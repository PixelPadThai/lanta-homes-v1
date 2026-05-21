<?php
// Dev router for `php -S 0.0.0.0:8000 router.php`.
// Redirects directory requests missing a trailing slash (e.g. /ot265 -> /ot265/)
// so relative asset paths resolve correctly. Real web servers (Apache/nginx)
// do this automatically; php's built-in server does not.

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

if ($uri !== '/' && substr($uri, -1) !== '/' && is_dir(__DIR__ . $uri)) {
    $location = $uri . '/';
    if (!empty($_SERVER['QUERY_STRING'])) {
        $location .= '?' . $_SERVER['QUERY_STRING'];
    }
    header('Location: ' . $location, true, 301);
    exit;
}

// Serve the requested file/directory as usual.
return false;
