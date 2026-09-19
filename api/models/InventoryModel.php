<?php
// api/models/InventoryModel.php

class InventoryModel
{
    public static function getAll(): array
    {
        $rows = Database::all("
          SELECT sp.*, s.name AS supplier_name
          FROM spare_parts sp
          LEFT JOIN suppliers s ON sp.supplier_id = s.id
          ORDER BY sp.id DESC
        ");

        return array_map([self::class, 'format'], $rows);
    }

    public static function getTransactions(): array
    {
        $rows = Database::all("
          SELECT it.*,
                 sp.part_code, sp.name AS part_name,
                 u.full_name AS performed_by_name
          FROM inventory_transactions it
          JOIN spare_parts sp ON it.spare_part_id = sp.id
          LEFT JOIN users u ON it.performed_by = u.id
          ORDER BY it.id DESC
          LIMIT 100
        ");

        return array_map(function (array $r): array {
            return [
                'id'            => $r['id'],
                'sparePartId'   => $r['spare_part_id'],
                'partCode'      => $r['part_code'],
                'partName'      => $r['part_name'],
                'type'          => $r['type'],
                'quantity'      => $r['quantity'],
                'referenceId'   => $r['reference_id'],
                'referenceType' => $r['reference_type'],
                'notes'         => $r['notes'] ?? '',
                'performedBy'   => $r['performed_by_name'] ?? 'System',
                'createdAt'     => $r['created_at'],
            ];
        }, $rows);
    }

    public static function create(array $input): array
    {
        $countRow  = Database::get('SELECT COUNT(*) AS cnt FROM spare_parts');
        $cnt       = (int) ($countRow['cnt'] ?? 0) + 100;
        $finalCode = $input['partCode'] ?? 'PT-' . str_pad($cnt, 4, '0', STR_PAD_LEFT);
        $qty       = !empty($input['stockQty'])    ? (int)   $input['stockQty']    : 0;
        $min       = !empty($input['minThreshold']) ? (int)   $input['minThreshold'] : 5;
        $finalPhoto = $input['image'] ?? $input['photoUrl'] ?? null;
        $supplierId = !empty($input['supplierId']) ? $input['supplierId'] : null;

        Database::run(
            "INSERT INTO spare_parts (part_code, name, category, brand, unit_price, stock_quantity, min_stock, supplier_id, location, photo_url)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                $finalCode,
                trim($input['name'] ?? ''),
                $input['category'] ?? null,
                $input['brand']    ?? null,
                (float) ($input['unitPrice'] ?? 0),
                $qty,
                $min,
                $supplierId,
                $input['location'] ?? 'Shelf A-01',
                $finalPhoto,
            ]
        );

        $inserted = Database::get('SELECT * FROM spare_parts WHERE part_code = ? ORDER BY id DESC LIMIT 1', [$finalCode]);
        $sup      = $inserted['supplier_id']
            ? Database::get('SELECT name FROM suppliers WHERE id = ?', [$inserted['supplier_id']])
            : null;

        return self::format(array_merge($inserted, ['supplier_name' => $sup['name'] ?? '']));
    }

    public static function update(int $id, array $input): ?array
    {
        $qty        = isset($input['stockQty'])    ? (int)   $input['stockQty']    : null;
        $min        = isset($input['minThreshold']) ? (int)   $input['minThreshold'] : null;
        $finalPhoto = $input['image'] ?? $input['photoUrl'] ?? null;
        $unitPrice  = isset($input['unitPrice'])   ? (float) $input['unitPrice']   : null;

        Database::run(
            "UPDATE spare_parts
             SET name           = COALESCE(?, name),
                 category       = COALESCE(?, category),
                 brand          = COALESCE(?, brand),
                 unit_price     = COALESCE(?, unit_price),
                 stock_quantity = COALESCE(?, stock_quantity),
                 min_stock      = COALESCE(?, min_stock),
                 supplier_id    = COALESCE(?, supplier_id),
                 location       = COALESCE(?, location),
                 photo_url      = COALESCE(?, photo_url),
                 updated_at     = NOW()
             WHERE id = ?",
            [
                $input['name']       ?? null,
                $input['category']   ?? null,
                $input['brand']      ?? null,
                $unitPrice,
                $qty,
                $min,
                $input['supplierId'] ?? null,
                $input['location']   ?? null,
                $finalPhoto,
                $id,
            ]
        );

        $updated = Database::get('SELECT * FROM spare_parts WHERE id = ?', [$id]);
        if (!$updated) {
            return null;
        }
        $sup = $updated['supplier_id']
            ? Database::get('SELECT name FROM suppliers WHERE id = ?', [$updated['supplier_id']])
            : null;

        return self::format(array_merge($updated, ['supplier_name' => $sup['name'] ?? '']));
    }

    public static function adjust(int $id, array $input, int $performedBy): ?array
    {
        $part = Database::get('SELECT * FROM spare_parts WHERE id = ?', [$id]);
        if (!$part) {
            return null;
        }

        $qtyChange  = isset($input['quantity']) ? (int) $input['quantity'] : 0;
        $type       = $input['type']  ?? 'Stock In';
        $notes      = $input['notes'] ?? '';
        $currentQty = (int) ($part['stock_quantity'] ?? 0);
        $newQty     = $type === 'Stock In'
            ? $currentQty + $qtyChange
            : max(0, $currentQty - $qtyChange);

        Database::run("UPDATE spare_parts SET stock_quantity = ?, updated_at = NOW() WHERE id = ?", [$newQty, $id]);
        Database::run(
            "INSERT INTO inventory_transactions (spare_part_id, type, quantity, notes, performed_by) VALUES (?, ?, ?, ?, ?)",
            [$id, $type === 'Stock In' ? 'Stock In' : 'Stock Out', $qtyChange, $notes, $performedBy]
        );

        $updated = Database::get('SELECT * FROM spare_parts WHERE id = ?', [$id]);
        $sup     = $updated['supplier_id']
            ? Database::get('SELECT name FROM suppliers WHERE id = ?', [$updated['supplier_id']])
            : null;

        return self::format(array_merge($updated, ['supplier_name' => $sup['name'] ?? '']));
    }

    public static function delete(int $id): bool
    {
        $exists = Database::get('SELECT id FROM spare_parts WHERE id = ?', [$id]);
        if (!$exists) {
            return false;
        }
        Database::run('DELETE FROM spare_parts WHERE id = ?', [$id]);
        return true;
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private static function format(array $r): array
    {
        $qty = (int) ($r['stock_quantity'] ?? 0);
        $min = (int) ($r['min_stock']      ?? 5);
        return [
            'id'           => $r['id'],
            'partCode'     => $r['part_code'],
            'name'         => $r['name'],
            'category'     => $r['category'] ?: 'General',
            'brand'        => $r['brand']    ?? '',
            'unitPrice'    => (float) ($r['unit_price'] ?? 0),
            'stockQty'     => $qty,
            'minThreshold' => $min,
            'supplier'     => $r['supplier_name'] ?? 'Supplier',
            'supplierId'   => $r['supplier_id'],
            'location'     => $r['location']  ?? 'Shelf A-01',
            'image'        => $r['photo_url'] ?? $r['image'] ?? '',
            'status'       => $qty === 0 ? 'Out of Stock' : ($qty <= $min ? 'Low Stock' : 'In Stock'),
        ];
    }
}
