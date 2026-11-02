<?php
// api/controllers/InvoiceController.php

require_once __DIR__ . '/../models/InvoiceModel.php';
require_once __DIR__ . '/../utils/sanitizer.php';
require_once __DIR__ . '/../utils/pagination.php';

class InvoiceController
{
    public function index(): void
    {
        $search = $_GET['search'] ?? '';
        $status = $_GET['status'] ?? null;
        $params = Pagination::getParams(10);

        if ($params['isAll']) {
            echo json_encode(['data' => InvoiceModel::getAll()]);
            return;
        }

        $result = InvoiceModel::getPaginated($search, $params['page'], $params['limit'], $status);
        echo json_encode(Pagination::formatResponse($result['data'], $result['total'], $params['page'], $params['limit']));
    }

    public function show(int $id): void
    {
        $invoice = InvoiceModel::findById($id);
        if (!$invoice) {
            http_response_code(404);
            echo json_encode(['error' => 'Invoice not found']);
            return;
        }
        echo json_encode(['data' => $invoice]);
    }

    public function store(): void
    {
        $input = Sanitizer::getJsonInput();
        http_response_code(201);
        echo json_encode(['data' => InvoiceModel::create($input)]);
    }

    public function update(int $id): void
    {
        $input   = Sanitizer::getJsonInput();
        $updated = InvoiceModel::update($id, $input);
        if (!$updated) {
            http_response_code(404);
            echo json_encode(['error' => 'Invoice not found']);
            return;
        }
        echo json_encode(['data' => $updated]);
    }

    public function destroy(int $id): void
    {
        try {
            if (!InvoiceModel::delete($id)) {
                http_response_code(404);
                echo json_encode(['error' => 'Invoice not found']);
                return;
            }
            echo json_encode(['success' => true, 'message' => 'Invoice deleted successfully']);
        } catch (PDOException $e) {
            http_response_code(409);
            echo json_encode([
                'error' => 'Conflict',
                'message' => 'Cannot delete invoice with active accounting dependencies.'
            ]);
        }
    }

    public function pay(int $id, array $authPayload): void
    {
        $input   = Sanitizer::getJsonInput();
        $updated = InvoiceModel::pay($id, $input, (int) ($authPayload['id'] ?? 0));
        if (!$updated) {
            http_response_code(404);
            echo json_encode(['error' => 'Invoice not found']);
            return;
        }
        echo json_encode(['data' => $updated]);
    }
}
