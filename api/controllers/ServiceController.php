<?php
// api/controllers/ServiceController.php

require_once __DIR__ . '/../models/ServiceModel.php';
require_once __DIR__ . '/../utils/sanitizer.php';
require_once __DIR__ . '/../utils/pagination.php';

class ServiceController
{
    public function index(): void
    {
        $search = $_GET['search'] ?? '';
        $status = $_GET['status'] ?? null;
        $params = Pagination::getParams(10);

        if ($params['isAll']) {
            echo json_encode(['data' => ServiceModel::getAll()]);
            return;
        }

        $result = ServiceModel::getPaginated($search, $params['page'], $params['limit'], $status);
        echo json_encode(Pagination::formatResponse($result['data'], $result['total'], $params['page'], $params['limit']));
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
        $input = Sanitizer::getJsonInput();
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
        $input   = Sanitizer::getJsonInput();
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
        try {
            if (!ServiceModel::delete($id)) {
                http_response_code(404);
                echo json_encode(['error' => 'Service not found']);
                return;
            }
            echo json_encode(['success' => true, 'message' => 'Service removed successfully']);
        } catch (PDOException $e) {
            http_response_code(409);
            echo json_encode([
                'error' => 'Conflict',
                'message' => 'Cannot delete service that is linked to active repair jobs or parts mapping.'
            ]);
        }
    }
}
