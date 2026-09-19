<?php
// api/models/EmployeeModel.php

class EmployeeModel
{
    public static function getAll(): array
    {
        $rows = Database::all("
          SELECT e.*, u.full_name, u.phone, u.email
          FROM employees e
          LEFT JOIN users u ON e.user_id = u.id
          ORDER BY e.id ASC
        ");

        return array_map([self::class, 'format'], $rows);
    }

    public static function create(array $input): array
    {
        $name     = trim($input['name'] ?? '');
        $phone    = $input['phone'] ?? null;
        $email    = $input['email'] ?? null;
        $password = $input['password'] ?? 'password123';

        $countRow = Database::get('SELECT COUNT(*) AS cnt FROM employees');
        $cnt      = (int) ($countRow['cnt'] ?? 0) + 1;
        $empCode  = 'EMP-' . str_pad($cnt, 3, '0', STR_PAD_LEFT);

        $username   = 'emp_' . time();
        $hash       = password_hash($password, PASSWORD_BCRYPT);
        $userEmail  = $email ?? "$username@carrepair.com";

        Database::run(
            "INSERT INTO users (username, email, password_hash, full_name, phone, role_id) VALUES (?, ?, ?, ?, ?, 4)",
            [$username, $userEmail, $hash, $name, $phone]
        );

        $uRow   = Database::get("SELECT id FROM users WHERE username = ? ORDER BY id DESC LIMIT 1", [$username]);
        $userId = (int) ($uRow['id'] ?? 0);

        $salaryStr  = $input['baseSalary'] ?? '3500';
        $salaryNum  = (float) preg_replace('/[^0-9.]/', '', $salaryStr) ?: 3500.0;
        $finalPhoto = $input['image'] ?? $input['photoUrl'] ?? null;
        $roleTitle  = $input['roleTitle'] ?? 'Staff';
        $spec       = $input['specialization'] ?? null;
        $experience = !empty($input['experience']) ? (int) $input['experience'] : 0;
        $status     = $input['status'] ?? 'Active';

        Database::run(
            "INSERT INTO employees (user_id, employee_code, position, specialization, experience_years, salary, employment_status, photo_url)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [$userId, $empCode, $roleTitle, $spec, $experience, $salaryNum, $status, $finalPhoto]
        );

        $eRow  = Database::get("SELECT id FROM employees WHERE employee_code = ? ORDER BY id DESC LIMIT 1", [$empCode]);
        $empId = (int) ($eRow['id'] ?? 0);

        return [
            'id'              => $empId,
            'empCode'         => $empCode,
            'name'            => $name,
            'roleTitle'       => $roleTitle,
            'department'      => 'Workshop',
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

        Database::run(
            "UPDATE employees
             SET position          = COALESCE(?, position),
                 salary            = COALESCE(?, salary),
                 employment_status = COALESCE(?, employment_status),
                 photo_url         = COALESCE(?, photo_url),
                 updated_at        = NOW()
             WHERE id = ?",
            [$input['roleTitle'] ?? null, $salaryNum, $input['status'] ?? null, $finalPhoto, $id]
        );

        $emp = Database::get('SELECT * FROM employees WHERE id = ?', [$id]);
        if (!$emp) {
            return null;
        }

        if (!empty($emp['user_id'])) {
            Database::run(
                "UPDATE users
                 SET full_name  = COALESCE(?, full_name),
                     phone      = COALESCE(?, phone),
                     email      = COALESCE(?, email),
                     updated_at = NOW()
                 WHERE id = ?",
                [$input['name'] ?? null, $input['phone'] ?? null, $input['email'] ?? null, $emp['user_id']]
            );
        }

        return self::format(array_merge($emp, [
            'full_name' => $input['name']  ?? 'Employee',
            'phone'     => $input['phone'] ?? '',
            'email'     => $input['email'] ?? '',
        ]));
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
        return [
            'id'              => $r['id'],
            'empCode'         => $r['employee_code'],
            'name'            => $r['full_name'] ?: "Employee {$r['employee_code']}",
            'roleTitle'       => $r['position']  ?: 'Staff',
            'department'      => 'Workshop',
            'phone'           => $r['phone'] ?? '',
            'email'           => $r['email'] ?? '',
            'baseSalary'      => $r['salary'] ? '$' . $r['salary'] . '/mo' : '$3,500/mo',
            'attendanceToday' => 'Present',
            'status'          => $r['employment_status'] ?: 'Active',
            'image'           => $r['photo_url'] ?? '',
        ];
    }
}
