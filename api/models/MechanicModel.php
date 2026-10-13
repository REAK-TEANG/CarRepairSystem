<?php
// api/models/MechanicModel.php

class MechanicModel
{
    public static function getAll(): array
    {
        $rows = Database::all("
          SELECT e.*, u.full_name, u.phone, u.email,
                 COUNT(CASE WHEN ro.status::text != 'Completed' AND ro.id IS NOT NULL THEN 1 END) AS active_jobs,
                 COUNT(CASE WHEN ro.status::text = 'Completed' THEN 1 END) AS completed_jobs
          FROM employees e
          LEFT JOIN users u ON e.user_id = u.id
          LEFT JOIN repair_orders ro ON ro.mechanic_id = e.id
          GROUP BY e.id, u.full_name, u.phone, u.email
          ORDER BY e.id ASC
        ");

        return array_map([self::class, 'format'], $rows);
    }

    public static function getPaginated(string $search = '', int $page = 1, int $limit = 10, ?string $status = null): array
    {
        $countSql = "
          SELECT COUNT(DISTINCT e.id) AS cnt
          FROM employees e
          LEFT JOIN users u ON e.user_id = u.id
          WHERE 1=1
        ";
        $countParams = [];
        if ($search) {
            $countSql .= " AND (u.full_name ILIKE ? OR e.employee_code ILIKE ? OR e.specialization ILIKE ? OR u.phone ILIKE ? OR u.email ILIKE ?)";
            $countParams = array_merge($countParams, ["%$search%", "%$search%", "%$search%", "%$search%", "%$search%"]);
        }
        if ($status && $status !== 'All Status' && $status !== 'All') {
            $countSql .= " AND e.employment_status = ?";
            $countParams[] = $status;
        }

        $countRow = Database::get($countSql, $countParams);
        $total = (int) ($countRow['cnt'] ?? 0);

        $offset = max(0, ($page - 1) * $limit);
        $sql = "
          SELECT e.*, u.full_name, u.phone, u.email,
                 COUNT(CASE WHEN ro.status::text != 'Completed' AND ro.id IS NOT NULL THEN 1 END) AS active_jobs,
                 COUNT(CASE WHEN ro.status::text = 'Completed' THEN 1 END) AS completed_jobs
          FROM employees e
          LEFT JOIN users u ON e.user_id = u.id
          LEFT JOIN repair_orders ro ON ro.mechanic_id = e.id
          WHERE 1=1
        ";
        $params = [];
        if ($search) {
            $sql .= " AND (u.full_name ILIKE ? OR e.employee_code ILIKE ? OR e.specialization ILIKE ? OR u.phone ILIKE ? OR u.email ILIKE ?)";
            $params = array_merge($params, ["%$search%", "%$search%", "%$search%", "%$search%", "%$search%"]);
        }
        if ($status && $status !== 'All Status' && $status !== 'All') {
            $sql .= " AND e.employment_status = ?";
            $params[] = $status;
        }
        $sql .= " GROUP BY e.id, u.full_name, u.phone, u.email ORDER BY e.id ASC LIMIT $limit OFFSET $offset";

        $rows = Database::all($sql, $params);
        return [
            'data' => array_map([self::class, 'format'], $rows),
            'total' => $total,
        ];
    }

    public static function findById(int $id): ?array
    {
        $r = Database::get("
          SELECT e.*, u.full_name, u.phone, u.email,
                 COUNT(CASE WHEN ro.status::text != 'Completed' AND ro.id IS NOT NULL THEN 1 END) AS active_jobs,
                 COUNT(CASE WHEN ro.status::text = 'Completed' THEN 1 END) AS completed_jobs
          FROM employees e
          LEFT JOIN users u ON e.user_id = u.id
          LEFT JOIN repair_orders ro ON ro.mechanic_id = e.id
          WHERE e.id = ?
          GROUP BY e.id, u.full_name, u.phone, u.email
        ", [$id]);

        return $r ? self::format($r) : null;
    }

    public static function create(array $input): array
    {
        $name = trim($input['name'] ?? '');

        $countRow = Database::get('SELECT COUNT(*) AS cnt FROM employees');
        $cnt      = (int) ($countRow['cnt'] ?? 0) + 1;
        $code     = 'EMP-' . str_pad($cnt, 3, '0', STR_PAD_LEFT);

        $username = 'mech_' . time();
        $hash     = password_hash('password123', PASSWORD_BCRYPT);
        $email    = $input['email'] ?? "$username@carrepair.com";
        $phone    = $input['phone'] ?? null;

        Database::run(
            "INSERT INTO users (username, email, password_hash, full_name, phone, role_id) VALUES (?, ?, ?, ?, ?, 4)",
            [$username, $email, $hash, $name, $phone]
        );

        $uRow   = Database::get("SELECT id FROM users WHERE username = ? ORDER BY id DESC LIMIT 1", [$username]);
        $userId = (int) ($uRow['id'] ?? 0);

        $specialization = $input['specialization'] ?? 'General Repair';
        $experience     = !empty($input['experience']) ? (int) $input['experience'] : 3;
        $status         = $input['status'] ?? 'Active';

        Database::run(
            "INSERT INTO employees (user_id, employee_code, position, specialization, experience_years, employment_status)
             VALUES (?, ?, 'Mechanic', ?, ?, ?)",
            [$userId, $code, $specialization, $experience, $status]
        );

        $eRow  = Database::get("SELECT id FROM employees WHERE employee_code = ? ORDER BY id DESC LIMIT 1", [$code]);
        $empId = (int) ($eRow['id'] ?? 0);

        return [
            'id'             => $empId,
            'code'           => $code,
            'name'           => $name,
            'phone'          => $phone ?? '',
            'email'          => $email,
            'specialization' => $specialization,
            'experience'     => $experience,
            'rating'         => 5.0,
            'activeJobs'     => 0,
            'completedJobs'  => 0,
            'status'         => $status,
        ];
    }

    public static function update(int $id, array $input): ?array
    {
        Database::run(
            "UPDATE employees
             SET specialization   = COALESCE(?, specialization),
                 experience_years = COALESCE(?, experience_years),
                 employment_status = COALESCE(?, employment_status),
                 updated_at       = NOW()
             WHERE id = ?",
            [
                $input['specialization'] ?? null,
                !empty($input['experience']) ? (int) $input['experience'] : null,
                $input['status'] ?? null,
                $id,
            ]
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

        return [
            'id'             => $emp['id'],
            'code'           => $emp['employee_code'],
            'name'           => $input['name'] ?? 'Mechanic',
            'phone'          => $input['phone'] ?? '',
            'email'          => $input['email'] ?? '',
            'specialization' => $emp['specialization'],
            'experience'     => $emp['experience_years'],
            'rating'         => 4.9,
            'activeJobs'     => 0,
            'completedJobs'  => 0,
            'status'         => $emp['employment_status'],
        ];
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
            'id'             => $r['id'],
            'code'           => $r['employee_code'],
            'name'           => $r['full_name'] ?: "Mechanic {$r['employee_code']}",
            'phone'          => $r['phone'] ?? '',
            'email'          => $r['email'] ?? '',
            'specialization' => $r['specialization'] ?: 'General Repair',
            'experience'     => (int) ($r['experience_years'] ?? 5),
            'rating'         => 4.9,
            'activeJobs'     => (int) ($r['active_jobs'] ?? 0),
            'completedJobs'  => (int) ($r['completed_jobs'] ?? 0),
            'status'         => $r['employment_status'] ?: 'Active',
        ];
    }
}
