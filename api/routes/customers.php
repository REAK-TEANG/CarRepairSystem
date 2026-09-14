<?php
// api/routes/customers.php
require_once __DIR__ . '/../config/db.php';

$authPayload = authenticate(); // Validates JWT

$method = $_SERVER['REQUEST_METHOD'];
$id = $segments[2] ?? null; // e.g., /api/customers/123 -> $segments = ['customers', '123']
if ($path === '/customers') {
    $id = null;
} else if (preg_match('#^/customers/(\d+)$#', $path, $matches)) {
    $id = $matches[1];
}

if ($method === 'GET' && !$id) {
    $search = $_GET['search'] ?? '';
    $sql = "
      SELECT c.*, 
             COUNT(DISTINCT v.id) AS vehicles_count,
             COALESCE(SUM(i.amount_paid), 0) AS total_spent
      FROM customers c
      LEFT JOIN vehicles v ON v.customer_id = c.id
      LEFT JOIN invoices i ON i.customer_id = c.id
    ";
    $params = [];

    if ($search) {
        $sql .= " WHERE c.full_name ILIKE ? OR c.phone ILIKE ? OR c.customer_code ILIKE ? ";
        $params[] = "%$search%";
        $params[] = "%$search%";
        $params[] = "%$search%";
    }

    $sql .= " GROUP BY c.id ORDER BY c.id DESC";

    $rows = all($sql, $params);

    $customers = array_map(function($r) {
        return [
            'id' => $r['id'],
            'code' => $r['customer_code'],
            'name' => $r['full_name'],
            'phone' => $r['phone'] ?? '',
            'email' => $r['email'] ?? '',
            'address' => $r['address'] ?? '',
            'avatar' => 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            'vehiclesCount' => (int)($r['vehicles_count'] ?? 0),
            'totalSpent' => '$' . number_format((float)($r['total_spent'] ?? 0), 2, '.', ','),
            'registrationDate' => !empty($r['registration_date']) ? explode(' ', $r['registration_date'])[0] : '',
            'notes' => $r['notes'] ?? ''
        ];
    }, $rows);

    echo json_encode(['data' => $customers]);
    exit;

} else if ($method === 'GET' && $id) {
    $r = get('SELECT * FROM customers WHERE id = ?', [$id]);
    if (!$r) {
        http_response_code(404);
        echo json_encode(['error' => 'Customer not found']);
        exit;
    }

    echo json_encode(['data' => [
        'id' => $r['id'],
        'code' => $r['customer_code'],
        'name' => $r['full_name'],
        'phone' => $r['phone'] ?? '',
        'email' => $r['email'] ?? '',
        'address' => $r['address'] ?? '',
        'avatar' => 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        'totalSpent' => '$0.00',
        'registrationDate' => $r['registration_date'],
    ]]);
    exit;

} else if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $name = $input['name'] ?? '';
    
    if (!trim($name)) {
        http_response_code(400);
        echo json_encode(['error' => 'Customer name is required']);
        exit;
    }

    $countRow = get('SELECT COUNT(*) AS cnt FROM customers');
    $cnt = (int)($countRow['cnt'] ?? 0) + 1;
    $code = 'CUST-' . str_pad($cnt, 3, '0', STR_PAD_LEFT);

    run(
        "INSERT INTO customers (customer_code, full_name, phone, email, address, notes) VALUES (?, ?, ?, ?, ?, ?)",
        [$code, trim($name), $input['phone'] ?? null, $input['email'] ?? null, $input['address'] ?? null, $input['notes'] ?? null]
    );
    
    $inserted = get('SELECT * FROM customers WHERE customer_code = ? ORDER BY id DESC LIMIT 1', [$code]);

    http_response_code(201);
    echo json_encode(['data' => [
        'id' => $inserted['id'],
        'code' => $inserted['customer_code'],
        'name' => $inserted['full_name'],
        'phone' => $inserted['phone'] ?? '',
        'email' => $inserted['email'] ?? '',
        'address' => $inserted['address'] ?? '',
        'avatar' => 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        'vehiclesCount' => 0,
        'totalSpent' => '$0.00',
        'registrationDate' => !empty($inserted['registration_date']) ? explode(' ', $inserted['registration_date'])[0] : ''
    ]]);
    exit;

} else if ($method === 'PUT' && $id) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    run(
        "UPDATE customers
         SET full_name = COALESCE(?, full_name),
             phone = COALESCE(?, phone),
             email = COALESCE(?, email),
             address = COALESCE(?, address),
             notes = COALESCE(?, notes),
             updated_at = NOW()
         WHERE id = ?",
        [
            $input['name'] ?? null,
            $input['phone'] ?? null,
            $input['email'] ?? null,
            $input['address'] ?? null,
            $input['notes'] ?? null,
            $id
        ]
    );

    $updated = get('SELECT * FROM customers WHERE id = ?', [$id]);
    if (!$updated) {
        http_response_code(404);
        echo json_encode(['error' => 'Customer not found']);
        exit;
    }

    echo json_encode(['data' => [
        'id' => $updated['id'],
        'code' => $updated['customer_code'],
        'name' => $updated['full_name'],
        'phone' => $updated['phone'] ?? '',
        'email' => $updated['email'] ?? '',
        'address' => $updated['address'] ?? '',
        'avatar' => 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        'totalSpent' => '$0.00'
    ]]);
    exit;

} else if ($method === 'DELETE' && $id) {
    $exists = get('SELECT id FROM customers WHERE id = ?', [$id]);
    if (!$exists) {
        http_response_code(404);
        echo json_encode(['error' => 'Customer not found']);
        exit;
    }
    
    run('DELETE FROM customers WHERE id = ?', [$id]);
    echo json_encode(['success' => true, 'message' => 'Customer deleted successfully']);
    exit;
}

http_response_code(404);
echo json_encode(['error' => 'Customer endpoint not found']);
