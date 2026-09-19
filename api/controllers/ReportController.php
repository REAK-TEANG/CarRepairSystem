<?php
// api/controllers/ReportController.php

require_once __DIR__ . '/../models/ReportModel.php';

class ReportController
{
    public function summary(): void
    {
        echo json_encode(['data' => ReportModel::getSummary()]);
    }

    public function dashboardMetrics(): void
    {
        echo json_encode(['data' => ReportModel::getDashboardMetrics()]);
    }

    public function revenue(): void
    {
        $period = $_GET['period'] ?? 'monthly';
        echo json_encode(['data' => ReportModel::getRevenueData($period)]);
    }
}
