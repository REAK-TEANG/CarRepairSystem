<?php
// api/routes/mechanics.php
require_once __DIR__ . '/../config/db.php';

$authPayload = authenticate(); 

$method = $_SERVER['REQUEST_METHOD'];
$id = null;

if (preg_match('#^/mechanics/(\d+)$#', $path, $matches)) {
    $id = $matches[1];
}

if ($method === 'GET' && !$id) {
    $rows = all("
      SELECT e.*, u.full_name, u.phone, u.email,
             COUNT(CASE WHEN ro.status::text != 'Completed' AND ro.id IS NOT NULL THEN 1 END) AS active_jobs,
             COUNT(CASE WHEN ro.status::text = 'Completed' THEN 1 END) AS completed_jobs
      FROM employees e
      LEFT JOIN users u ON e.user_id = u.id
      LEFT JOIN repair_orders ro ON ro.mechanic_id = e.id
      GROUP BY e.id, u.full_name, u.phone, u.email
      ORDER BY e.id ASC
    ");

    $mechanics = array_map(function($r) {
        return [
            'id' => $r['id'],
            'code' => $r['employee_code'],
            'name' => $r['full_name'] ?: "Mechanic {$r['employee_code']}",
            'phone' => $r['phone'] ?? '',
            'email' => $r['email'] ?? '',
            'specialization' => $r['specialization'] ?: 'General Repair',
            'experience' => (int)($r['experience_years'] ?? 5),
            'rating' => 4.9,
            'activeJobs' => (int)($r['active_jobs'] ?? 0),
            'completedJobs' => (int)($r['completed_jobs'] ?? 0),
            'status' => $r['employment_status'] ?: 'Active'
        ];
    }, $rows);

    echo json_encode(['data' => $mechanics]);
    exit;

} else if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $name = $input['name'] ?? '';
    if (!trim($name)) {
        http_response_code(400);
        echo json_encode(['error' => 'Mechanic name is required']);
        exit;
    }

    $countRow = get('SELECT COUNT(*) AS cnt FROM employees');
    $cnt = (int)($countRow['cnt'] ?? 0) + 1;
    $code = 'EMP-' . str_pad($cnt, 3, '0', STR_PAD_LEFT);

    $username = 'mech_' . time();
    $secureHash = password_hash('password123', PASSWORD_BCRYPT);
    $email = $input['email'] ?? "$username@carrepair.com";
    $phone = $input['phone'] ?? null;

    run(
        "INSERT INTO users (username, email, password_hash, full_name, phone, role_id) VALUES (?, ?, ?, ?, ?, 4)",
        [$username, $email, $secureHash, trim($name), $phone]
    );

    global $pdo;
    $userId = $pdo->lastInsertId();
    if (!$userId) {
        $uRow = get("SELECT id FROM users WHERE username = ?", [$username]);
        $userId = $uRow['id'];
    }

    $specialization = $input['specialization'] ?? 'General Repair';
    $experience = !empty($input['experience']) ? (int)$input['experience'] : 3;
    $status = $input['status'] ?? 'Active';

    run(
        "INSERT INTO employees (user_id, employee_code, position, specialization, experience_years, employment_status)
         VALUES (?, ?, 'Mechanic', ?, ?, ?)",
        [$userId, $code, $specialization, $experience, $status]
    );

    $empId = $pdo->lastInsertId();
    if (!$empId) {
        $eRow = get("SELECT id FROM employees WHERE employee_code = ?", [$code]);
        $empId = $eRow['id'];
    }

    http_response_code(201);
    echo json_encode(['data' => [
        'id' => $empId,
        'code' => $code,
        'name' => $name,
        'phone' => $phone ?? '',
        'email' => $email ?? '',
        'specialization' => $specialization,
        'experience' => $experience,
        'rating' => 5.0,
        'activeJobs' => 0,
        'completedJobs' => 0,
        'status' => $status
    ]]);
    exit;

} else if ($method === 'PUT' && $id) {
    $input = json_decode(file_get_contents('php://input'), true);

    run(
        "UPDATE employees
         SET specialization = COALESCE(?, specialization),
             experience_years = COALESCE(?, experience_years),
             employment_status = COALESCE(?, employment_status),
             updated_at = NOW()
         WHERE id = ?",
        [
            $input['specialization'] ?? null,
            !empty($input['experience']) ? (int)$input['experience'] : null,
            $input['status'] ?? null,
            $id
        ]
    );

    $emp = get('SELECT * FROM employees WHERE id = ?', [$id]);
    if (!$emp) {
        http_response_code(404);
        echo json_encode(['error' => 'Mechanic not found']);
        exit;
    }

    if (!empty($emp['user_id'])) {
        run(
            "UPDATE users
             SET full_name = COALESCE(?, full_name),
                 phone = COALESCE(?, phone),
                 email = COALESCE(?, email),
                 updated_at = NOW()
             WHERE id = ?",
            [$input['name'] ?? null, $input['phone'] ?? null, $input['email'] ?? null, $emp['user_id']]
        );
    }

    echo json_encode(['data' => [
        'id' => $emp['id'],
        'code' => $emp['employee_code'],
        'name' => $input['name'] ?? 'Mechanic',
        'phone' => $input['phone'] ?? '',
        'email' => $input['email'] ?? '',
        'specialization' => $emp['specialization'],
        'experience' => $emp['experience_years'],
        'rating' => 4.9,
        'activeJobs' => 0,
        'completedJobs' => 0,
        'status' => $emp['employment_status']
    ]]);
    exit;

} else if ($method === 'DELETE' && $id) {
    $emp = get('SELECT user_id FROM employees WHERE id = ?', [$id]);
    if (!$emp) {
        http_response_code(404);
        echo json_encode(['error' => 'Mechanic not found']);
        exit;
    }

    if (!empty($emp['user_id'])) {
        run('DELETE FROM users WHERE id = ?', [$emp['user_id']]);
    } else {
        run('DELETE FROM employees WHERE id = ?', [$id]);
    }
    echo json_encode(['success' => true, 'message' => 'Mechanic removed successfully']);
    exit;
}

http_response_code(404);
echo json_encode(['error' => 'Mechanic endpoint not found']);
