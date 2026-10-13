<?php
// api/utils/headers.php

if (!function_exists('getallheaders')) {
    function getallheaders(): array
    {
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (str_starts_with($name, 'HTTP_')) {
                $headerName = str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))));
                $headers[$headerName] = $value;
            } elseif ($name === 'CONTENT_TYPE') {
                $headers['Content-Type'] = $value;
            } elseif ($name === 'CONTENT_LENGTH') {
                $headers['Content-Length'] = $value;
            }
        }
        return $headers;
    }
}

/**
 * Robustly resolve the Authorization header across all SAPI / web server environments.
 */
function getAuthorizationHeader(): string
{
    if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
        return trim($_SERVER['HTTP_AUTHORIZATION']);
    }
    if (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        return trim($_SERVER['REDIRECT_HTTP_AUTHORIZATION']);
    }

    $headers = getallheaders();
    foreach ($headers as $key => $val) {
        if (strtolower($key) === 'authorization') {
            return trim($val);
        }
    }

    return '';
}

/**
 * Extract Bearer token from headers or query string fallback.
 */
function getBearerToken(): ?string
{
    $authHeader = getAuthorizationHeader();
    if ($authHeader && preg_match('/Bearer\s(\S+)/i', $authHeader, $matches)) {
        return $matches[1];
    }

    if (!empty($_GET['token'])) {
        return trim((string) $_GET['token']);
    }

    return null;
}
