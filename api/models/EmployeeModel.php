<?php
// api/models/EmployeeModel.php

class EmployeeModel
{
    public static function getAll(): array
    {
        $rows = Database::all("
          SELECT e.*, u.full_name, u.phone, u.email, u.role_id, r.name AS role_name
          FROM employees e
          LEFT JOIN users u ON e.user_id = u.id
          LEFT JOIN roles r ON u.role_id = r.id
          ORDER BY e.id ASC
        ");

        return array_map([self::class, 'format'], $rows);
    }

    public static function getPaginated(string $search = '', int $page = 1, int $limit = 10, ?string $status = null): array
    {
        $countSql = "
          SELECT COUNT(e.id) AS cnt
          FROM employees e
          LEFT JOIN users u ON e.user_id = u.id
          LEFT JOIN roles r ON u.role_id = r.id
          WHERE 1=1
        ";
        $countParams = [];
        if ($search) {
            $countSql .= " AND (u.full_name ILIKE ? OR e.employee_code ILIKE ? OR e.position ILIKE ? OR u.phone ILIKE ? OR u.email ILIKE ? OR r.name ILIKE ?)";
            $countParams = array_merge($countParams, ["%$search%", "%$search%", "%$search%", "%$search%", "%$search%", "%$search%"]);
        }
        if ($status && $status !== 'All' && $status !== 'All Status') {
            $countSql .= " AND e.employment_status = ?";
            $countParams[] = $status;
        }

        $countRow = Database::get($countSql, $countParams);
        $total = (int) ($countRow['cnt'] ?? 0);

        $offset = max(0, ($page - 1) * $limit);
        $sql = "
          SELECT e.*, u.full_name, u.phone, u.email, u.role_id, r.name AS role_name
          FROM employees e
          LEFT JOIN users u ON e.user_id = u.id
          LEFT JOIN roles r ON u.role_id = r.id
          WHERE 1=1
        ";
        $params = [];
        if ($search) {
            $sql .= " AND (u.full_name ILIKE ? OR e.employee_code ILIKE ? OR e.position ILIKE ? OR u.phone ILIKE ? OR u.email ILIKE ? OR r.name ILIKE ?)";
            $params = array_merge($params, ["%$search%", "%$search%", "%$search%", "%$search%", "%$search%", "%$search%"]);
        }
        if ($status && $status !== 'All' && $status !== 'All Status') {
            $sql .= " AND e.employment_status = ?";
            $params[] = $status;
        }
        $sql .= " ORDER BY e.id ASC LIMIT $limit OFFSET $offset";

        $rows = Database::all($sql, $params);
        return [
            'data' => array_map([self::class, 'format'], $rows),
            'total' => $total,
        ];
    }

    public static function create(array $input): array
    {
        $name     = trim($input['name'] ?? '');
        $phone    = $input['phone'] ?? null;
        $email    = $input['email'] ?? null;
        $password = !empty($input['password']) ? trim($input['password']) : '123456';

        // Resolve role_id
        $roleId = 4; // default Mechanic
        if (!empty($input['roleId'])) {
            $roleId = (int) $input['roleId'];
        } elseif (!empty($input['role'])) {
            $normalized = strtolower(str_replace('_', ' ', trim($input['role'])));
            $rRow = Database::get("SELECT id FROM roles WHERE LOWER(name) = ? OR LOWER(name) = ?", [$normalized, trim($input['role'])]);
            if ($rRow) {
                $roleId = (int) $rRow['id'];
            }
        }

        $countRow = Database::get('SELECT COUNT(*) AS cnt FROM employees');
        $cnt      = (int) ($countRow['cnt'] ?? 0) + 1;
        $empCode  = 'EMP-' . str_pad($cnt, 3, '0', STR_PAD_LEFT);

        $username   = 'emp_' . time() . '_' . rand(10, 99);
        $hash       = password_hash($password, PASSWORD_BCRYPT);
        $userEmail  = $email ?: "$username@carrepair.com";

        Database::run(
            "INSERT INTO users (username, email, password_hash, full_name, phone, role_id) VALUES (?, ?, ?, ?, ?, ?)",
            [$username, $userEmail, $hash, $name, $phone, $roleId]
        );

        $uRow   = Database::get("SELECT id FROM users WHERE username = ? ORDER BY id DESC LIMIT 1", [$username]);
        $userId = (int) ($uRow['id'] ?? 0);

        $salaryStr   = $input['baseSalary'] ?? '3500';
        $salaryNum   = (float) preg_replace('/[^0-9.]/', '', $salaryStr) ?: 3500.0;
        $finalPhoto  = $input['image'] ?? $input['photoUrl'] ?? null;
        $roleTitle   = $input['roleTitle'] ?? 'Staff';
        $department  = $input['department'] ?? 'Workshop';
        $spec        = $input['specialization'] ?? null;
        $experience  = !empty($input['experience']) ? (int) $input['experience'] : 0;
        $status      = $input['status'] ?? 'Active';

        Database::run(
            "INSERT INTO employees (user_id, employee_code, position, department, specialization, experience_years, salary, employment_status, photo_url)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [$userId, $empCode, $roleTitle, $department, $spec, $experience, $salaryNum, $status, $finalPhoto]
        );

        $eRow  = Database::get("SELECT id FROM employees WHERE employee_code = ? ORDER BY id DESC LIMIT 1", [$empCode]);
        $empId = (int) ($eRow['id'] ?? 0);

        $rRow = Database::get("SELECT name FROM roles WHERE id = ?", [$roleId]);
        $roleName = $rRow['name'] ?? 'Mechanic';

        return [
            'id'              => $empId,
            'userId'          => $userId,
            'empCode'         => $empCode,
            'name'            => $name,
            'roleTitle'       => $roleTitle,
            'department'      => $department,
            'roleId'          => $roleId,
            'role'            => strtolower(str_replace(' ', '_', $roleName)),
            'roleName'        => $roleName,
            'phone'           => $phone ?? '',
            'email'           => $userEmail,
            'baseSalary'      => '$' . $salaryNum . '/mo',
            'attendanceToday' => 'Present',
            'status'          => $status,
            'image'           => $finalPhoto ?? '',
        ];
    }

    public static function update(int $id, array $input): ?array
    {
        $salaryStr  = $input['baseSalary'] ?? null;
        $salaryNum  = $salaryStr ? (float) preg_replace('/[^0-9.]/', '', $salaryStr) : null;
        $finalPhoto = $input['image'] ?? $input['photoUrl'] ?? null;
        $dept       = $input['department'] ?? null;

        Database::run(
            "UPDATE employees
             SET position          = COALESCE(?, position),
                 department        = COALESCE(?, department),
                 salary            = COALESCE(?, salary),
                 employment_status = COALESCE(?, employment_status),
                 photo_url         = COALESCE(?, photo_url),
                 updated_at        = NOW()
             WHERE id = ?",
            [$input['roleTitle'] ?? null, $dept, $salaryNum, $input['status'] ?? null, $finalPhoto, $id]
        );

        $emp = Database::get('SELECT * FROM employees WHERE id = ?', [$id]);
        if (!$emp) {
            return null;
        }

        if (!empty($emp['user_id'])) {
            // Find role_id if role or roleId provided
            $roleId = null;
            if (!empty($input['roleId'])) {
                $roleId = (int) $input['roleId'];
            } elseif (!empty($input['role'])) {
                $normalized = strtolower(str_replace('_', ' ', trim($input['role'])));
                $rRow = Database::get("SELECT id FROM roles WHERE LOWER(name) = ? OR LOWER(name) = ?", [$normalized, trim($input['role'])]);
                if ($rRow) {
                    $roleId = (int) $rRow['id'];
                }
            }

            Database::run(
                "UPDATE users
                 SET full_name  = COALESCE(?, full_name),
                     phone      = COALESCE(?, phone),
                     email      = COALESCE(?, email),
                     role_id    = COALESCE(?, role_id),
                     updated_at = NOW()
                 WHERE id = ?",
                [$input['name'] ?? null, $input['phone'] ?? null, $input['email'] ?? null, $roleId, $emp['user_id']]
            );

            // If admin set or reset password
            if (!empty($input['password']) && trim($input['password']) !== '') {
                $hash = password_hash(trim($input['password']), PASSWORD_BCRYPT);
                Database::run(
                    "UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?",
                    [$hash, $emp['user_id']]
                );
            }
        }

        $row = Database::get("
            SELECT e.*, u.full_name, u.phone, u.email, u.role_id, r.name AS role_name
            FROM employees e
            LEFT JOIN users u ON e.user_id = u.id
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE e.id = ?
        ", [$id]);

        return $row ? self::format($row) : null;
    }

    public static function delete(int $id): bool
    {
        $emp = Database::get('SELECT user_id FROM employees WHERE id = ?', [$id]);
        if (!$emp) {
            return false;
        }

        if (!empty($emp['user_id'])) {
            Database::run('DELETE FROM users WHERE id = ?', [$emp['user_id']]);
        } else {
            Database::run('DELETE FROM employees WHERE id = ?', [$id]);
        }
        return true;
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private static function format(array $r): array
    {
        $rawRoleName = $r['role_name'] ?? 'Mechanic';
        $roleKey = strtolower(str_replace(' ', '_', $rawRoleName));

        return [
            'id'              => (int) $r['id'],
            'userId'          => (int) ($r['user_id'] ?? 0),
            'empCode'         => $r['employee_code'],
            'name'            => $r['full_name'] ?: "Employee {$r['employee_code']}",
            'roleTitle'       => $r['position'] ?: 'Staff',
            'department'      => $r['department'] ?: 'Workshop',
            'roleId'          => (int) ($r['role_id'] ?? 4),
            'role'            => $roleKey,
            'roleName'        => $rawRoleName,
            'phone'           => $r['phone'] ?? '',
            'email'           => $r['email'] ?? '',
            'baseSalary'      => $r['salary'] ? '$' . $r['salary'] . '/mo' : '$3,500/mo',
            'attendanceToday' => 'Present',
            'status'          => $r['employment_status'] ?: 'Active',
            'image'           => $r['photo_url'] ?? '',
        ];
    }
}
