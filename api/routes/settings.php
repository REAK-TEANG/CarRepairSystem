<?php
// api/routes/settings.php
require_once __DIR__ . '/../config/db.php';

$authPayload = authenticate(); 

$method = $_SERVER['REQUEST_METHOD'];

$DEFAULT_PERMISSIONS_MATRIX = [
    'dashboard' => ['admin' => ['read'], 'manager' => ['read'], 'mechanic' => ['read'], 'service_advisor' => ['read']],
    'customers' => ['admin' => ['create', 'read', 'update', 'delete', 'export'], 'manager' => ['create', 'read', 'update', 'export'], 'mechanic' => ['read'], 'service_advisor' => ['create', 'read', 'update']],
    'vehicles' => ['admin' => ['create', 'read', 'update', 'delete', 'export'], 'manager' => ['create', 'read', 'update', 'export'], 'mechanic' => ['read', 'update'], 'service_advisor' => ['create', 'read', 'update']],
    'appointments' => ['admin' => ['create', 'read', 'update', 'delete', 'export'], 'manager' => ['create', 'read', 'update', 'export'], 'mechanic' => ['read'], 'service_advisor' => ['create', 'read', 'update']],
    'repair_jobs' => ['admin' => ['create', 'read', 'update', 'delete', 'export'], 'manager' => ['create', 'read', 'update', 'export'], 'mechanic' => ['read', 'update'], 'service_advisor' => ['create', 'read', 'update']],
    'invoices' => ['admin' => ['create', 'read', 'update', 'delete', 'export'], 'manager' => ['create', 'read', 'update', 'export'], 'mechanic' => [], 'service_advisor' => ['create', 'read', 'update']],
    'inventory' => ['admin' => ['create', 'read', 'update', 'delete', 'export'], 'manager' => ['create', 'read', 'update', 'export'], 'mechanic' => ['read'], 'service_advisor' => ['read']],
    'suppliers' => ['admin' => ['create', 'read', 'update', 'delete', 'export'], 'manager' => ['create', 'read', 'update', 'export'], 'mechanic' => [], 'service_advisor' => []],
    'employees' => ['admin' => ['create', 'read', 'update', 'delete', 'export'], 'manager' => ['read'], 'mechanic' => [], 'service_advisor' => []],
    'mechanics' => ['admin' => ['create', 'read', 'update', 'delete', 'export'], 'manager' => ['create', 'read', 'update', 'export'], 'mechanic' => [], 'service_advisor' => []],
    'services' => ['admin' => ['create', 'read', 'update', 'delete', 'export'], 'manager' => ['create', 'read', 'update', 'export'], 'mechanic' => ['read'], 'service_advisor' => ['read']],
    'reports' => ['admin' => ['create', 'read', 'update', 'delete', 'export'], 'manager' => ['read', 'export'], 'mechanic' => [], 'service_advisor' => []],
    'settings' => ['admin' => ['create', 'read', 'update', 'delete', 'export'], 'manager' => [], 'mechanic' => [], 'service_advisor' => []]
];

if ($path === '/settings/permissions') {
    if ($method === 'GET') {
        $row = get("SELECT setting_value FROM settings WHERE setting_key = 'roles_permissions_matrix'");
        if ($row && $row['setting_value']) {
            $matrix = json_decode($row['setting_value'], true);
            if ($matrix) {
                echo json_encode(['data' => $matrix]);
                exit;
            }
        }
        echo json_encode(['data' => $DEFAULT_PERMISSIONS_MATRIX]);
        exit;
    } else if ($method === 'PUT') {
        // Strict admin check
        if (($authPayload['role'] ?? '') !== 'admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden']);
            exit;
        }

        $rawMatrix = json_decode(file_get_contents('php://input'), true);
        if (!is_array($rawMatrix)) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid permissions matrix payload']);
            exit;
        }

        $matrix = array_merge($DEFAULT_PERMISSIONS_MATRIX, $rawMatrix);
        foreach (array_keys($matrix) as $mod) {
            if (!isset($matrix[$mod]) || !is_array($matrix[$mod])) $matrix[$mod] = [];
            $matrix[$mod]['admin'] = ['create', 'read', 'update', 'delete', 'export'];
        }

        run(
            "INSERT INTO settings (setting_key, setting_value, updated_at)
             VALUES (?, ?, NOW())
             ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = NOW()",
            ['roles_permissions_matrix', json_encode($matrix)]
        );

        echo json_encode(['success' => true, 'message' => 'Role permissions matrix updated successfully', 'data' => $matrix]);
        exit;
    }
} else if ($path === '/settings' || $path === '/settings/') {
    if ($method === 'GET') {
        $rows = all('SELECT * FROM settings');

        $settingsObj = [
            'shopName' => 'ProTech Auto Repair Workshop',
            'taxRate' => 7.5,
            'currency' => 'USD ($)',
            'businessHours' => 'Mon - Sat: 08:00 AM - 06:00 PM',
            'contactPhone' => '+1 (555) 019-4820',
            'contactEmail' => 'service@protech-autorepair.com',
            'address' => '4582 Industrial Parkway, Suite 100, Motor City, MI',
            'autoBackupDaily' => true,
            'permissionsMatrix' => $DEFAULT_PERMISSIONS_MATRIX
        ];

        foreach ($rows as $r) {
            $k = $r['setting_key'];
            $v = $r['setting_value'];
            if ($k === 'shop_name' || $k === 'workshop_name') $settingsObj['shopName'] = $v;
            if ($k === 'tax_rate') $settingsObj['taxRate'] = (float)$v;
            if ($k === 'currency') $settingsObj['currency'] = $v;
            if ($k === 'business_hours') $settingsObj['businessHours'] = $v;
            if ($k === 'contact_phone' || $k === 'workshop_phone') $settingsObj['contactPhone'] = $v;
            if ($k === 'contact_email' || $k === 'workshop_email') $settingsObj['contactEmail'] = $v;
            if ($k === 'address' || $k === 'workshop_address') $settingsObj['address'] = $v;
            if ($k === 'roles_permissions_matrix') {
                $decoded = json_decode($v, true);
                if ($decoded) $settingsObj['permissionsMatrix'] = $decoded;
            }
        }

        echo json_encode(['data' => $settingsObj]);
        exit;

    } else if ($method === 'PUT') {
        if (($authPayload['role'] ?? '') !== 'admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden: Only administrators can update shop settings']);
            exit;
        }

        $input = json_decode(file_get_contents('php://input'), true);

        $updates = [];
        if (isset($input['shopName'])) $updates['shop_name'] = $input['shopName'];
        if (isset($input['taxRate'])) $updates['tax_rate'] = (string)$input['taxRate'];
        if (isset($input['currency'])) $updates['currency'] = $input['currency'];
        if (isset($input['businessHours'])) $updates['business_hours'] = $input['businessHours'];
        if (isset($input['contactPhone'])) $updates['contact_phone'] = $input['contactPhone'];
        if (isset($input['contactEmail'])) $updates['contact_email'] = $input['contactEmail'];
        if (isset($input['address'])) $updates['address'] = $input['address'];
        if (isset($input['permissionsMatrix'])) $updates['roles_permissions_matrix'] = json_encode($input['permissionsMatrix']);

        foreach ($updates as $k => $v) {
            run(
                "INSERT INTO settings (setting_key, setting_value, updated_at)
                 VALUES (?, ?, NOW())
                 ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = NOW()",
                [$k, $v]
            );
        }

        echo json_encode(['success' => true, 'message' => 'Settings saved successfully']);
        exit;
    }
}

http_response_code(404);
echo json_encode(['error' => 'Settings endpoint not found']);
