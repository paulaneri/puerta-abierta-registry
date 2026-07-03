<?php
// ============================================
// Configuración de la base de datos
// Este archivo se genera automáticamente por install.php
// ============================================

define('DB_HOST', 'localhost');
define('DB_NAME', 'par_registro');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// JWT Secret para autenticación.
// NUNCA hardcodear un valor por defecto: install.php debe generar un secret
// aleatorio y sobrescribir este archivo. Si no está definido, la API falla.
if (!defined('JWT_SECRET')) {
    $envSecret = getenv('JWT_SECRET');
    if ($envSecret && strlen($envSecret) >= 32) {
        define('JWT_SECRET', $envSecret);
    }
}
define('JWT_EXPIRY', 86400 * 7); // 7 días

// CORS - Orígenes permitidos (separados por coma)
define('ALLOWED_ORIGINS', '*');

// App
define('APP_VERSION', '1.0.0');
define('APP_NAME', 'Puerta Abierta Recreando');
define('INSTALLED', false);

// ============================================
// Conexión a la base de datos
// ============================================
function getDB() {
    static $pdo = null;
    if ($pdo === null) {
        // Fail fast si el secret JWT no está configurado — protege contra
        // deployments que no ejecutaron install.php.
        if (!defined('JWT_SECRET') || !JWT_SECRET || JWT_SECRET === 'CHANGE_ME_TO_A_RANDOM_SECRET_KEY') {
            http_response_code(500);
            echo json_encode(['error' => 'JWT_SECRET no configurado. Ejecutá install.php.']);
            exit;
        }
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $pdo = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database connection failed']);
            exit;
        }
    }
    return $pdo;
}

// CORS Headers
function setCorsHeaders() {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
    if (ALLOWED_ORIGINS !== '*') {
        $allowed = array_map('trim', explode(',', ALLOWED_ORIGINS));
        if (!in_array($origin, $allowed)) {
            $origin = $allowed[0];
        }
    }
    header("Access-Control-Allow-Origin: $origin");
    header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, apikey, x-client-info");
    header("Access-Control-Allow-Credentials: true");
    header("Content-Type: application/json; charset=utf-8");

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}

// ============================================
// Autorización basada en roles (equivalente a RLS)
// ============================================

/**
 * Matriz de permisos por tabla y operación.
 * Roles: administrador, coordinador, trabajador.
 * '*' = cualquier usuario autenticado.
 * [] = nadie (ni siquiera admin por esta vía; usar endpoint dedicado).
 */
function getTablePermissions() {
    return [
        // Datos operativos generales (todos los autenticados leen; escritura restringida)
        'mujeres'                => ['select' => ['administrador','coordinador','trabajador'], 'insert' => ['administrador','coordinador','trabajador'], 'update' => ['administrador','coordinador','trabajador'], 'delete' => ['administrador','coordinador']],
        'equipo'                 => ['select' => '*', 'insert' => ['administrador','coordinador'], 'update' => ['administrador','coordinador'], 'delete' => ['administrador']],
        'centro_dia'             => ['select' => ['administrador','coordinador','trabajador'], 'insert' => ['administrador','coordinador','trabajador'], 'update' => ['administrador','coordinador','trabajador'], 'delete' => ['administrador','coordinador']],
        'trabajo_campo'          => ['select' => ['administrador','coordinador','trabajador'], 'insert' => ['administrador','coordinador','trabajador'], 'update' => ['administrador','coordinador','trabajador'], 'delete' => ['administrador','coordinador','trabajador']],
        'gastos'                 => ['select' => ['administrador','coordinador'], 'insert' => ['administrador','coordinador'], 'update' => ['administrador','coordinador'], 'delete' => ['administrador','coordinador']],
        'etiquetas_gastos'       => ['select' => ['administrador','coordinador'], 'insert' => ['administrador','coordinador'], 'update' => ['administrador','coordinador'], 'delete' => ['administrador','coordinador']],
        'contactos'              => ['select' => ['administrador','coordinador'], 'insert' => ['administrador','coordinador'], 'update' => ['administrador','coordinador'], 'delete' => ['administrador','coordinador']],
        'eventos'                => ['select' => '*', 'insert' => '*', 'update' => '*', 'delete' => '*'],
        'duplas_acompanamiento'  => ['select' => ['administrador','coordinador','trabajador'], 'insert' => ['administrador','coordinador','trabajador'], 'update' => ['administrador','coordinador','trabajador'], 'delete' => ['administrador','coordinador']],
        'reuniones_semanales'    => ['select' => '*', 'insert' => ['administrador','coordinador'], 'update' => ['administrador','coordinador'], 'delete' => ['administrador']],
        'asignaciones_roles'     => ['select' => '*', 'insert' => ['administrador','coordinador'], 'update' => ['administrador','coordinador'], 'delete' => ['administrador']],
        'disponibilidad_reuniones' => ['select' => '*', 'insert' => ['administrador','coordinador','trabajador'], 'update' => ['administrador','coordinador','trabajador'], 'delete' => ['administrador','coordinador']],
        'actividades'            => ['select' => '*', 'insert' => '*', 'update' => '*', 'delete' => '*'],
        'albumes'                => ['select' => '*', 'insert' => ['administrador','coordinador','trabajador'], 'update' => ['administrador','coordinador','trabajador'], 'delete' => ['administrador','coordinador']],
        'fotos_album'            => ['select' => '*', 'insert' => ['administrador','coordinador','trabajador'], 'update' => ['administrador','coordinador','trabajador'], 'delete' => ['administrador','coordinador']],
        'lugares'                => ['select' => '*', 'insert' => ['administrador','coordinador'], 'update' => ['administrador','coordinador'], 'delete' => ['administrador']],
        'nacionalidades'         => ['select' => '*', 'insert' => ['administrador'], 'update' => ['administrador'], 'delete' => ['administrador']],
        'cargos_profesionales'   => ['select' => '*', 'insert' => ['administrador'], 'update' => ['administrador'], 'delete' => ['administrador']],
        'profiles'               => ['select' => '*', 'insert' => [], 'update' => [], 'delete' => []],
        // user_roles NUNCA se expone por CRUD genérico — usar endpoint admin dedicado.
    ];
}

function authorizeTableOp($table, $op, $userRole) {
    $perms = getTablePermissions();
    if (!isset($perms[$table])) return false;
    $rule = $perms[$table][$op] ?? [];
    if ($rule === '*') return true;
    if (is_array($rule)) return in_array($userRole, $rule, true);
    return false;
}

/**
 * Cachea columnas válidas por tabla desde information_schema.
 * Se usa como allow-list contra inyección por identificadores.
 */
function getAllowedColumns($db, $table) {
    static $cache = [];
    if (isset($cache[$table])) return $cache[$table];
    $stmt = $db->prepare("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?");
    $stmt->execute([DB_NAME, $table]);
    $cols = array_map(fn($r) => $r['COLUMN_NAME'], $stmt->fetchAll());
    $cache[$table] = $cols;
    return $cols;
}

function validIdentifier($name) {
    return is_string($name) && preg_match('/^[a-zA-Z_][a-zA-Z0-9_]*$/', $name) === 1;
}
