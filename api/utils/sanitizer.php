<?php
// api/utils/sanitizer.php

class Sanitizer
{
    /**
     * Recursively normalise input data:
     * - trim surrounding whitespace
     * - remove NUL bytes and other control characters (tab, newline and carriage return are kept)
     *
     * Text is otherwise kept exactly as sent. HTML is not stripped here: that silently corrupted
     * legitimate values (e.g. 'Tyres 15"<16"', passwords containing '<'). Output is escaped where it
     * is rendered instead: React escapes all text, and the report print view uses escapeHtml().
     */
    public static function clean(mixed $data): mixed
    {
        if (is_array($data)) {
            $cleaned = [];
            foreach ($data as $k => $v) {
                $cleaned[is_string($k) ? self::cleanString($k) : $k] = self::clean($v);
            }
            return $cleaned;
        }

        return is_string($data) ? self::cleanString($data) : $data;
    }

    /**
     * Make a value safe for a CSV cell opened in Excel/Sheets: text starting with = + - @ or a
     * tab/CR would otherwise run as a formula (CSV injection). Such text gets a leading apostrophe.
     */
    public static function csvCell(mixed $value): string
    {
        $text = (string) ($value ?? '');
        return preg_match('/^[=+\-@\t\r]/', $text) ? "'" . $text : $text;
    }

    private static function cleanString(string $value): string
    {
        // Byte mode (no /u): these bytes never occur inside a multi-byte UTF-8 character, and
        // invalid UTF-8 cannot make the call fail and blank the value.
        return trim(preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $value));
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

