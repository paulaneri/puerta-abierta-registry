<?php
// ============================================
// Storage - Subida, descarga y borrado de archivos
// Rutas:
//   POST   /api/storage/object/{bucket}/{path}  (subir, requiere auth)
//   DELETE /api/storage/object/{bucket}/{path}  (borrar, requiere auth)
//   GET    /storage/{bucket}/{path}             (servir archivo)
// ============================================

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/jwt.php';

// Permisos por bucket (espejo de las políticas de Supabase)
// 'public' => se puede ver sin iniciar sesión
// 'roles'  => roles que pueden subir/borrar (y ver si no es público)
function getBucketRules() {
    return [
        'fotos-albumes'      => ['public' => true,  'roles' => ['administrador', 'coordinador', 'trabajador'], 'images_only' => true],
        'gastos-documentos'  => ['public' => false, 'roles' => ['administrador', 'coordinador'], 'images_only' => false],
        'mujeres-documentos' => ['public' => false, 'roles' => ['administrador', 'coordinador', 'trabajador'], 'images_only' => false],
    ];
}

define('STORAGE_MAX_BYTES', 15 * 1024 * 1024); // 15 MB por archivo

function storageBaseDir() {
    return __DIR__ . '/../storage';
}

// Extrae bucket y path de la URL actual
function parseStorageRequest($marker) {
    $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $pos = strpos($uri, $marker);
    if ($pos === false) return null;
    $rest = substr($uri, $pos + strlen($marker));
    $rest = rawurldecode($rest);
    $parts = explode('/', ltrim($rest, '/'), 2);
    if (count($parts) !== 2 || $parts[0] === '' || $parts[1] === '') return null;
    return ['bucket' => $parts[0], 'path' => $parts[1]];
}

// Valida bucket y path contra traversal e inyección
function validateTarget($bucket, $path) {
    $rules = getBucketRules();
    if (!isset($rules[$bucket])) return ['error' => 'Bucket no permitido', 'code' => 403];
    if (strlen($path) > 300) return ['error' => 'Ruta demasiado larga', 'code' => 400];
    if (strpos($path, '..') !== false) return ['error' => 'Ruta inválida', 'code' => 400];
    if (!preg_match('#^[a-zA-Z0-9._/\-]+$#', $path)) return ['error' => 'Ruta con caracteres inválidos', 'code' => 400];
    return ['rules' => $rules[$bucket]];
}

// Auth por header Authorization o por ?token= (para <img> de buckets privados)
function storageAuthUser() {
    $user = get_authenticated_user();
    if ($user) return $user;
    $token = $_GET['token'] ?? '';
    if ($token !== '') return jwt_decode($token);
    return null;
}

function jsonError($msg, $code) {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => $msg]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

// ─── GET: servir archivo ─────────────────────────────────────
if ($method === 'GET') {
    $req = parseStorageRequest('/storage/');
    if (!$req || strpos(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/storage/object/') !== false) {
        jsonError('Ruta inválida', 400);
    }
    $check = validateTarget($req['bucket'], $req['path']);
    if (isset($check['error'])) jsonError($check['error'], $check['code']);
    $rules = $check['rules'];

    if (!$rules['public']) {
        $user = storageAuthUser();
        if (!$user) jsonError('No autenticado', 401);
        $role = $user['role'] ?? 'trabajador';
        if (!in_array($role, $rules['roles'], true)) jsonError('No autorizado', 403);
    }

    $file = storageBaseDir() . '/' . $req['bucket'] . '/' . $req['path'];
    $realBase = realpath(storageBaseDir());
    $realFile = realpath($file);
    if (!$realFile || !$realBase || strpos($realFile, $realBase) !== 0 || !is_file($realFile)) {
        jsonError('Archivo no encontrado', 404);
    }

    $ext = strtolower(pathinfo($realFile, PATHINFO_EXTENSION));
    $mimes = [
        'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png',
        'gif' => 'image/gif', 'webp' => 'image/webp', 'heic' => 'image/heic',
        'pdf' => 'application/pdf', 'txt' => 'text/plain; charset=utf-8',
        'doc' => 'application/msword',
        'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'xls' => 'application/vnd.ms-excel',
        'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    $mime = $mimes[$ext] ?? 'application/octet-stream';

    header('Content-Type: ' . $mime);
    header('Content-Length: ' . filesize($realFile));
    header('Content-Disposition: inline; filename="' . basename($realFile) . '"');
    header('Cache-Control: private, max-age=86400');
    header('X-Content-Type-Options: nosniff');
    readfile($realFile);
    exit;
}

// ─── POST / DELETE: requieren auth ───────────────────────────
setCorsHeaders();

$req = parseStorageRequest('/storage/object/');
if (!$req) jsonError('Ruta inválida', 400);
$check = validateTarget($req['bucket'], $req['path']);
if (isset($check['error'])) jsonError($check['error'], $check['code']);
$rules = $check['rules'];

$user = require_auth();
$role = $user['role'] ?? 'trabajador';
if (!in_array($role, $rules['roles'], true)) jsonError('No autorizado para este bucket', 403);

$dest = storageBaseDir() . '/' . $req['bucket'] . '/' . $req['path'];

if ($method === 'POST') {
    if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        $code = $_FILES['file']['error'] ?? 'sin archivo';
        jsonError('Error al recibir el archivo (código ' . $code . ')', 400);
    }
    if ($_FILES['file']['size'] > STORAGE_MAX_BYTES) {
        jsonError('El archivo pesa demasiado (máximo 15 MB)', 413);
    }
    if ($rules['images_only']) {
        $info = @getimagesize($_FILES['file']['tmp_name']);
        if ($info === false) jsonError('El archivo no es una imagen válida', 400);
    }

    $dir = dirname($dest);
    if (!is_dir($dir) && !mkdir($dir, 0755, true)) {
        jsonError('No se pudo crear la carpeta de destino', 500);
    }
    if (!move_uploaded_file($_FILES['file']['tmp_name'], $dest)) {
        jsonError('No se pudo guardar el archivo', 500);
    }

    http_response_code(200);
    echo json_encode(['data' => ['path' => $req['path'], 'bucket' => $req['bucket']]]);
    exit;
}

if ($method === 'DELETE') {
    $realBase = realpath(storageBaseDir());
    $realFile = realpath($dest);
    if ($realFile && $realBase && strpos($realFile, $realBase) === 0 && is_file($realFile)) {
        unlink($realFile);
    }
    echo json_encode(['data' => null, 'error' => null]);
    exit;
}

jsonError('Método no permitido', 405);
