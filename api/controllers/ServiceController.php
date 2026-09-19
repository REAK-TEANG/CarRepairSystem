<?php
// api/controllers/ServiceController.php

require_once __DIR__ . '/../models/ServiceModel.php';

class ServiceController
{
    public function index(): void
    {
        echo json_encode(['data' => ServiceModel::getAll()]);
    }

    public function show(int $id): void
    {
        $service = ServiceModel::findById($id);
        if (!$service) {
            http_response_code(404);
            echo json_encode(['error' => 'Service not found']);
            return;
        }
        echo json_encode(['data' => $service]);
    }

    public function store(): void
    {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        if (!trim($input['name'] ?? '')) {
            http_response_code(400);
            echo json_encode(['error' => 'Service name is required']);
            return;
        }
        http_response_code(201);
        echo json_encode(['data' => ServiceModel::create($input)]);
    }

    public function update(int $id): void
    {
        $input   = json_decode(file_get_contents('php://input'), true) ?? [];
        $updated = ServiceModel::update($id, $input);
        if (!$updated) {
            http_response_code(404);
            echo json_encode(['error' => 'Service not found']);
            return;
        }
        echo json_encode(['data' => $updated]);
    }

    public function destroy(int $id): void
    {
        if (!ServiceModel::delete($id)) {
            http_response_code(404);
            echo json_encode(['error' => 'Service not found']);
            return;
        }
        echo json_encode(['success' => true, 'message' => 'Service removed successfully']);
    }
}
