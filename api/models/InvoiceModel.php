<?php
// api/models/InvoiceModel.php

class InvoiceModel
{
    public static function getAll(): array
    {
        $rows = Database::all("
          SELECT i.*,
                 c.full_name AS customer_name,
                 c.customer_code, c.phone AS customer_phone,
                 c.email AS customer_email, c.address AS customer_address,
                 ro.order_number, ro.problem_description, ro.diagnosis,
                 ro.odometer, ro.fuel_level, ro.labor_minutes, ro.labor_rate,
                 v.vehicle_number, v.brand AS vehicle_brand, v.model AS vehicle_model,
                 v.year AS vehicle_year, v.color AS vehicle_color, v.vin AS vehicle_vin,
                 u.full_name AS mechanic_name,
                 COALESCE(
                   (SELECT json_agg(json_build_object(
                     'id', rp.id, 'sparePartId', sp.id, 'partCode', sp.part_code,
                     'name', sp.name, 'quantity', rp.quantity,
                     'unitPrice', rp.unit_price, 'totalPrice', rp.total_price))
                    FROM repair_parts rp JOIN spare_parts sp ON rp.spare_part_id = sp.id
                    WHERE rp.repair_order_id = ro.id), '[]') AS parts_used,
                 COALESCE(
                   (SELECT json_agg(json_build_object(
                     'id', p.id, 'paymentNumber', p.payment_number,
                     'amount', p.amount, 'paymentMethod', p.payment_method,
                     'paymentDate', p.payment_date))
                    FROM payments p WHERE p.invoice_id = i.id), '[]') AS payments_list
          FROM invoices i
          LEFT JOIN customers     c  ON i.customer_id      = c.id
          LEFT JOIN repair_orders ro ON i.repair_order_id  = ro.id
          LEFT JOIN vehicles      v  ON ro.vehicle_id      = v.id
          LEFT JOIN employees     e  ON ro.mechanic_id     = e.id
          LEFT JOIN users         u  ON e.user_id          = u.id
          ORDER BY i.id DESC
        ");

        return array_map([self::class, 'format'], $rows);
    }

    public static function create(array $input): array
    {
        $countRow     = Database::get('SELECT COUNT(*) AS cnt FROM invoices');
        $cnt          = (int) ($countRow['cnt'] ?? 0) + 1;
        $invoiceNumber = 'INV-2026-' . str_pad($cnt, 3, '0', STR_PAD_LEFT);
        $amt          = (float) ($input['amount'] ?? 0);

        $roId   = $input['repairOrderId'] ?? null;
        $custId = $input['customerId']    ?? null;

        // Resolve repair order
        if (!$roId && ($input['orderNumber'] ?? null)) {
            $foundRo = Database::get('SELECT id, customer_id FROM repair_orders WHERE order_number = ?', [$input['orderNumber']]);
            if ($foundRo) {
                $roId   = $foundRo['id'];
                $custId = $custId ?? $foundRo['customer_id'];
            }
        }
        if (!$roId) {
            $anyRo  = Database::get('SELECT id, customer_id FROM repair_orders ORDER BY id DESC LIMIT 1');
            $roId   = $anyRo ? $anyRo['id'] : 1;
            $custId = $custId ?? ($anyRo['customer_id'] ?? null);
        }
        if (!$custId) {
            $anyCust = Database::get('SELECT id FROM customers ORDER BY id LIMIT 1');
            $custId  = $anyCust ? $anyCust['id'] : 1;
        }

        Database::run(
            "INSERT INTO invoices (invoice_number, repair_order_id, customer_id, total_amount, amount_paid, balance_due, status, due_date)
             VALUES (?, ?, ?, ?, 0.00, ?, 'Issued', ?)",
            [$invoiceNumber, $roId, $custId, $amt, $amt, $input['dueDate'] ?? null]
        );

        $inserted = Database::get('SELECT * FROM invoices WHERE invoice_number = ? ORDER BY id DESC LIMIT 1', [$invoiceNumber]);
        $customer = Database::get('SELECT full_name FROM customers WHERE id = ?', [$inserted['customer_id']]);
        $ro       = $inserted['repair_order_id']
            ? Database::get('SELECT order_number FROM repair_orders WHERE id = ?', [$inserted['repair_order_id']])
            : null;

        return [
            'id'            => $inserted['id'],
            'invoiceNumber' => $invoiceNumber,
            'orderNumber'   => $ro['order_number'] ?? '',
            'repairOrderId' => $inserted['repair_order_id'],
            'customer'      => $customer['full_name'] ?? '',
            'customerId'    => $inserted['customer_id'],
            'amount'        => $amt,
            'paidAmount'    => 0.00,
            'status'        => 'Issued',
            'paymentMethod' => 'Credit Card',
            'issueDate'     => date('Y-m-d'),
            'dueDate'       => $input['dueDate'] ?? null,
        ];
    }

    public static function pay(int $id, array $input, int $performedBy): ?array
    {
        $inv = Database::get('SELECT * FROM invoices WHERE id = ?', [$id]);
        if (!$inv) {
            return null;
        }

        $addPaid      = (float) ($input['paidAmount'] ?? 0);
        $newTotalPaid = (float) ($inv['amount_paid'] ?? 0) + $addPaid;
        $totalAmount  = (float) ($inv['total_amount']  ?? 0);
        $newBalance   = max(0, $totalAmount - $newTotalPaid);
        $newStatus    = $newTotalPaid >= $totalAmount ? 'Paid' : ($newTotalPaid > 0 ? 'Partially Paid' : 'Issued');

        Database::run(
            "UPDATE invoices SET amount_paid = ?, balance_due = ?, status = ?, updated_at = NOW() WHERE id = ?",
            [$newTotalPaid, $newBalance, $newStatus, $id]
        );

        // Record payment
        $payCount = Database::get('SELECT COUNT(*) AS cnt FROM payments');
        $cnt      = (int) ($payCount['cnt'] ?? 0) + 1;
        $payNum   = 'PAY-2026-' . str_pad($cnt, 3, '0', STR_PAD_LEFT);

        $validMethods  = ['Cash', 'Credit/Debit Card', 'Bank Transfer', 'Mobile Payment', 'QR Payment'];
        $paymentMethod = $input['paymentMethod'] ?? 'Credit/Debit Card';
        $pMethod       = 'Credit/Debit Card';
        foreach ($validMethods as $m) {
            if (strtolower($m) === strtolower($paymentMethod)) {
                $pMethod = $m;
                break;
            }
        }

        Database::run(
            "INSERT INTO payments (payment_number, invoice_id, amount, payment_method, payment_date, received_by)
             VALUES (?, ?, ?, ?, NOW(), ?)",
            [$payNum, $id, $addPaid, $pMethod, $performedBy]
        );

        $updated  = Database::get('SELECT * FROM invoices WHERE id = ?', [$id]);
        $customer = Database::get('SELECT full_name FROM customers WHERE id = ?', [$updated['customer_id']]);
        $ro       = $updated['repair_order_id']
            ? Database::get('SELECT order_number FROM repair_orders WHERE id = ?', [$updated['repair_order_id']])
            : null;

        return [
            'id'            => $updated['id'],
            'invoiceNumber' => $updated['invoice_number'],
            'orderNumber'   => $ro['order_number'] ?? '',
            'customer'      => $customer['full_name'] ?? '',
            'amount'        => $totalAmount,
            'paidAmount'    => $newTotalPaid,
            'status'        => $newStatus,
            'paymentMethod' => $pMethod,
            'issueDate'     => $updated['issued_date'],
            'dueDate'       => $updated['due_date'],
        ];
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private static function format(array $r): array
    {
        $partsUsed    = ($r['parts_used']    && $r['parts_used']    !== '[]') ? json_decode($r['parts_used'],    true) : [];
        $paymentsList = ($r['payments_list'] && $r['payments_list'] !== '[]') ? json_decode($r['payments_list'], true) : [];
        $lastPayment  = count($paymentsList) > 0 ? end($paymentsList) : null;

        $totalAmt = (float) ($r['total_amount'] ?? 0);
        $paidAmt  = (float) ($r['amount_paid']  ?? 0);
        $balDue   = isset($r['balance_due']) ? (float) $r['balance_due'] : max(0, $totalAmt - $paidAmt);

        return [
            'id'              => $r['id'],
            'invoiceNumber'   => $r['invoice_number'],
            'orderNumber'     => $r['order_number']       ?: 'RO-2026-0001',
            'repairOrderId'   => $r['repair_order_id'],
            'customer'        => $r['customer_name']      ?: 'Customer',
            'customerId'      => $r['customer_id'],
            'customerCode'    => $r['customer_code']      ?: 'CUST-001',
            'customerPhone'   => $r['customer_phone']     ?? '',
            'customerEmail'   => $r['customer_email']     ?? '',
            'customerAddress' => $r['customer_address']   ?? '',
            'vehicle'         => !empty($r['vehicle_brand']) ? trim($r['vehicle_brand'] . ' ' . ($r['vehicle_model'] ?? '')) : 'Vehicle',
            'vehiclePlate'    => $r['vehicle_number']     ?? '',
            'vehicleBrand'    => $r['vehicle_brand']      ?? '',
            'vehicleModel'    => $r['vehicle_model']      ?? '',
            'vehicleYear'     => $r['vehicle_year']       ?? '',
            'vehicleColor'    => $r['vehicle_color']      ?? '',
            'vehicleVin'      => $r['vehicle_vin']        ?? '',
            'odometer'        => $r['odometer']           ?? '',
            'mechanic'        => $r['mechanic_name']      ?: 'Workshop Technician',
            'problem'         => $r['problem_description'] ?? '',
            'diagnosis'       => $r['diagnosis']          ?? '',
            'laborMinutes'    => (int)   ($r['labor_minutes'] ?? 0),
            'laborRate'       => (float) ($r['labor_rate']   ?? 45.0),
            'partsUsed'       => is_array($partsUsed) ? $partsUsed : [],
            'payments'        => is_array($paymentsList) ? $paymentsList : [],
            'amount'          => $totalAmt,
            'subtotal'        => isset($r['subtotal']) ? (float) $r['subtotal'] : $totalAmt,
            'taxRate'         => (float) ($r['tax_rate']   ?? 0),
            'taxAmount'       => (float) ($r['tax_amount'] ?? 0),
            'discount'        => (float) ($r['discount']   ?? 0),
            'paidAmount'      => $paidAmt,
            'balanceDue'      => $balDue,
            'status'          => $r['status'] ?: 'Draft',
            'paymentMethod'   => $lastPayment ? $lastPayment['paymentMethod'] : ($paidAmt > 0 ? 'Credit/Debit Card' : 'Pending'),
            'issueDate'       => !empty($r['issued_date']) ? explode(' ', $r['issued_date'])[0] : '2026-08-22',
            'dueDate'         => !empty($r['due_date'])    ? explode(' ', $r['due_date'])[0]    : '2026-08-29',
            'notes'           => $r['notes'] ?? '',
        ];
    }
}
