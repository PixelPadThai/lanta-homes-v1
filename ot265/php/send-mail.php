<?php
header('Content-Type: application/json');

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require __DIR__ . '/PHPMailer/Exception.php';
require __DIR__ . '/PHPMailer/PHPMailer.php';
require __DIR__ . '/PHPMailer/SMTP.php';

// Config via environment (set in Coolify / Docker). Defaults match the
// poste.io server on the VPS; only SMTP_PASS has no default and is required.
function env_val($key, $default = null) {
    $v = getenv($key);
    return ($v === false || $v === '') ? $default : $v;
}

// Caller's IP — behind Cloudflare + Coolify the real client is in
// CF-Connecting-IP; fall back through X-Forwarded-For to REMOTE_ADDR.
function client_ip() {
    $ip = $_SERVER['HTTP_CF_CONNECTING_IP']
        ?? $_SERVER['HTTP_X_FORWARDED_FOR']
        ?? $_SERVER['REMOTE_ADDR']
        ?? '0.0.0.0';
    return trim(explode(',', $ip)[0]); // X-Forwarded-For may be a list
}

// Simple file-based per-IP rate limit. Allows $maxPerHour submissions per
// rolling hour and enforces a minimum gap between two submissions. Fails
// open on filesystem errors so a broken /tmp never blocks real visitors.
function rate_limit_ok($maxPerHour = 5, $minIntervalSec = 20) {
    $dir = sys_get_temp_dir() . '/lanta_rl';
    if (!is_dir($dir)) { @mkdir($dir, 0700, true); }
    $file = $dir . '/' . sha1(client_ip()) . '.json';

    $now = time();
    $window = 3600;

    $fp = @fopen($file, 'c+');
    if ($fp === false) { return true; }
    flock($fp, LOCK_EX);
    $raw = stream_get_contents($fp);
    $times = $raw ? json_decode($raw, true) : [];
    if (!is_array($times)) { $times = []; }

    // Keep only timestamps inside the rolling window
    $times = array_values(array_filter($times, fn($t) => ($now - $t) < $window));

    $allowed = true;
    if (count($times) >= $maxPerHour) {
        $allowed = false;                              // hourly cap hit
    } elseif (!empty($times) && ($now - end($times)) < $minIntervalSec) {
        $allowed = false;                              // submitting too fast
    }

    if ($allowed) {
        $times[] = $now;
        ftruncate($fp, 0);
        rewind($fp);
        fwrite($fp, json_encode($times));
    }
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);

    return $allowed;
}

$SMTP_HOST = env_val('SMTP_HOST', 'mail.lanta.fun');
$SMTP_PORT = (int) env_val('SMTP_PORT', 587);
$SMTP_USER = env_val('SMTP_USER', 'noreply@lanta.homes');
$SMTP_PASS = env_val('SMTP_PASS');
$MAIL_FROM = env_val('MAIL_FROM', 'noreply@lanta.homes');
$MAIL_TO   = env_val('MAIL_TO', 'noreply@lanta.homes');

// Only accept POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

// Parse JSON body
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid request']);
    exit;
}

// Honeypot check — if filled, it's a bot; silently succeed
if (!empty($input['honeypot'])) {
    echo json_encode(['success' => true]);
    exit;
}

// Rate limit — block flooding (max 5/hour per IP, 20s min gap)
if (!rate_limit_ok()) {
    http_response_code(429);
    echo json_encode(['success' => false, 'error' => 'Too many requests. Please try again later.']);
    exit;
}

// Extract and sanitize
$name    = strip_tags(trim($input['name'] ?? ''));
$email   = filter_var(trim($input['email'] ?? ''), FILTER_SANITIZE_EMAIL);
$phone   = strip_tags(trim($input['phone'] ?? ''));
$message = strip_tags(trim($input['message'] ?? ''));

// Validate required fields
if (empty($name) || empty($email)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Name and email are required']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid email address']);
    exit;
}

if (preg_match('/[\r\n]/', $email) || preg_match('/[\r\n]/', $name)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid input']);
    exit;
}

// Length caps — reject oversized payloads
if (strlen($name) > 100 || strlen($email) > 150 || strlen($phone) > 40 || strlen($message) > 5000) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Input too long']);
    exit;
}

// Server misconfiguration — no SMTP password set
if (empty($SMTP_PASS)) {
    http_response_code(500);
    error_log('send-mail.php: SMTP_PASS is not set');
    echo json_encode(['success' => false, 'error' => 'Mail server not configured']);
    exit;
}

// Build email body
$subject = "Baan Sawan Inquiry from $name";
$body  = "New inquiry from the Baan Sawan property listing:\n\n";
$body .= "Name:    $name\n";
$body .= "Email:   $email\n";
$body .= "Phone:   $phone\n\n";
$body .= "Message:\n$message\n";

$mail = new PHPMailer(true);

try {
    $mail->isSMTP();
    $mail->Host       = $SMTP_HOST;
    $mail->SMTPAuth   = true;
    $mail->Username   = $SMTP_USER;
    $mail->Password   = $SMTP_PASS;
    $mail->Port       = $SMTP_PORT;
    // 587 -> STARTTLS, 465 -> implicit TLS
    $mail->SMTPSecure = ($SMTP_PORT === 465)
        ? PHPMailer::ENCRYPTION_SMTPS
        : PHPMailer::ENCRYPTION_STARTTLS;
    $mail->CharSet    = PHPMailer::CHARSET_UTF8;

    // The mail server is poste.io on the same VPS, presenting its built-in
    // self-signed cert. Skip peer verification (traffic is still encrypted).
    // Set SMTP_STRICT_TLS=1 to require a valid cert (e.g. after configuring
    // a Let's Encrypt cert for the mail host in poste.io).
    if (env_val('SMTP_STRICT_TLS') !== '1') {
        $mail->SMTPOptions = [
            'ssl' => [
                'verify_peer'       => false,
                'verify_peer_name'  => false,
                'allow_self_signed' => true,
            ],
        ];
    }

    $mail->setFrom($MAIL_FROM, 'Baan Sawan Listing');
    $mail->addAddress($MAIL_TO);
    $mail->addReplyTo($email, $name);

    $mail->Subject = $subject;
    $mail->Body    = $body;

    $mail->send();
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    http_response_code(500);
    error_log('send-mail.php: ' . $mail->ErrorInfo);
    echo json_encode(['success' => false, 'error' => 'Failed to send email']);
}
