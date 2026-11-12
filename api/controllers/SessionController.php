<?php
// api/controllers/SessionController.php

require_once __DIR__ . '/../models/SessionModel.php';
require_once __DIR__ . '/../utils/sanitizer.php';
require_once __DIR__ . '/../utils/headers.php';
require_once __DIR__ . '/../utils/auditLogger.php';

class SessionController
{
    /**
     * GET /api/sessions/active
     * Accessible by Admin and Manager
     */
    public function active(array $authPayload): void
    {
        $role = strtolower($authPayload['role'] ?? '');
        if (!in_array($role, ['admin', 'manager'])) {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden', 'message' => 'Admin or Manager role required']);
            return;
        }

        $sessions = SessionModel::getActiveSessions();
        echo json_encode(['success' => true, 'data' => $sessions]);
    }

    /**
     * GET /api/sessions/history
     * Accessible by Admin and Manager
     */
    public function history(array $authPayload): void
    {
        $role = strtolower($authPayload['role'] ?? '');
        if (!in_array($role, ['admin', 'manager'])) {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden', 'message' => 'Admin or Manager role required']);
            return;
        }

        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = max(5, min(100, (int)($_GET['limit'] ?? 20)));
        $userId = !empty($_GET['userId']) ? (int)$_GET['userId'] : null;

        $result = SessionModel::getSessionHistory($page, $limit, $userId);
        echo json_encode(['success' => true, 'data' => $result['sessions'], 'pagination' => $result['pagination']]);
    }

    /**
     * POST /api/sessions/heartbeat
     * Telemetry ping from active browser tab
     */
    public function heartbeat(array $authPayload): void
    {
        $token = getBearerToken();
        if (!$token) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized', 'message' => 'Token missing']);
            return;
        }

        $input = Sanitizer::getJsonInput();
        $currentRoute = substr(trim($input['currentRoute'] ?? '/'), 0, 255);

        $result = SessionModel::heartbeat($token, $currentRoute);

        if (!$result['valid']) {
            http_response_code(401);
            echo json_encode([
                'error' => 'Unauthorized', 
                'code' => $result['reason'] === 'admin_revoked' ? 'SESSION_REVOKED' : 'SESSION_INVALID',
                'message' => $result['reason'] === 'admin_revoked' 
                    ? 'Your session was terminated by an administrator.' 
                    : 'Session is no longer valid. Please sign in again.'
            ]);
            return;
        }

        echo json_encode(['success' => true, 'timestamp' => date('c')]);
    }

    /**
     * POST /api/sessions/close
     * Fired by navigator.sendBeacon() or explicit unload
     */
    public function close(): void
    {
        // Support token from JSON body, Bearer header, or form payload
        $token = getBearerToken();
        $input = Sanitizer::getJsonInput();

        if (!$token && !empty($input['token'])) {
            $token = trim($input['token']);
        }
        if (!$token && !empty($_POST['token'])) {
            $token = trim($_POST['token']);
        }

        if (!$token) {
            http_response_code(400);
            echo json_encode(['error' => 'Token required to close session']);
            return;
        }

        $reason = trim($input['reason'] ?? $_POST['reason'] ?? 'window_close');
        if (!in_array($reason, ['window_close', 'manual_logout', 'session_timeout'])) {
            $reason = 'window_close';
        }

        $closed = SessionModel::closeSession($token, $reason);

        // Record audit event
        $secret = getJwtSecret();
        $payload = JWT::decode($token, $secret);
        if ($payload) {
            AuditLogger::log(
                'SESSION_CLOSE',
                'auth',
                "User {$payload['name']} (@{$payload['username']}) closed application window / session ($reason)",
                null,
                ['close_reason' => $reason],
                $payload['id'],
                $payload['username'],
                $payload['role']
            );
        }

        echo json_encode(['success' => true, 'closed' => $closed]);
    }

    /**
     * POST /api/sessions/revoke
     * Administrator terminates an active user session (Kill Switch)
     */
    public function revoke(array $authPayload): void
    {
        // Strictly require Admin
        if (strtolower($authPayload['role'] ?? '') !== 'admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden', 'message' => 'Administrator privileges required']);
            return;
        }

        $input = Sanitizer::getJsonInput();
        $sessionId = (int)($input['sessionId'] ?? 0);

        if (!$sessionId) {
            http_response_code(400);
            echo json_encode(['error' => 'sessionId is required']);
            return;
        }

        $revoked = SessionModel::revokeSession($sessionId, $authPayload);

        if (!$revoked) {
            http_response_code(404);
            echo json_encode(['error' => 'Session not found or already inactive']);
            return;
        }

        echo json_encode(['success' => true, 'message' => 'Session terminated successfully']);
    }
}

