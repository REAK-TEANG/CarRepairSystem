<?php
// api/routes/invoices.php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../utils/eventBus.php';

$authPayload = authenticate(); 
authorizeRoles(['admin', 'manager', 'service_advisor', 'cashier'], $authPayload);

$method = $_SERVER['REQUEST_METHOD'];
$id = null;
$action = null;

if (preg_match('#^/invoices/(\d+)/(pay|payments)$#', $path, $matches)) {
    $id = $matches[1];
    $action = 'pay';
} else if (preg_match('#^/invoices/(\d+)$#', $path, $matches)) {
    $id = $matches[1];
}

if ($method === 'GET' && !$id) {
    $rows = all("
      SELECT i.*, 
             c.full_name AS customer_name,
             c.customer_code,
             c.phone AS customer_phone,
             c.email AS customer_email,
             c.address AS customer_address,
             ro.order_number,
             ro.problem_description,
             ro.diagnosis,
             ro.odometer,
             ro.fuel_level,
             ro.labor_minutes,
             ro.labor_rate,
             v.vehicle_number,
             v.brand AS vehicle_brand,
             v.model AS vehicle_model,
             v.year AS vehicle_year,
             v.color AS vehicle_color,
             v.vin AS vehicle_vin,
             u.full_name AS mechanic_name,
             COALESCE(
               (SELECT json_agg(
                  json_build_object(
                    'id', rp.id,
                    'sparePartId', sp.id,
                    'partCode', sp.part_code,
                    'name', sp.name,
                    'quantity', rp.quantity,
                    'unitPrice', rp.unit_price,
                    'totalPrice', rp.total_price
                  )
                )
                FROM repair_parts rp
                JOIN spare_parts sp ON rp.spare_part_id = sp.id
                WHERE rp.repair_order_id = ro.id),
               '[]'
             ) AS parts_used,
             COALESCE(
               (SELECT json_agg(
                  json_build_object(
                    'id', p.id,
                    'paymentNumber', p.payment_number,
                    'amount', p.amount,
                    'paymentMethod', p.payment_method,
                    'paymentDate', p.payment_date
                  )
                )
                FROM payments p
                WHERE p.invoice_id = i.id),
               '[]'
             ) AS payments_list
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      LEFT JOIN repair_orders ro ON i.repair_order_id = ro.id
      LEFT JOIN vehicles v ON ro.vehicle_id = v.id
      LEFT JOIN employees e ON ro.mechanic_id = e.id
      LEFT JOIN users u ON e.user_id = u.id
      ORDER BY i.id DESC
    ");

    $invoices = array_map(function($r) {
        $partsUsed = $r['parts_used'] !== '[]' ? json_decode($r['parts_used'], true) : [];
        $paymentsList = $r['payments_list'] !== '[]' ? json_decode($r['payments_list'], true) : [];
        $lastPayment = count($paymentsList) > 0 ? end($paymentsList) : null;
        
        $totalAmt = (float)($r['total_amount'] ?? 0);
        $paidAmt = (float)($r['amount_paid'] ?? 0);
        $balDue = isset($r['balance_due']) ? (float)$r['balance_due'] : max(0, $totalAmt - $paidAmt);

        return [
            'id' => $r['id'],
            'invoiceNumber' => $r['invoice_number'],
            'orderNumber' => $r['order_number'] ?: 'RO-2026-0001',
            'repairOrderId' => $r['repair_order_id'],
            'customer' => $r['customer_name'] ?: 'Customer',
            'customerId' => $r['customer_id'],
            'customerCode' => $r['customer_code'] ?: 'CUST-001',
            'customerPhone' => $r['customer_phone'] ?? '',
            'customerEmail' => $r['customer_email'] ?? '',
            'customerAddress' => $r['customer_address'] ?? '',
            'vehicle' => !empty($r['vehicle_brand']) ? trim($r['vehicle_brand'] . ' ' . ($r['vehicle_model'] ?? '')) : 'Vehicle',
            'vehiclePlate' => $r['vehicle_number'] ?? '',
            'vehicleBrand' => $r['vehicle_brand'] ?? '',
            'vehicleModel' => $r['vehicle_model'] ?? '',
            'vehicleYear' => $r['vehicle_year'] ?? '',
            'vehicleColor' => $r['vehicle_color'] ?? '',
            'vehicleVin' => $r['vehicle_vin'] ?? '',
            'odometer' => $r['odometer'] ?? '',
            'mechanic' => $r['mechanic_name'] ?: 'Workshop Technician',
            'problem' => $r['problem_description'] ?? '',
            'diagnosis' => $r['diagnosis'] ?? '',
            'laborMinutes' => (int)($r['labor_minutes'] ?? 0),
            'laborRate' => (float)($r['labor_rate'] ?? 45.0),
            'partsUsed' => $partsUsed,
            'payments' => $paymentsList,
            'amount' => $totalAmt,
            'subtotal' => isset($r['subtotal']) ? (float)$r['subtotal'] : $totalAmt,
            'taxRate' => (float)($r['tax_rate'] ?? 0),
            'taxAmount' => (float)($r['tax_amount'] ?? 0),
            'discount' => (float)($r['discount'] ?? 0),
            'paidAmount' => $paidAmt,
            'balanceDue' => $balDue,
            'status' => $r['status'] ?: 'Draft',
            'paymentMethod' => $lastPayment ? $lastPayment['paymentMethod'] : ($paidAmt > 0 ? 'Credit/Debit Card' : 'Pending'),
            'issueDate' => !empty($r['issued_date']) ? explode(' ', $r['issued_date'])[0] : '2026-08-22',
            'dueDate' => !empty($r['due_date']) ? explode(' ', $r['due_date'])[0] : '2026-08-29',
            'notes' => $r['notes'] ?? ''
        ];
    }, $rows);

    echo json_encode(['data' => $invoices]);
    exit;

} else if ($method === 'POST' && !$id) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $countRow = get('SELECT COUNT(*) AS cnt FROM invoices');
    $cnt = (int)($countRow['cnt'] ?? 0) + 1;
    $invoiceNumber = 'INV-2026-' . str_pad($cnt, 3, '0', STR_PAD_LEFT);
    $amt = (float)($input['amount'] ?? 0);

    $roId = $input['repairOrderId'] ?? null;
    $custId = $input['customerId'] ?? null;
    $orderNumber = $input['orderNumber'] ?? null;

    if (!$roId && $orderNumber) {
        $foundRo = get('SELECT id, customer_id FROM repair_orders WHERE order_number = ?', [$orderNumber]);
        if ($foundRo) {
            $roId = $foundRo['id'];
            if (!$custId) $custId = $foundRo['customer_id'];
        }
    }

    if (!$roId) {
        $anyRo = get('SELECT id, customer_id FROM repair_orders ORDER BY id DESC LIMIT 1');
        $roId = $anyRo ? $anyRo['id'] : 1;
        if (!$custId && $anyRo) $custId = $anyRo['customer_id'];
    }

    if (!$custId) {
        $anyCust = get('SELECT id FROM customers ORDER BY id LIMIT 1');
        $custId = $anyCust ? $anyCust['id'] : 1;
    }

    run(
        "INSERT INTO invoices (invoice_number, repair_order_id, customer_id, total_amount, amount_paid, balance_due, status, due_date)
         VALUES (?, ?, ?, ?, 0.00, ?, 'Issued', ?)",
        [$invoiceNumber, $roId, $custId, $amt, $amt, $input['dueDate'] ?? null]
    );

    global $pdo;
    $insertedId = $pdo->lastInsertId();
    if (!$insertedId) {
        $lastRow = get("SELECT * FROM invoices WHERE invoice_number = ? ORDER BY id DESC LIMIT 1", [$invoiceNumber]);
        $inserted = $lastRow;
    } else {
        $inserted = get('SELECT * FROM invoices WHERE id = ?', [$insertedId]);
    }

    $customer = get('SELECT full_name FROM customers WHERE id = ?', [$inserted['customer_id']]);
    $ro = $inserted['repair_order_id'] ? get('SELECT order_number FROM repair_orders WHERE id = ?', [$inserted['repair_order_id']]) : null;

    http_response_code(201);
    echo json_encode(['data' => [
        'id' => $inserted['id'],
        'invoiceNumber' => $invoiceNumber,
        'orderNumber' => $ro['order_number'] ?? '',
        'repairOrderId' => $inserted['repair_order_id'],
        'customer' => $customer['full_name'] ?? '',
        'customerId' => $inserted['customer_id'],
        'amount' => $amt,
        'paidAmount' => 0.00,
        'status' => 'Issued',
        'paymentMethod' => 'Credit Card',
        'issueDate' => date('Y-m-d'),
        'dueDate' => $input['dueDate'] ?? null
    ]]);
    exit;

} else if ($method === 'POST' && $id && $action === 'pay') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $inv = get('SELECT * FROM invoices WHERE id = ?', [$id]);
    if (!$inv) {
        http_response_code(404);
        echo json_encode(['error' => 'Invoice not found']);
        exit;
    }

    $addPaid = (float)($input['paidAmount'] ?? 0);
    $newTotalPaid = ((float)($inv['amount_paid'] ?? 0)) + $addPaid;
    $totalAmount = (float)($inv['total_amount'] ?? 0);
    $newBalance = max(0, $totalAmount - $newTotalPaid);
    $newStatus = $newTotalPaid >= $totalAmount ? 'Paid' : ($newTotalPaid > 0 ? 'Partially Paid' : 'Issued');

    run(
        "UPDATE invoices
         SET amount_paid = ?, balance_due = ?, status = ?, updated_at = NOW()
         WHERE id = ?",
        [$newTotalPaid, $newBalance, $newStatus, $id]
    );

    $updated = get('SELECT * FROM invoices WHERE id = ?', [$id]);
    $customer = get('SELECT full_name FROM customers WHERE id = ?', [$updated['customer_id']]);
    $ro = $updated['repair_order_id'] ? get('SELECT order_number FROM repair_orders WHERE id = ?', [$updated['repair_order_id']]) : null;

    try {
        $payCount = get('SELECT COUNT(*) AS cnt FROM payments');
        $cnt = (int)($payCount['cnt'] ?? 0) + 1;
        $payNum = 'PAY-2026-' . str_pad($cnt, 3, '0', STR_PAD_LEFT);
        
        $paymentMethod = $input['paymentMethod'] ?? 'Credit/Debit Card';
        $validMethods = ['Cash', 'Credit/Debit Card', 'Bank Transfer', 'Mobile Payment', 'QR Payment'];
        $pMethod = 'Credit/Debit Card';
        foreach ($validMethods as $m) {
            if (strtolower($m) === strtolower($paymentMethod)) {
                $pMethod = $m;
                break;
            }
        }

        $userId = $authPayload['id'] ?? null;
        run(
            "INSERT INTO payments (payment_number, invoice_id, amount, payment_method, payment_date, received_by)
             VALUES (?, ?, ?, ?, NOW(), ?)",
            [$payNum, $updated['id'], $addPaid, $pMethod, $userId]
        );
    } catch (Throwable $payErr) {
        error_log("Payment record warning: " . $payErr->getMessage());
    }

    EventBus::publish('invoices', 'paid', [
        'id' => (int)$updated['id'],
        'invoiceNumber' => $updated['invoice_number'],
        'paidAmount' => $addPaid,
        'totalPaid' => $newTotalPaid,
        'status' => $newStatus,
        'customer' => $customer['full_name'] ?? ''
    ]);

    echo json_encode(['data' => [
        'id' => $updated['id'],
        'invoiceNumber' => $updated['invoice_number'],
        'orderNumber' => $ro['order_number'] ?? '',
        'customer' => $customer['full_name'] ?? '',
        'amount' => $totalAmount,
        'paidAmount' => $newTotalPaid,
        'status' => $newStatus,
        'paymentMethod' => $paymentMethod ?? 'Credit Card',
        'issueDate' => $updated['issued_date'],
        'dueDate' => $updated['due_date']
    ]]);
    exit;
}

http_response_code(404);
echo json_encode(['error' => 'Invoice endpoint not found']);
