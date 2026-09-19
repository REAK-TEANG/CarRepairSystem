<?php
// api/controllers/MechanicController.php

require_once __DIR__ . '/../models/MechanicModel.php';

class MechanicController
{
    public function index(): void
    {
        echo json_encode(['data' => MechanicModel::getAll()]);
    }

    public function store(): void
    {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        if (!trim($input['name'] ?? '')) {
            http_response_code(400);
            echo json_encode(['error' => 'Mechanic name is required']);
            return;
        }
        http_response_code(201);
        echo json_encode(['data' => MechanicModel::create($input)]);
    }

    public function update(int $id): void
    {
        $input   = json_decode(file_get_contents('php://input'), true) ?? [];
        $updated = MechanicModel::update($id, $input);
        if (!$updated) {
            http_response_code(404);
            echo json_encode(['error' => 'Mechanic not found']);
            return;
        }
        echo json_encode(['data' => $updated]);
    }

    public function destroy(int $id): void
    {
        if (!MechanicModel::delete($id)) {
            http_response_code(404);
            echo json_encode(['error' => 'Mechanic not found']);
            return;
        }
        echo json_encode(['success' => true, 'message' => 'Mechanic removed successfully']);
    }
}
