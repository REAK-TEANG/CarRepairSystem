<?php
// api/routes/suppliers.php
require_once __DIR__ . '/../config/db.php';

$authPayload = authenticate(); 

$method = $_SERVER['REQUEST_METHOD'];
$id = null;

if (preg_match('#^/suppliers/(\d+)$#', $path, $matches)) {
    $id = $matches[1];
}

if ($method === 'GET' && !$id) {
    $rows = all("
      SELECT s.*, 
             COUNT(sp.id) AS parts_count,
             COALESCE(STRING_AGG(DISTINCT sp.category, ', '), 'OEM Parts, Fluids') AS categories_list
      FROM suppliers s
      LEFT JOIN spare_parts sp ON sp.supplier_id = s.id
      GROUP BY s.id
      ORDER BY s.id DESC
    ");

    $suppliers = array_map(function($r) {
        return [
            'id' => $r['id'],
            'name' => $r['name'],
            'contactPerson' => $r['contact_name'] ?? '',
            'phone' => $r['phone'] ?? '',
            'email' => $r['email'] ?? '',
            'address' => $r['address'] ?? '',
            'categories' => $r['categories_list'] ?: 'OEM Parts, Fluids',
            'rating' => 4.9,
            'activeOrders' => (int)($r['parts_count'] ?? 0)
        ];
    }, $rows);

    echo json_encode(['data' => $suppliers]);
    exit;

} else if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $name = $input['name'] ?? '';
    if (!trim($name)) {
        http_response_code(400);
        echo json_encode(['error' => 'Supplier name is required']);
        exit;
    }

    run(
        "INSERT INTO suppliers (name, contact_name, phone, email, address) VALUES (?, ?, ?, ?, ?)",
        [
            trim($name),
            $input['contactPerson'] ?? null,
            $input['phone'] ?? null,
            $input['email'] ?? null,
            $input['address'] ?? null
        ]
    );

    global $pdo;
    $insertedId = $pdo->lastInsertId();
    if (!$insertedId) {
        $lastRow = get("SELECT * FROM suppliers WHERE name = ? ORDER BY id DESC LIMIT 1", [trim($name)]);
        $inserted = $lastRow;
    } else {
        $inserted = get('SELECT * FROM suppliers WHERE id = ?', [$insertedId]);
    }

    http_response_code(201);
    echo json_encode(['data' => [
        'id' => $inserted['id'],
        'name' => $inserted['name'],
        'contactPerson' => $inserted['contact_name'] ?? '',
        'phone' => $inserted['phone'] ?? '',
        'email' => $inserted['email'] ?? '',
        'address' => $inserted['address'] ?? '',
        'categories' => 'OEM Parts, Fluids',
        'rating' => 4.9,
        'activeOrders' => 0
    ]]);
    exit;

} else if ($method === 'PUT' && $id) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    run(
        "UPDATE suppliers
         SET name = COALESCE(?, name),
             contact_name = COALESCE(?, contact_name),
             phone = COALESCE(?, phone),
             email = COALESCE(?, email),
             address = COALESCE(?, address),
             updated_at = NOW()
         WHERE id = ?",
        [
            $input['name'] ?? null,
            $input['contactPerson'] ?? null,
            $input['phone'] ?? null,
            $input['email'] ?? null,
            $input['address'] ?? null,
            $id
        ]
    );

    $updated = get('SELECT * FROM suppliers WHERE id = ?', [$id]);
    if (!$updated) {
        http_response_code(404);
        echo json_encode(['error' => 'Supplier not found']);
        exit;
    }

    echo json_encode(['data' => [
        'id' => $updated['id'],
        'name' => $updated['name'],
        'contactPerson' => $updated['contact_name'] ?? '',
        'phone' => $updated['phone'] ?? '',
        'email' => $updated['email'] ?? '',
        'address' => $updated['address'] ?? '',
        'categories' => 'OEM Parts, Fluids',
        'rating' => 4.9,
        'activeOrders' => 0
    ]]);
    exit;

} else if ($method === 'DELETE' && $id) {
    $exists = get('SELECT id FROM suppliers WHERE id = ?', [$id]);
    if (!$exists) {
        http_response_code(404);
        echo json_encode(['error' => 'Supplier not found']);
        exit;
    }

    run('DELETE FROM suppliers WHERE id = ?', [$id]);
    echo json_encode(['success' => true, 'message' => 'Supplier removed successfully']);
    exit;
}

http_response_code(404);
echo json_encode(['error' => 'Supplier endpoint not found']);
