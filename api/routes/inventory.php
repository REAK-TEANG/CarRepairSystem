<?php
// api/routes/inventory.php
require_once __DIR__ . '/../config/db.php';

$authPayload = authenticate(); 
authorizeRoles(['admin', 'manager', 'service_advisor', 'mechanic', 'storekeeper'], $authPayload);

$method = $_SERVER['REQUEST_METHOD'];

// Restrict stock mutations to authorized roles only
if (in_array($method, ['POST', 'PUT', 'DELETE', 'PATCH'])) {
    authorizeRoles(['admin', 'manager', 'storekeeper'], $authPayload);
}
$id = null;
$action = null;

if ($path === '/spare-parts/transactions' && $method === 'GET') {
    $rows = all("
      SELECT it.*, 
             sp.part_code, sp.name AS part_name,
             u.full_name AS performed_by_name
      FROM inventory_transactions it
      JOIN spare_parts sp ON it.spare_part_id = sp.id
      LEFT JOIN users u ON it.performed_by = u.id
      ORDER BY it.id DESC
      LIMIT 100
    ");

    $txs = array_map(function($r) {
        return [
            'id' => $r['id'],
            'sparePartId' => $r['spare_part_id'],
            'partCode' => $r['part_code'],
            'partName' => $r['part_name'],
            'type' => $r['type'],
            'quantity' => $r['quantity'],
            'referenceId' => $r['reference_id'],
            'referenceType' => $r['reference_type'],
            'notes' => $r['notes'] ?? '',
            'performedBy' => $r['performed_by_name'] ?? 'System',
            'createdAt' => $r['created_at']
        ];
    }, $rows);
    echo json_encode(['data' => $txs]);
    exit;
}

if (preg_match('#^/spare-parts/(\d+)/adjust$#', $path, $matches)) {
    $id = $matches[1];
    $action = 'adjust';
} else if (preg_match('#^/spare-parts/(\d+)$#', $path, $matches)) {
    $id = $matches[1];
}

if ($method === 'GET' && !$id) {
    $rows = all("
      SELECT sp.*, s.name AS supplier_name
      FROM spare_parts sp
      LEFT JOIN suppliers s ON sp.supplier_id = s.id
      ORDER BY sp.id DESC
    ");

    $items = array_map(function($r) {
        $qty = (int)($r['stock_quantity'] ?? 0);
        $min = (int)($r['min_stock'] ?? 5);
        $status = $qty === 0 ? 'Out of Stock' : ($qty <= $min ? 'Low Stock' : 'In Stock');

        return [
            'id' => $r['id'],
            'partCode' => $r['part_code'],
            'name' => $r['name'],
            'category' => $r['category'] ?: 'General',
            'brand' => $r['brand'] ?? '',
            'unitPrice' => (float)($r['unit_price'] ?? 0),
            'stockQty' => $qty,
            'minThreshold' => $min,
            'supplier' => $r['supplier_name'] ?? 'Supplier',
            'supplierId' => $r['supplier_id'],
            'location' => $r['location'] ?? 'Shelf A-01',
            'image' => $r['photo_url'] ?? $r['image'] ?? '',
            'status' => $status
        ];
    }, $rows);

    echo json_encode(['data' => $items]);
    exit;

} else if ($method === 'POST' && !$id) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $name = $input['name'] ?? '';
    if (!trim($name)) {
        http_response_code(400);
        echo json_encode(['error' => 'Part name is required']);
        exit;
    }

    $countRow = get('SELECT COUNT(*) AS cnt FROM spare_parts');
    $cnt = (int)($countRow['cnt'] ?? 0) + 100;
    $finalCode = $input['partCode'] ?? 'PT-' . str_pad($cnt, 4, '0', STR_PAD_LEFT);
    $qty = !empty($input['stockQty']) ? (int)$input['stockQty'] : 0;
    $min = !empty($input['minThreshold']) ? (int)$input['minThreshold'] : 5;
    $finalPhoto = $input['image'] ?? $input['photoUrl'] ?? null;
    $supplierId = !empty($input['supplierId']) ? $input['supplierId'] : null;

    try {
        run(
            "INSERT INTO spare_parts (part_code, name, category, brand, unit_price, stock_quantity, min_stock, supplier_id, location, photo_url)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                $finalCode,
                trim($name),
                $input['category'] ?? null,
                $input['brand'] ?? null,
                (float)($input['unitPrice'] ?? 0),
                $qty,
                $min,
                $supplierId,
                $input['location'] ?? 'Shelf A-01',
                $finalPhoto
            ]
        );
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'photo_url') !== false) {
            run("ALTER TABLE spare_parts ADD COLUMN IF NOT EXISTS photo_url TEXT;");
            run(
                "INSERT INTO spare_parts (part_code, name, category, brand, unit_price, stock_quantity, min_stock, supplier_id, location, photo_url)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [
                    $finalCode, trim($name), $input['category'] ?? null, $input['brand'] ?? null,
                    (float)($input['unitPrice'] ?? 0), $qty, $min, $supplierId, $input['location'] ?? 'Shelf A-01', $finalPhoto
                ]
            );
        } else {
            throw $e;
        }
    }

    global $pdo;
    $insertedId = $pdo->lastInsertId();
    if (!$insertedId) {
        $lastRow = get("SELECT * FROM spare_parts WHERE part_code = ? ORDER BY id DESC LIMIT 1", [$finalCode]);
        $inserted = $lastRow;
    } else {
        $inserted = get('SELECT * FROM spare_parts WHERE id = ?', [$insertedId]);
    }

    $sup = $inserted['supplier_id'] ? get('SELECT name FROM suppliers WHERE id = ?', [$inserted['supplier_id']]) : null;

    http_response_code(201);
    echo json_encode(['data' => [
        'id' => $inserted['id'],
        'partCode' => $finalCode,
        'name' => $inserted['name'],
        'category' => $inserted['category'] ?: 'General',
        'brand' => $inserted['brand'] ?? '',
        'unitPrice' => $inserted['unit_price'],
        'stockQty' => $inserted['stock_quantity'],
        'minThreshold' => $inserted['min_stock'],
        'supplier' => $sup ? $sup['name'] : '',
        'supplierId' => $inserted['supplier_id'],
        'location' => $inserted['location'],
        'image' => $inserted['photo_url'] ?? '',
        'status' => $qty === 0 ? 'Out of Stock' : ($qty <= $min ? 'Low Stock' : 'In Stock')
    ]]);
    exit;

} else if ($method === 'PUT' && $id) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $qty = isset($input['stockQty']) ? (int)$input['stockQty'] : null;
    $min = isset($input['minThreshold']) ? (int)$input['minThreshold'] : null;
    $finalPhoto = $input['image'] ?? $input['photoUrl'] ?? null;
    $unitPrice = isset($input['unitPrice']) ? (float)$input['unitPrice'] : null;
    
    try {
        run(
            "UPDATE spare_parts
             SET name = COALESCE(?, name),
                 category = COALESCE(?, category),
                 brand = COALESCE(?, brand),
                 unit_price = COALESCE(?, unit_price),
                 stock_quantity = COALESCE(?, stock_quantity),
                 min_stock = COALESCE(?, min_stock),
                 supplier_id = COALESCE(?, supplier_id),
                 location = COALESCE(?, location),
                 photo_url = COALESCE(?, photo_url),
                 updated_at = NOW()
             WHERE id = ?",
            [
                $input['name'] ?? null,
                $input['category'] ?? null,
                $input['brand'] ?? null,
                $unitPrice,
                $qty,
                $min,
                $input['supplierId'] ?? null,
                $input['location'] ?? null,
                $finalPhoto,
                $id
            ]
        );
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'photo_url') !== false) {
            run("ALTER TABLE spare_parts ADD COLUMN IF NOT EXISTS photo_url TEXT;");
            run(
                "UPDATE spare_parts
                 SET name = COALESCE(?, name),
                     category = COALESCE(?, category),
                     brand = COALESCE(?, brand),
                     unit_price = COALESCE(?, unit_price),
                     stock_quantity = COALESCE(?, stock_quantity),
                     min_stock = COALESCE(?, min_stock),
                     supplier_id = COALESCE(?, supplier_id),
                     location = COALESCE(?, location),
                     photo_url = COALESCE(?, photo_url),
                     updated_at = NOW()
                 WHERE id = ?",
                [
                    $input['name'] ?? null, $input['category'] ?? null, $input['brand'] ?? null,
                    $unitPrice, $qty, $min, $input['supplierId'] ?? null, $input['location'] ?? null, $finalPhoto, $id
                ]
            );
        } else {
            throw $e;
        }
    }

    $updated = get('SELECT * FROM spare_parts WHERE id = ?', [$id]);
    if (!$updated) {
        http_response_code(404);
        echo json_encode(['error' => 'Spare part not found']);
        exit;
    }

    $sup = $updated['supplier_id'] ? get('SELECT name FROM suppliers WHERE id = ?', [$updated['supplier_id']]) : null;
    $q = (int)$updated['stock_quantity'];
    $m = (int)$updated['min_stock'];

    echo json_encode(['data' => [
        'id' => $updated['id'],
        'partCode' => $updated['part_code'],
        'name' => $updated['name'],
        'category' => $updated['category'],
        'brand' => $updated['brand'],
        'unitPrice' => $updated['unit_price'],
        'stockQty' => $q,
        'minThreshold' => $m,
        'supplier' => $sup ? $sup['name'] : '',
        'supplierId' => $updated['supplier_id'],
        'location' => $updated['location'],
        'image' => $updated['photo_url'] ?? '',
        'status' => $q === 0 ? 'Out of Stock' : ($q <= $m ? 'Low Stock' : 'In Stock')
    ]]);
    exit;

} else if ($method === 'POST' && $id && $action === 'adjust') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $part = get('SELECT * FROM spare_parts WHERE id = ?', [$id]);
    if (!$part) {
        http_response_code(404);
        echo json_encode(['error' => 'Part not found']);
        exit;
    }

    $qtyChange = isset($input['quantity']) ? (int)$input['quantity'] : 0;
    $type = $input['type'] ?? 'Stock In';
    $notes = $input['notes'] ?? '';
    
    $currentQty = (int)($part['stock_quantity'] ?? 0);
    $newQty = $type === 'Stock In' ? $currentQty + $qtyChange : max(0, $currentQty - $qtyChange);

    run("UPDATE spare_parts SET stock_quantity = ?, updated_at = NOW() WHERE id = ?", [$newQty, $id]);
    
    $userId = $authPayload['id'] ?? null;
    $txType = $type === 'Stock In' ? 'Stock In' : 'Stock Out';
    
    run(
        "INSERT INTO inventory_transactions (spare_part_id, type, quantity, notes, performed_by) VALUES (?, ?, ?, ?, ?)",
        [$id, $txType, $qtyChange, $notes, $userId]
    );

    $updated = get('SELECT * FROM spare_parts WHERE id = ?', [$id]);
    $sup = $updated['supplier_id'] ? get('SELECT name FROM suppliers WHERE id = ?', [$updated['supplier_id']]) : null;
    
    echo json_encode(['data' => [
        'id' => $updated['id'],
        'partCode' => $updated['part_code'],
        'name' => $updated['name'],
        'category' => $updated['category'],
        'brand' => $updated['brand'],
        'unitPrice' => $updated['unit_price'],
        'stockQty' => $newQty,
        'minThreshold' => $updated['min_stock'],
        'supplier' => $sup ? $sup['name'] : '',
        'location' => $updated['location'],
        'status' => $newQty === 0 ? 'Out of Stock' : ($newQty <= $updated['min_stock'] ? 'Low Stock' : 'In Stock')
    ]]);
    exit;

} else if ($method === 'DELETE' && $id) {
    $exists = get('SELECT id FROM spare_parts WHERE id = ?', [$id]);
    if (!$exists) {
        http_response_code(404);
        echo json_encode(['error' => 'Spare part not found']);
        exit;
    }

    run('DELETE FROM spare_parts WHERE id = ?', [$id]);
    echo json_encode(['success' => true, 'message' => 'Spare part removed successfully']);
    exit;
}

http_response_code(404);
echo json_encode(['error' => 'Inventory endpoint not found']);
