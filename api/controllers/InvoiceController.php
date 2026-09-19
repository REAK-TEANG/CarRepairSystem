<?php
// api/controllers/InvoiceController.php

require_once __DIR__ . '/../models/InvoiceModel.php';

class InvoiceController
{
    public function index(): void
    {
        echo json_encode(['data' => InvoiceModel::getAll()]);
    }

    public function store(): void
    {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        http_response_code(201);
        echo json_encode(['data' => InvoiceModel::create($input)]);
    }

    public function pay(int $id, array $authPayload): void
    {
        $input   = json_decode(file_get_contents('php://input'), true) ?? [];
        $updated = InvoiceModel::pay($id, $input, (int) ($authPayload['id'] ?? 0));
        if (!$updated) {
            http_response_code(404);
            echo json_encode(['error' => 'Invoice not found']);
            return;
        }
        echo json_encode(['data' => $updated]);
    }
}
