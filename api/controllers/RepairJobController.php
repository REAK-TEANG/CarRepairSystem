<?php
// api/controllers/RepairJobController.php

require_once __DIR__ . '/../models/RepairJobModel.php';

class RepairJobController
{
    public function index(): void
    {
        $filters = [
            'mechanicId' => $_GET['mechanicId'] ?? null,
            'vehicleId'  => $_GET['vehicleId']  ?? null,
            'customerId' => $_GET['customerId'] ?? null,
        ];
        echo json_encode(['data' => RepairJobModel::getAll($filters)]);
    }

    public function show(int $id): void
    {
        $job = RepairJobModel::findById($id);
        if (!$job) {
            http_response_code(404);
            echo json_encode(['error' => 'Repair order not found']);
            return;
        }
        echo json_encode(['data' => $job]);
    }

    public function store(array $authPayload): void
    {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        http_response_code(201);
        echo json_encode(['data' => RepairJobModel::create($input, (int) ($authPayload['id'] ?? 0))]);
    }

    public function update(int $id, array $authPayload): void
    {
        $input   = json_decode(file_get_contents('php://input'), true) ?? [];
        $updated = RepairJobModel::update($id, $input, (int) ($authPayload['id'] ?? 0));
        if (!$updated) {
            http_response_code(404);
            echo json_encode(['error' => 'Repair order not found']);
            return;
        }
        echo json_encode(['data' => $updated]);
    }

    public function destroy(int $id): void
    {
        if (!RepairJobModel::delete($id)) {
            http_response_code(404);
            echo json_encode(['error' => 'Repair order not found']);
            return;
        }
        echo json_encode(['success' => true, 'message' => 'Repair order deleted successfully']);
    }
}
