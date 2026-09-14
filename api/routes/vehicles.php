<?php
// api/routes/vehicles.php
require_once __DIR__ . '/../config/db.php';

$authPayload = authenticate(); // Validates JWT

$method = $_SERVER['REQUEST_METHOD'];
$id = $segments[2] ?? null; 
if ($path === '/vehicles') {
    $id = null;
} else if (preg_match('#^/vehicles/(\d+)$#', $path, $matches)) {
    $id = $matches[1];
}

function resolveCustomerId($ownerId) {
    $custId = (int)$ownerId;
    if (!$custId) {
        $firstCust = get('SELECT id FROM customers ORDER BY id ASC LIMIT 1');
        return $firstCust ? $firstCust['id'] : 1;
    }
    $exists = get('SELECT id FROM customers WHERE id = ?', [$custId]);
    if (!$exists) {
        $firstCust = get('SELECT id FROM customers ORDER BY id ASC LIMIT 1');
        return $firstCust ? $firstCust['id'] : $custId;
    }
    return $custId;
}

if ($method === 'GET' && !$id) {
    $rows = all("
      SELECT v.*, c.full_name AS customer_name
      FROM vehicles v
      LEFT JOIN customers c ON v.customer_id = c.id
      ORDER BY v.id DESC
    ");

    $vehicles = array_map(function($r) {
        return [
            'id' => $r['id'],
            'number' => $r['vehicle_number'],
            'vin' => $r['vin'] ?? '',
            'brand' => $r['brand'] ?? '',
            'model' => $r['model'] ?? '',
            'year' => (int)($r['year'] ?? 2022),
            'color' => $r['color'] ?? '',
            'fuelType' => $r['fuel_type'] ?? 'Gasoline',
            'mileage' => (int)($r['mileage'] ?? 0),
            'image' => $r['photo_url'] ?? $r['image'] ?? '',
            'owner' => $r['customer_name'] ?? 'Owner',
            'ownerId' => $r['customer_id'],
            'notes' => $r['notes'] ?? ''
        ];
    }, $rows);

    echo json_encode(['data' => $vehicles]);
    exit;

} else if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $number = $input['number'] ?? '';
    if (!trim($number)) {
        http_response_code(400);
        echo json_encode(['error' => 'Vehicle license plate number is required']);
        exit;
    }

    $targetCustomerId = resolveCustomerId($input['ownerId'] ?? null);
    $validFuels = ['Gasoline', 'Diesel', 'Electric', 'Hybrid', 'LPG'];
    $fuelType = trim($input['fuelType'] ?? '');
    
    $normalizedFuel = 'Gasoline';
    foreach ($validFuels as $f) {
        if (strtolower($f) === strtolower($fuelType)) {
            $normalizedFuel = $f;
            break;
        }
    }

    $photoUrl = $input['image'] ?? $input['photoUrl'] ?? null;
    
    try {
        run(
            "INSERT INTO vehicles (customer_id, vehicle_number, vin, brand, model, year, color, fuel_type, mileage, photo_url, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                $targetCustomerId,
                trim($number),
                $input['vin'] ?? null,
                $input['brand'] ?? null,
                $input['model'] ?? null,
                !empty($input['year']) ? (int)$input['year'] : null,
                $input['color'] ?? null,
                $normalizedFuel,
                !empty($input['mileage']) ? (int)$input['mileage'] : 0,
                $photoUrl,
                $input['notes'] ?? null
            ]
        );
    } catch (PDOException $e) {
        // Simple auto-migrate for photo_url just in case
        if (strpos($e->getMessage(), 'photo_url') !== false) {
            run("ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS photo_url TEXT;");
            run(
                "INSERT INTO vehicles (customer_id, vehicle_number, vin, brand, model, year, color, fuel_type, mileage, photo_url, notes)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [
                    $targetCustomerId,
                    trim($number),
                    $input['vin'] ?? null,
                    $input['brand'] ?? null,
                    $input['model'] ?? null,
                    !empty($input['year']) ? (int)$input['year'] : null,
                    $input['color'] ?? null,
                    $normalizedFuel,
                    !empty($input['mileage']) ? (int)$input['mileage'] : 0,
                    $photoUrl,
                    $input['notes'] ?? null
                ]
            );
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Database error', 'message' => $e->getMessage()]);
            exit;
        }
    }

    global $pdo;
    $insertedId = $pdo->lastInsertId();
    if (!$insertedId) {
        // Fallback if lastInsertId fails (postgres sequence issue)
        $lastRow = get("SELECT * FROM vehicles WHERE vehicle_number = ? ORDER BY id DESC LIMIT 1", [trim($number)]);
        $inserted = $lastRow;
    } else {
        $inserted = get('SELECT * FROM vehicles WHERE id = ?', [$insertedId]);
    }

    $customer = get('SELECT full_name FROM customers WHERE id = ?', [$inserted['customer_id']]);

    http_response_code(201);
    echo json_encode(['data' => [
        'id' => $inserted['id'],
        'number' => $inserted['vehicle_number'],
        'vin' => $inserted['vin'] ?? '',
        'brand' => $inserted['brand'] ?? '',
        'model' => $inserted['model'] ?? '',
        'year' => $inserted['year'],
        'color' => $inserted['color'] ?? '',
        'fuelType' => $inserted['fuel_type'],
        'mileage' => $inserted['mileage'],
        'image' => $inserted['photo_url'] ?? '',
        'owner' => $customer ? $customer['full_name'] : '',
        'ownerId' => $inserted['customer_id']
    ]]);
    exit;

} else if ($method === 'PUT' && $id) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $targetCustomerId = !empty($input['ownerId']) ? resolveCustomerId($input['ownerId']) : null;
    
    $normalizedFuel = null;
    if (!empty($input['fuelType'])) {
        $validFuels = ['Gasoline', 'Diesel', 'Electric', 'Hybrid', 'LPG'];
        foreach ($validFuels as $f) {
            if (strtolower($f) === strtolower(trim($input['fuelType']))) {
                $normalizedFuel = $f;
                break;
            }
        }
        if (!$normalizedFuel) $normalizedFuel = 'Gasoline';
    }

    $photoUrl = $input['image'] ?? $input['photoUrl'] ?? null;

    run(
        "UPDATE vehicles
         SET vehicle_number = COALESCE(?, vehicle_number),
             vin = COALESCE(?, vin),
             brand = COALESCE(?, brand),
             model = COALESCE(?, model),
             year = COALESCE(?, year),
             color = COALESCE(?, color),
             fuel_type = COALESCE(?, fuel_type),
             mileage = COALESCE(?, mileage),
             customer_id = COALESCE(?, customer_id),
             photo_url = COALESCE(?, photo_url),
             notes = COALESCE(?, notes),
             updated_at = NOW()
         WHERE id = ?",
        [
            $input['number'] ?? null,
            $input['vin'] ?? null,
            $input['brand'] ?? null,
            $input['model'] ?? null,
            !empty($input['year']) ? (int)$input['year'] : null,
            $input['color'] ?? null,
            $normalizedFuel,
            !empty($input['mileage']) ? (int)$input['mileage'] : null,
            $targetCustomerId,
            $photoUrl,
            $input['notes'] ?? null,
            $id
        ]
    );

    $updated = get('SELECT * FROM vehicles WHERE id = ?', [$id]);
    if (!$updated) {
        http_response_code(404);
        echo json_encode(['error' => 'Vehicle not found']);
        exit;
    }

    $customer = get('SELECT full_name FROM customers WHERE id = ?', [$updated['customer_id']]);

    echo json_encode(['data' => [
        'id' => $updated['id'],
        'number' => $updated['vehicle_number'],
        'vin' => $updated['vin'] ?? '',
        'brand' => $updated['brand'] ?? '',
        'model' => $updated['model'] ?? '',
        'year' => $updated['year'],
        'color' => $updated['color'] ?? '',
        'fuelType' => $updated['fuel_type'],
        'mileage' => $updated['mileage'],
        'image' => $updated['photo_url'] ?? '',
        'owner' => $customer ? $customer['full_name'] : '',
        'ownerId' => $updated['customer_id']
    ]]);
    exit;

} else if ($method === 'DELETE' && $id) {
    $exists = get('SELECT id FROM vehicles WHERE id = ?', [$id]);
    if (!$exists) {
        http_response_code(404);
        echo json_encode(['error' => 'Vehicle not found']);
        exit;
    }

    run('DELETE FROM vehicles WHERE id = ?', [$id]);
    echo json_encode(['success' => true, 'message' => 'Vehicle removed successfully']);
    exit;
}

http_response_code(404);
echo json_encode(['error' => 'Vehicle endpoint not found']);
