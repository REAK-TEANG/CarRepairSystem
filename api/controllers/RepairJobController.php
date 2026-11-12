<?php
// api/controllers/RepairJobController.php

require_once __DIR__ . '/../models/RepairJobModel.php';
require_once __DIR__ . '/../utils/sanitizer.php';
require_once __DIR__ . '/../utils/pagination.php';
require_once __DIR__ . '/../utils/auditLogger.php';

class RepairJobController
{
    public function index(): void
    {
        $search = $_GET['search'] ?? '';
        $status = $_GET['status'] ?? null;
        $params = Pagination::getParams(10);
        $filters = [
            'mechanicId' => $_GET['mechanicId'] ?? null,
            'vehicleId'  => $_GET['vehicleId']  ?? null,
            'customerId' => $_GET['customerId'] ?? null,
        ];

        if ($params['isAll']) {
            echo json_encode(['data' => RepairJobModel::getAll($filters)]);
            return;
        }

        $result = RepairJobModel::getPaginated($filters, $search, $params['page'], $params['limit'], $status);
        echo json_encode(Pagination::formatResponse($result['data'], $result['total'], $params['page'], $params['limit']));
    }

    public function show(int $id): void
    {
        $job = RepairJobModel::findById($id);
        if (!$job) {
            http_response_code(404);
            echo json_encode(['error' => 'Repair order not found']);
            return;
        }
        echo json_encode(['data' => $job]);
    }

    public function store(array $authPayload): void
    {
        $input = Sanitizer::getJsonInput();
        $created = RepairJobModel::create($input, (int) ($authPayload['id'] ?? 0));
        
        $jobId = $created['id'] ?? 'N/A';
        AuditLogger::log(
            'CREATE',
            'repair_jobs',
            "Created repair work order #$jobId",
            (string)$jobId,
            $input,
            (int)($authPayload['id'] ?? 0),
            $authPayload['username'] ?? null,
            $authPayload['role'] ?? null
        );

        http_response_code(201);
        echo json_encode(['data' => $created]);
    }

    public function update(int $id, array $authPayload): void
    {
        $input   = Sanitizer::getJsonInput();
        $updated = RepairJobModel::update($id, $input, (int) ($authPayload['id'] ?? 0));
        if (!$updated) {
            http_response_code(404);
            echo json_encode(['error' => 'Repair order not found']);
            return;
        }

        $desc = isset($input['status']) 
            ? "Updated repair order #$id status to '{$input['status']}'" 
            : "Updated details for repair order #$id";

        AuditLogger::log(
            isset($input['status']) ? 'STATUS_CHANGE' : 'UPDATE',
            'repair_jobs',
            $desc,
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
            if (!RepairJobModel::delete($id)) {
                http_response_code(404);
                echo json_encode(['error' => 'Repair order not found']);
                return;
            }

            AuditLogger::log('DELETE', 'repair_jobs', "Deleted repair order #$id", (string)$id);

            echo json_encode(['success' => true, 'message' => 'Repair order deleted successfully']);
        } catch (PDOException $e) {
            http_response_code(409);
            echo json_encode([
                'error' => 'Conflict',
                'message' => 'Cannot delete repair order due to active accounting or transaction dependencies.'
            ]);
        }
    }
}
