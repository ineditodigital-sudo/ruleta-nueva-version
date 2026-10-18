<?php
/**
 * Router para `php -S` (npm run serve:dist): imita el .htaccess de producción.
 * Los archivos reales se sirven tal cual y cualquier otra ruta (/totem,
 * /admin, /demo) devuelve index.html para que la resuelva la app.
 */
$root = $_SERVER['DOCUMENT_ROOT'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if ($path !== '/' && file_exists($root . $path) && !is_dir($root . $path)) {
    return false;
}
readfile($root . '/index.html');
