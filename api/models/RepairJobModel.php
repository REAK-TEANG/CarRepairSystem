    <?php
// api/models/RepairJobModel.php

class RepairJobModel
{
    public static function getAll(array $filters = []): array
    {
        $sql    = self::baseSql();
        $params = [];
        $where  = [];

        if (!empty($filters['mechanicId'])) {
            $where[]  = 'ro.mechanic_id = ?';
            $params[] = $filters['mechanicId'];
        }
        if (!empty($filters['vehicleId'])) {
            $where[]  = 'ro.vehicle_id = ?';
            $params[] = $filters['vehicleId'];
        }
        if (!empty($filters['customerId'])) {
            $where[]  = 'ro.customer_id = ?';
            $params[] = $filters['customerId'];
        }

        if ($where) {
            $sql .= ' WHERE ' . implode(' AND ', $where);
        }

        $sql .= ' ORDER BY ro.id DESC';

        return array_map([self::class, 'format'], Database::all($sql, $params));
    }

    public static function getPaginated(array $filters = [], string $search = '', int $page = 1, int $limit = 10, ?string $status = null): array
    {
        $countSql = "
          SELECT COUNT(DISTINCT ro.id) AS cnt
          FROM repair_orders ro
          LEFT JOIN customers c ON ro.customer_id = c.id
          LEFT JOIN vehicles v ON ro.vehicle_id = v.id
          LEFT JOIN employees e ON ro.mechanic_id = e.id
          LEFT JOIN users u ON e.user_id = u.id
          WHERE 1=1
        ";
        $countParams = [];
        if (!empty($filters['mechanicId'])) {
            $countSql .= " AND ro.mechanic_id = ?";
            $countParams[] = $filters['mechanicId'];
        }
        if (!empty($filters['vehicleId'])) {
            $countSql .= " AND ro.vehicle_id = ?";
            $countParams[] = $filters['vehicleId'];
        }
        if (!empty($filters['customerId'])) {
            $countSql .= " AND ro.customer_id = ?";
            $countParams[] = $filters['customerId'];
        }
        if ($status && $status !== 'All') {
            $countSql .= " AND ro.status = ?";
            $countParams[] = $status;
        }
        if ($search) {
            $countSql .= " AND (ro.order_number ILIKE ? OR c.full_name ILIKE ? OR v.vehicle_number ILIKE ? OR v.brand ILIKE ? OR v.model ILIKE ? OR ro.problem_description ILIKE ?)";
            $countParams = array_merge($countParams, ["%$search%", "%$search%", "%$search%", "%$search%", "%$search%", "%$search%"]);
        }

        $countRow = Database::get($countSql, $countParams);
        $total = (int) ($countRow['cnt'] ?? 0);

        $offset = max(0, ($page - 1) * $limit);
        $sql = self::baseSql();
        $params = [];
        $where = [];

        if (!empty($filters['mechanicId'])) {
            $where[] = 'ro.mechanic_id = ?';
            $params[] = $filters['mechanicId'];
        }
        if (!empty($filters['vehicleId'])) {
            $where[] = 'ro.vehicle_id = ?';
            $params[] = $filters['vehicleId'];
        }
        if (!empty($filters['customerId'])) {
            $where[] = 'ro.customer_id = ?';
            $params[] = $filters['customerId'];
        }
        if ($status && $status !== 'All') {
            $where[] = 'ro.status = ?';
            $params[] = $status;
        }
        if ($search) {
            $where[] = '(ro.order_number ILIKE ? OR c.full_name ILIKE ? OR v.vehicle_number ILIKE ? OR v.brand ILIKE ? OR v.model ILIKE ? OR ro.problem_description ILIKE ?)';
            $params = array_merge($params, ["%$search%", "%$search%", "%$search%", "%$search%", "%$search%", "%$search%"]);
        }
        if ($where) {
            $sql .= ' WHERE ' . implode(' AND ', $where);
        }
        $sql .= ' ORDER BY ro.id DESC LIMIT ' . $limit . ' OFFSET ' . $offset;

        $rows = Database::all($sql, $params);
        return [
            'data' => array_map([self::class, 'format'], $rows),
            'total' => $total,
        ];
    }

    public static function findById(int $id): ?array
    {
        $r = Database::get(
            self::baseSql() . ' WHERE ro.id = ?',
            [$id]
        );
        return $r ? self::format($r) : null;
    }

    public static function create(array $input, int $performedBy): array
    {
        return Database::transaction(function () use ($input, $performedBy) {
            $orderNumber = generateUniqueCode('repair_orders', 'order_number', 'RO-2026', 4);
            $costNum    = (float) preg_replace('/[^0-9.]/', '', $input['estimatedCost'] ?? '350') ?: 350.00;
            $approvedAmt = isset($input['approvedAmount']) ? (float) $input['approvedAmount'] : $costNum;

            Database::run(
                "INSERT INTO repair_orders (
                    order_number, customer_id, vehicle_id, mechanic_id, problem_description, diagnosis,
                    estimated_cost, status, odometer, fuel_level, intake_inspection, customer_approval, approved_amount
                 ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [
                    $orderNumber,
                    $input['customerId']      ?? 1,
                    $input['vehicleId']       ?? 1,
                    $input['mechanicId']      ?? null,
                    $input['problem']         ?? null,
                    $input['diagnosis']       ?? null,
                    $costNum,
                    $input['status']          ?? 'Pending',
                    (int) ($input['odometer'] ?? 0),
                    $input['fuelLevel']       ?? '1/2',
                    json_encode($input['intakeInspection'] ?? new \stdClass()),
                    $input['customerApproval'] ?? 'Approved',
                    $approvedAmt,
                ]
            );

            $inserted      = Database::get('SELECT * FROM repair_orders WHERE order_number = ? ORDER BY id DESC LIMIT 1', [$orderNumber]);
            $serviceId     = !empty($input['serviceId']) ? (int) $input['serviceId'] : null;
            $deductedParts = self::autoStockOut($inserted['id'], $orderNumber, $serviceId, $input['usedParts'] ?? null, $performedBy);

            $customer = Database::get('SELECT full_name FROM customers WHERE id = ?', [$inserted['customer_id']]);
            $vehicle  = Database::get('SELECT vehicle_number, brand, model FROM vehicles WHERE id = ?', [$inserted['vehicle_id']]);

            $formatted = self::format(array_merge($inserted, [
                'customer_name'  => $customer['full_name']      ?? '',
                'vehicle_number' => $vehicle['vehicle_number'] ?? '',
                'brand'          => $vehicle['brand']          ?? '',
                'model'          => $vehicle['model']          ?? '',
                'mechanic_name'  => null,
                'parts_used'     => json_encode($deductedParts),
            ]));
            $formatted['partsUsed'] = $deductedParts;

            EventBus::publish('repair_jobs', 'created', [
                'id' => $inserted['id'],
                'orderNumber' => $orderNumber,
                'status' => $inserted['status'],
                'customerId' => $inserted['customer_id'],
                'mechanicId' => $inserted['mechanic_id'],
            ]);

            return $formatted;
        });
    }

    public static function update(int $id, array $input, int $performedBy): ?array
    {
        return Database::transaction(function () use ($id, $input, $performedBy) {
            $actualNum = ($input['actualCost'] ?? null)
                ? (float) preg_replace('/[^0-9.]/', '', $input['actualCost'])
                : null;
            $estNum    = ($input['estimatedCost'] ?? null)
                ? (float) preg_replace('/[^0-9.]/', '', $input['estimatedCost'])
                : null;
            $qaJson    = isset($input['qaChecklist']) ? json_encode($input['qaChecklist']) : null;
            $mechanicId = (!empty($input['mechanicId']) && (int) $input['mechanicId'] > 0)
                ? (int) $input['mechanicId']
                : ((!empty($input['mechanic_id']) && (int) $input['mechanic_id'] > 0) ? (int) $input['mechanic_id'] : null);

            $status = !empty($input['status']) ? self::normalizeStatus($input['status']) : null;

            Database::run(
                "UPDATE repair_orders
                 SET status               = COALESCE(?, status),
                     diagnosis            = COALESCE(?, diagnosis),
                     actual_cost          = COALESCE(?, actual_cost),
                     estimated_cost       = COALESCE(?, estimated_cost),
                     mechanic_id          = COALESCE(?, mechanic_id),
                     notes                = COALESCE(?, notes),
                     qa_checklist         = COALESCE(?::jsonb, qa_checklist),
                     labor_minutes        = COALESCE(?, labor_minutes),
                     labor_rate           = COALESCE(?, labor_rate),
                     customer_approval    = COALESCE(?, customer_approval),
                     approved_amount      = COALESCE(?, approved_amount),
                     next_service_due_date = COALESCE(?, next_service_due_date),
                     next_service_due_km  = COALESCE(?, next_service_due_km),
                     updated_at           = NOW()
                 WHERE id = ?",
                [
                    $status,
                    $input['diagnosis']       ?? null,
                    $actualNum,
                    $estNum,
                    $mechanicId,
                    $input['notes']           ?? null,
                    $qaJson,
                    isset($input['laborMinutes'])   ? (int)   $input['laborMinutes']   : null,
                    isset($input['laborRate'])      ? (float) $input['laborRate']      : null,
                    $input['customerApproval']      ?? null,
                    isset($input['approvedAmount']) ? (float) $input['approvedAmount'] : null,
                    $input['nextServiceDueDate']    ?? null,
                    isset($input['nextServiceDueKm']) ? (int) $input['nextServiceDueKm'] : null,
                    $id,
                ]
            );

            $updated = Database::get('SELECT * FROM repair_orders WHERE id = ?', [$id]);
            if (!$updated) {
                return null;
            }

            $serviceId = !empty($input['serviceId']) ? (int) $input['serviceId'] : null;
            if ($serviceId !== null || isset($input['usedParts'])) {
                self::autoStockOut($updated['id'], $updated['order_number'], $serviceId, $input['usedParts'] ?? null, $performedBy);
            }

            $result = self::findById($id);

            EventBus::publish('repair_jobs', 'updated', [
                'id' => $id,
                'orderNumber' => $updated['order_number'],
                'status' => $updated['status'],
                'mechanicId' => $updated['mechanic_id'],
            ]);

            return $result;
        });
    }

    public static function delete(int $id): bool
    {
        return Database::transaction(function () use ($id) {
            $exists = Database::get('SELECT id, order_number FROM repair_orders WHERE id = ?', [$id]);
            if (!$exists) {
                return false;
            }
            // Cascade delete any linked invoices and payments in this transaction
            $invs = Database::all('SELECT id FROM invoices WHERE repair_order_id = ?', [$id]);
            foreach ($invs as $inv) {
                Database::run('DELETE FROM refunds WHERE invoice_id = ?', [$inv['id']]);
                Database::run('DELETE FROM payments WHERE invoice_id = ?', [$inv['id']]);
                Database::run('DELETE FROM invoices WHERE id = ?', [$inv['id']]);
            }
            Database::run('DELETE FROM repair_parts WHERE repair_order_id = ?', [$id]);
            Database::run('DELETE FROM repair_services WHERE repair_order_id = ?', [$id]);
            Database::run('DELETE FROM repair_orders WHERE id = ?', [$id]);
            EventBus::publish('repair_jobs', 'deleted', ['id' => $id, 'orderNumber' => $exists['order_number']]);
            return true;
        });
    }

    /**
     * Auto Stock-Out: deducts or syncs spare parts with inventory and logs transactions.
     */
    public static function autoStockOut(int $repairOrderId, string $orderNumber, ?int $serviceId, ?array $usedParts, int $performedBy): array
    {
        $targetParts = [];

        // 1. Service parts from Service Catalog
        if ($serviceId) {
            $serviceParts = Database::all("
              SELECT sp.id AS spare_part_id, sp.part_code, sp.name, sp.unit_price, sp.stock_quantity,
                     svp.quantity AS required_quantity, s.name AS service_name
              FROM service_parts svp
              JOIN spare_parts sp ON svp.spare_part_id = sp.id
              JOIN services s ON svp.service_id = s.id
              WHERE svp.service_id = ?",
                [$serviceId]
            );
            foreach ($serviceParts as $sp) {
                $spId = (int)$sp['spare_part_id'];
                $targetParts[$spId] = [
                    'sparePartId' => $spId,
                    'partCode'    => $sp['part_code'],
                    'name'        => $sp['name'],
                    'unitPrice'   => (float) ($sp['unit_price'] ?? 0),
                    'quantity'    => (int)   ($sp['required_quantity'] ?? 1),
                    'serviceName' => $sp['service_name'],
                ];
            }
        }

        // 2. Custom or selected used parts from frontend
        if (is_array($usedParts)) {
            foreach ($usedParts as $item) {
                $qty = (int) ($item['quantity'] ?? 1);
                if ($qty <= 0) continue;

                $rawId = $item['sparePartId'] ?? $item['spare_part_id'] ?? null;
                $code  = $item['partCode'] ?? $item['partNumber'] ?? $item['code'] ?? null;

                if (!$rawId && isset($item['id'])) {
                    if (is_numeric($item['id']) || (is_string($item['id']) && ctype_digit($item['id']))) {
                        $rawId = (int)$item['id'];
                    } elseif (!$code) {
                        $code = (string)$item['id'];
                    }
                }

                $partInfo = null;

                // Lookup by integer ID if numeric
                if ($rawId !== null && (is_numeric($rawId) || ctype_digit((string)$rawId))) {
                    $partInfo = Database::get(
                        'SELECT id, part_code, name, unit_price, stock_quantity FROM spare_parts WHERE id = ?',
                        [(int)$rawId]
                    );
                }

                // Lookup by part code
                if (!$partInfo && $code) {
                    $cleanCode = (string)$code;
                    if (preg_match('/^\d+-([A-Za-z0-9\-_]+)-\d+$/', $cleanCode, $m)) {
                        $cleanCode = $m[1];
                    }
                    $partInfo = Database::get(
                        'SELECT id, part_code, name, unit_price, stock_quantity FROM spare_parts WHERE LOWER(part_code) = LOWER(?) LIMIT 1',
                        [$cleanCode]
                    );
                    if (!$partInfo) {
                        $partInfo = Database::get(
                            'SELECT id, part_code, name, unit_price, stock_quantity FROM spare_parts WHERE part_code ILIKE ? LIMIT 1',
                            ['%' . $cleanCode . '%']
                        );
                    }
                }

                // Lookup by name
                if (!$partInfo && !empty($item['name'])) {
                    $cleanName = trim($item['name']);
                    $partInfo = Database::get(
                        'SELECT id, part_code, name, unit_price, stock_quantity FROM spare_parts WHERE LOWER(name) = LOWER(?) LIMIT 1',
                        [$cleanName]
                    );
                    if (!$partInfo) {
                        $partInfo = Database::get(
                            'SELECT id, part_code, name, unit_price, stock_quantity FROM spare_parts WHERE name ILIKE ? LIMIT 1',
                            ['%' . $cleanName . '%']
                        );
                    }
                }

                // Auto-create supply item in spare_parts if not found
                if (!$partInfo) {
                    $partCodeToUse = !empty($cleanCode) ? $cleanCode : (!empty($code) ? (string)$code : 'SUP-' . strtoupper(substr(md5(uniqid()), 0, 6)));
                    if (preg_match('/^\d+-([A-Za-z0-9\-_]+)-\d+$/', $partCodeToUse, $m)) {
                        $partCodeToUse = $m[1];
                    }
                    $nameToUse  = !empty($item['name']) ? trim($item['name']) : 'Shop Supply (' . $partCodeToUse . ')';
                    $priceToUse = isset($item['unitPrice']) ? (float)$item['unitPrice'] : (isset($item['price']) ? (float)$item['price'] : 15.00);

                    Database::run(
                        "INSERT INTO spare_parts (part_code, name, category, unit_price, stock_quantity, min_stock, location)
                         VALUES (?, ?, 'Supplies', ?, 50, 5, 'Shop Floor Shelf')
                         ON CONFLICT (part_code) DO NOTHING",
                        [$partCodeToUse, $nameToUse, $priceToUse]
                    );
                    $partInfo = Database::get('SELECT id, part_code, name, unit_price, stock_quantity FROM spare_parts WHERE part_code = ?', [$partCodeToUse]);
                }

                if ($partInfo) {
                    $spId = (int)$partInfo['id'];
                    $price = isset($item['unitPrice']) ? (float)$item['unitPrice'] : (isset($item['price']) ? (float)$item['price'] : (float)$partInfo['unit_price']);

                    if (isset($targetParts[$spId])) {
                        $targetParts[$spId]['quantity'] += $qty;
                    } else {
                        $targetParts[$spId] = [
                            'sparePartId' => $spId,
                            'partCode'    => $partInfo['part_code'],
                            'name'        => $partInfo['name'],
                            'unitPrice'   => $price,
                            'quantity'    => $qty,
                            'serviceName' => null,
                        ];
                    }
                }
            }
        }

        // Fetch existing parts recorded in repair_parts for this repair order
        $existingRows = Database::all(
            'SELECT spare_part_id, quantity, unit_price FROM repair_parts WHERE repair_order_id = ?',
            [$repairOrderId]
        );
        $existingMap = [];
        foreach ($existingRows as $er) {
            $existingMap[(int)$er['spare_part_id']] = (int)$er['quantity'];
        }

        $perfBy = ($performedBy > 0) ? $performedBy : null;

        // Apply net delta and upsert target parts
        foreach ($targetParts as $spId => $part) {
            $prevQty = $existingMap[$spId] ?? 0;
            $newQty  = $part['quantity'];
            $delta   = $newQty - $prevQty;

            if ($delta > 0) {
                // Deduct additional stock
                Database::run(
                    "UPDATE spare_parts SET stock_quantity = GREATEST(0, stock_quantity - ?), updated_at = NOW() WHERE id = ?",
                    [$delta, $spId]
                );
                $notes = $part['serviceName']
                    ? "Auto Stock-Out for Service \"{$part['serviceName']}\" on Job {$orderNumber}"
                    : "Auto Stock-Out for Repair Job {$orderNumber}";
                Database::run(
                    "INSERT INTO inventory_transactions (spare_part_id, type, quantity, reference_id, reference_type, notes, performed_by)
                     VALUES (?, 'Stock Out', ?, ?, 'repair_order', ?, ?)",
                    [$spId, $delta, $repairOrderId, $notes, $perfBy]
                );
            } elseif ($delta < 0) {
                // Return stock back to inventory
                $returnQty = abs($delta);
                Database::run(
                    "UPDATE spare_parts SET stock_quantity = stock_quantity + ?, updated_at = NOW() WHERE id = ?",
                    [$returnQty, $spId]
                );
                Database::run(
                    "INSERT INTO inventory_transactions (spare_part_id, type, quantity, reference_id, reference_type, notes, performed_by)
                     VALUES (?, 'Stock In', ?, ?, 'repair_order', 'Returned excess parts from Job {$orderNumber}', ?)",
                    [$spId, $returnQty, $repairOrderId, $perfBy]
                );
            }

            Database::run(
                "INSERT INTO repair_parts (repair_order_id, spare_part_id, quantity, unit_price, total_price)
                 VALUES (?, ?, ?, ?, ?)
                 ON CONFLICT (repair_order_id, spare_part_id)
                 DO UPDATE SET quantity = EXCLUDED.quantity,
                               unit_price = EXCLUDED.unit_price,
                               total_price = EXCLUDED.quantity * EXCLUDED.unit_price",
                [$repairOrderId, $spId, $newQty, $part['unitPrice'], $part['unitPrice'] * $newQty]
            );
        }

        // Handle parts removed completely (only when usedParts was explicitly supplied as a full list)
        if (is_array($usedParts)) {
            foreach ($existingMap as $oldSpId => $oldQty) {
                if (!isset($targetParts[$oldSpId])) {
                    // Restore stock
                    Database::run(
                        "UPDATE spare_parts SET stock_quantity = stock_quantity + ?, updated_at = NOW() WHERE id = ?",
                        [$oldQty, $oldSpId]
                    );
                    Database::run(
                        "INSERT INTO inventory_transactions (spare_part_id, type, quantity, reference_id, reference_type, notes, performed_by)
                         VALUES (?, 'Stock In', ?, ?, 'repair_order', 'Removed part from Repair Job {$orderNumber}', ?)",
                        [$oldSpId, $oldQty, $repairOrderId, $perfBy]
                    );
                    Database::run(
                        "DELETE FROM repair_parts WHERE repair_order_id = ? AND spare_part_id = ?",
                        [$repairOrderId, $oldSpId]
                    );
                }
            }
        }

        return array_values($targetParts);
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private static function normalizeStatus(?string $status): ?string
    {
        if (!$status) return null;
        $map = [
            'in progress' => 'In Progress',
            'in-progress' => 'In Progress',
            'in_progress' => 'In Progress',
            'completed' => 'Completed',
            'pending' => 'Pending',
            'diagnosing' => 'Diagnosing',
            'repairing' => 'Repairing',
            'waiting for parts' => 'Waiting for Parts',
            'waiting_for_parts' => 'Waiting for Parts',
            'ready for pickup' => 'Ready for Pickup',
            'ready_for_pickup' => 'Ready for Pickup',
            'cancelled' => 'Cancelled',
            'canceled' => 'Cancelled',
        ];
        $key = strtolower(trim($status));
        return $map[$key] ?? $status;
    }

    private static function baseSql(): string
    {
        return "
          SELECT ro.*,
                 c.full_name AS customer_name,
                 v.vehicle_number, v.brand, v.model,
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
                 ) AS parts_used
          FROM repair_orders ro
          LEFT JOIN customers c ON ro.customer_id = c.id
          LEFT JOIN vehicles  v ON ro.vehicle_id  = v.id
          LEFT JOIN employees e ON ro.mechanic_id = e.id
          LEFT JOIN users     u ON e.user_id      = u.id
        ";
    }

    private static function format(array $r): array
    {
        $partsUsed = ($r['parts_used'] && $r['parts_used'] !== '[]') ? json_decode($r['parts_used'], true) : [];
        $ii        = $r['intake_inspection'] ? json_decode($r['intake_inspection'], true) : new \stdClass();
        $qa        = $r['qa_checklist']      ? json_decode($r['qa_checklist'],      true) : new \stdClass();

        return [
            'id'                  => $r['id'],
            'orderNumber'         => $r['order_number'],
            'customer'            => $r['customer_name']       ?: 'Customer',
            'customerId'          => $r['customer_id'],
            'vehicle'             => !empty($r['brand']) ? trim($r['brand'] . ' ' . ($r['model'] ?? '')) : 'Vehicle',
            'vehicleId'           => $r['vehicle_id'],
            'plate'               => $r['vehicle_number']      ?? '',
            'mechanic'            => $r['mechanic_name']       ?: 'Mechanic',
            'mechanicId'          => $r['mechanic_id'],
            'problem'             => $r['problem_description'] ?? '',
            'diagnosis'           => $r['diagnosis']           ?? '',
            'estimatedCost'       => $r['estimated_cost'] ? '$' . $r['estimated_cost'] : '$350.00',
            'actualCost'          => $r['actual_cost']    ? '$' . $r['actual_cost']    : '',
            'status'              => $r['status']              ?: 'Pending',
            'odometer'            => (int)   ($r['odometer']   ?? 0),
            'fuelLevel'           => $r['fuel_level']          ?: '1/2',
            'intakeInspection'    => $ii,
            'customerApproval'    => $r['customer_approval']   ?: 'Approved',
            'approvedAmount'      => (float)  ($r['approved_amount'] ?? 0),
            'qaChecklist'         => $qa,
            'laborMinutes'        => (int)   ($r['labor_minutes'] ?? 0),
            'laborRate'           => (float) ($r['labor_rate']   ?? 45.00),
            'nextServiceDueDate'  => $r['next_service_due_date'] ?? null,
            'nextServiceDueKm'    => $r['next_service_due_km']   ?? null,
            'createdAt'           => !empty($r['created_at']) ? explode(' ', $r['created_at'])[0] : 'Today',
            'partsUsed'           => is_array($partsUsed) ? $partsUsed : [],
        ];
    }
}
