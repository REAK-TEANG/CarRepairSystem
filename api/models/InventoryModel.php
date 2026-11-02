<?php
// api/models/InventoryModel.php

class InventoryModel
{
    public static function getAll(): array
    {
        // Exclude heavy photo_url from dropdown/catalog queries to ensure lightweight, fast responses
        $rows = Database::all("
          SELECT sp.id, sp.part_code, sp.name, sp.category, sp.brand, sp.unit_price, 
                 sp.stock_quantity, sp.min_stock, sp.supplier_id, sp.location,
                 s.name AS supplier_name
          FROM spare_parts sp
          LEFT JOIN suppliers s ON sp.supplier_id = s.id
          ORDER BY sp.id DESC
        ");

        return array_map([self::class, 'format'], $rows);
    }

    public static function getPaginated(string $search = '', int $page = 1, int $limit = 10, ?string $category = null): array
    {
        $countSql = "
          SELECT COUNT(*) AS cnt
          FROM spare_parts sp
          LEFT JOIN suppliers s ON sp.supplier_id = s.id
          WHERE 1=1
        ";
        $countParams = [];
        if ($search) {
            $countSql .= " AND (sp.part_code ILIKE ? OR sp.name ILIKE ? OR sp.brand ILIKE ? OR sp.category ILIKE ? OR s.name ILIKE ?)";
            $countParams = array_merge($countParams, ["%$search%", "%$search%", "%$search%", "%$search%", "%$search%"]);
        }
        if ($category && $category !== 'All') {
            $countSql .= " AND sp.category = ?";
            $countParams[] = $category;
        }

        $countRow = Database::get($countSql, $countParams);
        $total = (int) ($countRow['cnt'] ?? 0);

        $offset = max(0, ($page - 1) * $limit);
        $sql = "
          SELECT sp.*, s.name AS supplier_name
          FROM spare_parts sp
          LEFT JOIN suppliers s ON sp.supplier_id = s.id
          WHERE 1=1
        ";
        $params = [];
        if ($search) {
            $sql .= " AND (sp.part_code ILIKE ? OR sp.name ILIKE ? OR sp.brand ILIKE ? OR sp.category ILIKE ? OR s.name ILIKE ?)";
            $params = array_merge($params, ["%$search%", "%$search%", "%$search%", "%$search%", "%$search%"]);
        }
        if ($category && $category !== 'All') {
            $sql .= " AND sp.category = ?";
            $params[] = $category;
        }
        $sql .= " ORDER BY sp.id DESC LIMIT $limit OFFSET $offset";

        $rows = Database::all($sql, $params);
        return [
            'data' => array_map([self::class, 'format'], $rows),
            'total' => $total,
        ];
    }

    public static function findById(int $id): ?array
    {
        $r = Database::get("
          SELECT sp.*, s.name AS supplier_name
          FROM spare_parts sp
          LEFT JOIN suppliers s ON sp.supplier_id = s.id
          WHERE sp.id = ?
        ", [$id]);

        return $r ? self::format($r) : null;
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
        $requestedCode = trim($input['partCode'] ?? '');
        if (!$requestedCode) {
            $countRow  = Database::get('SELECT COUNT(*) AS cnt FROM spare_parts');
            $cnt       = (int) ($countRow['cnt'] ?? 0) + 100;
            $finalCode = 'PT-' . str_pad($cnt, 4, '0', STR_PAD_LEFT);
        } else {
            $finalCode = $requestedCode;
        }

        // Guarantee uniqueness to avoid duplicate key exceptions
        $check = Database::get('SELECT id FROM spare_parts WHERE part_code = ?', [$finalCode]);
        if ($check) {
            $baseCode = preg_replace('/-\d+$/', '', $finalCode);
            $suffix = 1;
            do {
                $candidate = sprintf('%s-%03d', $baseCode, $suffix++);
                $exists = Database::get('SELECT id FROM spare_parts WHERE part_code = ?', [$candidate]);
            } while ($exists);
            $finalCode = $candidate;
        }

        $qty        = !empty($input['stockQty']) ? (int) $input['stockQty'] : (!empty($input['stock_quantity']) ? (int) $input['stock_quantity'] : 0);
        $min        = !empty($input['minThreshold']) ? (int) $input['minThreshold'] : (!empty($input['min_stock']) ? (int) $input['min_stock'] : 5);
        $finalPhoto = $input['image'] ?? $input['photoUrl'] ?? $input['photo_url'] ?? null;
        $supplierId = (!empty($input['supplierId']) && (int) $input['supplierId'] > 0)
            ? (int) $input['supplierId']
            : ((!empty($input['supplier_id']) && (int) $input['supplier_id'] > 0) ? (int) $input['supplier_id'] : null);
        $unitPrice  = isset($input['unitPrice']) && $input['unitPrice'] !== '' ? (float) $input['unitPrice'] : (isset($input['unit_price']) && $input['unit_price'] !== '' ? (float) $input['unit_price'] : 0.0);

        Database::run(
            "INSERT INTO spare_parts (part_code, name, category, brand, unit_price, stock_quantity, min_stock, supplier_id, location, photo_url)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                $finalCode,
                trim($input['name'] ?? ''),
                $input['category'] ?? null,
                $input['brand']    ?? null,
                $unitPrice,
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

        EventBus::publish('inventory', 'created', [
            'id' => $inserted['id'],
            'partCode' => $finalCode,
            'name' => $inserted['name'],
            'stockQuantity' => (int)$inserted['stock_quantity'],
        ]);

        return self::format(array_merge($inserted, ['supplier_name' => $sup['name'] ?? '']));
    }

    public static function update(int $id, array $input): ?array
    {
        $part = Database::get('SELECT * FROM spare_parts WHERE id = ?', [$id]);
        if (!$part) {
            return null;
        }

        $fields = [];
        $params = [];

        if (array_key_exists('name', $input)) {
            $fields[] = 'name = ?';
            $params[] = trim($input['name'] ?? '');
        }
        if (array_key_exists('category', $input)) {
            $fields[] = 'category = ?';
            $params[] = $input['category'] ?: null;
        }
        if (array_key_exists('brand', $input)) {
            $fields[] = 'brand = ?';
            $params[] = $input['brand'] ?: null;
        }
        if (array_key_exists('unitPrice', $input) || array_key_exists('unit_price', $input)) {
            $val = $input['unitPrice'] ?? $input['unit_price'];
            $fields[] = 'unit_price = ?';
            $params[] = ($val !== null && $val !== '') ? (float) $val : 0.0;
        }
        if (array_key_exists('stockQty', $input) || array_key_exists('stock_quantity', $input)) {
            $val = $input['stockQty'] ?? $input['stock_quantity'];
            $fields[] = 'stock_quantity = ?';
            $params[] = ($val !== null && $val !== '') ? (int) $val : 0;
        }
        if (array_key_exists('minThreshold', $input) || array_key_exists('min_stock', $input)) {
            $val = $input['minThreshold'] ?? $input['min_stock'];
            $fields[] = 'min_stock = ?';
            $params[] = ($val !== null && $val !== '') ? (int) $val : 5;
        }
        if (array_key_exists('supplierId', $input) || array_key_exists('supplier_id', $input)) {
            $supVal = $input['supplierId'] ?? $input['supplier_id'];
            $fields[] = 'supplier_id = ?';
            $params[] = (!empty($supVal) && (int) $supVal > 0) ? (int) $supVal : null;
        }
        if (array_key_exists('location', $input)) {
            $fields[] = 'location = ?';
            $params[] = $input['location'] ?: 'Shelf A-01';
        }
        if (array_key_exists('image', $input) || array_key_exists('photoUrl', $input) || array_key_exists('photo_url', $input)) {
            $photo = $input['image'] ?? $input['photoUrl'] ?? $input['photo_url'] ?? null;
            $fields[] = 'photo_url = ?';
            $params[] = $photo ?: null;
        }
        if (array_key_exists('isActive', $input) || array_key_exists('is_active', $input)) {
            $activeVal = $input['isActive'] ?? $input['is_active'];
            $fields[] = 'is_active = ?';
            $params[] = filter_var($activeVal, FILTER_VALIDATE_BOOLEAN) ? 'true' : 'false';
        }

        if (!empty($fields)) {
            $fields[] = 'updated_at = NOW()';
            $params[] = $id;
            $sql = 'UPDATE spare_parts SET ' . implode(', ', $fields) . ' WHERE id = ?';
            Database::run($sql, $params);
        }

        $updated = Database::get('SELECT * FROM spare_parts WHERE id = ?', [$id]);
        if (!$updated) {
            return null;
        }
        $sup = $updated['supplier_id']
            ? Database::get('SELECT name FROM suppliers WHERE id = ?', [$updated['supplier_id']])
            : null;

        EventBus::publish('inventory', 'updated', [
            'id' => $id,
            'partCode' => $updated['part_code'],
            'stockQuantity' => (int)$updated['stock_quantity'],
        ]);

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

        EventBus::publish('inventory', 'stock_adjusted', [
            'id' => $id,
            'partCode' => $updated['part_code'],
            'newQuantity' => $newQty,
            'change' => $qtyChange,
            'type' => $type,
        ]);

        return self::format(array_merge($updated, ['supplier_name' => $sup['name'] ?? '']));
    }

    public static function delete(int $id): bool
    {
        $exists = Database::get('SELECT id, part_code FROM spare_parts WHERE id = ?', [$id]);
        if (!$exists) {
            return false;
        }
        Database::run('DELETE FROM spare_parts WHERE id = ?', [$id]);
        EventBus::publish('inventory', 'deleted', ['id' => $id, 'partCode' => $exists['part_code']]);
        return true;
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private static function format(array $r): array
    {
        $qty   = (int) ($r['stock_quantity'] ?? 0);
        $min   = (int) ($r['min_stock']      ?? 5);
        $price = (float) ($r['unit_price']   ?? 0);
        $code  = $r['part_code'] ?? '';

        return [
            'id'           => $r['id'],
            'partCode'     => $code,
            'code'         => $code,
            'sku'          => $code,
            'name'         => $r['name'],
            'category'     => $r['category'] ?: 'General',
            'brand'        => $r['brand']    ?? '',
            'unitPrice'    => $price,
            'price'        => $price,
            'stockQty'     => $qty,
            'quantity'     => $qty,
            'stock'        => $qty,
            'minThreshold' => $min,
            'supplier'     => $r['supplier_name'] ?? 'Supplier',
            'supplierId'   => $r['supplier_id'],
            'location'     => $r['location']  ?? 'Shelf A-01',
            'image'        => $r['photo_url'] ?? $r['image'] ?? '',
            'status'       => $qty === 0 ? 'Out of Stock' : ($qty <= $min ? 'Low Stock' : 'In Stock'),
        ];
    }
}
