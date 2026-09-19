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

        $sql .= ' GROUP BY ro.id, c.full_name, v.vehicle_number, v.brand, v.model, u.full_name ORDER BY ro.id DESC';

        return array_map([self::class, 'format'], Database::all($sql, $params));
    }

    public static function findById(int $id): ?array
    {
        $r = Database::get(
            self::baseSql() . ' WHERE ro.id = ?
             GROUP BY ro.id, c.full_name, v.vehicle_number, v.brand, v.model, u.full_name',
            [$id]
        );
        return $r ? self::format($r) : null;
    }

    public static function create(array $input, int $performedBy): array
    {
        $countRow   = Database::get('SELECT COUNT(*) AS cnt FROM repair_orders');
        $cnt        = (int) ($countRow['cnt'] ?? 0) + 41;
        $orderNumber = 'RO-2026-' . str_pad($cnt, 4, '0', STR_PAD_LEFT);
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
        $deductedParts = self::autoStockOut($inserted['id'], $orderNumber, $input['serviceId'] ?? null, $input['usedParts'] ?? null, $performedBy);

        $customer = Database::get('SELECT full_name FROM customers WHERE id = ?', [$inserted['customer_id']]);
        $vehicle  = Database::get('SELECT vehicle_number, brand, model FROM vehicles WHERE id = ?', [$inserted['vehicle_id']]);

        $formatted                = self::format(array_merge($inserted, [
            'customer_name'  => $customer['full_name']      ?? '',
            'vehicle_number' => $vehicle['vehicle_number'] ?? '',
            'brand'          => $vehicle['brand']          ?? '',
            'model'          => $vehicle['model']          ?? '',
            'mechanic_name'  => null,
            'parts_used'     => json_encode($deductedParts),
        ]));
        $formatted['partsUsed'] = $deductedParts;
        return $formatted;
    }

    public static function update(int $id, array $input, int $performedBy): ?array
    {
        $actualNum = ($input['actualCost'] ?? null)
            ? (float) preg_replace('/[^0-9.]/', '', $input['actualCost'])
            : null;
        $estNum    = ($input['estimatedCost'] ?? null)
            ? (float) preg_replace('/[^0-9.]/', '', $input['estimatedCost'])
            : null;
        $qaJson    = isset($input['qaChecklist']) ? json_encode($input['qaChecklist']) : null;

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
                $input['status']          ?? null,
                $input['diagnosis']       ?? null,
                $actualNum,
                $estNum,
                $input['mechanicId']      ?? null,
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

        if (($input['serviceId'] ?? null) || (is_array($input['usedParts'] ?? null) && count($input['usedParts']) > 0)) {
            self::autoStockOut($updated['id'], $updated['order_number'], $input['serviceId'] ?? null, $input['usedParts'] ?? null, $performedBy);
        }

        return self::findById($id);
    }

    public static function delete(int $id): bool
    {
        $exists = Database::get('SELECT id FROM repair_orders WHERE id = ?', [$id]);
        if (!$exists) {
            return false;
        }
        Database::run('DELETE FROM repair_orders WHERE id = ?', [$id]);
        return true;
    }

    /**
     * Auto Stock-Out: deducts spare parts from inventory and logs transactions.
     * Moved from the old procedural route file.
     */
    public static function autoStockOut(int $repairOrderId, string $orderNumber, ?int $serviceId, ?array $usedParts, int $performedBy): array
    {
        $partsToDeduct = [];

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
                $partsToDeduct[] = [
                    'sparePartId' => $sp['spare_part_id'],
                    'partCode'    => $sp['part_code'],
                    'name'        => $sp['name'],
                    'unitPrice'   => (float) ($sp['unit_price'] ?? 0),
                    'quantity'    => (int)   ($sp['required_quantity'] ?? 1),
                    'serviceName' => $sp['service_name'],
                ];
            }
        }

        if (is_array($usedParts) && count($usedParts) > 0) {
            foreach ($usedParts as $item) {
                $partId = $item['sparePartId'] ?? $item['spare_part_id'] ?? $item['id'] ?? null;
                $qty    = (int) ($item['quantity'] ?? 1);
                if (!$partId) continue;
                $partInfo = Database::get('SELECT id, part_code, name, unit_price, stock_quantity FROM spare_parts WHERE id = ?', [$partId]);
                if ($partInfo) {
                    $partsToDeduct[] = [
                        'sparePartId' => $partInfo['id'],
                        'partCode'    => $partInfo['part_code'],
                        'name'        => $partInfo['name'],
                        'unitPrice'   => (float) ($partInfo['unit_price'] ?? 0),
                        'quantity'    => $qty,
                        'serviceName' => null,
                    ];
                }
            }
        }

        foreach ($partsToDeduct as $part) {
            Database::run(
                "UPDATE spare_parts SET stock_quantity = GREATEST(0, stock_quantity - ?), updated_at = NOW() WHERE id = ?",
                [$part['quantity'], $part['sparePartId']]
            );
            $notes = $part['serviceName']
                ? "Auto Stock-Out for Service \"{$part['serviceName']}\" on Job {$orderNumber}"
                : "Auto Stock-Out for Repair Job {$orderNumber}";
            Database::run(
                "INSERT INTO inventory_transactions (spare_part_id, type, quantity, reference_id, reference_type, notes, performed_by)
                 VALUES (?, 'Stock Out', ?, ?, 'repair_order', ?, ?)",
                [$part['sparePartId'], $part['quantity'], $repairOrderId, $notes, $performedBy]
            );
            Database::run(
                "INSERT INTO repair_parts (repair_order_id, spare_part_id, quantity, unit_price, total_price)
                 VALUES (?, ?, ?, ?, ?)",
                [$repairOrderId, $part['sparePartId'], $part['quantity'], $part['unitPrice'], $part['unitPrice'] * $part['quantity']]
            );
        }

        return $partsToDeduct;
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private static function baseSql(): string
    {
        return "
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
          LEFT JOIN customers    c  ON ro.customer_id  = c.id
          LEFT JOIN vehicles     v  ON ro.vehicle_id   = v.id
          LEFT JOIN employees    e  ON ro.mechanic_id  = e.id
          LEFT JOIN users        u  ON e.user_id       = u.id
          LEFT JOIN repair_parts rp ON rp.repair_order_id = ro.id
          LEFT JOIN spare_parts  sp ON rp.spare_part_id   = sp.id
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
