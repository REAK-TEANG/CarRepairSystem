<?php
// api/routes/appointments.php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../utils/eventBus.php';

$authPayload = authenticate(); 
authorizeRoles(['admin', 'manager', 'service_advisor', 'mechanic', 'cashier'], $authPayload);

$method = $_SERVER['REQUEST_METHOD'];

// Mutation operations restricted to front-desk and leadership
if (in_array($method, ['POST', 'PUT', 'DELETE', 'PATCH'])) {
    authorizeRoles(['admin', 'manager', 'service_advisor'], $authPayload);
}
$id = null;
$action = null;

if (preg_match('#^/appointments/(\d+)/status$#', $path, $matches)) {
    $id = $matches[1];
    $action = 'status';
} else if (preg_match('#^/appointments/(\d+)$#', $path, $matches)) {
    $id = $matches[1];
}

if ($method === 'GET' && !$id) {
    $rows = all("
      SELECT a.*, 
             c.full_name AS customer_name,
             v.vehicle_number, v.brand, v.model,
             u.full_name AS mechanic_name
      FROM appointments a
      LEFT JOIN customers c ON a.customer_id = c.id
      LEFT JOIN vehicles v ON a.vehicle_id = v.id
      LEFT JOIN employees e ON a.mechanic_id = e.id
      LEFT JOIN users u ON e.user_id = u.id
      ORDER BY a.scheduled_date ASC
    ");

    $appointments = array_map(function($r) {
        return [
            'id' => $r['id'],
            'code' => $r['appointment_code'],
            'customer' => $r['customer_name'] ?? 'Customer',
            'customerId' => $r['customer_id'],
            'vehicle' => !empty($r['brand']) ? trim($r['brand'] . ' ' . ($r['model'] ?? '')) : 'Vehicle',
            'vehicleId' => $r['vehicle_id'],
            'plate' => $r['vehicle_number'] ?? '',
            'mechanic' => $r['mechanic_name'] ?? 'Mechanic',
            'mechanicId' => $r['mechanic_id'],
            'service' => 'General Service',
            'date' => !empty($r['scheduled_date']) ? explode(' ', $r['scheduled_date'])[0] : '',
            'time' => $r['scheduled_time'] ?? '09:00',
            'status' => $r['status'] ?? 'Scheduled',
            'notes' => $r['notes'] ?? ''
        ];
    }, $rows);

    echo json_encode(['data' => $appointments]);
    exit;

} else if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $countRow = get('SELECT COUNT(*) AS cnt FROM appointments');
    $cnt = (int)($countRow['cnt'] ?? 0) + 1;
    $code = 'APT-2026-' . str_pad($cnt, 3, '0', STR_PAD_LEFT);

    run(
        "INSERT INTO appointments (appointment_code, customer_id, vehicle_id, mechanic_id, scheduled_date, scheduled_time, status, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
            $code,
            $input['customerId'] ?? 1,
            $input['vehicleId'] ?? 1,
            $input['mechanicId'] ?? null,
            $input['date'] ?? date('Y-m-d'),
            $input['time'] ?? '09:00',
            $input['status'] ?? 'Scheduled',
            $input['notes'] ?? null
        ]
    );

    global $pdo;
    $insertedId = $pdo->lastInsertId();
    if (!$insertedId) {
        $lastRow = get("SELECT * FROM appointments WHERE appointment_code = ? ORDER BY id DESC LIMIT 1", [$code]);
        $inserted = $lastRow;
    } else {
        $inserted = get('SELECT * FROM appointments WHERE id = ?', [$insertedId]);
    }

    $customer = get('SELECT full_name FROM customers WHERE id = ?', [$inserted['customer_id']]);
    $vehicle = get('SELECT vehicle_number, brand, model FROM vehicles WHERE id = ?', [$inserted['vehicle_id']]);

    EventBus::publish('appointments', 'created', [
        'id' => (int)$inserted['id'],
        'code' => $inserted['appointment_code'],
        'customer' => $customer['full_name'] ?? '',
        'date' => $inserted['scheduled_date'],
        'time' => $inserted['scheduled_time'],
        'status' => $inserted['status']
    ]);

    http_response_code(201);
    echo json_encode(['data' => [
        'id' => $inserted['id'],
        'code' => $inserted['appointment_code'],
        'customer' => $customer['full_name'] ?? '',
        'customerId' => $inserted['customer_id'],
        'vehicle' => $vehicle ? trim(($vehicle['brand'] ?? '') . ' ' . ($vehicle['model'] ?? '')) : '',
        'vehicleId' => $inserted['vehicle_id'],
        'plate' => $vehicle['vehicle_number'] ?? '',
        'mechanicId' => $inserted['mechanic_id'],
        'service' => 'General Service',
        'date' => !empty($inserted['scheduled_date']) ? explode(' ', $inserted['scheduled_date'])[0] : '',
        'time' => $inserted['scheduled_time'],
        'status' => $inserted['status'],
        'notes' => $inserted['notes']
    ]]);
    exit;

} else if ($method === 'PUT' && $id && !$action) {
    $input = json_decode(file_get_contents('php://input'), true);

    run(
        "UPDATE appointments
         SET status = COALESCE(?, status),
             mechanic_id = COALESCE(?, mechanic_id),
             scheduled_date = COALESCE(?, scheduled_date),
             scheduled_time = COALESCE(?, scheduled_time),
             notes = COALESCE(?, notes),
             updated_at = NOW()
         WHERE id = ?",
        [
            $input['status'] ?? null,
            $input['mechanicId'] ?? null,
            $input['date'] ?? null,
            $input['time'] ?? null,
            $input['notes'] ?? null,
            $id
        ]
    );

    $updated = get('SELECT * FROM appointments WHERE id = ?', [$id]);
    if (!$updated) {
        http_response_code(404);
        echo json_encode(['error' => 'Appointment not found']);
        exit;
    }

    $customer = get('SELECT full_name FROM customers WHERE id = ?', [$updated['customer_id']]);
    $vehicle = get('SELECT vehicle_number, brand, model FROM vehicles WHERE id = ?', [$updated['vehicle_id']]);

    EventBus::publish('appointments', 'updated', [
        'id' => (int)$updated['id'],
        'code' => $updated['appointment_code'],
        'status' => $updated['status'],
        'date' => $updated['scheduled_date'],
        'time' => $updated['scheduled_time']
    ]);

    echo json_encode(['data' => [
        'id' => $updated['id'],
        'code' => $updated['appointment_code'],
        'customer' => $customer['full_name'] ?? '',
        'customerId' => $updated['customer_id'],
        'vehicle' => $vehicle ? trim(($vehicle['brand'] ?? '') . ' ' . ($vehicle['model'] ?? '')) : '',
        'vehicleId' => $updated['vehicle_id'],
        'plate' => $vehicle['vehicle_number'] ?? '',
        'mechanicId' => $updated['mechanic_id'],
        'service' => 'General Service',
        'date' => !empty($updated['scheduled_date']) ? explode(' ', $updated['scheduled_date'])[0] : '',
        'time' => $updated['scheduled_time'],
        'status' => $updated['status'],
        'notes' => $updated['notes']
    ]]);
    exit;

} else if ($method === 'PATCH' && $id && $action === 'status') {
    $input = json_decode(file_get_contents('php://input'), true);
    $status = $input['status'] ?? null;
    
    run("UPDATE appointments SET status = ?, updated_at = NOW() WHERE id = ?", [$status, $id]);
    $updated = get('SELECT * FROM appointments WHERE id = ?', [$id]);
    
    if (!$updated) {
        http_response_code(404);
        echo json_encode(['error' => 'Appointment not found']);
        exit;
    }

    EventBus::publish('appointments', 'status_changed', [
        'id' => (int)$updated['id'],
        'code' => $updated['appointment_code'],
        'status' => $updated['status']
    ]);
    
    echo json_encode(['data' => $updated]);
    exit;

} else if ($method === 'DELETE' && $id) {
    $exists = get('SELECT id, appointment_code FROM appointments WHERE id = ?', [$id]);
    if (!$exists) {
        http_response_code(404);
        echo json_encode(['error' => 'Appointment not found']);
        exit;
    }

    run("UPDATE appointments SET status = 'Cancelled', updated_at = NOW() WHERE id = ?", [$id]);

    EventBus::publish('appointments', 'cancelled', [
        'id' => (int)$id,
        'code' => $exists['appointment_code'],
        'status' => 'Cancelled'
    ]);

    echo json_encode(['success' => true, 'message' => 'Appointment cancelled successfully']);
    exit;
}

http_response_code(404);
echo json_encode(['error' => 'Appointment endpoint not found']);
