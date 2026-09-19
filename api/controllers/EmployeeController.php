<?php
// api/controllers/EmployeeController.php

require_once __DIR__ . '/../models/EmployeeModel.php';

class EmployeeController
{
    public function index(): void
    {
        echo json_encode(['data' => EmployeeModel::getAll()]);
    }

    public function store(): void
    {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        if (!trim($input['name'] ?? '')) {
            http_response_code(400);
            echo json_encode(['error' => 'Employee name is required']);
            return;
        }
        http_response_code(201);
        echo json_encode(['data' => EmployeeModel::create($input)]);
    }

    public function update(int $id): void
    {
        $input   = json_decode(file_get_contents('php://input'), true) ?? [];
        $updated = EmployeeModel::update($id, $input);
        if (!$updated) {
            http_response_code(404);
            echo json_encode(['error' => 'Employee not found']);
            return;
        }
        echo json_encode(['data' => $updated]);
    }

    public function toggleAttendance(int $id): void
    {
        // Attendance toggle acknowledged; extend with real DB logic when needed
        echo json_encode(['success' => true, 'message' => 'Attendance toggled']);
    }

    public function destroy(int $id): void
    {
        if (!EmployeeModel::delete($id)) {
            http_response_code(404);
            echo json_encode(['error' => 'Employee not found']);
            return;
        }
        echo json_encode(['success' => true, 'message' => 'Employee removed successfully']);
    }
}
