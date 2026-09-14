<?php
// api/routes/reports.php
require_once __DIR__ . '/../config/db.php';

$authPayload = authenticate(); 

$method = $_SERVER['REQUEST_METHOD'];

if ($path === '/reports' || $path === '/reports/') {
    if ($method === 'GET') {
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
            ['id' => 1, 'title' => 'Monthly Revenue & Profit Breakdown', 'category' => 'Financial', 'date' => $currentMonthName, 'format' => 'PDF / Excel'],
            ['id' => 2, 'title' => 'Mechanic Workload & Efficiency Report', 'category' => 'Operations', 'date' => $currentMonthName, 'format' => 'PDF'],
            ['id' => 3, 'title' => 'Spare Parts Inventory Valuation & Stock Turnover', 'category' => 'Inventory', 'date' => "Q3 $currentYear", 'format' => 'Excel'],
            ['id' => 4, 'title' => 'Customer Retention & Lifetime Value Analysis', 'category' => 'Marketing', 'date' => "$currentYear YTD", 'format' => 'PDF'],
            ['id' => 5, 'title' => 'Vehicle Service History & Warranty Summary', 'category' => 'Service', 'date' => 'Past 12 Months', 'format' => 'PDF / Excel']
        ];

        echo json_encode(['data' => [
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
        ]]);
        exit;
    }
} else if ($path === '/reports/dashboard-metrics' || $path === '/dashboard-metrics') {
    if ($method === 'GET') {
        $invStats = get('SELECT COALESCE(SUM(total_amount), 0) AS total_invoiced, COALESCE(SUM(amount_paid), 0) AS total_collected FROM invoices');
        $jobStats = get("SELECT COUNT(*) AS total_jobs, COUNT(*) FILTER (WHERE status = 'Completed') AS completed_jobs FROM repair_orders");
        $custStats = get('SELECT COUNT(*) AS total_customers FROM customers');

        $totalRev = (float)($invStats['total_invoiced'] ?? 0);
        $totalColl = (float)($invStats['total_collected'] ?? 0);
        $totalJobs = (int)($jobStats['total_jobs'] ?? 0);
        $completedJobs = (int)($jobStats['completed_jobs'] ?? 0);
        $totalCust = (int)($custStats['total_customers'] ?? 0);

        $completedRate = $totalJobs > 0 ? round(($completedJobs / $totalJobs) * 100) . '%' : '100%';

        echo json_encode(['data' => [
            'netRevenue' => '$' . number_format($totalRev, 2, '.', ','),
            'totalCollected' => '$' . number_format($totalColl, 2, '.', ','),
            'activeOrders' => $totalJobs - $completedJobs,
            'totalCustomers' => $totalCust,
            'completedRate' => $completedRate
        ]]);
        exit;
    }
} else if (preg_match('#^/reports/revenue#', $path)) {
    if ($method === 'GET') {
        $period = $_GET['period'] ?? 'monthly';
        // Basic implementation for revenue chart
        echo json_encode(['data' => [
            ['month' => 'Jan', 'revenue' => 12000],
            ['month' => 'Feb', 'revenue' => 15000],
            ['month' => 'Mar', 'revenue' => 14000],
            ['month' => 'Apr', 'revenue' => 18000],
            ['month' => 'May', 'revenue' => 22000],
            ['month' => 'Jun', 'revenue' => 25000]
        ]]);
        exit;
    }
}

http_response_code(404);
echo json_encode(['error' => 'Reports endpoint not found']);
