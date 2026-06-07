<?php
header('Content-Type: application/json; charset=utf-8');

$langPath   = realpath(__DIR__ . '/../../ot265/lang.json');
$backupsDir = __DIR__ . '/backups';

if (!$langPath || !file_exists($langPath)) {
    http_response_code(500);
    echo json_encode(['error' => 'lang.json not found']);
    exit;
}

if (!is_dir($backupsDir)) {
    mkdir($backupsDir, 0775, true);
}

if (($_GET['list'] ?? '') === '1') {
    $files = glob($backupsDir . '/lang-*.json') ?: [];
    usort($files, fn($a, $b) => filemtime($b) - filemtime($a));
    $backups = [];
    foreach (array_slice($files, 0, 50) as $f) {
        $backups[] = [
            'name'  => basename($f),
            'size'  => filesize($f),
            'mtime' => filemtime($f),
        ];
    }
    echo json_encode(['backups' => $backups]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'POST required']);
    exit;
}

$raw  = file_get_contents('php://input');
$body = json_decode($raw, true);

if (!is_array($body)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON body']);
    exit;
}

if (isset($body['restore'])) {
    $name = basename((string)$body['restore']);
    if (!preg_match('/^lang-\d{4}-\d{2}-\d{2}_\d{6}\.json$/', $name)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid backup name']);
        exit;
    }
    $path = $backupsDir . '/' . $name;
    if (!file_exists($path)) {
        http_response_code(404);
        echo json_encode(['error' => 'Backup not found']);
        exit;
    }
    backupCurrent($langPath, $backupsDir);
    if (!copy($path, $langPath)) {
        http_response_code(500);
        echo json_encode(['error' => 'Restore failed']);
        exit;
    }
    echo json_encode(['ok' => true, 'restored' => $name]);
    exit;
}

if (!isset($body['en'], $body['th'], $body['sv']) || !is_array($body['en']) || !is_array($body['th']) || !is_array($body['sv'])) {
    http_response_code(422);
    echo json_encode(['error' => 'Payload must contain en, th and sv objects']);
    exit;
}

$enKeys = array_keys($body['en']);
$thKeys = array_keys($body['th']);
$svKeys = array_keys($body['sv']);
$enSorted = $enKeys; $thSorted = $thKeys; $svSorted = $svKeys;
sort($enSorted); sort($thSorted); sort($svSorted);
if ($enSorted !== $thSorted || $enSorted !== $svSorted) {
    http_response_code(422);
    echo json_encode(['error' => 'EN, TH and SV key sets must all match']);
    exit;
}

foreach (['en', 'th', 'sv'] as $lang) {
    foreach ($body[$lang] as $k => $v) {
        if (!is_string($v)) {
            http_response_code(422);
            echo json_encode(['error' => "Non-string value at $lang.$k"]);
            exit;
        }
    }
}

backupCurrent($langPath, $backupsDir);

$json = json_encode($body, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
if ($json === false) {
    http_response_code(500);
    echo json_encode(['error' => 'JSON encode failed: ' . json_last_error_msg()]);
    exit;
}
// PHP's JSON_PRETTY_PRINT uses 4 spaces; the project uses 2 — halve leading indentation.
$json = preg_replace_callback('/^( +)/m', fn($m) => str_repeat(' ', strlen($m[1]) >> 1), $json);
$json .= "\n";

$tmp = $langPath . '.tmp';
if (file_put_contents($tmp, $json) === false || !rename($tmp, $langPath)) {
    @unlink($tmp);
    http_response_code(500);
    echo json_encode(['error' => 'Write failed']);
    exit;
}

echo json_encode(['ok' => true, 'savedAt' => date('c'), 'bytes' => strlen($json)]);

function backupCurrent($langPath, $backupsDir) {
    if (!file_exists($langPath)) return;
    $stamp = date('Y-m-d_His');
    copy($langPath, $backupsDir . '/lang-' . $stamp . '.json');
    $files = glob($backupsDir . '/lang-*.json') ?: [];
    if (count($files) > 30) {
        usort($files, fn($a, $b) => filemtime($a) - filemtime($b));
        foreach (array_slice($files, 0, count($files) - 30) as $f) {
            @unlink($f);
        }
    }
}
