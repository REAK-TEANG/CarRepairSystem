<?php
// api/models/VehicleModel.php

class VehicleModel
{
    private const VALID_FUELS = ['Gasoline', 'Diesel', 'Electric', 'Hybrid', 'LPG'];

    public static function getAll(): array
    {
        $rows = Database::all("
          SELECT v.*, c.full_name AS customer_name
          FROM vehicles v
          LEFT JOIN customers c ON v.customer_id = c.id
          ORDER BY v.id DESC
        ");

        return array_map([self::class, 'format'], $rows);
    }

    public static function create(array $input): array
    {
        $customerId  = self::resolveCustomerId($input['ownerId'] ?? null);
        $normalFuel  = self::normalizeFuel($input['fuelType'] ?? '');
        $photoUrl    = $input['image'] ?? $input['photoUrl'] ?? null;

        Database::run(
            "INSERT INTO vehicles (customer_id, vehicle_number, vin, brand, model, year, color, fuel_type, mileage, photo_url, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                $customerId,
                trim($input['number'] ?? ''),
                $input['vin']    ?? null,
                $input['brand']  ?? null,
                $input['model']  ?? null,
                !empty($input['year'])    ? (int) $input['year']    : null,
                $input['color']  ?? null,
                $normalFuel,
                !empty($input['mileage']) ? (int) $input['mileage'] : 0,
                $photoUrl,
                $input['notes']  ?? null,
            ]
        );

        $inserted = Database::get(
            'SELECT * FROM vehicles WHERE vehicle_number = ? ORDER BY id DESC LIMIT 1',
            [trim($input['number'] ?? '')]
        );
        $customer = Database::get('SELECT full_name FROM customers WHERE id = ?', [$inserted['customer_id']]);
        return self::format(array_merge($inserted, ['customer_name' => $customer['full_name'] ?? '']));
    }

    public static function update(int $id, array $input): ?array
    {
        $customerId = !empty($input['ownerId']) ? self::resolveCustomerId($input['ownerId']) : null;
        $normalFuel = !empty($input['fuelType']) ? self::normalizeFuel($input['fuelType']) : null;
        $photoUrl   = $input['image'] ?? $input['photoUrl'] ?? null;

        Database::run(
            "UPDATE vehicles
             SET vehicle_number = COALESCE(?, vehicle_number),
                 vin            = COALESCE(?, vin),
                 brand          = COALESCE(?, brand),
                 model          = COALESCE(?, model),
                 year           = COALESCE(?, year),
                 color          = COALESCE(?, color),
                 fuel_type      = COALESCE(?, fuel_type),
                 mileage        = COALESCE(?, mileage),
                 customer_id    = COALESCE(?, customer_id),
                 photo_url      = COALESCE(?, photo_url),
                 notes          = COALESCE(?, notes),
                 updated_at     = NOW()
             WHERE id = ?",
            [
                $input['number'] ?? null,
                $input['vin']    ?? null,
                $input['brand']  ?? null,
                $input['model']  ?? null,
                !empty($input['year'])    ? (int) $input['year']    : null,
                $input['color']  ?? null,
                $normalFuel,
                !empty($input['mileage']) ? (int) $input['mileage'] : null,
                $customerId,
                $photoUrl,
                $input['notes']  ?? null,
                $id,
            ]
        );

        $updated  = Database::get('SELECT * FROM vehicles WHERE id = ?', [$id]);
        if (!$updated) {
            return null;
        }
        $customer = Database::get('SELECT full_name FROM customers WHERE id = ?', [$updated['customer_id']]);
        return self::format(array_merge($updated, ['customer_name' => $customer['full_name'] ?? '']));
    }

    public static function delete(int $id): bool
    {
        $exists = Database::get('SELECT id FROM vehicles WHERE id = ?', [$id]);
        if (!$exists) {
            return false;
        }
        Database::run('DELETE FROM vehicles WHERE id = ?', [$id]);
        return true;
    }

    /** Resolve a customer_id, falling back to the first customer if not found. */
    public static function resolveCustomerId(?int $ownerId): int
    {
        if (!$ownerId) {
            $first = Database::get('SELECT id FROM customers ORDER BY id ASC LIMIT 1');
            return $first ? (int) $first['id'] : 1;
        }
        $exists = Database::get('SELECT id FROM customers WHERE id = ?', [$ownerId]);
        if (!$exists) {
            $first = Database::get('SELECT id FROM customers ORDER BY id ASC LIMIT 1');
            return $first ? (int) $first['id'] : $ownerId;
        }
        return $ownerId;
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private static function normalizeFuel(string $fuelType): string
    {
        foreach (self::VALID_FUELS as $f) {
            if (strtolower($f) === strtolower(trim($fuelType))) {
                return $f;
            }
        }
        return 'Gasoline';
    }

    private static function format(array $r): array
    {
        return [
            'id'       => $r['id'],
            'number'   => $r['vehicle_number'],
            'vin'      => $r['vin']       ?? '',
            'brand'    => $r['brand']     ?? '',
            'model'    => $r['model']     ?? '',
            'year'     => (int) ($r['year']    ?? 2022),
            'color'    => $r['color']     ?? '',
            'fuelType' => $r['fuel_type'] ?? 'Gasoline',
            'mileage'  => (int) ($r['mileage'] ?? 0),
            'image'    => $r['photo_url'] ?? $r['image'] ?? '',
            'owner'    => $r['customer_name'] ?? 'Owner',
            'ownerId'  => $r['customer_id'],
            'notes'    => $r['notes']     ?? '',
        ];
    }
}
