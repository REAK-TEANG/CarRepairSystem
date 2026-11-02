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
          LEFT JOIN customers c ON sr.customer_id = c.id
          LEFT JOIN vehicles  v ON sr.vehicle_id  = v.id
          ORDER BY sr.due_date ASC NULLS LAST, sr.id DESC
        ");

        return array_map([self::class, 'format'], $rows);
    }

    public static function findById(int $id): ?array
    {
        $r = Database::get("
          SELECT sr.*,
                 c.full_name AS customer_name, c.phone AS customer_phone, c.email AS customer_email,
                 v.brand, v.model, v.vehicle_number, v.mileage AS current_mileage
          FROM service_reminders sr
          LEFT JOIN customers c ON sr.customer_id = c.id
          LEFT JOIN vehicles  v ON sr.vehicle_id  = v.id
          WHERE sr.id = ?
        ", [$id]);

        return $r ? self::format($r) : null;
    }

    public static function create(array $input): array
    {
        $customerId = (!empty($input['customerId']) && is_numeric($input['customerId'])) ? (int) $input['customerId'] : null;
        $vehicleId  = (!empty($input['vehicleId']) && is_numeric($input['vehicleId']))   ? (int) $input['vehicleId']  : null;
        $roId       = (!empty($input['repairOrderId']) && is_numeric($input['repairOrderId'])) ? (int) $input['repairOrderId'] : null;

        $res = Database::get(
            "INSERT INTO service_reminders (customer_id, vehicle_id, repair_order_id, service_type, due_date, due_odometer, notes, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')
             RETURNING id",
            [
                $customerId,
                $vehicleId,
                $roId,
                $input['serviceType']    ?? null,
                $input['dueDate']        ?? null,
                isset($input['dueOdometer']) && is_numeric($input['dueOdometer']) ? (int) $input['dueOdometer'] : null,
                $input['notes']          ?? null,
            ]
        );

        $id = (int) ($res['id'] ?? 0);
        return $id ? (self::findById($id) ?? []) : [];
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

        return self::findById($id);
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
            'customer'       => $r['customer_name'] ?? '',
            'customerPhone'  => $r['customer_phone'] ?? null,
            'customerEmail'  => $r['customer_email'] ?? null,
            'vehicleId'      => $r['vehicle_id'],
            'vehicle'        => trim(($r['brand'] ?? '') . ' ' . ($r['model'] ?? '')),
            'plate'          => $r['vehicle_number'] ?? '',
            'currentMileage' => (int) ($r['current_mileage'] ?? 0),
            'serviceType'    => $r['service_type'] ?? '',
            'dueDate'        => !empty($r['due_date']) ? explode(' ', $r['due_date'])[0] : null,
            'dueOdometer'    => $r['due_odometer'] ?? null,
            'status'         => $r['status'] ?: 'Pending',
            'notes'          => $r['notes']  ?? '',
            'createdAt'      => $r['created_at'] ?? null,
        ];
    }
}
