<?php
// api/controllers/InventoryController.php

require_once __DIR__ . '/../models/InventoryModel.php';
require_once __DIR__ . '/../utils/sanitizer.php';
require_once __DIR__ . '/../utils/pagination.php';
require_once __DIR__ . '/../utils/auditLogger.php';

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

    public function show(int $id): void
    {
        $part = InventoryModel::findById($id);
        if (!$part) {
            http_response_code(404);
            echo json_encode(['error' => 'Spare part not found']);
            return;
        }
        echo json_encode(['data' => $part]);
    }

    public function store(): void
    {
        $input = Sanitizer::getJsonInput();
        if (!trim($input['name'] ?? '')) {
            http_response_code(400);
            echo json_encode(['error' => 'Part name is required']);
            return;
        }
        $created = InventoryModel::create($input);
        $partId = $created['id'] ?? 'N/A';
        AuditLogger::log('CREATE', 'inventory', "Added new inventory item '{$input['name']}' (#$partId)", (string)$partId, $input);
        http_response_code(201);
        echo json_encode(['data' => $created]);
    }

    public function update(int $id): void
    {
        $input   = Sanitizer::getJsonInput();
        $updated = InventoryModel::update($id, $input);
        if (!$updated) {
            http_response_code(404);
            echo json_encode(['error' => 'Spare part not found']);
            return;
        }
        AuditLogger::log('UPDATE', 'inventory', "Updated spare part #$id details", (string)$id, $input);
        echo json_encode(['data' => $updated]);
    }

    public function adjust(int $id, array $authPayload): void
    {
        $input   = Sanitizer::getJsonInput();
        $updated = InventoryModel::adjust($id, $input, (int) ($authPayload['id'] ?? 0));
        if (!$updated) {
            http_response_code(404);
            echo json_encode(['error' => 'Part not found']);
            return;
        }
        $type = $input['type'] ?? 'adjustment';
        $qty = $input['quantity'] ?? 0;
        AuditLogger::log(
            'STATUS_CHANGE', 
            'inventory', 
            "Stock $type for part #$id (qty: $qty). Reason: " . ($input['notes'] ?? 'manual adjustment'), 
            (string)$id, 
            $input,
            (int)($authPayload['id'] ?? 0),
            $authPayload['username'] ?? null,
            $authPayload['role'] ?? null
        );
        echo json_encode(['data' => $updated]);
    }

    public function destroy(int $id): void
    {
        try {
            if (!InventoryModel::delete($id)) {
                http_response_code(404);
                echo json_encode(['error' => 'Spare part not found']);
                return;
            }
            AuditLogger::log('DELETE', 'inventory', "Deleted spare part #$id", (string)$id);
            echo json_encode(['success' => true, 'message' => 'Spare part removed successfully']);
        } catch (PDOException $e) {
            // If referenced by transactions or repair orders, deactivate rather than failing
            Database::run('UPDATE spare_parts SET is_active = FALSE, updated_at = NOW() WHERE id = ?', [$id]);
            AuditLogger::log('UPDATE', 'inventory', "Archived spare part #$id (has dependencies)", (string)$id);
            echo json_encode(['success' => true, 'message' => 'Spare part has existing transaction history and has been archived.']);
        }
    }
}
