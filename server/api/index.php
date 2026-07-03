<?php
// ============================================
// API REST Principal - Router genérico CRUD
// Con autorización por rol (equivalente a RLS) y
// allow-list de columnas para prevenir inyección SQL por identificadores.
// ============================================

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/jwt.php';

setCorsHeaders();

if (!INSTALLED) {
    http_response_code(503);
    echo json_encode(['error' => 'La aplicación no está instalada. Ejecutá install.php']);
    exit;
}

$user = require_auth();
$userRole = $user['role'] ?? 'trabajador';
$db = getDB();

// Parse URL: /api/rest/v1/{table}
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$segments = array_values(array_filter(explode('/', $path)));

$tableIndex = array_search('v1', $segments);
$table = ($tableIndex !== false && isset($segments[$tableIndex + 1])) ? $segments[$tableIndex + 1] : null;

if (!$table || !validIdentifier($table)) {
    http_response_code(400);
    echo json_encode(['error' => 'Tabla inválida']);
    exit;
}

// user_roles NUNCA se expone por CRUD genérico (privilege escalation).
$blockedTables = ['user_roles', 'auth_users'];
if (in_array($table, $blockedTables, true)) {
    http_response_code(403);
    echo json_encode(['error' => "Tabla '$table' no accesible por esta vía"]);
    exit;
}

$perms = getTablePermissions();
if (!isset($perms[$table])) {
    http_response_code(403);
    echo json_encode(['error' => "Tabla '$table' no permitida"]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$opMap = ['GET' => 'select', 'POST' => 'insert', 'PATCH' => 'update', 'DELETE' => 'delete'];
$op = $opMap[$method] ?? null;
if (!$op) {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    exit;
}

if (!authorizeTableOp($table, $op, $userRole)) {
    http_response_code(403);
    echo json_encode(['error' => 'No autorizado para esta operación']);
    exit;
}

$allowedCols = getAllowedColumns($db, $table);

switch ($op) {
    case 'select': handleSelect($db, $table, $allowedCols); break;
    case 'insert': handleInsert($db, $table, $allowedCols); break;
    case 'update': handleUpdate($db, $table, $allowedCols); break;
    case 'delete': handleDelete($db, $table, $allowedCols); break;
}

// ============================================

function handleSelect($db, $table, $allowedCols) {
    // Validar 'select': solo '*' o lista de columnas conocidas separadas por coma.
    $selectRaw = $_GET['select'] ?? '*';
    if ($selectRaw === '*') {
        $selectSql = '*';
    } else {
        $parts = array_map('trim', explode(',', $selectRaw));
        foreach ($parts as $c) {
            if (!validIdentifier($c) || !in_array($c, $allowedCols, true)) {
                http_response_code(400);
                echo json_encode(['error' => "Columna inválida en select: $c"]);
                return;
            }
        }
        $selectSql = implode(', ', array_map(fn($c) => "`$c`", $parts));
    }

    $where = buildWhereClause($allowedCols);
    if ($where === false) return;
    $order = buildOrderClause($allowedCols);
    if ($order === false) return;

    $limit = isset($_GET['limit']) ? max(0, min(10000, (int)$_GET['limit'])) : 1000;
    $offset = isset($_GET['offset']) ? max(0, (int)$_GET['offset']) : 0;

    $sql = "SELECT $selectSql FROM `$table`";
    if ($where['sql']) $sql .= " WHERE " . $where['sql'];
    if ($order) $sql .= " ORDER BY $order";
    $sql .= " LIMIT $limit OFFSET $offset";

    $stmt = $db->prepare($sql);
    $stmt->execute($where['params']);
    $results = $stmt->fetchAll();

    foreach ($results as &$row) {
        foreach ($row as $key => &$value) {
            if (is_string($value) && (str_starts_with($value, '{') || str_starts_with($value, '['))) {
                $decoded = json_decode($value, true);
                if ($decoded !== null) $value = $decoded;
            }
        }
    }

    $prefer = $_SERVER['HTTP_PREFER'] ?? '';
    if (strpos($prefer, 'return=representation') !== false && count($results) === 1) {
        echo json_encode($results[0]);
    } else {
        echo json_encode($results);
    }
}

function handleInsert($db, $table, $allowedCols) {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        http_response_code(400);
        echo json_encode(['error' => 'Datos inválidos']);
        return;
    }

    $rows = isset($input[0]) ? $input : [$input];
    $results = [];

    foreach ($rows as $row) {
        if (!isset($row['id'])) {
            $row['id'] = generateUUID();
        }

        // Filtrar columnas contra allow-list
        $clean = [];
        foreach ($row as $col => $val) {
            if (!validIdentifier($col) || !in_array($col, $allowedCols, true)) {
                http_response_code(400);
                echo json_encode(['error' => "Columna inválida: $col"]);
                return;
            }
            if (is_array($val)) $val = json_encode($val);
            $clean[$col] = $val;
        }

        $columns = array_keys($clean);
        $placeholders = array_fill(0, count($columns), '?');
        $sql = "INSERT INTO `$table` (`" . implode('`, `', $columns) . "`) VALUES (" . implode(', ', $placeholders) . ")";

        $stmt = $db->prepare($sql);
        $stmt->execute(array_values($clean));

        $stmt2 = $db->prepare("SELECT * FROM `$table` WHERE id = ?");
        $stmt2->execute([$clean['id']]);
        $results[] = $stmt2->fetch();
    }

    http_response_code(201);
    echo json_encode(count($results) === 1 ? $results[0] : $results);
}

function handleUpdate($db, $table, $allowedCols) {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        http_response_code(400);
        echo json_encode(['error' => 'Datos inválidos']);
        return;
    }

    $where = buildWhereClause($allowedCols);
    if ($where === false) return;
    if (!$where['sql']) {
        http_response_code(400);
        echo json_encode(['error' => 'Se requiere un filtro para actualizar']);
        return;
    }

    $sets = [];
    $params = [];
    foreach ($input as $col => $val) {
        if (!validIdentifier($col) || !in_array($col, $allowedCols, true)) {
            http_response_code(400);
            echo json_encode(['error' => "Columna inválida: $col"]);
            return;
        }
        if (is_array($val)) $val = json_encode($val);
        $sets[] = "`$col` = ?";
        $params[] = $val;
    }
    if (!$sets) {
        http_response_code(400);
        echo json_encode(['error' => 'Sin campos para actualizar']);
        return;
    }

    $params = array_merge($params, $where['params']);
    $sql = "UPDATE `$table` SET " . implode(', ', $sets) . " WHERE " . $where['sql'];

    $stmt = $db->prepare($sql);
    $stmt->execute($params);

    $sql2 = "SELECT * FROM `$table` WHERE " . $where['sql'];
    $stmt2 = $db->prepare($sql2);
    $stmt2->execute($where['params']);
    $results = $stmt2->fetchAll();

    echo json_encode($results);
}

function handleDelete($db, $table, $allowedCols) {
    $where = buildWhereClause($allowedCols);
    if ($where === false) return;
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
// Con allow-list de columnas.
// ============================================

function buildWhereClause($allowedCols) {
    $conditions = [];
    $params = [];

    foreach ($_GET as $key => $value) {
        if (in_array($key, ['select', 'order', 'limit', 'offset'])) continue;

        // Validar identificador contra allow-list
        if (!validIdentifier($key) || !in_array($key, $allowedCols, true)) {
            http_response_code(400);
            echo json_encode(['error' => "Filtro con columna inválida: $key"]);
            return false;
        }

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

function buildOrderClause($allowedCols) {
    $order = $_GET['order'] ?? '';
    if (!$order) return '';

    $parts = [];
    foreach (explode(',', $order) as $item) {
        $item = trim($item);
        $dir = 'ASC';
        $col = $item;
        if (str_ends_with($item, '.desc')) { $dir = 'DESC'; $col = substr($item, 0, -5); }
        elseif (str_ends_with($item, '.asc')) { $dir = 'ASC'; $col = substr($item, 0, -4); }

        if (!validIdentifier($col) || !in_array($col, $allowedCols, true)) {
            http_response_code(400);
            echo json_encode(['error' => "Orden con columna inválida: $col"]);
            return false;
        }
        $parts[] = "`$col` $dir";
    }
    return implode(', ', $parts);
}

function generateUUID() {
    $data = random_bytes(16);
    $data[6] = chr((ord($data[6]) & 0x0f) | 0x40);
    $data[8] = chr((ord($data[8]) & 0x3f) | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}
