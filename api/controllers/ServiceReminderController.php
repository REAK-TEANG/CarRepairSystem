<?php
// api/controllers/ServiceReminderController.php

require_once __DIR__ . '/../models/ServiceReminderModel.php';

class ServiceReminderController
{
    public function index(): void
    {
        echo json_encode(['data' => ServiceReminderModel::getAll()]);
    }

    public function store(): void
    {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        if (empty($input['customerId']) || empty($input['vehicleId']) || empty($input['serviceType'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Customer, vehicle, and service type are required']);
            return;
        }

        $inserted = ServiceReminderModel::create($input);
        http_response_code(201);
        echo json_encode(['data' => $inserted, 'message' => 'Service reminder scheduled successfully']);
    }

    public function update(int $id): void
    {
        $input   = json_decode(file_get_contents('php://input'), true) ?? [];
        $updated = ServiceReminderModel::update($id, $input);
        if (!$updated) {
            http_response_code(404);
            echo json_encode(['error' => 'Service reminder not found']);
            return;
        }
        echo json_encode(['data' => $updated, 'message' => 'Service reminder updated']);
    }

    public function destroy(int $id): void
    {
        ServiceReminderModel::delete($id);
        echo json_encode(['success' => true, 'message' => 'Service reminder deleted']);
    }
}
