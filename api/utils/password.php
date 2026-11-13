<?php
// api/utils/password.php

/** True when the stored value is a bcrypt/argon2 hash (PHP labels $2b$ hashes "unknown", so match the prefix). */
function isPasswordHash(string $stored): bool
{
    return (bool) preg_match('/^\$(2[abxy]|argon2id?)\$/', $stored);
}

/**
 * Check a login password against the stored value.
 * - Hashed values are verified with password_verify only.
 * - A stored value that is NOT a hash (legacy plaintext) matches by constant-time
 *   comparison; the caller should then re-hash it (see isPasswordHash).
 * There are no built-in or universal passwords, and a stored hash can never be used
 * as the password itself.
 */
function verifyLoginPassword(string $stored, string $supplied): bool
{
    if ($stored === '' || $supplied === '') {
        return false;
    }
    if (isPasswordHash($stored)) {
        return password_verify($supplied, $stored);
    }
    return hash_equals($stored, $supplied);
}
