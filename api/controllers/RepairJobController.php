<?php
// api/controllers/RepairJobController.php

require_once __DIR__ . '/../models/RepairJobModel.php';
require_once __DIR__ . '/../utils/pagination.php';

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
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        http_response_code(201);
        echo json_encode(['data' => RepairJobModel::create($input, (int) ($authPayload['id'] ?? 0))]);
    }

    public function update(int $id, array $authPayload): void
    {
        $input   = json_decode(file_get_contents('php://input'), true) ?? [];
        $updated = RepairJobModel::update($id, $input, (int) ($authPayload['id'] ?? 0));
        if (!$updated) {
            http_response_code(404);
            echo json_encode(['error' => 'Repair order not found']);
            return;
        }
        echo json_encode(['data' => $updated]);
    }

    public function destroy(int $id): void
    {
        if (!RepairJobModel::delete($id)) {
            http_response_code(404);
            echo json_encode(['error' => 'Repair order not found']);
            return;
        }
        echo json_encode(['success' => true, 'message' => 'Repair order deleted successfully']);
    }
}
