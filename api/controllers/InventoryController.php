<?php
// api/controllers/InventoryController.php

require_once __DIR__ . '/../models/InventoryModel.php';
require_once __DIR__ . '/../utils/pagination.php';

class InventoryController
{
    public function transactions(): void
    {
        echo json_encode(['data' => InventoryModel::getTransactions()]);
    }

    public function index(): void
    {
        $search = $_GET['search'] ?? '';
        $category = $_GET['category'] ?? null;
        $params = Pagination::getParams(10);

        if ($params['isAll']) {
            echo json_encode(['data' => InventoryModel::getAll()]);
            return;
        }

        $result = InventoryModel::getPaginated($search, $params['page'], $params['limit'], $category);
        echo json_encode(Pagination::formatResponse($result['data'], $result['total'], $params['page'], $params['limit']));
    }

    public function store(): void
    {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        if (!trim($input['name'] ?? '')) {
            http_response_code(400);
            echo json_encode(['error' => 'Part name is required']);
            return;
        }
        http_response_code(201);
        echo json_encode(['data' => InventoryModel::create($input)]);
    }

    public function update(int $id): void
    {
        $input   = json_decode(file_get_contents('php://input'), true) ?? [];
        $updated = InventoryModel::update($id, $input);
        if (!$updated) {
            http_response_code(404);
            echo json_encode(['error' => 'Spare part not found']);
            return;
        }
        echo json_encode(['data' => $updated]);
    }

    public function adjust(int $id, array $authPayload): void
    {
        $input   = json_decode(file_get_contents('php://input'), true) ?? [];
        $updated = InventoryModel::adjust($id, $input, (int) ($authPayload['id'] ?? 0));
        if (!$updated) {
            http_response_code(404);
            echo json_encode(['error' => 'Part not found']);
            return;
        }
        echo json_encode(['data' => $updated]);
    }

    public function destroy(int $id): void
    {
        if (!InventoryModel::delete($id)) {
            http_response_code(404);
            echo json_encode(['error' => 'Spare part not found']);
            return;
        }
        echo json_encode(['success' => true, 'message' => 'Spare part removed successfully']);
    }
}
