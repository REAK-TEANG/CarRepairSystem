<?php
// api/controllers/CustomerController.php

require_once __DIR__ . '/../models/CustomerModel.php';

class CustomerController
{
    public function index(): void
    {
        $search = $_GET['search'] ?? '';
        echo json_encode(['data' => CustomerModel::getAll($search)]);
    }

    public function show(int $id): void
    {
        $customer = CustomerModel::findById($id);
        if (!$customer) {
            http_response_code(404);
            echo json_encode(['error' => 'Customer not found']);
            return;
        }
        echo json_encode(['data' => $customer]);
    }

    public function store(): void
    {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        if (!trim($input['name'] ?? '')) {
            http_response_code(400);
            echo json_encode(['error' => 'Customer name is required']);
            return;
        }
        http_response_code(201);
        echo json_encode(['data' => CustomerModel::create($input)]);
    }

    public function update(int $id): void
    {
        $input   = json_decode(file_get_contents('php://input'), true) ?? [];
        $updated = CustomerModel::update($id, $input);
        if (!$updated) {
            http_response_code(404);
            echo json_encode(['error' => 'Customer not found']);
            return;
        }
        echo json_encode(['data' => $updated]);
    }

    public function destroy(int $id): void
    {
        if (!CustomerModel::delete($id)) {
            http_response_code(404);
            echo json_encode(['error' => 'Customer not found']);
            return;
        }
        echo json_encode(['success' => true, 'message' => 'Customer deleted successfully']);
    }
}
