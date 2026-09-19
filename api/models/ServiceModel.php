<?php
// api/models/ServiceModel.php

class ServiceModel
{
    public static function getAll(): array
    {
        $rows = Database::all("
          SELECT s.*,
                 COALESCE(
                   json_agg(
                     json_build_object(
                       'id', sp.id,
                       'sparePartId', p.id,
                       'partCode', p.part_code,
                       'name', p.name,
                       'brand', p.brand,
                       'unitPrice', p.unit_price,
                       'stockQuantity', p.stock_quantity,
                       'quantity', sp.quantity
                     )
                   ) FILTER (WHERE sp.id IS NOT NULL),
                   '[]'
                 ) AS required_parts
          FROM services s
          LEFT JOIN service_parts sp ON sp.service_id = s.id
          LEFT JOIN spare_parts p ON sp.spare_part_id = p.id
          GROUP BY s.id
          ORDER BY s.id ASC
        ");

        return array_map([self::class, 'format'], $rows);
    }

    public static function findById(int $id): ?array
    {
        $r = Database::get("
          SELECT s.*,
                 COALESCE(
                   json_agg(
                     json_build_object(
                       'id', sp.id,
                       'sparePartId', p.id,
                       'partCode', p.part_code,
                       'name', p.name,
                       'brand', p.brand,
                       'unitPrice', p.unit_price,
                       'stockQuantity', p.stock_quantity,
                       'quantity', sp.quantity
                     )
                   ) FILTER (WHERE sp.id IS NOT NULL),
                   '[]'
                 ) AS required_parts
          FROM services s
          LEFT JOIN service_parts sp ON sp.service_id = s.id
          LEFT JOIN spare_parts p ON sp.spare_part_id = p.id
          WHERE s.id = ?
          GROUP BY s.id",
            [$id]
        );

        return $r ? self::format($r) : null;
    }

    public static function create(array $input): array
    {
        Database::run(
            "INSERT INTO services (name, description, estimated_cost, estimated_hours, is_active) VALUES (?, ?, ?, ?, ?)",
            [
                trim($input['name'] ?? ''),
                $input['description']   ?? null,
                (float) ($input['estimatedCost'] ?? 0),
                (float) ($input['laborHours']    ?? 1.0),
                isset($input['isActive']) ? (int) $input['isActive'] : 1,
            ]
        );

        $inserted   = Database::get('SELECT * FROM services WHERE name = ? ORDER BY id DESC LIMIT 1', [trim($input['name'] ?? '')]);
        $insertedId = (int) $inserted['id'];
        self::syncParts($insertedId, $input['requiredParts'] ?? []);
        return self::findById($insertedId);
    }

    public static function update(int $id, array $input): ?array
    {
        Database::run(
            "UPDATE services
             SET name           = COALESCE(?, name),
                 description    = COALESCE(?, description),
                 estimated_cost = COALESCE(?, estimated_cost),
                 estimated_hours = COALESCE(?, estimated_hours),
                 is_active      = COALESCE(?, is_active),
                 updated_at     = NOW()
             WHERE id = ?",
            [
                $input['name']        ?? null,
                $input['description'] ?? null,
                isset($input['estimatedCost']) ? (float) $input['estimatedCost'] : null,
                isset($input['laborHours'])    ? (float) $input['laborHours']    : null,
                isset($input['isActive'])      ? (int)   $input['isActive']      : null,
                $id,
            ]
        );

        if (is_array($input['requiredParts'] ?? null)) {
            Database::run('DELETE FROM service_parts WHERE service_id = ?', [$id]);
            self::syncParts($id, $input['requiredParts']);
        }

        return self::findById($id);
    }

    public static function delete(int $id): bool
    {
        $exists = Database::get('SELECT id FROM services WHERE id = ?', [$id]);
        if (!$exists) {
            return false;
        }
        Database::run('DELETE FROM services WHERE id = ?', [$id]);
        return true;
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private static function syncParts(int $serviceId, array $parts): void
    {
        foreach ($parts as $item) {
            $sparePartId = $item['sparePartId'] ?? $item['id'] ?? null;
            $qty         = (int) ($item['quantity'] ?? 1);
            if ($sparePartId) {
                Database::run(
                    "INSERT INTO service_parts (service_id, spare_part_id, quantity)
                     VALUES (?, ?, ?)
                     ON CONFLICT (service_id, spare_part_id) DO UPDATE SET quantity = EXCLUDED.quantity",
                    [$serviceId, $sparePartId, $qty]
                );
            }
        }
    }

    private static function format(array $r): array
    {
        $rawParts = $r['required_parts'];
        $parts    = ($rawParts && $rawParts !== '[]') ? json_decode($rawParts, true) : [];
        return [
            'id'            => $r['id'],
            'name'          => $r['name'],
            'category'      => 'Maintenance',
            'description'   => $r['description']    ?? '',
            'estimatedCost' => (float) ($r['estimated_cost']  ?? 0),
            'laborHours'    => (float) ($r['estimated_hours'] ?? 1.0),
            'isActive'      => (bool)   $r['is_active'],
            'requiredParts' => is_array($parts) ? $parts : [],
        ];
    }
}
