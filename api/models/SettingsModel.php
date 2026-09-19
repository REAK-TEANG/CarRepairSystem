<?php
// api/models/SettingsModel.php

class SettingsModel
{
    public const DEFAULT_PERMISSIONS_MATRIX = [
        'dashboard'   => ['admin' => ['read'], 'manager' => ['read'], 'mechanic' => ['read'], 'service_advisor' => ['read']],
        'customers'   => ['admin' => ['create','read','update','delete','export'], 'manager' => ['create','read','update','export'], 'mechanic' => ['read'], 'service_advisor' => ['create','read','update']],
        'vehicles'    => ['admin' => ['create','read','update','delete','export'], 'manager' => ['create','read','update','export'], 'mechanic' => ['read','update'], 'service_advisor' => ['create','read','update']],
        'appointments'=> ['admin' => ['create','read','update','delete','export'], 'manager' => ['create','read','update','export'], 'mechanic' => ['read'], 'service_advisor' => ['create','read','update']],
        'repair_jobs' => ['admin' => ['create','read','update','delete','export'], 'manager' => ['create','read','update','export'], 'mechanic' => ['read','update'], 'service_advisor' => ['create','read','update']],
        'invoices'    => ['admin' => ['create','read','update','delete','export'], 'manager' => ['create','read','update','export'], 'mechanic' => [], 'service_advisor' => ['create','read','update']],
        'inventory'   => ['admin' => ['create','read','update','delete','export'], 'manager' => ['create','read','update','export'], 'mechanic' => ['read'], 'service_advisor' => ['read']],
        'suppliers'   => ['admin' => ['create','read','update','delete','export'], 'manager' => ['create','read','update','export'], 'mechanic' => [], 'service_advisor' => []],
        'employees'   => ['admin' => ['create','read','update','delete','export'], 'manager' => ['read'], 'mechanic' => [], 'service_advisor' => []],
        'mechanics'   => ['admin' => ['create','read','update','delete','export'], 'manager' => ['create','read','update','export'], 'mechanic' => [], 'service_advisor' => []],
        'services'    => ['admin' => ['create','read','update','delete','export'], 'manager' => ['create','read','update','export'], 'mechanic' => ['read'], 'service_advisor' => ['read']],
        'reports'     => ['admin' => ['create','read','update','delete','export'], 'manager' => ['read','export'], 'mechanic' => [], 'service_advisor' => []],
        'settings'    => ['admin' => ['create','read','update','delete','export'], 'manager' => [], 'mechanic' => [], 'service_advisor' => []],
    ];

    public static function getAll(): array
    {
        $rows        = Database::all('SELECT * FROM settings');
        $settingsObj = [
            'shopName'          => 'ProTech Auto Repair Workshop',
            'taxRate'           => 7.5,
            'currency'          => 'USD ($)',
            'businessHours'     => 'Mon - Sat: 08:00 AM - 06:00 PM',
            'contactPhone'      => '+1 (555) 019-4820',
            'contactEmail'      => 'service@protech-autorepair.com',
            'address'           => '4582 Industrial Parkway, Suite 100, Motor City, MI',
            'autoBackupDaily'   => true,
            'permissionsMatrix' => self::DEFAULT_PERMISSIONS_MATRIX,
        ];

        foreach ($rows as $r) {
            $k = $r['setting_key'];
            $v = $r['setting_value'];
            if (in_array($k, ['shop_name', 'workshop_name']))                            $settingsObj['shopName']      = $v;
            if ($k === 'tax_rate')                                                        $settingsObj['taxRate']       = (float) $v;
            if ($k === 'currency')                                                        $settingsObj['currency']      = $v;
            if ($k === 'business_hours')                                                  $settingsObj['businessHours'] = $v;
            if (in_array($k, ['contact_phone', 'workshop_phone']))                       $settingsObj['contactPhone']  = $v;
            if (in_array($k, ['contact_email', 'workshop_email']))                       $settingsObj['contactEmail']  = $v;
            if (in_array($k, ['address', 'workshop_address']))                           $settingsObj['address']       = $v;
            if ($k === 'roles_permissions_matrix') {
                $decoded = json_decode($v, true);
                if ($decoded) $settingsObj['permissionsMatrix'] = $decoded;
            }
        }

        return $settingsObj;
    }

    public static function getPermissions(): array
    {
        $row = Database::get("SELECT setting_value FROM settings WHERE setting_key = 'roles_permissions_matrix'");
        if ($row && $row['setting_value']) {
            $matrix = json_decode($row['setting_value'], true);
            if ($matrix) {
                return $matrix;
            }
        }
        return self::DEFAULT_PERMISSIONS_MATRIX;
    }

    public static function updatePermissions(array $rawMatrix): array
    {
        $matrix = array_merge(self::DEFAULT_PERMISSIONS_MATRIX, $rawMatrix);
        foreach (array_keys($matrix) as $mod) {
            if (!isset($matrix[$mod]) || !is_array($matrix[$mod])) {
                $matrix[$mod] = [];
            }
            $matrix[$mod]['admin'] = ['create', 'read', 'update', 'delete', 'export'];
        }

        self::upsert('roles_permissions_matrix', json_encode($matrix));
        return $matrix;
    }

    public static function save(array $input): void
    {
        $map = [
            'shopName'          => 'shop_name',
            'taxRate'           => 'tax_rate',
            'currency'          => 'currency',
            'businessHours'     => 'business_hours',
            'contactPhone'      => 'contact_phone',
            'contactEmail'      => 'contact_email',
            'address'           => 'address',
            'permissionsMatrix' => 'roles_permissions_matrix',
        ];

        foreach ($map as $inputKey => $dbKey) {
            if (!isset($input[$inputKey])) continue;
            $value = $inputKey === 'permissionsMatrix'
                ? json_encode($input[$inputKey])
                : (string) $input[$inputKey];
            self::upsert($dbKey, $value);
        }
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private static function upsert(string $key, string $value): void
    {
        Database::run(
            "INSERT INTO settings (setting_key, setting_value, updated_at)
             VALUES (?, ?, NOW())
             ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = NOW()",
            [$key, $value]
        );
    }
}
