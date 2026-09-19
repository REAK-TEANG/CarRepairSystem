<?php
// api/controllers/SettingsController.php

require_once __DIR__ . '/../models/SettingsModel.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

class SettingsController
{
    public function index(): void
    {
        echo json_encode(['data' => SettingsModel::getAll()]);
    }

    public function update(): void
    {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        SettingsModel::save($input);
        echo json_encode(['success' => true, 'message' => 'Settings saved successfully']);
    }

    public function getPermissions(): void
    {
        echo json_encode(['data' => SettingsModel::getPermissions()]);
    }

    public function updatePermissions(array $authPayload): void
    {
        AuthMiddleware::requireAdmin($authPayload);

        $rawMatrix = json_decode(file_get_contents('php://input'), true);
        if (!is_array($rawMatrix)) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid permissions matrix payload']);
            return;
        }

        $matrix = SettingsModel::updatePermissions($rawMatrix);
        echo json_encode(['success' => true, 'message' => 'Role permissions matrix updated successfully', 'data' => $matrix]);
    }
}
