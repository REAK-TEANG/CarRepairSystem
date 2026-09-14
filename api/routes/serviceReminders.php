<?php
// api/routes/serviceReminders.php
require_once __DIR__ . '/../config/db.php';

$authPayload = authenticate(); 

$method = $_SERVER['REQUEST_METHOD'];
$id = null;

if (preg_match('#^/serviceReminders/(\d+)$#', $path, $matches)) {
    $id = $matches[1];
}

if ($method === 'GET' && !$id) {
    $rows = all("
      SELECT sr.*, 
             c.full_name as customer_name, c.phone as customer_phone, c.email as customer_email,
             v.brand, v.model, v.vehicle_number, v.mileage as current_mileage
      FROM service_reminders sr
      JOIN customers c ON sr.customer_id = c.id
      JOIN vehicles v ON sr.vehicle_id = v.id
      ORDER BY sr.due_date ASC NULLS LAST, sr.id DESC
    ");

    $reminders = array_map(function($r) {
        return [
            'id' => $r['id'],
            'customerId' => $r['customer_id'],
            'customer' => $r['customer_name'],
            'customerPhone' => $r['customer_phone'],
            'customerEmail' => $r['customer_email'],
            'vehicleId' => $r['vehicle_id'],
            'vehicle' => trim(($r['brand'] ?? '') . ' ' . ($r['model'] ?? '')),
            'plate' => $r['vehicle_number'],
            'currentMileage' => (int)($r['current_mileage'] ?? 0),
            'serviceType' => $r['service_type'],
            'dueDate' => !empty($r['due_date']) ? explode(' ', $r['due_date'])[0] : null,
            'dueOdometer' => $r['due_odometer'] ?? null,
            'status' => $r['status'] ?: 'Pending',
            'notes' => $r['notes'] ?? '',
            'createdAt' => $r['created_at']
        ];
    }, $rows);

    echo json_encode(['data' => $reminders]);
    exit;

} else if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $customerId = $input['customerId'] ?? null;
    $vehicleId = $input['vehicleId'] ?? null;
    $serviceType = $input['serviceType'] ?? null;

    if (!$customerId || !$vehicleId || !$serviceType) {
        http_response_code(400);
        echo json_encode(['error' => 'Customer, vehicle, and service type are required']);
        exit;
    }

    $dueOdometer = isset($input['dueOdometer']) ? (int)$input['dueOdometer'] : null;

    run(
        "INSERT INTO service_reminders (customer_id, vehicle_id, repair_order_id, service_type, due_date, due_odometer, notes, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')",
        [
            $customerId,
            $vehicleId,
            $input['repairOrderId'] ?? null,
            $serviceType,
            $input['dueDate'] ?? null,
            $dueOdometer,
            $input['notes'] ?? null
        ]
    );

    global $pdo;
    $insertedId = $pdo->lastInsertId();
    if (!$insertedId) {
        $lastRow = get("SELECT * FROM service_reminders WHERE customer_id = ? AND vehicle_id = ? ORDER BY id DESC LIMIT 1", [$customerId, $vehicleId]);
        $inserted = $lastRow;
    } else {
        $inserted = get('SELECT * FROM service_reminders WHERE id = ?', [$insertedId]);
    }

    http_response_code(201);
    echo json_encode(['data' => $inserted, 'message' => 'Service reminder scheduled successfully']);
    exit;

} else if ($method === 'PUT' && $id) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    run(
        "UPDATE service_reminders
         SET status = COALESCE(?, status),
             notes = COALESCE(?, notes),
             due_date = COALESCE(?, due_date)
         WHERE id = ?",
        [
            $input['status'] ?? null,
            $input['notes'] ?? null,
            $input['dueDate'] ?? null,
            $id
        ]
    );

    $updated = get('SELECT * FROM service_reminders WHERE id = ?', [$id]);
    if (!$updated) {
        http_response_code(404);
        echo json_encode(['error' => 'Service reminder not found']);
        exit;
    }

    echo json_encode(['data' => $updated, 'message' => 'Service reminder updated']);
    exit;

} else if ($method === 'DELETE' && $id) {
    run('DELETE FROM service_reminders WHERE id = ?', [$id]);
    echo json_encode(['success' => true, 'message' => 'Service reminder deleted']);
    exit;
}

http_response_code(404);
echo json_encode(['error' => 'Service Reminders endpoint not found']);
