<?php
// api/controllers/AppointmentController.php

require_once __DIR__ . '/../models/AppointmentModel.php';
require_once __DIR__ . '/../utils/sanitizer.php';
require_once __DIR__ . '/../utils/pagination.php';

class AppointmentController
{
    public function index(): void
    {
        $search = $_GET['search'] ?? '';
        $status = $_GET['status'] ?? null;
        $filters = [
            'mechanicId' => $_GET['mechanicId'] ?? null,
        ];
        $params = Pagination::getParams(10);

        if ($params['isAll']) {
            echo json_encode(['data' => AppointmentModel::getAll($filters)]);
            return;
        }

        $result = AppointmentModel::getPaginated($search, $params['page'], $params['limit'], $status, $filters);
        echo json_encode(Pagination::formatResponse($result['data'], $result['total'], $params['page'], $params['limit']));
    }

    public function show(int $id): void
    {
        $appointment = AppointmentModel::findById($id);
        if (!$appointment) {
            http_response_code(404);
            echo json_encode(['error' => 'Appointment not found']);
            return;
        }
        echo json_encode(['data' => $appointment]);
    }

    public function store(): void
    {
        $input = Sanitizer::getJsonInput();
        $date  = trim($input['date'] ?? '');
        $today = date('Y-m-d');
        if ($date && $date < $today) {
            http_response_code(400);
            echo json_encode([
                'error' => 'Validation Error',
                'message' => 'Appointment date cannot be behind the current date.'
            ]);
            return;
        }
        http_response_code(201);
        echo json_encode(['data' => AppointmentModel::create($input)]);
    }

    public function update(int $id): void
    {
        $input    = Sanitizer::getJsonInput();
        $date     = trim($input['date'] ?? '');
        $today    = date('Y-m-d');
        $existing = AppointmentModel::findById($id);
        if (!$existing) {
            http_response_code(404);
            echo json_encode(['error' => 'Appointment not found']);
            return;
        }
        if ($date && $date !== $existing['date'] && $date < $today && in_array($existing['status'], ['Scheduled', 'Confirmed', 'Pending'])) {
            http_response_code(400);
            echo json_encode([
                'error' => 'Validation Error',
                'message' => 'Appointment date cannot be behind the current date.'
            ]);
            return;
        }
        $updated = AppointmentModel::update($id, $input);
        echo json_encode(['data' => $updated]);
    }

    public function updateStatus(int $id): void
    {
        $input  = Sanitizer::getJsonInput();
        $status = $input['status'] ?? null;
        if (!$status) {
            http_response_code(400);
            echo json_encode(['error' => 'Status is required']);
            return;
        }

        $updated = AppointmentModel::updateStatus($id, $status);
        if (!$updated) {
            http_response_code(404);
            echo json_encode(['error' => 'Appointment not found']);
            return;
        }
        echo json_encode(['data' => $updated]);
    }

    public function destroy(int $id): void
    {
        if (!AppointmentModel::cancel($id)) {
            http_response_code(404);
            echo json_encode(['error' => 'Appointment not found']);
            return;
        }
        echo json_encode(['success' => true, 'message' => 'Appointment cancelled successfully']);
    }
}
