<?php
// api/routes/services.php
require_once __DIR__ . '/../config/db.php';

$authPayload = authenticate(); 

$method = $_SERVER['REQUEST_METHOD'];
$id = null;

if (preg_match('#^/services/(\d+)$#', $path, $matches)) {
    $id = $matches[1];
}

function parseRequiredParts($jsonString) {
    if (!$jsonString || $jsonString === '[]') return [];
    $parts = json_decode($jsonString, true);
    return is_array($parts) ? $parts : [];
}

if ($method === 'GET' && !$id) {
    $rows = all("
      SELECT s.*,
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', sp.id,
                   'sparePartId', p.id,
                   'partCode', p.part_code,
                   'name', p.name,
                   'brand', p.brand,
                   'unitPrice', p.unit_price,
                   'stockQuantity', p.stock_quantity,
                   'quantity', sp.quantity
                 )
               ) FILTER (WHERE sp.id IS NOT NULL),
               '[]'
             ) AS required_parts
      FROM services s
      LEFT JOIN service_parts sp ON sp.service_id = s.id
      LEFT JOIN spare_parts p ON sp.spare_part_id = p.id
      GROUP BY s.id
      ORDER BY s.id ASC
    ");

    $services = array_map(function($r) {
        return [
            'id' => $r['id'],
            'name' => $r['name'],
            'category' => 'Maintenance',
            'description' => $r['description'] ?? '',
            'estimatedCost' => (float)($r['estimated_cost'] ?? 0),
            'laborHours' => (float)($r['estimated_hours'] ?? 1.0),
            'isActive' => (bool)$r['is_active'],
            'requiredParts' => parseRequiredParts($r['required_parts'])
        ];
    }, $rows);

    echo json_encode(['data' => $services]);
    exit;

} else if ($method === 'GET' && $id) {
    $r = get("
      SELECT s.*,
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', sp.id,
                   'sparePartId', p.id,
                   'partCode', p.part_code,
                   'name', p.name,
                   'brand', p.brand,
                   'unitPrice', p.unit_price,
                   'stockQuantity', p.stock_quantity,
                   'quantity', sp.quantity
                 )
               ) FILTER (WHERE sp.id IS NOT NULL),
               '[]'
             ) AS required_parts
       FROM services s
       LEFT JOIN service_parts sp ON sp.service_id = s.id
       LEFT JOIN spare_parts p ON sp.spare_part_id = p.id
       WHERE s.id = ?
       GROUP BY s.id",
       [$id]
    );

    if (!$r) {
        http_response_code(404);
        echo json_encode(['error' => 'Service not found']);
        exit;
    }

    echo json_encode(['data' => [
        'id' => $r['id'],
        'name' => $r['name'],
        'category' => 'Maintenance',
        'description' => $r['description'] ?? '',
        'estimatedCost' => (float)($r['estimated_cost'] ?? 0),
        'laborHours' => (float)($r['estimated_hours'] ?? 1.0),
        'isActive' => (bool)$r['is_active'],
        'requiredParts' => parseRequiredParts($r['required_parts'])
    ]]);
    exit;

} else if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $name = $input['name'] ?? '';
    
    if (!trim($name)) {
        http_response_code(400);
        echo json_encode(['error' => 'Service name is required']);
        exit;
    }

    run(
        "INSERT INTO services (name, description, estimated_cost, estimated_hours, is_active)
         VALUES (?, ?, ?, ?, ?)",
        [
            trim($name),
            $input['description'] ?? null,
            (float)($input['estimatedCost'] ?? 0),
            (float)($input['laborHours'] ?? 1.0),
            isset($input['isActive']) ? (int)$input['isActive'] : 1
        ]
    );

    global $pdo;
    $insertedId = $pdo->lastInsertId();
    if (!$insertedId) {
        $lastRow = get("SELECT * FROM services WHERE name = ? ORDER BY id DESC LIMIT 1", [trim($name)]);
        $inserted = $lastRow;
        $insertedId = $inserted['id'];
    } else {
        $inserted = get('SELECT * FROM services WHERE id = ?', [$insertedId]);
    }

    $savedParts = [];
    $requiredParts = $input['requiredParts'] ?? [];
    if (is_array($requiredParts) && count($requiredParts) > 0) {
        foreach ($requiredParts as $item) {
            $sparePartId = $item['sparePartId'] ?? $item['id'] ?? null;
            $qty = (int)($item['quantity'] ?? 1);
            if ($sparePartId) {
                run(
                    "INSERT INTO service_parts (service_id, spare_part_id, quantity)
                     VALUES (?, ?, ?)
                     ON CONFLICT (service_id, spare_part_id) DO UPDATE SET quantity = EXCLUDED.quantity",
                    [$insertedId, $sparePartId, $qty]
                );
            }
        }

        $savedParts = all(
            'SELECT sp.id, sp.quantity, p.id AS "sparePartId", p.part_code AS "partCode", p.name, p.brand, p.unit_price AS "unitPrice", p.stock_quantity AS "stockQuantity"
             FROM service_parts sp
             JOIN spare_parts p ON sp.spare_part_id = p.id
             WHERE sp.service_id = ?',
            [$insertedId]
        );
    }

    http_response_code(201);
    echo json_encode(['data' => [
        'id' => $inserted['id'],
        'name' => $inserted['name'],
        'category' => 'Maintenance',
        'description' => $inserted['description'] ?? '',
        'estimatedCost' => (float)($inserted['estimated_cost'] ?? 0),
        'laborHours' => (float)($inserted['estimated_hours'] ?? 1.0),
        'isActive' => (bool)$inserted['is_active'],
        'requiredParts' => $savedParts
    ]]);
    exit;

} else if ($method === 'PUT' && $id) {
    $input = json_decode(file_get_contents('php://input'), true);

    run(
        "UPDATE services
         SET name = COALESCE(?, name),
             description = COALESCE(?, description),
             estimated_cost = COALESCE(?, estimated_cost),
             estimated_hours = COALESCE(?, estimated_hours),
             is_active = COALESCE(?, is_active),
             updated_at = NOW()
         WHERE id = ?",
        [
            $input['name'] ?? null,
            $input['description'] ?? null,
            isset($input['estimatedCost']) ? (float)$input['estimatedCost'] : null,
            isset($input['laborHours']) ? (float)$input['laborHours'] : null,
            isset($input['isActive']) ? (int)$input['isActive'] : null,
            $id
        ]
    );

    $updated = get('SELECT * FROM services WHERE id = ?', [$id]);
    if (!$updated) {
        http_response_code(404);
        echo json_encode(['error' => 'Service not found']);
        exit;
    }

    $requiredParts = $input['requiredParts'] ?? null;
    if (is_array($requiredParts)) {
        run('DELETE FROM service_parts WHERE service_id = ?', [$id]);
        foreach ($requiredParts as $item) {
            $sparePartId = $item['sparePartId'] ?? $item['id'] ?? null;
            $qty = (int)($item['quantity'] ?? 1);
            if ($sparePartId) {
                run(
                    "INSERT INTO service_parts (service_id, spare_part_id, quantity)
                     VALUES (?, ?, ?)
                     ON CONFLICT (service_id, spare_part_id) DO UPDATE SET quantity = EXCLUDED.quantity",
                    [$id, $sparePartId, $qty]
                );
            }
        }
    }

    $pRows = all(
        'SELECT sp.id, sp.quantity, p.id AS "sparePartId", p.part_code AS "partCode", p.name, p.brand, p.unit_price AS "unitPrice", p.stock_quantity AS "stockQuantity"
         FROM service_parts sp
         JOIN spare_parts p ON sp.spare_part_id = p.id
         WHERE sp.service_id = ?',
        [$id]
    );

    echo json_encode(['data' => [
        'id' => $updated['id'],
        'name' => $updated['name'],
        'category' => 'Maintenance',
        'description' => $updated['description'] ?? '',
        'estimatedCost' => (float)($updated['estimated_cost'] ?? 0),
        'laborHours' => (float)($updated['estimated_hours'] ?? 1.0),
        'isActive' => (bool)$updated['is_active'],
        'requiredParts' => $pRows
    ]]);
    exit;

} else if ($method === 'DELETE' && $id) {
    $exists = get('SELECT id FROM services WHERE id = ?', [$id]);
    if (!$exists) {
        http_response_code(404);
        echo json_encode(['error' => 'Service not found']);
        exit;
    }

    run('DELETE FROM services WHERE id = ?', [$id]);
    echo json_encode(['success' => true, 'message' => 'Service removed successfully']);
    exit;
}

http_response_code(404);
echo json_encode(['error' => 'Service endpoint not found']);
