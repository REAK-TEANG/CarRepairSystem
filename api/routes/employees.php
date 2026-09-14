<?php
// api/routes/employees.php
require_once __DIR__ . '/../config/db.php';

$authPayload = authenticate(); 

$method = $_SERVER['REQUEST_METHOD'];
$id = null;
$action = null;

if (preg_match('#^/employees/(\d+)/toggle-attendance$#', $path, $matches)) {
    $id = $matches[1];
    $action = 'toggle-attendance';
} else if (preg_match('#^/employees/(\d+)$#', $path, $matches)) {
    $id = $matches[1];
}

if ($method === 'GET' && !$id) {
    $rows = all("
      SELECT e.*, u.full_name, u.phone, u.email
      FROM employees e
      LEFT JOIN users u ON e.user_id = u.id
      ORDER BY e.id ASC
    ");

    $employees = array_map(function($r) {
        return [
            'id' => $r['id'],
            'empCode' => $r['employee_code'],
            'name' => $r['full_name'] ?: "Employee {$r['employee_code']}",
            'roleTitle' => $r['position'] ?: 'Staff',
            'department' => 'Workshop',
            'phone' => $r['phone'] ?? '',
            'email' => $r['email'] ?? '',
            'baseSalary' => $r['salary'] ? "$" . $r['salary'] . "/mo" : "$3,500/mo",
            'attendanceToday' => 'Present',
            'status' => $r['employment_status'] ?: 'Active',
            'image' => $r['photo_url'] ?? ''
        ];
    }, $rows);

    echo json_encode(['data' => $employees]);
    exit;

} else if ($method === 'POST' && !$id) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $name = $input['name'] ?? '';
    if (!trim($name)) {
        http_response_code(400);
        echo json_encode(['error' => 'Employee name is required']);
        exit;
    }

    $countRow = get('SELECT COUNT(*) AS cnt FROM employees');
    $cnt = (int)($countRow['cnt'] ?? 0) + 1;
    $empCode = 'EMP-' . str_pad($cnt, 3, '0', STR_PAD_LEFT);

    $username = 'emp_' . time();
    $password = $input['password'] ?? 'password123';
    $secureHash = password_hash($password, PASSWORD_BCRYPT);
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

    $salaryStr = $input['baseSalary'] ?? '3500';
    $salaryNum = (float)preg_replace('/[^0-9.]/', '', $salaryStr);
    if (!$salaryNum) $salaryNum = 3500;
    
    $finalPhoto = $input['image'] ?? $input['photoUrl'] ?? null;
    $roleTitle = $input['roleTitle'] ?? 'Staff';
    $specialization = $input['specialization'] ?? null;
    $experience = !empty($input['experience']) ? (int)$input['experience'] : 0;
    $status = $input['status'] ?? 'Active';

    try {
        run(
            "INSERT INTO employees (user_id, employee_code, position, specialization, experience_years, salary, employment_status, photo_url)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [$userId, $empCode, $roleTitle, $specialization, $experience, $salaryNum, $status, $finalPhoto]
        );
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'photo_url') !== false) {
            run("ALTER TABLE employees ADD COLUMN IF NOT EXISTS photo_url TEXT;");
            run(
                "INSERT INTO employees (user_id, employee_code, position, specialization, experience_years, salary, employment_status, photo_url)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                [$userId, $empCode, $roleTitle, $specialization, $experience, $salaryNum, $status, $finalPhoto]
            );
        } else {
            throw $e;
        }
    }

    $empId = $pdo->lastInsertId();
    if (!$empId) {
        $eRow = get("SELECT id FROM employees WHERE employee_code = ?", [$empCode]);
        $empId = $eRow['id'];
    }

    http_response_code(201);
    echo json_encode(['data' => [
        'id' => $empId,
        'empCode' => $empCode,
        'name' => $name,
        'roleTitle' => $roleTitle,
        'department' => 'Workshop',
        'phone' => $phone ?? '',
        'email' => $email ?? '',
        'baseSalary' => "$" . $salaryNum . "/mo",
        'attendanceToday' => 'Present',
        'status' => $status,
        'image' => $finalPhoto ?? '',
    ]]);
    exit;

} else if ($method === 'PUT' && $id) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $salaryStr = $input['baseSalary'] ?? null;
    $salaryNum = $salaryStr ? (float)preg_replace('/[^0-9.]/', '', $salaryStr) : null;
    $finalPhoto = $input['image'] ?? $input['photoUrl'] ?? null;
    
    try {
        run(
            "UPDATE employees
             SET position = COALESCE(?, position),
                 salary = COALESCE(?, salary),
                 employment_status = COALESCE(?, employment_status),
                 photo_url = COALESCE(?, photo_url),
                 updated_at = NOW()
             WHERE id = ?",
            [$input['roleTitle'] ?? null, $salaryNum, $input['status'] ?? null, $finalPhoto, $id]
        );
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'photo_url') !== false) {
            run("ALTER TABLE employees ADD COLUMN IF NOT EXISTS photo_url TEXT;");
            run(
                "UPDATE employees
                 SET position = COALESCE(?, position),
                     salary = COALESCE(?, salary),
                     employment_status = COALESCE(?, employment_status),
                     photo_url = COALESCE(?, photo_url),
                     updated_at = NOW()
                 WHERE id = ?",
                [$input['roleTitle'] ?? null, $salaryNum, $input['status'] ?? null, $finalPhoto, $id]
            );
        } else {
            throw $e;
        }
    }

    $emp = get('SELECT * FROM employees WHERE id = ?', [$id]);
    if (!$emp) {
        http_response_code(404);
        echo json_encode(['error' => 'Employee not found']);
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
        'empCode' => $emp['employee_code'],
        'name' => $input['name'] ?? 'Employee',
        'roleTitle' => $emp['position'],
        'department' => 'Workshop',
        'phone' => $input['phone'] ?? '',
        'email' => $input['email'] ?? '',
        'baseSalary' => "$" . $emp['salary'] . "/mo",
        'attendanceToday' => 'Present',
        'status' => $emp['employment_status'],
        'image' => $emp['photo_url'] ?? '',
    ]]);
    exit;

} else if ($method === 'POST' && $id && $action === 'toggle-attendance') {
    echo json_encode(['success' => true, 'message' => 'Attendance toggled']);
    exit;

} else if ($method === 'DELETE' && $id) {
    $emp = get('SELECT user_id FROM employees WHERE id = ?', [$id]);
    if (!$emp) {
        http_response_code(404);
        echo json_encode(['error' => 'Employee not found']);
        exit;
    }

    if (!empty($emp['user_id'])) {
        run('DELETE FROM users WHERE id = ?', [$emp['user_id']]);
    } else {
        run('DELETE FROM employees WHERE id = ?', [$id]);
    }
    echo json_encode(['success' => true, 'message' => 'Employee removed successfully']);
    exit;
}

http_response_code(404);
echo json_encode(['error' => 'Employee endpoint not found']);
