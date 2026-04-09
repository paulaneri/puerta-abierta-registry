<?php
// ============================================
// JWT Helper - Encode/Decode tokens
// ============================================

function base64url_encode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64url_decode($data) {
    return base64_decode(strtr($data, '-_', '+/'));
}

function jwt_encode($payload) {
    $header = ['alg' => 'HS256', 'typ' => 'JWT'];
    $segments = [];
    $segments[] = base64url_encode(json_encode($header));
    $segments[] = base64url_encode(json_encode($payload));
    $signing_input = implode('.', $segments);
    $signature = hash_hmac('sha256', $signing_input, JWT_SECRET, true);
    $segments[] = base64url_encode($signature);
    return implode('.', $segments);
}

function jwt_decode($token) {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;
    
    $signature = hash_hmac('sha256', $parts[0] . '.' . $parts[1], JWT_SECRET, true);
    if (!hash_equals(base64url_encode($signature), $parts[2])) return null;
    
    $payload = json_decode(base64url_decode($parts[1]), true);
    if (!$payload) return null;
    
    if (isset($payload['exp']) && $payload['exp'] < time()) return null;
    
    return $payload;
}

function get_authenticated_user() {
    $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (preg_match('/Bearer\s+(.+)$/i', $auth, $matches)) {
        return jwt_decode($matches[1]);
    }
    return null;
}

function require_auth() {
    $user = get_authenticated_user();
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'No autenticado']);
        exit;
    }
    return $user;
}
