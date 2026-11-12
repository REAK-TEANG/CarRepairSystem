<?php
// api/routes/reports.php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../utils/cache.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

$authPayload = AuthMiddleware::requireAuth(); 
AuthMiddleware::authorize('reports', 'read', $authPayload);

$method = $_SERVER['REQUEST_METHOD'];

if ($path === '/reports' || $path === '/reports/') {
    if ($method === 'GET') {
        $cacheKey = 'reports_summary';
        $cachedData = Cache::fetch($cacheKey);
        
        if ($cachedData) {
            echo json_encode(['data' => $cachedData, 'cached' => true]);
            exit;
        }

        $custCount = get('SELECT COUNT(*) AS cnt FROM customers');
        $vehCount = get('SELECT COUNT(*) AS cnt FROM vehicles');
        $jobCount = get('SELECT COUNT(*) AS cnt FROM repair_orders');
        $completedJobCount = get("SELECT COUNT(*) AS cnt FROM repair_orders WHERE status = 'Completed'");
        $invStats = get('SELECT COALESCE(SUM(total_amount), 0) AS total_invoiced, COALESCE(SUM(amount_paid), 0) AS total_collected FROM invoices');
        $partStats = get('SELECT COUNT(*) AS cnt, COALESCE(SUM(stock_quantity), 0) AS total_units FROM spare_parts');
        $empStats = get('SELECT COUNT(*) AS total_staff FROM employees');

        $currentYear = date('Y');
        $currentMonthName = date('F Y');

        $reportsList = [
            [
                'id' => 1,
                'title' => 'Monthly Revenue & Invoices Audit',
                'summary' => 'Comprehensive billing audit, receivables, paid invoices, and payment methods.',
                'category' => 'Financial',
                'date' => $currentMonthName,
                'format' => 'PDF · Excel · Print'
            ],
            [
                'id' => 2,
                'title' => 'Mechanic Workload & Labor Efficiency',
                'summary' => 'Breakdown of assigned work orders, completion rates, and active workshop pipeline.',
                'category' => 'Operations',
                'date' => $currentMonthName,
                'format' => 'PDF · Excel · Print'
            ],
            [
                'id' => 3,
                'title' => 'Spare Parts Valuation & Stock Audit',
                'summary' => 'Current inventory levels, valuation assets, reorder thresholds, and low-stock alerts.',
                'category' => 'Inventory',
                'date' => "Q3 $currentYear",
                'format' => 'PDF · Excel · Print'
            ],
            [
                'id' => 4,
                'title' => 'Customer Accounts & Lifetime Value',
                'summary' => 'Client directory spending history, registered vehicles, and appointment retention.',
                'category' => 'Customers',
                'date' => "$currentYear YTD",
                'format' => 'PDF · Excel · Print'
            ],
            [
                'id' => 5,
                'title' => 'Workshop Work Orders & Service History',
                'summary' => 'Operational logs of diagnostic inspections, repair orders, and status turnaround.',
                'category' => 'Operations',
                'date' => 'Past 12 Months',
                'format' => 'PDF · Excel · Print'
            ]
        ];

        $responseData = [
            'reports' => $reportsList,
            'metrics' => [
                'totalCustomers' => (int)($custCount['cnt'] ?? 0),
                'totalVehicles' => (int)($vehCount['cnt'] ?? 0),
                'totalRepairJobs' => (int)($jobCount['cnt'] ?? 0),
                'completedRepairs' => (int)($completedJobCount['cnt'] ?? 0),
                'totalRevenue' => (float)($invStats['total_invoiced'] ?? 0),
                'totalCollected' => (float)($invStats['total_collected'] ?? 0),
                'totalSpareParts' => (int)($partStats['cnt'] ?? 0),
                'totalStockUnits' => (int)($partStats['total_units'] ?? 0),
                'totalEmployees' => (int)($empStats['total_staff'] ?? 0)
            ]
        ];

        Cache::store($cacheKey, $responseData, 300); // cache for 5 minutes

        echo json_encode(['data' => $responseData]);
        exit;
    }
} else if ($path === '/reports/dashboard-metrics' || $path === '/dashboard-metrics') {
    if ($method === 'GET') {
        $cacheKey = 'dashboard_metrics';
        $cachedData = Cache::fetch($cacheKey);
        
        if ($cachedData) {
            echo json_encode(['data' => $cachedData, 'cached' => true]);
            exit;
        }

        $invStats = get('SELECT COALESCE(SUM(total_amount), 0) AS total_invoiced, COALESCE(SUM(amount_paid), 0) AS total_collected FROM invoices');
        $jobStats = get("SELECT COUNT(*) AS total_jobs, COUNT(*) FILTER (WHERE status = 'Completed') AS completed_jobs FROM repair_orders");
        $custStats = get('SELECT COUNT(*) AS total_customers FROM customers');

        $totalRev = (float)($invStats['total_invoiced'] ?? 0);
        $totalColl = (float)($invStats['total_collected'] ?? 0);
        $totalJobs = (int)($jobStats['total_jobs'] ?? 0);
        $completedJobs = (int)($jobStats['completed_jobs'] ?? 0);
        $totalCust = (int)($custStats['total_customers'] ?? 0);

        $completedRate = $totalJobs > 0 ? round(($completedJobs / $totalJobs) * 100) . '%' : '100%';

        $responseData = [
            'netRevenue' => '$' . number_format($totalRev, 2, '.', ','),
            'totalCollected' => '$' . number_format($totalColl, 2, '.', ','),
            'activeOrders' => $totalJobs - $completedJobs,
            'totalCustomers' => $totalCust,
            'completedRate' => $completedRate
        ];

        Cache::store($cacheKey, $responseData, 120); // cache for 2 minutes

        echo json_encode(['data' => $responseData]);
        exit;
    }
} else if (preg_match('#^/reports/revenue#', $path)) {
    if ($method === 'GET') {
        $revenueData = all("
            SELECT TO_CHAR(created_at, 'Mon') as month, 
                   COALESCE(SUM(total_amount), 0) as revenue 
            FROM invoices 
            WHERE created_at >= NOW() - INTERVAL '6 months'
            GROUP BY TO_CHAR(created_at, 'Mon'), DATE_TRUNC('month', created_at)
            ORDER BY DATE_TRUNC('month', created_at) ASC
        ");
        
        echo json_encode(['data' => $revenueData ?: []]);
        exit;
    }
}

http_response_code(404);
echo json_encode(['error' => 'Reports endpoint not found']);
