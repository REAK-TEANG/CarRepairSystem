<?php
// api/controllers/SupplierController.php

require_once __DIR__ . '/../models/SupplierModel.php';
require_once __DIR__ . '/../utils/pagination.php';

class SupplierController
{
    public function index(): void
    {
        $search = $_GET['search'] ?? '';
        $params = Pagination::getParams(10);

        if ($params['isAll']) {
            echo json_encode(['data' => SupplierModel::getAll()]);
            return;
        }

        $result = SupplierModel::getPaginated($search, $params['page'], $params['limit']);
        echo json_encode(Pagination::formatResponse($result['data'], $result['total'], $params['page'], $params['limit']));
    }

    public function store(): void
    {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        if (!trim($input['name'] ?? '')) {
            http_response_code(400);
            echo json_encode(['error' => 'Supplier name is required']);
            return;
        }
        http_response_code(201);
        echo json_encode(['data' => SupplierModel::create($input)]);
    }

    public function update(int $id): void
    {
        $input   = json_decode(file_get_contents('php://input'), true) ?? [];
        $updated = SupplierModel::update($id, $input);
        if (!$updated) {
            http_response_code(404);
            echo json_encode(['error' => 'Supplier not found']);
            return;
        }
        echo json_encode(['data' => $updated]);
    }

    public function destroy(int $id): void
    {
        if (!SupplierModel::delete($id)) {
            http_response_code(404);
            echo json_encode(['error' => 'Supplier not found']);
            return;
        }
        echo json_encode(['success' => true, 'message' => 'Supplier removed successfully']);
    }
}
