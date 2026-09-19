<?php
// api/models/CustomerModel.php

class CustomerModel
{
    public static function getAll(string $search = ''): array
    {
        $sql = "
          SELECT c.*,
                 COUNT(DISTINCT v.id)         AS vehicles_count,
                 COALESCE(SUM(i.amount_paid), 0) AS total_spent
          FROM customers c
          LEFT JOIN vehicles v ON v.customer_id = c.id
          LEFT JOIN invoices i ON i.customer_id = c.id
        ";
        $params = [];

        if ($search) {
            $sql   .= " WHERE c.full_name ILIKE ? OR c.phone ILIKE ? OR c.customer_code ILIKE ?";
            $params = ["%$search%", "%$search%", "%$search%"];
        }

        $sql .= " GROUP BY c.id ORDER BY c.id DESC";

        return array_map([self::class, 'format'], Database::all($sql, $params));
    }

    public static function findById(int $id): ?array
    {
        $r = Database::get('SELECT * FROM customers WHERE id = ?', [$id]);
        return $r ? self::format($r) : null;
    }

    public static function create(array $input): array
    {
        $countRow = Database::get('SELECT COUNT(*) AS cnt FROM customers');
        $cnt      = (int) ($countRow['cnt'] ?? 0) + 1;
        $code     = 'CUST-' . str_pad($cnt, 3, '0', STR_PAD_LEFT);

        Database::run(
            "INSERT INTO customers (customer_code, full_name, phone, email, address, notes) VALUES (?, ?, ?, ?, ?, ?)",
            [
                $code,
                trim($input['name'] ?? ''),
                $input['phone']   ?? null,
                $input['email']   ?? null,
                $input['address'] ?? null,
                $input['notes']   ?? null,
            ]
        );

        $inserted = Database::get('SELECT * FROM customers WHERE customer_code = ? ORDER BY id DESC LIMIT 1', [$code]);
        return self::format($inserted);
    }

    public static function update(int $id, array $input): ?array
    {
        Database::run(
            "UPDATE customers
             SET full_name = COALESCE(?, full_name),
                 phone     = COALESCE(?, phone),
                 email     = COALESCE(?, email),
                 address   = COALESCE(?, address),
                 notes     = COALESCE(?, notes),
                 updated_at = NOW()
             WHERE id = ?",
            [
                $input['name']    ?? null,
                $input['phone']   ?? null,
                $input['email']   ?? null,
                $input['address'] ?? null,
                $input['notes']   ?? null,
                $id,
            ]
        );

        $updated = Database::get('SELECT * FROM customers WHERE id = ?', [$id]);
        return $updated ? self::format($updated) : null;
    }

    public static function delete(int $id): bool
    {
        $exists = Database::get('SELECT id FROM customers WHERE id = ?', [$id]);
        if (!$exists) {
            return false;
        }

        Database::run('DELETE FROM customers WHERE id = ?', [$id]);
        return true;
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private static function format(array $r): array
    {
        return [
            'id'               => $r['id'],
            'code'             => $r['customer_code'],
            'name'             => $r['full_name'],
            'phone'            => $r['phone'] ?? '',
            'email'            => $r['email'] ?? '',
            'address'          => $r['address'] ?? '',
            'avatar'           => 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            'vehiclesCount'    => (int) ($r['vehicles_count'] ?? 0),
            'totalSpent'       => '$' . number_format((float) ($r['total_spent'] ?? 0), 2, '.', ','),
            'registrationDate' => !empty($r['registration_date']) ? explode(' ', $r['registration_date'])[0] : '',
            'notes'            => $r['notes'] ?? '',
        ];
    }
}
