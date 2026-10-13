<?php
// api/controllers/MechanicController.php

require_once __DIR__ . '/../models/MechanicModel.php';
require_once __DIR__ . '/../utils/pagination.php';

class MechanicController
{
    public function index(): void
    {
        $search = $_GET['search'] ?? '';
        $status = $_GET['status'] ?? null;
        $params = Pagination::getParams(10);

        if ($params['isAll']) {
            echo json_encode(['data' => MechanicModel::getAll()]);
            return;
        }

        $result = MechanicModel::getPaginated($search, $params['page'], $params['limit'], $status);
        echo json_encode(Pagination::formatResponse($result['data'], $result['total'], $params['page'], $params['limit']));
    }

    public function show(int $id): void
    {
        $mechanic = MechanicModel::findById($id);
        if (!$mechanic) {
            http_response_code(404);
            echo json_encode(['error' => 'Mechanic not found']);
            return;
        }
        echo json_encode(['data' => $mechanic]);
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
