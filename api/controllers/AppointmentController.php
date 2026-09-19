<?php
// api/controllers/AppointmentController.php

require_once __DIR__ . '/../models/AppointmentModel.php';

class AppointmentController
{
    public function index(): void
    {
        echo json_encode(['data' => AppointmentModel::getAll()]);
    }

    public function store(): void
    {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        http_response_code(201);
        echo json_encode(['data' => AppointmentModel::create($input)]);
    }

    public function update(int $id): void
    {
        $input   = json_decode(file_get_contents('php://input'), true) ?? [];
        $updated = AppointmentModel::update($id, $input);
        if (!$updated) {
            http_response_code(404);
            echo json_encode(['error' => 'Appointment not found']);
            return;
        }
        echo json_encode(['data' => $updated]);
    }

    public function updateStatus(int $id): void
    {
        $input  = json_decode(file_get_contents('php://input'), true) ?? [];
        $status = $input['status'] ?? null;
        if (!$status) {
            http_response_code(400);
            echo json_encode(['error' => 'Status is required']);
            return;
        }

        $updated = AppointmentModel::updateStatus($id, $status);
        if (!$updated) {
            http_response_code(404);
            echo json_encode(['error' => 'Appointment not found']);
            return;
        }
        echo json_encode(['data' => $updated]);
    }

    public function destroy(int $id): void
    {
        if (!AppointmentModel::cancel($id)) {
            http_response_code(404);
            echo json_encode(['error' => 'Appointment not found']);
            return;
        }
        echo json_encode(['success' => true, 'message' => 'Appointment cancelled successfully']);
    }
}
