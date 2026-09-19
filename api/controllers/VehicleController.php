<?php
// api/controllers/VehicleController.php

require_once __DIR__ . '/../models/VehicleModel.php';

class VehicleController
{
    public function index(): void
    {
        echo json_encode(['data' => VehicleModel::getAll()]);
    }

    public function store(): void
    {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        if (!trim($input['number'] ?? '')) {
            http_response_code(400);
            echo json_encode(['error' => 'Vehicle license plate number is required']);
            return;
        }
        http_response_code(201);
        echo json_encode(['data' => VehicleModel::create($input)]);
    }

    public function update(int $id): void
    {
        $input   = json_decode(file_get_contents('php://input'), true) ?? [];
        $updated = VehicleModel::update($id, $input);
        if (!$updated) {
            http_response_code(404);
            echo json_encode(['error' => 'Vehicle not found']);
            return;
        }
        echo json_encode(['data' => $updated]);
    }

    public function destroy(int $id): void
    {
        if (!VehicleModel::delete($id)) {
            http_response_code(404);
            echo json_encode(['error' => 'Vehicle not found']);
            return;
        }
        echo json_encode(['success' => true, 'message' => 'Vehicle removed successfully']);
    }
}
