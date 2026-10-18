<?php
/**
 * Genera el hash de una nueva contraseña para el panel.
 *
 *   php scripts/hash-password.php "mi-nueva-contraseña"
 *
 * Copia el resultado en public/api/config.php (o en el servidor, en
 * api/config.php) como:  define('PASSWORD_HASH', 'EL_HASH');
 */
if ($argc < 2 || $argv[1] === '') {
    fwrite(STDERR, "Uso: php scripts/hash-password.php \"nueva-contraseña\"\n");
    exit(1);
}
echo password_hash($argv[1], PASSWORD_BCRYPT, ['cost' => 12]), PHP_EOL;
