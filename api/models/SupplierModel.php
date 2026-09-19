<?php
// api/models/SupplierModel.php

class SupplierModel
{
    public static function getAll(): array
    {
        $rows = Database::all("
          SELECT s.*,
                 COUNT(sp.id) AS parts_count,
                 COALESCE(STRING_AGG(DISTINCT sp.category, ', '), 'OEM Parts, Fluids') AS categories_list
          FROM suppliers s
          LEFT JOIN spare_parts sp ON sp.supplier_id = s.id
          GROUP BY s.id
          ORDER BY s.id DESC
        ");

        return array_map([self::class, 'format'], $rows);
    }

    public static function create(array $input): array
    {
        Database::run(
            "INSERT INTO suppliers (name, contact_name, phone, email, address) VALUES (?, ?, ?, ?, ?)",
            [
                trim($input['name'] ?? ''),
                $input['contactPerson'] ?? null,
                $input['phone']         ?? null,
                $input['email']         ?? null,
                $input['address']       ?? null,
            ]
        );

        $inserted = Database::get(
            'SELECT * FROM suppliers WHERE name = ? ORDER BY id DESC LIMIT 1',
            [trim($input['name'] ?? '')]
        );

        return self::format(array_merge($inserted, ['parts_count' => 0, 'categories_list' => 'OEM Parts, Fluids']));
    }

    public static function update(int $id, array $input): ?array
    {
        Database::run(
            "UPDATE suppliers
             SET name         = COALESCE(?, name),
                 contact_name = COALESCE(?, contact_name),
                 phone        = COALESCE(?, phone),
                 email        = COALESCE(?, email),
                 address      = COALESCE(?, address),
                 updated_at   = NOW()
             WHERE id = ?",
            [
                $input['name']          ?? null,
                $input['contactPerson'] ?? null,
                $input['phone']         ?? null,
                $input['email']         ?? null,
                $input['address']       ?? null,
                $id,
            ]
        );

        $updated = Database::get('SELECT * FROM suppliers WHERE id = ?', [$id]);
        if (!$updated) {
            return null;
        }

        return self::format(array_merge($updated, ['parts_count' => 0, 'categories_list' => 'OEM Parts, Fluids']));
    }

    public static function delete(int $id): bool
    {
        $exists = Database::get('SELECT id FROM suppliers WHERE id = ?', [$id]);
        if (!$exists) {
            return false;
        }
        Database::run('DELETE FROM suppliers WHERE id = ?', [$id]);
        return true;
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private static function format(array $r): array
    {
        return [
            'id'            => $r['id'],
            'name'          => $r['name'],
            'contactPerson' => $r['contact_name']    ?? '',
            'phone'         => $r['phone']            ?? '',
            'email'         => $r['email']            ?? '',
            'address'       => $r['address']          ?? '',
            'categories'    => $r['categories_list']  ?: 'OEM Parts, Fluids',
            'rating'        => 4.9,
            'activeOrders'  => (int) ($r['parts_count'] ?? 0),
        ];
    }
}
