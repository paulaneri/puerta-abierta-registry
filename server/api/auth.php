<?php
// ============================================
// Autenticación - Login, Signup, Session
// ============================================

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/jwt.php';

setCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true) ?? [];

// Determinar acción desde la URL
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$segments = array_values(array_filter(explode('/', $path)));
$action = end($segments);

switch ($action) {
    case 'signup':
        handleSignup($input);
        break;
    case 'login':
        handleLogin($input);
        break;
    case 'session':
        handleSession();
        break;
    case 'user':
        handleGetUser();
        break;
    case 'signout':
        handleSignout();
        break;
    default:
        http_response_code(404);
        echo json_encode(['error' => 'Endpoint no encontrado']);
}

function handleSignup($input) {
    $email = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';
    $nombre = $input['nombre'] ?? '';
    $apellido = $input['apellido'] ?? '';
    
    if (!$email || !$password) {
        http_response_code(400);
        echo json_encode(['error' => 'Email y contraseña son requeridos']);
        return;
    }
    
    if (strlen($password) < 6) {
        http_response_code(400);
        echo json_encode(['error' => 'La contraseña debe tener al menos 6 caracteres']);
        return;
    }
    
    $db = getDB();
    
    // Check if user exists
    $stmt = $db->prepare("SELECT id FROM auth_users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(['error' => 'El usuario ya existe']);
        return;
    }
    
    $userId = generateUUID();
    $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
    
    $db->beginTransaction();
    try {
        // Create user
        $stmt = $db->prepare("INSERT INTO auth_users (id, email, encrypted_password, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())");
        $stmt->execute([$userId, $email, $hashedPassword]);
        
        // Create profile
        $stmt = $db->prepare("INSERT INTO profiles (id, email, nombre, apellido, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())");
        $stmt->execute([$userId, $email, $nombre, $apellido]);
        
        // Check if first user → make admin, otherwise trabajador
        $stmt = $db->prepare("SELECT COUNT(*) as total FROM auth_users");
        $stmt->execute();
        $count = $stmt->fetch()['total'];
        
        $role = ($count <= 1) ? 'administrador' : 'trabajador';
        $stmt = $db->prepare("INSERT INTO user_roles (id, user_id, role, created_at) VALUES (?, ?, ?, NOW())");
        $stmt->execute([generateUUID(), $userId, $role]);
        
        $db->commit();
        
        // Generate token
        $token = jwt_encode([
            'sub' => $userId,
            'email' => $email,
            'role' => $role,
            'exp' => time() + JWT_EXPIRY,
            'iat' => time()
        ]);
        
        echo json_encode([
            'access_token' => $token,
            'token_type' => 'bearer',
            'user' => [
                'id' => $userId,
                'email' => $email,
                'role' => $role
            ]
        ]);
    } catch (Exception $e) {
        $db->rollBack();
        http_response_code(500);
        echo json_encode(['error' => 'Error al crear usuario: ' . $e->getMessage()]);
    }
}

function handleLogin($input) {
    $email = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';
    
    if (!$email || !$password) {
        http_response_code(400);
        echo json_encode(['error' => 'Email y contraseña son requeridos']);
        return;
    }
    
    $db = getDB();
    
    $stmt = $db->prepare("SELECT u.id, u.email, u.encrypted_password, r.role FROM auth_users u LEFT JOIN user_roles r ON u.id = r.user_id WHERE u.email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    
    if (!$user || !password_verify($password, $user['encrypted_password'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Credenciales inválidas']);
        return;
    }
    
    $token = jwt_encode([
        'sub' => $user['id'],
        'email' => $user['email'],
        'role' => $user['role'] ?? 'trabajador',
        'exp' => time() + JWT_EXPIRY,
        'iat' => time()
    ]);
    
    echo json_encode([
        'access_token' => $token,
        'token_type' => 'bearer',
        'user' => [
            'id' => $user['id'],
            'email' => $user['email'],
            'role' => $user['role'] ?? 'trabajador'
        ]
    ]);
}

function handleSession() {
    $user = get_authenticated_user();
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'No autenticado', 'session' => null]);
        return;
    }
    
    $token = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    // Remove "Bearer " prefix if present
    if (strpos($token, 'Bearer ') === 0) {
        $token = substr($token, 7);
    }
    
    echo json_encode([
        'session' => [
            'access_token' => $token,
            'user' => [
                'id' => $user['sub'],
                'email' => $user['email'],
                'role' => $user['role'] ?? 'trabajador'
            ]
        ]
    ]);
}

function handleSignout() {
    echo json_encode(['success' => true]);
}

function handleGetUser() {
    $user = get_authenticated_user();
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'No autenticado', 'user' => null]);
        return;
    }
    
    $db = getDB();
    $stmt = $db->prepare("SELECT p.*, r.role FROM profiles p LEFT JOIN user_roles r ON p.id = r.user_id WHERE p.id = ?");
    $stmt->execute([$user['sub']]);
    $profile = $stmt->fetch();
    
    echo json_encode([
        'user' => [
            'id' => $user['sub'],
            'email' => $user['email'],
            'role' => $profile['role'] ?? $user['role'] ?? 'trabajador',
            'user_metadata' => [
                'nombre' => $profile['nombre'] ?? '',
                'apellido' => $profile['apellido'] ?? ''
            ]
        ]
    ]);
}

function generateUUID() {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}
