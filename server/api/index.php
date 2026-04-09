<?php
// ============================================
// API REST Principal - Router genérico CRUD
// ============================================

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/jwt.php';

setCorsHeaders();

// Check installation
if (!INSTALLED) {
    http_response_code(503);
    echo json_encode(['error' => 'La aplicación no está instalada. Ejecutá install.php']);
    exit;
}

$user = require_auth();
$db = getDB();

// Parse URL: /api/rest/v1/{table}
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$segments = array_values(array_filter(explode('/', $path)));

// Find table name (after 'v1')
$tableIndex = array_search('v1', $segments);
$table = ($tableIndex !== false && isset($segments[$tableIndex + 1])) ? $segments[$tableIndex + 1] : null;

if (!$table) {
    http_response_code(400);
    echo json_encode(['error' => 'Tabla no especificada']);
    exit;
}

// Allowed tables
$allowedTables = [
    'mujeres', 'equipo', 'centro_dia', 'trabajo_campo', 'gastos', 
    'etiquetas_gastos', 'contactos', 'eventos', 'duplas_acompanamiento',
    'reuniones_semanales', 'asignaciones_roles', 'disponibilidad_reuniones',
    'actividades', 'albumes', 'fotos_album', 'lugares', 'nacionalidades',
    'cargos_profesionales', 'profiles', 'user_roles'
];

if (!in_array($table, $allowedTables)) {
    http_response_code(403);
    echo json_encode(['error' => "Tabla '$table' no permitida"]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleSelect($db, $table);
        break;
    case 'POST':
        handleInsert($db, $table);
        break;
    case 'PATCH':
        handleUpdate($db, $table);
        break;
    case 'DELETE':
        handleDelete($db, $table);
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Método no permitido']);
}

function handleSelect($db, $table) {
    $select = $_GET['select'] ?? '*';
    $where = buildWhereClause();
    $order = buildOrderClause();
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 1000;
    $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
    
    $sql = "SELECT $select FROM `$table`";
    if ($where['sql']) $sql .= " WHERE " . $where['sql'];
    if ($order) $sql .= " ORDER BY $order";
    $sql .= " LIMIT $limit OFFSET $offset";
    
    $stmt = $db->prepare($sql);
    $stmt->execute($where['params']);
    $results = $stmt->fetchAll();
    
    // Parse JSON fields
    foreach ($results as &$row) {
        foreach ($row as $key => &$value) {
            if (is_string($value) && (str_starts_with($value, '{') || str_starts_with($value, '['))) {
                $decoded = json_decode($value, true);
                if ($decoded !== null) $value = $decoded;
            }
        }
    }
    
    // Check if single row requested via header
    $prefer = $_SERVER['HTTP_PREFER'] ?? '';
    if (strpos($prefer, 'return=representation') !== false && count($results) === 1) {
        echo json_encode($results[0]);
    } else {
        echo json_encode($results);
    }
}

function handleInsert($db, $table) {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        http_response_code(400);
        echo json_encode(['error' => 'Datos inválidos']);
        return;
    }
    
    // Handle single or bulk insert
    $rows = isset($input[0]) ? $input : [$input];
    $results = [];
    
    foreach ($rows as $row) {
        // Add UUID if not present
        if (!isset($row['id'])) {
            $row['id'] = generateUUID();
        }
        
        // Encode JSON fields
        foreach ($row as $key => &$value) {
            if (is_array($value)) $value = json_encode($value);
        }
        
        $columns = array_keys($row);
        $placeholders = array_fill(0, count($columns), '?');
        $sql = "INSERT INTO `$table` (`" . implode('`, `', $columns) . "`) VALUES (" . implode(', ', $placeholders) . ")";
        
        $stmt = $db->prepare($sql);
        $stmt->execute(array_values($row));
        
        // Fetch inserted row
        $stmt2 = $db->prepare("SELECT * FROM `$table` WHERE id = ?");
        $stmt2->execute([$row['id']]);
        $results[] = $stmt2->fetch();
    }
    
    http_response_code(201);
    echo json_encode(count($results) === 1 ? $results[0] : $results);
}

function handleUpdate($db, $table) {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        http_response_code(400);
        echo json_encode(['error' => 'Datos inválidos']);
        return;
    }
    
    $where = buildWhereClause();
    if (!$where['sql']) {
        http_response_code(400);
        echo json_encode(['error' => 'Se requiere un filtro para actualizar']);
        return;
    }
    
    // Encode JSON fields
    foreach ($input as $key => &$value) {
        if (is_array($value)) $value = json_encode($value);
    }
    
    $sets = [];
    $params = [];
    foreach ($input as $col => $val) {
        $sets[] = "`$col` = ?";
        $params[] = $val;
    }
    
    $params = array_merge($params, $where['params']);
    $sql = "UPDATE `$table` SET " . implode(', ', $sets) . " WHERE " . $where['sql'];
    
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    
    // Return updated rows
    $sql2 = "SELECT * FROM `$table` WHERE " . $where['sql'];
    $stmt2 = $db->prepare($sql2);
    $stmt2->execute($where['params']);
    $results = $stmt2->fetchAll();
    
    echo json_encode($results);
}

function handleDelete($db, $table) {
    $where = buildWhereClause();
    if (!$where['sql']) {
        http_response_code(400);
        echo json_encode(['error' => 'Se requiere un filtro para eliminar']);
        return;
    }
    
    $sql = "DELETE FROM `$table` WHERE " . $where['sql'];
    $stmt = $db->prepare($sql);
    $stmt->execute($where['params']);
    
    echo json_encode(['success' => true, 'deleted' => $stmt->rowCount()]);
}

// ============================================
// Query builders (Supabase-style filters)
// ============================================

function buildWhereClause() {
    $conditions = [];
    $params = [];
    
    foreach ($_GET as $key => $value) {
        if (in_array($key, ['select', 'order', 'limit', 'offset'])) continue;
        
        // Parse operator: column=op.value
        if (preg_match('/^(eq|neq|gt|gte|lt|lte|like|ilike|is|in)\.(.*)$/', $value, $m)) {
            $op = $m[1];
            $val = $m[2];
            
            switch ($op) {
                case 'eq': $conditions[] = "`$key` = ?"; $params[] = $val; break;
                case 'neq': $conditions[] = "`$key` != ?"; $params[] = $val; break;
                case 'gt': $conditions[] = "`$key` > ?"; $params[] = $val; break;
                case 'gte': $conditions[] = "`$key` >= ?"; $params[] = $val; break;
                case 'lt': $conditions[] = "`$key` < ?"; $params[] = $val; break;
                case 'lte': $conditions[] = "`$key` <= ?"; $params[] = $val; break;
                case 'like': $conditions[] = "`$key` LIKE ?"; $params[] = $val; break;
                case 'ilike': $conditions[] = "LOWER(`$key`) LIKE LOWER(?)"; $params[] = $val; break;
                case 'is':
                    if ($val === 'null') $conditions[] = "`$key` IS NULL";
                    elseif ($val === 'true') $conditions[] = "`$key` = 1";
                    elseif ($val === 'false') $conditions[] = "`$key` = 0";
                    break;
                case 'in':
                    $vals = explode(',', trim($val, '()'));
                    $placeholders = array_fill(0, count($vals), '?');
                    $conditions[] = "`$key` IN (" . implode(',', $placeholders) . ")";
                    $params = array_merge($params, $vals);
                    break;
            }
        }
    }
    
    return ['sql' => implode(' AND ', $conditions), 'params' => $params];
}

function buildOrderClause() {
    $order = $_GET['order'] ?? '';
    if (!$order) return '';
    
    $parts = [];
    foreach (explode(',', $order) as $item) {
        $item = trim($item);
        if (str_ends_with($item, '.desc')) {
            $parts[] = '`' . substr($item, 0, -5) . '` DESC';
        } elseif (str_ends_with($item, '.asc')) {
            $parts[] = '`' . substr($item, 0, -4) . '` ASC';
        } else {
            $parts[] = "`$item` ASC";
        }
    }
    return implode(', ', $parts);
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
