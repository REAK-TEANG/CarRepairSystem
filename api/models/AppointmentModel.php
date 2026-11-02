<?php
// api/models/AppointmentModel.php

class AppointmentModel
{
    public static function getAll(): array
    {
        $rows = Database::all("
          SELECT a.*,
                 c.full_name AS customer_name,
                 v.vehicle_number, v.brand, v.model,
                 u.full_name AS mechanic_name
          FROM appointments a
          LEFT JOIN customers  c ON a.customer_id  = c.id
          LEFT JOIN vehicles   v ON a.vehicle_id   = v.id
          LEFT JOIN employees  e ON a.mechanic_id  = e.id
          LEFT JOIN users      u ON e.user_id      = u.id
          ORDER BY a.scheduled_date ASC
        ");

        return array_map([self::class, 'format'], $rows);
    }

    public static function getPaginated(string $search = '', int $page = 1, int $limit = 10, ?string $status = null): array
    {
        $countSql = "
          SELECT COUNT(*) AS cnt
          FROM appointments a
          LEFT JOIN customers c ON a.customer_id = c.id
          LEFT JOIN vehicles v ON a.vehicle_id = v.id
          LEFT JOIN employees e ON a.mechanic_id = e.id
          LEFT JOIN users u ON e.user_id = u.id
          WHERE 1=1
        ";
        $countParams = [];
        if ($search) {
            $countSql .= " AND (a.appointment_code ILIKE ? OR c.full_name ILIKE ? OR v.vehicle_number ILIKE ? OR v.brand ILIKE ? OR v.model ILIKE ? OR u.full_name ILIKE ?)";
            $countParams = array_merge($countParams, ["%$search%", "%$search%", "%$search%", "%$search%", "%$search%", "%$search%"]);
        }
        if ($status && $status !== 'All') {
            $countSql .= " AND a.status = ?";
            $countParams[] = $status;
        }

        $countRow = Database::get($countSql, $countParams);
        $total = (int) ($countRow['cnt'] ?? 0);

        $offset = max(0, ($page - 1) * $limit);
        $sql = "
          SELECT a.*,
                 c.full_name AS customer_name,
                 v.vehicle_number, v.brand, v.model,
                 u.full_name AS mechanic_name
          FROM appointments a
          LEFT JOIN customers  c ON a.customer_id  = c.id
          LEFT JOIN vehicles   v ON a.vehicle_id   = v.id
          LEFT JOIN employees  e ON a.mechanic_id  = e.id
          LEFT JOIN users      u ON e.user_id      = u.id
          WHERE 1=1
        ";
        $params = [];
        if ($search) {
            $sql .= " AND (a.appointment_code ILIKE ? OR c.full_name ILIKE ? OR v.vehicle_number ILIKE ? OR v.brand ILIKE ? OR v.model ILIKE ? OR u.full_name ILIKE ?)";
            $params = array_merge($params, ["%$search%", "%$search%", "%$search%", "%$search%", "%$search%", "%$search%"]);
        }
        if ($status && $status !== 'All') {
            $sql .= " AND a.status = ?";
            $params[] = $status;
        }
        $sql .= " ORDER BY a.scheduled_date DESC, a.scheduled_time DESC LIMIT $limit OFFSET $offset";

        $rows = Database::all($sql, $params);
        return [
            'data' => array_map([self::class, 'format'], $rows),
            'total' => $total,
        ];
    }

    public static function findById(int $id): ?array
    {
        $r = Database::get("
          SELECT a.*,
                 c.full_name AS customer_name,
                 v.vehicle_number, v.brand, v.model,
                 u.full_name AS mechanic_name
          FROM appointments a
          LEFT JOIN customers  c ON a.customer_id  = c.id
          LEFT JOIN vehicles   v ON a.vehicle_id   = v.id
          LEFT JOIN employees  e ON a.mechanic_id  = e.id
          LEFT JOIN users      u ON e.user_id      = u.id
          WHERE a.id = ?
        ", [$id]);

        return $r ? self::format($r) : null;
    }

    public static function create(array $input): array
    {
        $code = generateUniqueCode('appointments', 'appointment_code', 'APT-2026', 3);

        $customerId = (!empty($input['customerId']) && is_numeric($input['customerId'])) ? (int) $input['customerId'] : null;
        if ($customerId) {
            $custExists = Database::get('SELECT id FROM customers WHERE id = ?', [$customerId]);
            if (!$custExists) $customerId = null;
        }
        if (!$customerId && !empty($input['customer'])) {
            $cust = Database::get('SELECT id FROM customers WHERE LOWER(full_name) = LOWER(?) LIMIT 1', [trim($input['customer'])]);
            if ($cust) $customerId = (int) $cust['id'];
        }
        if (!$customerId) {
            $firstCust = Database::get('SELECT id FROM customers ORDER BY id ASC LIMIT 1');
            if ($firstCust) {
                $customerId = (int) $firstCust['id'];
            } else {
                $cCode = generateUniqueCode('customers', 'customer_code', 'CUST', 3);
                Database::run("INSERT INTO customers (customer_code, full_name, phone) VALUES (?, ?, ?)", [$cCode, 'Walk-in Customer', '012000000']);
                $newCust = Database::get('SELECT id FROM customers WHERE customer_code = ?', [$cCode]);
                $customerId = (int) $newCust['id'];
            }
        }

        $vehicleId = (!empty($input['vehicleId']) && is_numeric($input['vehicleId'])) ? (int) $input['vehicleId'] : null;
        if ($vehicleId) {
            $vehExists = Database::get('SELECT id FROM vehicles WHERE id = ?', [$vehicleId]);
            if (!$vehExists) $vehicleId = null;
        }
        if (!$vehicleId && !empty($input['plate'])) {
            $veh = Database::get('SELECT id FROM vehicles WHERE LOWER(vehicle_number) = LOWER(?) LIMIT 1', [trim($input['plate'])]);
            if ($veh) $vehicleId = (int) $veh['id'];
        }
        if (!$vehicleId) {
            $firstVeh = Database::get('SELECT id FROM vehicles WHERE customer_id = ? ORDER BY id ASC LIMIT 1', [$customerId]);
            if (!$firstVeh) {
                $firstVeh = Database::get('SELECT id FROM vehicles ORDER BY id ASC LIMIT 1');
            }
            if ($firstVeh) {
                $vehicleId = (int) $firstVeh['id'];
            } else {
                Database::run("INSERT INTO vehicles (customer_id, vehicle_number, brand, model, year) VALUES (?, ?, ?, ?, ?)", [
                    $customerId, '2X-' . rand(1000, 9999), 'Toyota', 'Prius', (int) date('Y')
                ]);
                $newVeh = Database::get('SELECT id FROM vehicles WHERE customer_id = ? ORDER BY id DESC LIMIT 1', [$customerId]);
                $vehicleId = (int) $newVeh['id'];
            }
        }

        $mechanicId = (!empty($input['mechanicId']) && is_numeric($input['mechanicId'])) ? (int) $input['mechanicId'] : null;
        if ($mechanicId) {
            $mechExists = Database::get('SELECT id FROM employees WHERE id = ?', [$mechanicId]);
            if (!$mechExists) $mechanicId = null;
        }
        if (!$mechanicId && !empty($input['mechanic'])) {
            $mech = Database::get('SELECT e.id FROM employees e JOIN users u ON e.user_id = u.id WHERE LOWER(u.full_name) = LOWER(?) LIMIT 1', [trim($input['mechanic'])]);
            if ($mech) $mechanicId = (int) $mech['id'];
        }

        $schedDate = !empty($input['date']) ? $input['date'] : date('Y-m-d');
        if ($schedDate < date('Y-m-d')) {
            $schedDate = date('Y-m-d');
        }

        Database::run(
            "INSERT INTO appointments (appointment_code, customer_id, vehicle_id, mechanic_id, scheduled_date, scheduled_time, status, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [
                $code,
                $customerId,
                $vehicleId,
                $mechanicId,
                $schedDate,
                !empty($input['time']) ? $input['time'] : '09:00',
                !empty($input['status']) ? $input['status'] : 'Scheduled',
                !empty($input['notes']) ? $input['notes'] : null,
            ]
        );

        $inserted = Database::get('SELECT * FROM appointments WHERE appointment_code = ? ORDER BY id DESC LIMIT 1', [$code]);
        if ($inserted) {
            if (class_exists('EventBus')) {
                EventBus::publish('appointments', 'created', [
                    'id' => $inserted['id'],
                    'code' => $code,
                    'status' => $inserted['status'],
                    'scheduledDate' => $inserted['scheduled_date'],
                ]);
            }
            return self::findById((int) $inserted['id']) ?? [];
        }
        return [];
    }

    public static function update(int $id, array $input): ?array
    {
        $mechanicId = (!empty($input['mechanicId']) && (int) $input['mechanicId'] > 0)
            ? (int) $input['mechanicId']
            : ((!empty($input['mechanic_id']) && (int) $input['mechanic_id'] > 0) ? (int) $input['mechanic_id'] : null);

        Database::run(
            "UPDATE appointments
             SET status         = COALESCE(?, status),
                 mechanic_id    = COALESCE(?, mechanic_id),
                 scheduled_date = COALESCE(?, scheduled_date),
                 scheduled_time = COALESCE(?, scheduled_time),
                 notes          = COALESCE(?, notes),
                 updated_at     = NOW()
             WHERE id = ?",
            [
                $input['status'] ?? null,
                $mechanicId,
                $input['date']   ?? null,
                $input['time']   ?? null,
                $input['notes']  ?? null,
                $id,
            ]
        );

        $res = self::findById($id);
        if ($res) {
            EventBus::publish('appointments', 'updated', [
                'id' => $id,
                'status' => $res['status'],
                'scheduledDate' => $res['date'],
            ]);
        }
        return $res;
    }

    public static function updateStatus(int $id, string $status): ?array
    {
        Database::run("UPDATE appointments SET status = ?, updated_at = NOW() WHERE id = ?", [$status, $id]);
        $res = self::findById($id);
        if ($res) {
            if (class_exists('EventBus')) {
                EventBus::publish('appointments', 'status_changed', [
                    'id' => $id,
                    'status' => $status,
                ]);
            }
        }
        return $res;
    }

    public static function cancel(int $id): bool
    {
        $exists = Database::get('SELECT id FROM appointments WHERE id = ?', [$id]);
        if (!$exists) {
            return false;
        }

        Database::run("UPDATE appointments SET status = 'Cancelled', updated_at = NOW() WHERE id = ?", [$id]);
        if (class_exists('EventBus')) {
            EventBus::publish('appointments', 'cancelled', ['id' => $id]);
        }
        return true;
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private static function format(array $r): array
    {
        return [
            'id'         => $r['id'],
            'code'       => $r['appointment_code'],
            'customer'   => $r['customer_name']  ?? 'Customer',
            'customerId' => $r['customer_id'],
            'vehicle'    => !empty($r['brand']) ? trim($r['brand'] . ' ' . ($r['model'] ?? '')) : 'Vehicle',
            'vehicleId'  => $r['vehicle_id'],
            'plate'      => $r['vehicle_number'] ?? '',
            'mechanic'   => $r['mechanic_name']  ?? 'Mechanic',
            'mechanicId' => $r['mechanic_id'],
            'service'    => 'General Service',
            'date'       => !empty($r['scheduled_date']) ? explode(' ', $r['scheduled_date'])[0] : '',
            'time'       => $r['scheduled_time'] ?? '09:00',
            'status'     => $r['status']         ?? 'Scheduled',
            'notes'      => $r['notes']          ?? '',
        ];
    }
}
