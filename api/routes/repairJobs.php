<?php
// api/routes/repairJobs.php
require_once __DIR__ . '/../config/db.php';

$authPayload = authenticate(); 

$method = $_SERVER['REQUEST_METHOD'];
$id = null;

if (preg_match('#^/repair-orders/(\d+)$#', $path, $matches)) {
    $id = $matches[1];
} else if ($path === '/repair-orders' || preg_match('#^/repair-orders/(\d+)$#', $path, $matches)) {
    // some frontends might use repair-jobs or repair_jobs
    if (isset($matches[1])) $id = $matches[1];
}

// ---------------------------------------------------------
// Helper: Auto Stock Out Logic
// ---------------------------------------------------------
function autoStockOutForRepair($repairOrderId, $orderNumber, $serviceId, $usedParts, $performedBy) {
    $partsToDeduct = [];

    // 1. If serviceId provided, fetch Bill of Materials
    if ($serviceId) {
        $serviceParts = all("
          SELECT sp.id as spare_part_id, sp.part_code, sp.name, sp.unit_price, sp.stock_quantity,
                 svp.quantity as required_quantity, s.name as service_name
          FROM service_parts svp
          JOIN spare_parts sp ON svp.spare_part_id = sp.id
          JOIN services s ON svp.service_id = s.id
          WHERE svp.service_id = ?
        ", [$serviceId]);

        foreach ($serviceParts as $sp) {
            $partsToDeduct[] = [
                'sparePartId' => $sp['spare_part_id'],
                'partCode' => $sp['part_code'],
                'name' => $sp['name'],
                'unitPrice' => (float)($sp['unit_price'] ?? 0),
                'quantity' => (int)($sp['required_quantity'] ?? 1),
                'serviceName' => $sp['service_name']
            ];
        }
    }

    // 2. If usedParts array provided
    if (is_array($usedParts) && count($usedParts) > 0) {
        foreach ($usedParts as $item) {
            $partId = $item['sparePartId'] ?? $item['spare_part_id'] ?? $item['id'] ?? null;
            $qty = (int)($item['quantity'] ?? 1);
            if (!$partId) continue;

            $partInfo = get('SELECT id, part_code, name, unit_price, stock_quantity FROM spare_parts WHERE id = ?', [$partId]);
            if ($partInfo) {
                $partsToDeduct[] = [
                    'sparePartId' => $partInfo['id'],
                    'partCode' => $partInfo['part_code'],
                    'name' => $partInfo['name'],
                    'unitPrice' => (float)($partInfo['unit_price'] ?? 0),
                    'quantity' => $qty,
                    'serviceName' => null
                ];
            }
        }
    }

    // 3. Execute
    foreach ($partsToDeduct as $part) {
        run(
            "UPDATE spare_parts
             SET stock_quantity = GREATEST(0, stock_quantity - ?), updated_at = NOW()
             WHERE id = ?",
            [$part['quantity'], $part['sparePartId']]
        );

        $notes = $part['serviceName']
            ? "Auto Stock-Out for Service \"{$part['serviceName']}\" on Job {$orderNumber}"
            : "Auto Stock-Out for Repair Job {$orderNumber}";

        run(
            "INSERT INTO inventory_transactions (spare_part_id, type, quantity, reference_id, reference_type, notes, performed_by)
             VALUES (?, 'Stock Out', ?, ?, 'repair_order', ?, ?)",
            [$part['sparePartId'], $part['quantity'], $repairOrderId, $notes, $performedBy]
        );

        $totalPrice = $part['unitPrice'] * $part['quantity'];
        run(
            "INSERT INTO repair_parts (repair_order_id, spare_part_id, quantity, unit_price, total_price)
             VALUES (?, ?, ?, ?, ?)",
            [$repairOrderId, $part['sparePartId'], $part['quantity'], $part['unitPrice'], $totalPrice]
        );
    }
    
    return $partsToDeduct;
}


if ($method === 'GET' && !$id) {
    $mechanicId = $_GET['mechanicId'] ?? null;
    $vehicleId = $_GET['vehicleId'] ?? null;
    $customerId = $_GET['customerId'] ?? null;

    $sql = "
      SELECT ro.*, 
             c.full_name AS customer_name,
             v.vehicle_number, v.brand, v.model,
             u.full_name AS mechanic_name,
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', rp.id,
                   'sparePartId', sp.id,
                   'partCode', sp.part_code,
                   'name', sp.name,
                   'quantity', rp.quantity,
                   'unitPrice', rp.unit_price,
                   'totalPrice', rp.total_price
                 )
               ) FILTER (WHERE rp.id IS NOT NULL),
               '[]'
             ) AS parts_used
      FROM repair_orders ro
      LEFT JOIN customers c ON ro.customer_id = c.id
      LEFT JOIN vehicles v ON ro.vehicle_id = v.id
      LEFT JOIN employees e ON ro.mechanic_id = e.id
      LEFT JOIN users u ON e.user_id = u.id
      LEFT JOIN repair_parts rp ON rp.repair_order_id = ro.id
      LEFT JOIN spare_parts sp ON rp.spare_part_id = sp.id
    ";

    $params = [];
    $whereClauses = [];

    if ($mechanicId) {
        $whereClauses[] = "ro.mechanic_id = ?";
        $params[] = $mechanicId;
    }
    if ($vehicleId) {
        $whereClauses[] = "ro.vehicle_id = ?";
        $params[] = $vehicleId;
    }
    if ($customerId) {
        $whereClauses[] = "ro.customer_id = ?";
        $params[] = $customerId;
    }

    if (count($whereClauses) > 0) {
        $sql .= " WHERE " . implode(' AND ', $whereClauses);
    }

    $sql .= " GROUP BY ro.id, c.full_name, v.vehicle_number, v.brand, v.model, u.full_name ORDER BY ro.id DESC";

    $rows = all($sql, $params);

    $jobs = array_map(function($r) {
        $partsUsed = $r['parts_used'] !== '[]' ? json_decode($r['parts_used'], true) : [];
        $ii = $r['intake_inspection'] ? json_decode($r['intake_inspection'], true) : new stdClass();
        $qa = $r['qa_checklist'] ? json_decode($r['qa_checklist'], true) : new stdClass();

        return [
            'id' => $r['id'],
            'orderNumber' => $r['order_number'],
            'customer' => $r['customer_name'] ?: 'Customer',
            'customerId' => $r['customer_id'],
            'vehicle' => !empty($r['brand']) ? trim($r['brand'] . ' ' . ($r['model'] ?? '')) : 'Vehicle',
            'vehicleId' => $r['vehicle_id'],
            'plate' => $r['vehicle_number'] ?? '',
            'mechanic' => $r['mechanic_name'] ?: 'Mechanic',
            'mechanicId' => $r['mechanic_id'],
            'problem' => $r['problem_description'] ?? '',
            'diagnosis' => $r['diagnosis'] ?? '',
            'estimatedCost' => $r['estimated_cost'] ? "$" . $r['estimated_cost'] : "$350.00",
            'actualCost' => $r['actual_cost'] ? "$" . $r['actual_cost'] : "",
            'status' => $r['status'] ?: 'Pending',
            'odometer' => (int)($r['odometer'] ?? 0),
            'fuelLevel' => $r['fuel_level'] ?: '1/2',
            'intakeInspection' => $ii,
            'customerApproval' => $r['customer_approval'] ?: 'Approved',
            'approvedAmount' => (float)($r['approved_amount'] ?? 0),
            'qaChecklist' => $qa,
            'laborMinutes' => (int)($r['labor_minutes'] ?? 0),
            'laborRate' => (float)($r['labor_rate'] ?? 45.00),
            'nextServiceDueDate' => $r['next_service_due_date'] ?? null,
            'nextServiceDueKm' => $r['next_service_due_km'] ?? null,
            'createdAt' => !empty($r['created_at']) ? explode(' ', $r['created_at'])[0] : 'Today',
            'partsUsed' => is_array($partsUsed) ? $partsUsed : []
        ];
    }, $rows);

    echo json_encode(['data' => $jobs]);
    exit;

} else if ($method === 'GET' && $id) {
    $r = get("
      SELECT ro.*, 
             c.full_name AS customer_name,
             v.vehicle_number, v.brand, v.model,
             u.full_name AS mechanic_name,
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', rp.id,
                   'sparePartId', sp.id,
                   'partCode', sp.part_code,
                   'name', sp.name,
                   'quantity', rp.quantity,
                   'unitPrice', rp.unit_price,
                   'totalPrice', rp.total_price
                 )
               ) FILTER (WHERE rp.id IS NOT NULL),
               '[]'
             ) AS parts_used
      FROM repair_orders ro
      LEFT JOIN customers c ON ro.customer_id = c.id
      LEFT JOIN vehicles v ON ro.vehicle_id = v.id
      LEFT JOIN employees e ON ro.mechanic_id = e.id
      LEFT JOIN users u ON e.user_id = u.id
      LEFT JOIN repair_parts rp ON rp.repair_order_id = ro.id
      LEFT JOIN spare_parts sp ON rp.spare_part_id = sp.id
      WHERE ro.id = ?
      GROUP BY ro.id, c.full_name, v.vehicle_number, v.brand, v.model, u.full_name
    ", [$id]);

    if (!$r) {
        http_response_code(404);
        echo json_encode(['error' => 'Repair order not found']);
        exit;
    }

    $partsUsed = $r['parts_used'] !== '[]' ? json_decode($r['parts_used'], true) : [];
    $ii = $r['intake_inspection'] ? json_decode($r['intake_inspection'], true) : new stdClass();
    $qa = $r['qa_checklist'] ? json_decode($r['qa_checklist'], true) : new stdClass();

    echo json_encode(['data' => [
        'id' => $r['id'],
        'orderNumber' => $r['order_number'],
        'customer' => $r['customer_name'] ?: '',
        'customerId' => $r['customer_id'],
        'vehicle' => !empty($r['brand']) ? trim($r['brand'] . ' ' . ($r['model'] ?? '')) : '',
        'vehicleId' => $r['vehicle_id'],
        'plate' => $r['vehicle_number'] ?? '',
        'mechanic' => $r['mechanic_name'] ?: '',
        'mechanicId' => $r['mechanic_id'],
        'problem' => $r['problem_description'],
        'diagnosis' => $r['diagnosis'],
        'estimatedCost' => $r['estimated_cost'] ? "$" . $r['estimated_cost'] : "",
        'actualCost' => $r['actual_cost'] ? "$" . $r['actual_cost'] : "",
        'status' => $r['status'],
        'odometer' => (int)($r['odometer'] ?? 0),
        'fuelLevel' => $r['fuel_level'] ?: '1/2',
        'intakeInspection' => $ii,
        'customerApproval' => $r['customer_approval'] ?: 'Approved',
        'approvedAmount' => (float)($r['approved_amount'] ?? 0),
        'qaChecklist' => $qa,
        'laborMinutes' => (int)($r['labor_minutes'] ?? 0),
        'laborRate' => (float)($r['labor_rate'] ?? 45.00),
        'nextServiceDueDate' => $r['next_service_due_date'] ?? null,
        'nextServiceDueKm' => $r['next_service_due_km'] ?? null,
        'createdAt' => !empty($r['created_at']) ? explode(' ', $r['created_at'])[0] : 'Today',
        'partsUsed' => is_array($partsUsed) ? $partsUsed : []
    ]]);
    exit;

} else if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $countRow = get('SELECT COUNT(*) AS cnt FROM repair_orders');
    $cnt = (int)($countRow['cnt'] ?? 0) + 41;
    $orderNumber = 'RO-2026-' . str_pad($cnt, 4, '0', STR_PAD_LEFT);
    $costNum = (float)preg_replace('/[^0-9.]/', '', $input['estimatedCost'] ?? '350');
    if (!$costNum) $costNum = 350.00;

    $approvedAmt = isset($input['approvedAmount']) ? (float)$input['approvedAmount'] : $costNum;

    run(
        "INSERT INTO repair_orders (
            order_number, customer_id, vehicle_id, mechanic_id, problem_description, diagnosis, 
            estimated_cost, status, odometer, fuel_level, intake_inspection, customer_approval, approved_amount
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
            $orderNumber,
            $input['customerId'] ?? 1,
            $input['vehicleId'] ?? 1,
            $input['mechanicId'] ?? null,
            $input['problem'] ?? null,
            $input['diagnosis'] ?? null,
            $costNum,
            $input['status'] ?? 'Pending',
            (int)($input['odometer'] ?? 0),
            $input['fuelLevel'] ?? '1/2',
            json_encode($input['intakeInspection'] ?? new stdClass()),
            $input['customerApproval'] ?? 'Approved',
            $approvedAmt
        ]
    );

    global $pdo;
    $insertedId = $pdo->lastInsertId();
    if (!$insertedId) {
        $lastRow = get("SELECT * FROM repair_orders WHERE order_number = ? ORDER BY id DESC LIMIT 1", [$orderNumber]);
        $inserted = $lastRow;
    } else {
        $inserted = get('SELECT * FROM repair_orders WHERE id = ?', [$insertedId]);
    }

    $deductedParts = autoStockOutForRepair(
        $inserted['id'],
        $orderNumber,
        $input['serviceId'] ?? null,
        $input['usedParts'] ?? null,
        $authPayload['id'] ?? null
    );

    $customer = get('SELECT full_name FROM customers WHERE id = ?', [$inserted['customer_id']]);
    $vehicle = get('SELECT vehicle_number, brand, model FROM vehicles WHERE id = ?', [$inserted['vehicle_id']]);

    http_response_code(201);
    echo json_encode(['data' => [
        'id' => $inserted['id'],
        'orderNumber' => $orderNumber,
        'customer' => $customer['full_name'] ?? '',
        'customerId' => $inserted['customer_id'],
        'vehicle' => $vehicle ? trim(($vehicle['brand'] ?? '') . ' ' . ($vehicle['model'] ?? '')) : '',
        'vehicleId' => $inserted['vehicle_id'],
        'plate' => $vehicle['vehicle_number'] ?? '',
        'mechanicId' => $inserted['mechanic_id'],
        'problem' => $inserted['problem_description'],
        'diagnosis' => $inserted['diagnosis'],
        'estimatedCost' => "$" . $inserted['estimated_cost'],
        'status' => $inserted['status'],
        'odometer' => $inserted['odometer'],
        'fuelLevel' => $inserted['fuel_level'],
        'intakeInspection' => $inserted['intake_inspection'] ? json_decode($inserted['intake_inspection'], true) : new stdClass(),
        'customerApproval' => $inserted['customer_approval'],
        'approvedAmount' => $inserted['approved_amount'],
        'createdAt' => date('Y-m-d'),
        'partsUsed' => $deductedParts
    ]]);
    exit;

} else if ($method === 'PUT' && $id) {
    $input = json_decode(file_get_contents('php://input'), true);

    $actualCost = $input['actualCost'] ?? null;
    $actualNum = $actualCost ? (float)preg_replace('/[^0-9.]/', '', $actualCost) : null;
    $estCost = $input['estimatedCost'] ?? null;
    $estNum = $estCost ? (float)preg_replace('/[^0-9.]/', '', $estCost) : null;

    $qaJson = isset($input['qaChecklist']) ? json_encode($input['qaChecklist']) : null;

    run(
        "UPDATE repair_orders
         SET status = COALESCE(?, status),
             diagnosis = COALESCE(?, diagnosis),
             actual_cost = COALESCE(?, actual_cost),
             estimated_cost = COALESCE(?, estimated_cost),
             mechanic_id = COALESCE(?, mechanic_id),
             notes = COALESCE(?, notes),
             qa_checklist = COALESCE(?::jsonb, qa_checklist),
             labor_minutes = COALESCE(?, labor_minutes),
             labor_rate = COALESCE(?, labor_rate),
             customer_approval = COALESCE(?, customer_approval),
             approved_amount = COALESCE(?, approved_amount),
             next_service_due_date = COALESCE(?, next_service_due_date),
             next_service_due_km = COALESCE(?, next_service_due_km),
             updated_at = NOW()
         WHERE id = ?",
        [
            $input['status'] ?? null,
            $input['diagnosis'] ?? null,
            $actualNum,
            $estNum,
            $input['mechanicId'] ?? null,
            $input['notes'] ?? null,
            $qaJson,
            isset($input['laborMinutes']) ? (int)$input['laborMinutes'] : null,
            isset($input['laborRate']) ? (float)$input['laborRate'] : null,
            $input['customerApproval'] ?? null,
            isset($input['approvedAmount']) ? (float)$input['approvedAmount'] : null,
            $input['nextServiceDueDate'] ?? null,
            isset($input['nextServiceDueKm']) ? (int)$input['nextServiceDueKm'] : null,
            $id
        ]
    );

    $updated = get('SELECT * FROM repair_orders WHERE id = ?', [$id]);
    if (!$updated) {
        http_response_code(404);
        echo json_encode(['error' => 'Repair order not found']);
        exit;
    }

    $serviceId = $input['serviceId'] ?? null;
    $usedParts = $input['usedParts'] ?? null;
    if ($serviceId || (is_array($usedParts) && count($usedParts) > 0)) {
        autoStockOutForRepair(
            $updated['id'],
            $updated['order_number'],
            $serviceId,
            $usedParts,
            $authPayload['id'] ?? null
        );
    }

    $customer = get('SELECT full_name FROM customers WHERE id = ?', [$updated['customer_id']]);
    $vehicle = get('SELECT vehicle_number, brand, model FROM vehicles WHERE id = ?', [$updated['vehicle_id']]);
    $partsUsedRaw = all(
        "SELECT rp.*, sp.name, sp.part_code
         FROM repair_parts rp
         JOIN spare_parts sp ON rp.spare_part_id = sp.id
         WHERE rp.repair_order_id = ?",
        [$updated['id']]
    );

    $qa = $updated['qa_checklist'] ? json_decode($updated['qa_checklist'], true) : new stdClass();
    $ii = $updated['intake_inspection'] ? json_decode($updated['intake_inspection'], true) : new stdClass();

    echo json_encode(['data' => [
        'id' => $updated['id'],
        'orderNumber' => $updated['order_number'],
        'customer' => $customer['full_name'] ?? '',
        'customerId' => $updated['customer_id'],
        'vehicle' => $vehicle ? trim(($vehicle['brand'] ?? '') . ' ' . ($vehicle['model'] ?? '')) : '',
        'vehicleId' => $updated['vehicle_id'],
        'plate' => $vehicle['vehicle_number'] ?? '',
        'mechanicId' => $updated['mechanic_id'],
        'problem' => $updated['problem_description'],
        'diagnosis' => $updated['diagnosis'],
        'estimatedCost' => $updated['estimated_cost'] ? "$" . $updated['estimated_cost'] : "",
        'actualCost' => $updated['actual_cost'] ? "$" . $updated['actual_cost'] : "",
        'status' => $updated['status'],
        'odometer' => $updated['odometer'],
        'fuelLevel' => $updated['fuel_level'],
        'intakeInspection' => $ii,
        'customerApproval' => $updated['customer_approval'],
        'approvedAmount' => $updated['approved_amount'],
        'qaChecklist' => $qa,
        'laborMinutes' => $updated['labor_minutes'],
        'laborRate' => $updated['labor_rate'],
        'nextServiceDueDate' => $updated['next_service_due_date'],
        'nextServiceDueKm' => $updated['next_service_due_km'],
        'createdAt' => !empty($updated['created_at']) ? explode(' ', $updated['created_at'])[0] : 'Today',
        'partsUsed' => $partsUsedRaw
    ]]);
    exit;

} else if ($method === 'DELETE' && $id) {
    $exists = get('SELECT id FROM repair_orders WHERE id = ?', [$id]);
    if (!$exists) {
        http_response_code(404);
        echo json_encode(['error' => 'Repair order not found']);
        exit;
    }
    
    run('DELETE FROM repair_orders WHERE id = ?', [$id]);
    echo json_encode(['success' => true, 'message' => 'Repair order deleted successfully']);
    exit;
}

http_response_code(404);
echo json_encode(['error' => 'Repair Jobs endpoint not found']);
