<?php
// api/models/ServiceReminderModel.php

class ServiceReminderModel
{
    public static function getAll(): array
    {
        $rows = Database::all("
          SELECT sr.*,
                 c.full_name AS customer_name, c.phone AS customer_phone, c.email AS customer_email,
                 v.brand, v.model, v.vehicle_number, v.mileage AS current_mileage
          FROM service_reminders sr
          JOIN customers c ON sr.customer_id = c.id
          JOIN vehicles  v ON sr.vehicle_id  = v.id
          ORDER BY sr.due_date ASC NULLS LAST, sr.id DESC
        ");

        return array_map([self::class, 'format'], $rows);
    }

    public static function create(array $input): array
    {
        Database::run(
            "INSERT INTO service_reminders (customer_id, vehicle_id, repair_order_id, service_type, due_date, due_odometer, notes, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')",
            [
                $input['customerId']     ?? null,
                $input['vehicleId']      ?? null,
                $input['repairOrderId']  ?? null,
                $input['serviceType']    ?? null,
                $input['dueDate']        ?? null,
                isset($input['dueOdometer']) ? (int) $input['dueOdometer'] : null,
                $input['notes']          ?? null,
            ]
        );

        $inserted = Database::get(
            'SELECT * FROM service_reminders WHERE customer_id = ? AND vehicle_id = ? ORDER BY id DESC LIMIT 1',
            [$input['customerId'], $input['vehicleId']]
        );

        return $inserted;
    }

    public static function update(int $id, array $input): ?array
    {
        Database::run(
            "UPDATE service_reminders
             SET status   = COALESCE(?, status),
                 notes    = COALESCE(?, notes),
                 due_date = COALESCE(?, due_date)
             WHERE id = ?",
            [$input['status'] ?? null, $input['notes'] ?? null, $input['dueDate'] ?? null, $id]
        );

        $updated = Database::get('SELECT * FROM service_reminders WHERE id = ?', [$id]);
        return $updated ?: null;
    }

    public static function delete(int $id): void
    {
        Database::run('DELETE FROM service_reminders WHERE id = ?', [$id]);
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private static function format(array $r): array
    {
        return [
            'id'             => $r['id'],
            'customerId'     => $r['customer_id'],
            'customer'       => $r['customer_name'],
            'customerPhone'  => $r['customer_phone'],
            'customerEmail'  => $r['customer_email'],
            'vehicleId'      => $r['vehicle_id'],
            'vehicle'        => trim(($r['brand'] ?? '') . ' ' . ($r['model'] ?? '')),
            'plate'          => $r['vehicle_number'],
            'currentMileage' => (int) ($r['current_mileage'] ?? 0),
            'serviceType'    => $r['service_type'],
            'dueDate'        => !empty($r['due_date']) ? explode(' ', $r['due_date'])[0] : null,
            'dueOdometer'    => $r['due_odometer'] ?? null,
            'status'         => $r['status'] ?: 'Pending',
            'notes'          => $r['notes']  ?? '',
            'createdAt'      => $r['created_at'],
        ];
    }
}
