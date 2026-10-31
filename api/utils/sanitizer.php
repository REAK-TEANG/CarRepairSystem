<?php
// api/utils/sanitizer.php

class Sanitizer
{
    /**
     * Recursively clean input data:
     * - Trim whitespace
     * - Strip null byte characters (\0)
     * - Strip HTML and PHP tags to prevent Cross-Site Scripting (XSS)
     */
    public static function clean(mixed $data): mixed
    {
        if (is_array($data)) {
            $cleaned = [];
            foreach ($data as $k => $v) {
                $cleanKey = is_string($k) ? trim(strip_tags(str_replace("\0", '', $k))) : $k;
                $cleaned[$cleanKey] = self::clean($v);
            }
            return $cleaned;
        }

        if (is_string($data)) {
            $trimmed = trim($data);
            $noNull = str_replace("\0", '', $trimmed);
            return strip_tags($noNull);
        }

        return $data;
    }

    /**
     * Read and sanitize JSON payload from php://input safely
     */
    public static function getJsonInput(): array
    {
        $raw = file_get_contents('php://input');
        if (!$raw) {
            return [];
        }

        $decoded = json_decode($raw, true);
        if (!is_array($decoded)) {
            return [];
        }

        return self::clean($decoded);
    }

    /**
     * Validate password complexity requirements:
     * - Minimum 8 characters
     * - At least one letter (a-z or A-Z)
     * - At least one number (0-9)
     * - Disallow trivial and easily guessed passwords
     */
    public static function validatePassword(string $password): array
    {
        $length = strlen($password);
        if ($length < 8) {
            return [
                'valid' => false,
                'error' => 'Password must be at least 8 characters long.'
            ];
        }

        if (!preg_match('/[a-zA-Z]/', $password)) {
            return [
                'valid' => false,
                'error' => 'Password must contain at least one letter.'
            ];
        }

        if (!preg_match('/[0-9]/', $password)) {
            return [
                'valid' => false,
                'error' => 'Password must contain at least one number.'
            ];
        }

        $trivial = [
            '12345678',
            'password',
            'password123',
            'admin123',
            'qwerty123',
            'pass1234',
            'welcome123',
            'letmein123'
        ];

        if (in_array(strtolower($password), $trivial, true)) {
            return [
                'valid' => false,
                'error' => 'Password is too common. Please choose a stronger password.'
            ];
        }

        return ['valid' => true];
    }

    /**
     * Validate email format
     */
    public static function validateEmail(?string $email): bool
    {
        if (!$email) {
            return false;
        }
        return (bool) filter_var($email, FILTER_VALIDATE_EMAIL);
    }
}

