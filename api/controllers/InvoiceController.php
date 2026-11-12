<?php
// api/controllers/InvoiceController.php

require_once __DIR__ . '/../models/InvoiceModel.php';
require_once __DIR__ . '/../utils/sanitizer.php';
require_once __DIR__ . '/../utils/pagination.php';
require_once __DIR__ . '/../utils/auditLogger.php';

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

    public function show($id): void
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
        try {
            $input = Sanitizer::getJsonInput();
            $invoice = InvoiceModel::create($input);
            $invId = $invoice['id'] ?? ($invoice['invoice_number'] ?? 'N/A');
            AuditLogger::log('CREATE', 'invoices', "Created invoice #$invId (Total: \${$invoice['total_amount']})", (string)$invId, $input);
            http_response_code(201);
            echo json_encode(['data' => $invoice]);
        } catch (\InvalidArgumentException $e) {
            http_response_code(400);
            echo json_encode(['error' => 'Bad Request', 'message' => $e->getMessage()]);
        }
    }

    public function update($id): void
    {
        $input   = Sanitizer::getJsonInput();
        $updated = InvoiceModel::update($id, $input);
        if (!$updated) {
            http_response_code(404);
            echo json_encode(['error' => 'Invoice not found']);
            return;
        }
        $desc = isset($input['paidAmount']) || isset($input['status'])
            ? "Updated payment/status for invoice #$id"
            : "Updated invoice #$id details";
        AuditLogger::log('UPDATE', 'invoices', $desc, (string)$id, $input);
        echo json_encode(['data' => $updated]);
    }

    public function destroy($id): void
    {
        try {
            if (!InvoiceModel::delete($id)) {
                http_response_code(404);
                echo json_encode(['error' => 'Invoice not found']);
                return;
            }
            AuditLogger::log('DELETE', 'invoices', "Deleted invoice #$id", (string)$id);
            echo json_encode(['success' => true, 'message' => 'Invoice deleted successfully']);
        } catch (PDOException $e) {
            http_response_code(409);
            echo json_encode([
                'error' => 'Conflict',
                'message' => 'Cannot delete invoice with active accounting dependencies.'
            ]);
        }
    }

    public function pay($id, array $authPayload): void
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
