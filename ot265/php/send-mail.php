<?php
header('Content-Type: application/json');

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
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

// TEMPORARY diagnostic: append ?debug=KohLanta2026 to the URL to get the raw
// SMTP error + transcript back in the JSON. REMOVE once the form is verified.
$DEBUG = (($_GET['debug'] ?? '') === 'KohLanta2026');
$debugLog = '';

$mail = new PHPMailer(true);

try {
    $mail->isSMTP();
    if ($DEBUG) {
        $mail->SMTPDebug = SMTP::DEBUG_CONNECTION;
        $mail->Debugoutput = function ($str, $level) use (&$debugLog) {
            $debugLog .= $str . "\n";
        };
    }
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
    $out = ['success' => false, 'error' => 'Failed to send email'];
    if ($DEBUG) {
        $out['debug_error'] = $mail->ErrorInfo;
        $out['debug_log']   = $debugLog;
        $out['config']      = ['host' => $SMTP_HOST, 'port' => $SMTP_PORT, 'user' => $SMTP_USER];
    }
    echo json_encode($out);
}
