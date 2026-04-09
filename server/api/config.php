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

// JWT Secret para autenticación
define('JWT_SECRET', 'CHANGE_ME_TO_A_RANDOM_SECRET_KEY');
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
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $pdo = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
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
