<?php
/**
 * Estado compartido de la Ruleta UTA (Universidad Tecnológica de Aguascalientes).
 *
 * El panel guarda aquí la configuración y todos los tótems la leen, así que
 * cualquier equipo —o una ventana privada— ve lo mismo. Cada giro del tótem se
 * registra aquí también.
 *
 * Rutas (todas sobre este archivo):
 *   GET                                  → { config, updatedAt, participantsCount }
 *   GET  + cabecera X-Admin-Token        → además { participants } (los leads)
 *   POST { action: 'login', password }   → { token } de sesión temporal
 *   POST { action: 'logout', token }
 *   POST { action: 'config', ... }       → reemplaza la configuración (requiere token)
 *   POST { action: 'lead', ... }         → añade un giro/participante (abierto: lo llama el tótem)
 *   POST { action: 'participants' }      → reemplaza la lista de leads (requiere token)
 *   POST { action: 'reset', config }     → borra leads y contadores (requiere token)
 *
 * Los leads son datos personales: sólo se entregan con sesión de administrador
 * y el archivo de datos vive FUERA del directorio público.
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

date_default_timezone_set('America/Mexico_City');

/*
 * Carpeta de datos: por defecto, dos niveles arriba de /api, es decir, junto a
 * la carpeta pública del subdominio (p. ej. /home/usuario/ruleta-uta-datos).
 * Se puede fijar otra en config.php (ver config.example.php).
 */
$localConfig = __DIR__ . '/config.php';
if (is_file($localConfig)) {
    require $localConfig;
}
if (!defined('DATA_DIR')) {
    define('DATA_DIR', dirname(__DIR__, 2) . '/ruleta-uta-datos');
}
const DATA_FILE = DATA_DIR . '/ruleta-uta.json';
const SESSIONS_FILE = DATA_DIR . '/sesiones.json';

/**
 * Hash bcrypt de la contraseña del panel. La contraseña nunca viaja en el
 * bundle: el panel la manda aquí, este archivo la compara y devuelve un token.
 *
 * Para cambiarla: `php scripts/hash-password.php "la-nueva"` y pega el hash en
 * config.php como PASSWORD_HASH (o sustitúyelo aquí).
 */
if (!defined('PASSWORD_HASH')) {
    define('PASSWORD_HASH', '$2y$12$PDUVSvbPErv/ZfpMaKidyeReS.gQQYzNrAfnc4J16tia6LfhUWPDG');
}

const SESSION_TTL = 12 * 3600;
const MAX_BODY_BYTES = 12 * 1024 * 1024;
const MAX_PARTICIPANTS = 50000;

/* -------------------------------------------------------------------------- */

function fail(int $status, string $message): never
{
    http_response_code($status);
    echo json_encode(['error' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

function ensureDataDir(): void
{
    if (!is_dir(DATA_DIR) && !@mkdir(DATA_DIR, 0700, true) && !is_dir(DATA_DIR)) {
        fail(500, 'No se puede crear el directorio de datos');
    }
    // Defensa extra por si la carpeta quedara dentro de public_html: Apache no
    // debe servir nunca los leads ni las sesiones.
    $guard = DATA_DIR . '/.htaccess';
    if (!is_file($guard)) {
        @file_put_contents($guard, "Require all denied\nDeny from all\n");
    }
}

function today(): string
{
    return date('Y-m-d');
}

/* --- Sesiones -------------------------------------------------------------- */

function readSessions(): array
{
    if (!is_file(SESSIONS_FILE)) {
        return [];
    }
    $parsed = json_decode((string) file_get_contents(SESSIONS_FILE), true);
    if (!is_array($parsed)) {
        return [];
    }
    $now = time();
    return array_filter($parsed, static fn ($exp) => is_int($exp) && $exp > $now);
}

function writeSessions(array $sessions): void
{
    ensureDataDir();
    file_put_contents(SESSIONS_FILE, json_encode($sessions), LOCK_EX);
}

function issueSession(): string
{
    $token = bin2hex(random_bytes(24));
    $sessions = readSessions();
    if (count($sessions) > 50) {
        $sessions = array_slice($sessions, -50, null, true);
    }
    $sessions[$token] = time() + SESSION_TTL;
    writeSessions($sessions);
    return $token;
}

function validSession(string $token): bool
{
    if ($token === '') {
        return false;
    }
    foreach (readSessions() as $known => $exp) {
        if (hash_equals((string) $known, $token)) {
            return true;
        }
    }
    return false;
}

function dropSession(string $token): void
{
    $sessions = readSessions();
    unset($sessions[$token]);
    writeSessions($sessions);
}

/* --- Estado ---------------------------------------------------------------- */

function emptyState(): array
{
    return ['updatedAt' => 0, 'config' => null, 'participants' => []];
}

function readState(): array
{
    if (!is_file(DATA_FILE)) {
        return emptyState();
    }
    $raw = file_get_contents(DATA_FILE);
    if ($raw === false || $raw === '') {
        return emptyState();
    }
    $parsed = json_decode($raw, true);
    return is_array($parsed) ? $parsed + emptyState() : emptyState();
}

/**
 * Escritura atómica (archivo temporal + rename): dos tótems pueden registrar
 * un giro a la vez y un archivo a medio escribir dejaría todo sin configuración.
 */
function writeState(array $state): void
{
    ensureDataDir();
    $state['updatedAt'] = time();
    $json = json_encode($state, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) {
        fail(500, 'No se puede serializar el estado');
    }
    $tmp = DATA_FILE . '.' . getmypid() . '.tmp';
    if (file_put_contents($tmp, $json, LOCK_EX) === false || !rename($tmp, DATA_FILE)) {
        @unlink($tmp);
        fail(500, 'No se puede guardar el estado');
    }
}

function withLock(callable $fn): mixed
{
    ensureDataDir();
    $lock = fopen(DATA_DIR . '/.lock', 'c');
    if ($lock === false) {
        fail(500, 'No se puede abrir el bloqueo');
    }
    flock($lock, LOCK_EX);
    try {
        return $fn();
    } finally {
        flock($lock, LOCK_UN);
        fclose($lock);
    }
}

/** El conteo diario vuelve a cero al cambiar de día. */
function rollDailyCount(array &$config): void
{
    if (!isset($config['gameConfig']) || !is_array($config['gameConfig'])) {
        return;
    }
    if (($config['gameConfig']['countDate'] ?? '') !== today()) {
        $config['gameConfig']['currentDailyCount'] = 0;
        $config['gameConfig']['countDate'] = today();
    }
}

function str(mixed $value, int $max): string
{
    $s = is_scalar($value) ? trim((string) $value) : '';
    return function_exists('mb_substr') ? mb_substr($s, 0, $max) : substr($s, 0, $max);
}

/**
 * El tótem es público, así que lo que manda se limpia: sólo pasan los campos
 * esperados, como texto y con un largo razonable.
 */
function cleanParticipant(mixed $p): ?array
{
    if (!is_array($p)) {
        return null;
    }
    $prize = $p['prizeWon'] ?? null;
    $ts = str($p['timestamp'] ?? '', 40);
    return [
        'id' => str($p['id'] ?? '', 64) ?: bin2hex(random_bytes(8)),
        'name' => str($p['name'] ?? '', 120),
        'email' => str($p['email'] ?? '', 160),
        'phone' => str($p['phone'] ?? '', 30),
        'acceptedTerms' => (bool) ($p['acceptedTerms'] ?? false),
        'prizeWon' => is_array($prize) ? [
            'id' => str($prize['id'] ?? '', 64),
            'name' => str($prize['name'] ?? '', 120),
            'description' => str($prize['description'] ?? '', 240),
            'isWin' => (bool) ($prize['isWin'] ?? true),
        ] : null,
        'timestamp' => strtotime($ts) !== false ? $ts : date('c'),
    ];
}

function requestToken(array $body = []): string
{
    $header = $_SERVER['HTTP_X_ADMIN_TOKEN'] ?? '';
    return (string) ($body['token'] ?? $header);
}

/* -------------------------------------------------------------------------- */

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    $state = readState();
    if (is_array($state['config'])) {
        rollDailyCount($state['config']);
    }
    $out = [
        'updatedAt' => $state['updatedAt'],
        'config' => $state['config'],
        'participantsCount' => count($state['participants']),
    ];
    if (validSession(requestToken())) {
        $out['participants'] = $state['participants'];
    }
    echo json_encode($out, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if ($method !== 'POST') {
    header('Allow: GET, POST');
    fail(405, 'Método no permitido');
}

$rawBody = file_get_contents('php://input') ?: '';
if (strlen($rawBody) > MAX_BODY_BYTES) {
    fail(413, 'La configuración es demasiado grande: usa imágenes más ligeras');
}
$body = json_decode($rawBody, true);
if (!is_array($body)) {
    fail(400, 'Cuerpo JSON inválido');
}

$action = (string) ($body['action'] ?? '');
$authorised = validSession(requestToken($body));

switch ($action) {
    case 'login':
        $password = (string) ($body['password'] ?? '');
        // Retardo fijo: encarece probar contraseñas a ciegas.
        usleep(400000);
        if ($password === '' || !password_verify($password, PASSWORD_HASH)) {
            fail(401, 'Contraseña incorrecta');
        }
        echo json_encode(['ok' => true, 'token' => issueSession(), 'ttl' => SESSION_TTL]);
        exit;

    case 'logout':
        dropSession(requestToken($body));
        echo json_encode(['ok' => true]);
        exit;

    case 'config':
        if (!$authorised) {
            fail(401, 'Sesión vencida');
        }
        $config = $body['config'] ?? null;
        if (!is_array($config)) {
            fail(400, 'Falta la configuración');
        }
        withLock(function () use ($config, $body) {
            $state = readState();
            $previous = is_array($state['config']) ? $state['config'] : [];

            // Los contadores los lleva el servidor: si el panel los pisara con su
            // copia, perdería los giros registrados mientras tenía la pantalla abierta.
            if (empty($body['resetCounts'])) {
                $wins = [];
                foreach (($previous['prizes'] ?? []) as $prize) {
                    if (isset($prize['id'])) {
                        $wins[$prize['id']] = $prize['currentWins'] ?? 0;
                    }
                }
                // Gajos cuyo contador de entregados el panel pidió reiniciar.
                $resetIds = array_map('strval', is_array($body['resetPrizeIds'] ?? null) ? $body['resetPrizeIds'] : []);
                foreach (($config['prizes'] ?? []) as $i => $prize) {
                    if (in_array((string) ($prize['id'] ?? ''), $resetIds, true)) {
                        $config['prizes'][$i]['currentWins'] = 0;
                    } elseif (isset($prize['id'], $wins[$prize['id']])) {
                        $config['prizes'][$i]['currentWins'] = $wins[$prize['id']];
                    }
                }
                if (isset($previous['gameConfig']['currentDailyCount'])) {
                    $config['gameConfig']['currentDailyCount'] = $previous['gameConfig']['currentDailyCount'];
                    $config['gameConfig']['countDate'] = $previous['gameConfig']['countDate'] ?? today();
                }
            }
            rollDailyCount($config);
            $state['config'] = $config;
            writeState($state);
        });
        echo json_encode(['ok' => true, 'updatedAt' => time()]);
        exit;

    case 'lead':
        // Sin token a propósito: lo llama el tótem, que es público y no puede
        // guardar un secreto. A cambio sólo sabe añadir, nunca leer ni borrar.
        $participant = cleanParticipant($body['participant'] ?? null);
        $prizeId = isset($body['prizeId']) ? str($body['prizeId'], 64) : null;

        withLock(function () use ($participant, $prizeId) {
            $state = readState();
            if ($participant !== null) {
                $state['participants'][] = $participant;
                if (count($state['participants']) > MAX_PARTICIPANTS) {
                    $state['participants'] = array_slice($state['participants'], -MAX_PARTICIPANTS);
                }
            }
            if (is_array($state['config'])) {
                if ($prizeId !== null && isset($state['config']['prizes'])) {
                    foreach ($state['config']['prizes'] as $i => $prize) {
                        if ((string) ($prize['id'] ?? '') === $prizeId) {
                            $state['config']['prizes'][$i]['currentWins'] = ($prize['currentWins'] ?? 0) + 1;
                        }
                    }
                }
                if (isset($state['config']['gameConfig'])) {
                    rollDailyCount($state['config']);
                    $state['config']['gameConfig']['currentDailyCount'] =
                        ($state['config']['gameConfig']['currentDailyCount'] ?? 0) + 1;
                }
            }
            writeState($state);
        });
        echo json_encode(['ok' => true]);
        exit;

    case 'participants':
        if (!$authorised) {
            fail(401, 'Sesión vencida');
        }
        if (!is_array($body['participants'] ?? null)) {
            fail(400, 'Falta la lista de participantes');
        }
        withLock(function () use ($body) {
            $state = readState();
            $state['participants'] = array_values(array_filter(array_map('cleanParticipant', $body['participants'])));
            // Borrar un lead devuelve su premio al inventario: el panel manda los contadores corregidos.
            if (is_array($body['prizes'] ?? null) && is_array($state['config'])) {
                $state['config']['prizes'] = $body['prizes'];
            }
            if (isset($body['currentDailyCount'], $state['config']['gameConfig'])) {
                $state['config']['gameConfig']['currentDailyCount'] = max(0, (int) $body['currentDailyCount']);
            }
            writeState($state);
        });
        echo json_encode(['ok' => true]);
        exit;

    case 'reset':
        if (!$authorised) {
            fail(401, 'Sesión vencida');
        }
        withLock(function () use ($body) {
            $config = is_array($body['config'] ?? null) ? $body['config'] : null;
            if ($config !== null) {
                rollDailyCount($config);
            }
            writeState(['config' => $config, 'participants' => []]);
        });
        echo json_encode(['ok' => true]);
        exit;

    default:
        fail(400, 'Acción desconocida');
}
