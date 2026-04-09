<?php
/**
 * ============================================
 * INSTALADOR - Puerta Abierta Recreando
 * ============================================
 * 
 * Ejecutar desde el navegador:
 *   https://tu-servidor.com/install.php
 * 
 * Este script:
 * 1. Verifica requisitos del servidor (PHP, MySQL, extensiones)
 * 2. Pide datos de conexión a MySQL
 * 3. Crea todas las tablas necesarias
 * 4. Crea el primer usuario administrador
 * 5. Genera el archivo config.php con los datos correctos
 * 6. Se auto-elimina (opcional) por seguridad
 */

session_start();
error_reporting(E_ALL);
ini_set('display_errors', 0);

// ============================================
// Si ya está instalado, bloquear acceso
// ============================================
if (file_exists(__DIR__ . '/api/config.php')) {
    include __DIR__ . '/api/config.php';
    if (defined('INSTALLED') && INSTALLED === true) {
        die('<!DOCTYPE html><html><head><meta charset="utf-8"><title>Ya instalado</title></head><body style="font-family:sans-serif;text-align:center;padding:50px"><h1>⚠️ La aplicación ya está instalada</h1><p>Por seguridad, eliminá este archivo <code>install.php</code> del servidor.</p></body></html>');
    }
}

$step = $_POST['step'] ?? ($_GET['step'] ?? 1);
$step = (int)$step;
$errors = [];
$success = [];

// ============================================
// Procesar formularios
// ============================================
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    
    if ($step === 2) {
        // Test database connection
        $dbHost = trim($_POST['db_host'] ?? 'localhost');
        $dbName = trim($_POST['db_name'] ?? '');
        $dbUser = trim($_POST['db_user'] ?? '');
        $dbPass = $_POST['db_pass'] ?? '';
        
        if (!$dbName || !$dbUser) {
            $errors[] = 'El nombre de la base de datos y el usuario son requeridos.';
        } else {
            try {
                $dsn = "mysql:host=$dbHost;charset=utf8mb4";
                $pdo = new PDO($dsn, $dbUser, $dbPass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
                
                // Try to create database if not exists
                $pdo->exec("CREATE DATABASE IF NOT EXISTS `$dbName` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
                $pdo->exec("USE `$dbName`");
                
                $_SESSION['db'] = [
                    'host' => $dbHost,
                    'name' => $dbName,
                    'user' => $dbUser,
                    'pass' => $dbPass
                ];
                $step = 3;
            } catch (PDOException $e) {
                $errors[] = 'Error de conexión: ' . $e->getMessage();
            }
        }
    }
    
    elseif ($step === 3) {
        // Create tables
        $db = $_SESSION['db'] ?? null;
        if (!$db) { $step = 2; }
        else {
            try {
                $pdo = new PDO("mysql:host={$db['host']};dbname={$db['name']};charset=utf8mb4", $db['user'], $db['pass'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
                
                $sql = getSchemaSQL();
                $pdo->exec($sql);
                
                $success[] = '¡Todas las tablas fueron creadas exitosamente!';
                $step = 4;
            } catch (PDOException $e) {
                $errors[] = 'Error al crear tablas: ' . $e->getMessage();
            }
        }
    }
    
    elseif ($step === 4) {
        // Create admin user
        $db = $_SESSION['db'] ?? null;
        $adminEmail = trim($_POST['admin_email'] ?? '');
        $adminPass = $_POST['admin_pass'] ?? '';
        $adminNombre = trim($_POST['admin_nombre'] ?? '');
        $adminApellido = trim($_POST['admin_apellido'] ?? '');
        
        if (!$adminEmail || !$adminPass) {
            $errors[] = 'Email y contraseña del administrador son requeridos.';
        } elseif (strlen($adminPass) < 6) {
            $errors[] = 'La contraseña debe tener al menos 6 caracteres.';
        } elseif (!$db) {
            $errors[] = 'Sesión expirada. Empezá de nuevo.';
            $step = 1;
        } else {
            try {
                $pdo = new PDO("mysql:host={$db['host']};dbname={$db['name']};charset=utf8mb4", $db['user'], $db['pass'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
                
                $userId = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
                    mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff),
                    mt_rand(0, 0x0fff) | 0x4000, mt_rand(0, 0x3fff) | 0x8000,
                    mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff));
                
                $hashedPass = password_hash($adminPass, PASSWORD_BCRYPT);
                
                $pdo->beginTransaction();
                
                $stmt = $pdo->prepare("INSERT INTO auth_users (id, email, encrypted_password, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())");
                $stmt->execute([$userId, $adminEmail, $hashedPass]);
                
                $stmt = $pdo->prepare("INSERT INTO profiles (id, email, nombre, apellido, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())");
                $stmt->execute([$userId, $adminEmail, $adminNombre, $adminApellido]);
                
                $roleId = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
                    mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff),
                    mt_rand(0, 0x0fff) | 0x4000, mt_rand(0, 0x3fff) | 0x8000,
                    mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff));
                
                $stmt = $pdo->prepare("INSERT INTO user_roles (id, user_id, role, created_at) VALUES (?, ?, 'administrador', NOW())");
                $stmt->execute([$roleId, $userId]);
                
                $pdo->commit();
                
                $_SESSION['admin_email'] = $adminEmail;
                
                // Generate config file
                $jwtSecret = bin2hex(random_bytes(32));
                writeConfigFile($db, $jwtSecret);
                
                $step = 5;
            } catch (PDOException $e) {
                $errors[] = 'Error al crear administrador: ' . $e->getMessage();
            }
        }
    }
}

// ============================================
// Schema SQL
// ============================================
function getSchemaSQL() {
    return "
-- Auth users (reemplaza auth.users de Supabase)
CREATE TABLE IF NOT EXISTS auth_users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    encrypted_password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Profiles
CREATE TABLE IF NOT EXISTS profiles (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    nombre VARCHAR(255) DEFAULT NULL,
    apellido VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User roles
CREATE TABLE IF NOT EXISTS user_roles (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    role ENUM('administrador', 'coordinador', 'trabajador') NOT NULL DEFAULT 'trabajador',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_role (user_id, role),
    FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Mujeres
CREATE TABLE IF NOT EXISTS mujeres (
    id VARCHAR(36) PRIMARY KEY,
    nombre VARCHAR(255) DEFAULT NULL,
    apellido VARCHAR(255) DEFAULT NULL,
    apodo VARCHAR(255) DEFAULT NULL,
    edad INT DEFAULT NULL,
    fecha_nacimiento DATE DEFAULT NULL,
    nacionalidad VARCHAR(100) DEFAULT NULL,
    telefono VARCHAR(50) DEFAULT NULL,
    email VARCHAR(255) DEFAULT NULL,
    direccion TEXT DEFAULT NULL,
    parada_zona VARCHAR(255) DEFAULT NULL,
    tiene_documentacion TINYINT(1) DEFAULT NULL,
    tipo_documentacion VARCHAR(100) DEFAULT NULL,
    hijos TINYINT(1) DEFAULT NULL,
    numero_hijos INT DEFAULT NULL,
    situacion_laboral VARCHAR(100) DEFAULT NULL,
    cobertura_salud VARCHAR(100) DEFAULT NULL,
    alfabetizada TINYINT(1) DEFAULT NULL,
    vivienda_tipo VARCHAR(100) DEFAULT NULL,
    vivienda_contrato VARCHAR(100) DEFAULT NULL,
    tipo_residencia VARCHAR(100) DEFAULT NULL,
    aporte_previsional VARCHAR(100) DEFAULT NULL,
    ayuda_habitacional VARCHAR(100) DEFAULT NULL,
    fecha_primer_contacto DATE DEFAULT NULL,
    origen_registro VARCHAR(100) DEFAULT NULL,
    persona_contacto_referencia TEXT DEFAULT NULL,
    observaciones TEXT DEFAULT NULL,
    observaciones_historia TEXT DEFAULT NULL,
    descripcion_rasgos TEXT DEFAULT NULL,
    llamadas_realizadas INT DEFAULT 0,
    llamadas_recibidas INT DEFAULT 0,
    tramites_realizados JSON DEFAULT NULL,
    acompanamientos JSON DEFAULT NULL,
    documentos JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Equipo
CREATE TABLE IF NOT EXISTS equipo (
    id VARCHAR(36) PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    apellido VARCHAR(255) NOT NULL,
    profesion VARCHAR(255) DEFAULT NULL,
    especialidad VARCHAR(255) DEFAULT NULL,
    email VARCHAR(255) DEFAULT NULL,
    telefono VARCHAR(50) DEFAULT NULL,
    fecha_ingreso DATE DEFAULT NULL,
    fecha_nacimiento DATE DEFAULT NULL,
    activo TINYINT(1) DEFAULT 1,
    equipo_ampliado TINYINT(1) DEFAULT 0,
    experiencia TEXT DEFAULT NULL,
    certificaciones JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Centro de día
CREATE TABLE IF NOT EXISTS centro_dia (
    id VARCHAR(36) PRIMARY KEY,
    fecha DATE NOT NULL,
    tipo_actividad VARCHAR(100) NOT NULL,
    descripcion TEXT DEFAULT NULL,
    profesional VARCHAR(255) DEFAULT NULL,
    mujer_id VARCHAR(36) DEFAULT NULL,
    mujeres_asistieron JSON DEFAULT NULL,
    observaciones TEXT DEFAULT NULL,
    llamadas_hechas JSON DEFAULT NULL,
    llamadas_recibidas JSON DEFAULT NULL,
    tramites JSON DEFAULT NULL,
    articulacion_instituciones TEXT DEFAULT NULL,
    trabajo_campo_resumen TEXT DEFAULT NULL,
    proxima_cita DATE DEFAULT NULL,
    archivado TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Trabajo de campo
CREATE TABLE IF NOT EXISTS trabajo_campo (
    id VARCHAR(36) PRIMARY KEY,
    fecha DATE NOT NULL,
    lugar VARCHAR(255) NOT NULL,
    actividad TEXT NOT NULL,
    profesional_responsable VARCHAR(255) DEFAULT NULL,
    participantes JSON DEFAULT NULL,
    encuentros JSON DEFAULT NULL,
    observaciones TEXT DEFAULT NULL,
    resultados TEXT DEFAULT NULL,
    archivado TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Gastos
CREATE TABLE IF NOT EXISTS gastos (
    id VARCHAR(36) PRIMARY KEY,
    fecha DATE NOT NULL,
    concepto VARCHAR(255) NOT NULL,
    monto DECIMAL(12,2) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    descripcion TEXT DEFAULT NULL,
    metodo_pago VARCHAR(50) DEFAULT NULL,
    comprobante_id VARCHAR(255) DEFAULT NULL,
    documentos_adjuntos JSON DEFAULT NULL,
    archivado TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Etiquetas de gastos
CREATE TABLE IF NOT EXISTS etiquetas_gastos (
    id VARCHAR(36) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    color VARCHAR(20) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Contactos
CREATE TABLE IF NOT EXISTS contactos (
    id VARCHAR(36) PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    apellido VARCHAR(255) DEFAULT NULL,
    organizacion VARCHAR(255) DEFAULT NULL,
    cargo VARCHAR(255) DEFAULT NULL,
    telefono VARCHAR(50) DEFAULT NULL,
    email VARCHAR(255) DEFAULT NULL,
    direccion TEXT DEFAULT NULL,
    ciudad VARCHAR(100) DEFAULT NULL,
    provincia VARCHAR(100) DEFAULT NULL,
    pais VARCHAR(100) DEFAULT NULL,
    servicio VARCHAR(255) DEFAULT NULL,
    dia_atencion VARCHAR(100) DEFAULT NULL,
    horario_atencion VARCHAR(100) DEFAULT NULL,
    pagina_web VARCHAR(500) DEFAULT NULL,
    notas TEXT DEFAULT NULL,
    tags JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Eventos (calendario)
CREATE TABLE IF NOT EXISTS eventos (
    id VARCHAR(36) PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    descripcion TEXT DEFAULT NULL,
    lugar VARCHAR(255) DEFAULT NULL,
    participantes JSON DEFAULT NULL,
    recordatorio TINYINT(1) DEFAULT 0,
    repeticion VARCHAR(50) DEFAULT NULL,
    fecha_fin_repeticion DATE DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Duplas de acompañamiento
CREATE TABLE IF NOT EXISTS duplas_acompanamiento (
    id VARCHAR(36) PRIMARY KEY,
    profesional1_id VARCHAR(36) NOT NULL,
    profesional2_id VARCHAR(36) NOT NULL,
    mujer_id VARCHAR(36) DEFAULT NULL,
    fecha_formacion DATE NOT NULL,
    activa TINYINT(1) DEFAULT 1,
    observaciones TEXT DEFAULT NULL,
    archivado TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (profesional1_id) REFERENCES equipo(id),
    FOREIGN KEY (profesional2_id) REFERENCES equipo(id),
    FOREIGN KEY (mujer_id) REFERENCES mujeres(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reuniones semanales
CREATE TABLE IF NOT EXISTS reuniones_semanales (
    id VARCHAR(36) PRIMARY KEY,
    fecha DATE NOT NULL,
    semana_numero INT NOT NULL,
    ano INT NOT NULL,
    estado VARCHAR(50) DEFAULT 'pendiente',
    numero_acta INT DEFAULT NULL,
    observaciones TEXT DEFAULT NULL,
    motivo_cancelacion TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Asignaciones de roles en reuniones
CREATE TABLE IF NOT EXISTS asignaciones_roles (
    id VARCHAR(36) PRIMARY KEY,
    reunion_id VARCHAR(36) NOT NULL,
    profesional_id VARCHAR(36) NOT NULL,
    rol ENUM('reflexion', 'coordinacion', 'acta') NOT NULL,
    suplente_id VARCHAR(36) DEFAULT NULL,
    presente TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (reunion_id) REFERENCES reuniones_semanales(id),
    FOREIGN KEY (profesional_id) REFERENCES equipo(id),
    FOREIGN KEY (suplente_id) REFERENCES equipo(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Disponibilidad reuniones
CREATE TABLE IF NOT EXISTS disponibilidad_reuniones (
    id VARCHAR(36) PRIMARY KEY,
    reunion_id VARCHAR(36) NOT NULL,
    profesional_id VARCHAR(36) NOT NULL,
    disponible TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (reunion_id) REFERENCES reuniones_semanales(id),
    FOREIGN KEY (profesional_id) REFERENCES equipo(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Actividades
CREATE TABLE IF NOT EXISTS actividades (
    id VARCHAR(36) PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT DEFAULT NULL,
    estado VARCHAR(50) DEFAULT 'pendiente',
    prioridad VARCHAR(20) DEFAULT NULL,
    fecha_limite DATE DEFAULT NULL,
    responsable_id VARCHAR(36) DEFAULT NULL,
    creado_por VARCHAR(36) NOT NULL,
    orden INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (responsable_id) REFERENCES equipo(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Álbumes
CREATE TABLE IF NOT EXISTS albumes (
    id VARCHAR(36) PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT DEFAULT NULL,
    fecha DATE NOT NULL,
    evento VARCHAR(255) DEFAULT NULL,
    foto_portada_url TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Fotos de álbum
CREATE TABLE IF NOT EXISTS fotos_album (
    id VARCHAR(36) PRIMARY KEY,
    album_id VARCHAR(36) NOT NULL,
    url TEXT NOT NULL,
    descripcion TEXT DEFAULT NULL,
    nombre_archivo VARCHAR(255) DEFAULT NULL,
    orden INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (album_id) REFERENCES albumes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Lugares
CREATE TABLE IF NOT EXISTS lugares (
    id VARCHAR(36) PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    activo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Nacionalidades
CREATE TABLE IF NOT EXISTS nacionalidades (
    id VARCHAR(36) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    activa TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cargos profesionales
CREATE TABLE IF NOT EXISTS cargos_profesionales (
    id VARCHAR(36) PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT DEFAULT NULL,
    activo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Version tracking for future updates
CREATE TABLE IF NOT EXISTS app_metadata (
    meta_key VARCHAR(100) PRIMARY KEY,
    meta_value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO app_metadata (meta_key, meta_value) VALUES ('db_version', '1.0.0');
INSERT IGNORE INTO app_metadata (meta_key, meta_value) VALUES ('installed_at', NOW());
";
}

// ============================================
// Write config file
// ============================================
function writeConfigFile($db, $jwtSecret) {
    $config = "<?php
// ============================================
// Configuración generada por el instalador
// Fecha: " . date('Y-m-d H:i:s') . "
// ============================================

define('DB_HOST', " . var_export($db['host'], true) . ");
define('DB_NAME', " . var_export($db['name'], true) . ");
define('DB_USER', " . var_export($db['user'], true) . ");
define('DB_PASS', " . var_export($db['pass'], true) . ");
define('DB_CHARSET', 'utf8mb4');

define('JWT_SECRET', " . var_export($jwtSecret, true) . ");
define('JWT_EXPIRY', 86400 * 7); // 7 días

define('ALLOWED_ORIGINS', '*');

define('APP_VERSION', '1.0.0');
define('APP_NAME', 'Puerta Abierta Recreando');
define('INSTALLED', true);

// ============================================
// Conexión a la base de datos
// ============================================
function getDB() {
    static \$pdo = null;
    if (\$pdo === null) {
        try {
            \$dsn = \"mysql:host=\" . DB_HOST . \";dbname=\" . DB_NAME . \";charset=\" . DB_CHARSET;
            \$pdo = new PDO(\$dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
        } catch (PDOException \$e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database connection failed: ' . \$e->getMessage()]);
            exit;
        }
    }
    return \$pdo;
}

function setCorsHeaders() {
    \$origin = \$_SERVER['HTTP_ORIGIN'] ?? '*';
    if (ALLOWED_ORIGINS !== '*') {
        \$allowed = array_map('trim', explode(',', ALLOWED_ORIGINS));
        if (!in_array(\$origin, \$allowed)) {
            \$origin = \$allowed[0];
        }
    }
    header(\"Access-Control-Allow-Origin: \$origin\");
    header(\"Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS\");
    header(\"Access-Control-Allow-Headers: Content-Type, Authorization, apikey, x-client-info\");
    header(\"Access-Control-Allow-Credentials: true\");
    header(\"Content-Type: application/json; charset=utf-8\");
    
    if (\$_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}
";
    file_put_contents(__DIR__ . '/api/config.php', $config);
}

// ============================================
// Check server requirements
// ============================================
function checkRequirements() {
    $checks = [];
    $checks['php_version'] = ['label' => 'PHP ≥ 7.4', 'ok' => version_compare(PHP_VERSION, '7.4.0', '>='), 'value' => PHP_VERSION];
    $checks['pdo'] = ['label' => 'Extensión PDO', 'ok' => extension_loaded('pdo'), 'value' => extension_loaded('pdo') ? 'Instalada' : 'No encontrada'];
    $checks['pdo_mysql'] = ['label' => 'PDO MySQL', 'ok' => extension_loaded('pdo_mysql'), 'value' => extension_loaded('pdo_mysql') ? 'Instalada' : 'No encontrada'];
    $checks['json'] = ['label' => 'Extensión JSON', 'ok' => extension_loaded('json'), 'value' => extension_loaded('json') ? 'Instalada' : 'No encontrada'];
    $checks['mbstring'] = ['label' => 'Extensión mbstring', 'ok' => extension_loaded('mbstring'), 'value' => extension_loaded('mbstring') ? 'Instalada' : 'No encontrada'];
    $checks['config_writable'] = ['label' => 'Directorio api/ escribible', 'ok' => is_writable(__DIR__ . '/api/'), 'value' => is_writable(__DIR__ . '/api/') ? 'Sí' : 'No'];
    
    $allOk = true;
    foreach ($checks as $c) { if (!$c['ok']) $allOk = false; }
    
    return ['checks' => $checks, 'allOk' => $allOk];
}

$requirements = checkRequirements();
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Instalador — Puerta Abierta Recreando</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #f8f0fc 0%, #e8f4f8 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .container { background: white; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); max-width: 600px; width: 100%; overflow: hidden; }
        .header { background: linear-gradient(135deg, #7c3aed, #a855f7); padding: 30px; text-align: center; color: white; }
        .header h1 { font-size: 1.5rem; margin-bottom: 5px; }
        .header p { opacity: 0.9; font-size: 0.9rem; }
        .steps { display: flex; justify-content: center; gap: 8px; padding: 20px 30px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
        .step-dot { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.85rem; background: #e5e7eb; color: #9ca3af; transition: all 0.3s; }
        .step-dot.active { background: #7c3aed; color: white; }
        .step-dot.done { background: #10b981; color: white; }
        .step-line { width: 30px; height: 2px; background: #e5e7eb; align-self: center; }
        .content { padding: 30px; }
        .content h2 { font-size: 1.2rem; color: #1f2937; margin-bottom: 15px; }
        .content p { color: #6b7280; margin-bottom: 20px; line-height: 1.6; }
        .form-group { margin-bottom: 16px; }
        .form-group label { display: block; font-weight: 500; margin-bottom: 6px; color: #374151; font-size: 0.9rem; }
        .form-group input { width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.95rem; transition: border-color 0.2s; }
        .form-group input:focus { outline: none; border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124,58,237,0.1); }
        .btn { display: inline-block; padding: 12px 24px; background: #7c3aed; color: white; border: none; border-radius: 8px; font-size: 1rem; font-weight: 500; cursor: pointer; width: 100%; transition: background 0.2s; }
        .btn:hover { background: #6d28d9; }
        .btn:disabled { background: #9ca3af; cursor: not-allowed; }
        .check-item { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
        .check-item:last-child { border: none; }
        .check-icon { font-size: 1.2rem; }
        .check-label { flex: 1; font-size: 0.9rem; color: #374151; }
        .check-value { font-size: 0.85rem; color: #6b7280; }
        .alert { padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; font-size: 0.9rem; }
        .alert-error { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
        .alert-success { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
        .final-box { text-align: center; padding: 20px 0; }
        .final-box .icon { font-size: 3rem; margin-bottom: 15px; }
        .final-box h2 { color: #16a34a; }
        .hint { font-size: 0.8rem; color: #9ca3af; margin-top: 4px; }
        code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 0.85rem; }
    </style>
</head>
<body>
<div class="container">
    <div class="header">
        <h1>🏠 Puerta Abierta Recreando</h1>
        <p>Asistente de instalación</p>
    </div>
    
    <div class="steps">
        <?php for ($i = 1; $i <= 5; $i++): ?>
            <?php if ($i > 1): ?><div class="step-line"></div><?php endif; ?>
            <div class="step-dot <?= $i < $step ? 'done' : ($i === $step ? 'active' : '') ?>">
                <?= $i < $step ? '✓' : $i ?>
            </div>
        <?php endfor; ?>
    </div>
    
    <div class="content">
        <?php foreach ($errors as $e): ?>
            <div class="alert alert-error">❌ <?= htmlspecialchars($e) ?></div>
        <?php endforeach; ?>
        <?php foreach ($success as $s): ?>
            <div class="alert alert-success">✅ <?= htmlspecialchars($s) ?></div>
        <?php endforeach; ?>
        
        <?php if ($step === 1): ?>
            <!-- PASO 1: Verificar requisitos -->
            <h2>Paso 1: Verificar requisitos</h2>
            <p>Verificando que tu servidor cumple con los requisitos necesarios.</p>
            
            <?php foreach ($requirements['checks'] as $check): ?>
                <div class="check-item">
                    <span class="check-icon"><?= $check['ok'] ? '✅' : '❌' ?></span>
                    <span class="check-label"><?= $check['label'] ?></span>
                    <span class="check-value"><?= htmlspecialchars($check['value']) ?></span>
                </div>
            <?php endforeach; ?>
            
            <?php if ($requirements['allOk']): ?>
                <br>
                <a href="?step=2"><button class="btn">Continuar →</button></a>
            <?php else: ?>
                <br>
                <div class="alert alert-error">Corregí los requisitos marcados con ❌ antes de continuar.</div>
            <?php endif; ?>
        
        <?php elseif ($step === 2): ?>
            <!-- PASO 2: Conexión a base de datos -->
            <h2>Paso 2: Conexión a la base de datos</h2>
            <p>Ingresá los datos de conexión a tu base de datos MySQL/MariaDB.</p>
            
            <form method="POST">
                <input type="hidden" name="step" value="2">
                <div class="form-group">
                    <label>Servidor</label>
                    <input type="text" name="db_host" value="<?= htmlspecialchars($_POST['db_host'] ?? 'localhost') ?>" required>
                    <div class="hint">Generalmente "localhost" o una IP</div>
                </div>
                <div class="form-group">
                    <label>Nombre de la base de datos</label>
                    <input type="text" name="db_name" value="<?= htmlspecialchars($_POST['db_name'] ?? 'par_registro') ?>" required>
                    <div class="hint">Se creará automáticamente si no existe</div>
                </div>
                <div class="form-group">
                    <label>Usuario</label>
                    <input type="text" name="db_user" value="<?= htmlspecialchars($_POST['db_user'] ?? '') ?>" required>
                </div>
                <div class="form-group">
                    <label>Contraseña</label>
                    <input type="password" name="db_pass" value="">
                </div>
                <button type="submit" class="btn">Conectar y continuar →</button>
            </form>
        
        <?php elseif ($step === 3): ?>
            <!-- PASO 3: Crear tablas -->
            <h2>Paso 3: Crear tablas</h2>
            <p>Se van a crear todas las tablas necesarias para la aplicación. Este proceso es automático.</p>
            <p><strong>Tablas a crear:</strong> auth_users, profiles, user_roles, mujeres, equipo, centro_dia, trabajo_campo, gastos, etiquetas_gastos, contactos, eventos, duplas_acompanamiento, reuniones_semanales, asignaciones_roles, disponibilidad_reuniones, actividades, albumes, fotos_album, lugares, nacionalidades, cargos_profesionales, app_metadata</p>
            
            <form method="POST">
                <input type="hidden" name="step" value="3">
                <button type="submit" class="btn">Crear tablas →</button>
            </form>
        
        <?php elseif ($step === 4): ?>
            <!-- PASO 4: Crear administrador -->
            <h2>Paso 4: Crear administrador</h2>
            <p>Creá la cuenta del primer usuario administrador.</p>
            
            <form method="POST">
                <input type="hidden" name="step" value="4">
                <div class="form-group">
                    <label>Nombre</label>
                    <input type="text" name="admin_nombre" value="<?= htmlspecialchars($_POST['admin_nombre'] ?? '') ?>">
                </div>
                <div class="form-group">
                    <label>Apellido</label>
                    <input type="text" name="admin_apellido" value="<?= htmlspecialchars($_POST['admin_apellido'] ?? '') ?>">
                </div>
                <div class="form-group">
                    <label>Email *</label>
                    <input type="email" name="admin_email" value="<?= htmlspecialchars($_POST['admin_email'] ?? '') ?>" required>
                </div>
                <div class="form-group">
                    <label>Contraseña *</label>
                    <input type="password" name="admin_pass" required minlength="6">
                    <div class="hint">Mínimo 6 caracteres</div>
                </div>
                <button type="submit" class="btn">Crear administrador →</button>
            </form>
        
        <?php elseif ($step === 5): ?>
            <!-- PASO 5: Instalación completa -->
            <div class="final-box">
                <div class="icon">🎉</div>
                <h2>¡Instalación completada!</h2>
                <p style="margin-top: 15px;">La aplicación fue configurada correctamente.</p>
                <p><strong>Administrador:</strong> <?= htmlspecialchars($_SESSION['admin_email'] ?? '') ?></p>
                
                <div class="alert alert-success" style="margin-top: 20px; text-align: left;">
                    <strong>Próximos pasos:</strong><br>
                    1. <strong>Eliminá</strong> este archivo <code>install.php</code> del servidor por seguridad.<br>
                    2. Accedé a la aplicación desde tu navegador.<br>
                    3. Ingresá con las credenciales del administrador.
                </div>
                
                <div class="alert alert-error" style="margin-top: 10px; text-align: left;">
                    ⚠️ <strong>Importante:</strong> Eliminá <code>install.php</code> inmediatamente después de la instalación para evitar que alguien reinstale la aplicación.
                </div>
            </div>
        <?php endif; ?>
    </div>
</div>
</body>
</html>
