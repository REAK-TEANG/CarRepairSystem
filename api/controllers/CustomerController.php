<?php
// api/controllers/CustomerController.php

require_once __DIR__ . '/../models/CustomerModel.php';
require_once __DIR__ . '/../utils/sanitizer.php';
require_once __DIR__ . '/../utils/pagination.php';

class CustomerController
{
    public function index(): void
    {
        $search = $_GET['search'] ?? '';
        $params = Pagination::getParams(10);

        if ($params['isAll']) {
            echo json_encode(['data' => CustomerModel::getAll($search)]);
            return;
        }

        $result = CustomerModel::getPaginated($search, $params['page'], $params['limit']);
        echo json_encode(Pagination::formatResponse($result['data'], $result['total'], $params['page'], $params['limit']));
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
        $input = Sanitizer::getJsonInput();
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
        $input   = Sanitizer::getJsonInput();
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
        try {
            if (!CustomerModel::delete($id)) {
                http_response_code(404);
                echo json_encode(['error' => 'Customer not found']);
                return;
            }
            echo json_encode(['success' => true, 'message' => 'Customer deleted successfully']);
        } catch (PDOException $e) {
            http_response_code(409);
            echo json_encode([
                'error' => 'Conflict',
                'message' => 'Cannot delete customer with active or historical records (appointments, repair orders, or invoices).'
            ]);
        }
    }
}
