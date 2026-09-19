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

    public static function create(array $input): array
    {
        $countRow = Database::get('SELECT COUNT(*) AS cnt FROM appointments');
        $cnt      = (int) ($countRow['cnt'] ?? 0) + 1;
        $code     = 'APT-2026-' . str_pad($cnt, 3, '0', STR_PAD_LEFT);

        Database::run(
            "INSERT INTO appointments (appointment_code, customer_id, vehicle_id, mechanic_id, scheduled_date, scheduled_time, status, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [
                $code,
                $input['customerId']  ?? 1,
                $input['vehicleId']   ?? 1,
                $input['mechanicId']  ?? null,
                $input['date']        ?? date('Y-m-d'),
                $input['time']        ?? '09:00',
                $input['status']      ?? 'Scheduled',
                $input['notes']       ?? null,
            ]
        );

        $inserted = Database::get('SELECT * FROM appointments WHERE appointment_code = ? ORDER BY id DESC LIMIT 1', [$code]);
        $customer = Database::get('SELECT full_name FROM customers WHERE id = ?', [$inserted['customer_id']]);
        $vehicle  = Database::get('SELECT vehicle_number, brand, model FROM vehicles WHERE id = ?', [$inserted['vehicle_id']]);

        return self::format(array_merge($inserted, [
            'customer_name'  => $customer['full_name'] ?? '',
            'vehicle_number' => $vehicle['vehicle_number'] ?? '',
            'brand'          => $vehicle['brand'] ?? '',
            'model'          => $vehicle['model'] ?? '',
            'mechanic_name'  => null,
        ]));
    }

    public static function update(int $id, array $input): ?array
    {
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
                $input['status']     ?? null,
                $input['mechanicId'] ?? null,
                $input['date']       ?? null,
                $input['time']       ?? null,
                $input['notes']      ?? null,
                $id,
            ]
        );

        return self::findById($id);
    }

    public static function updateStatus(int $id, string $status): ?array
    {
        Database::run("UPDATE appointments SET status = ?, updated_at = NOW() WHERE id = ?", [$status, $id]);
        return self::findById($id);
    }

    public static function cancel(int $id): bool
    {
        $exists = Database::get('SELECT id FROM appointments WHERE id = ?', [$id]);
        if (!$exists) {
            return false;
        }

        Database::run("UPDATE appointments SET status = 'Cancelled', updated_at = NOW() WHERE id = ?", [$id]);
        return true;
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private static function findById(int $id): ?array
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
          WHERE a.id = ?",
            [$id]
        );
        return $r ? self::format($r) : null;
    }

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
