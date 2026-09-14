<?php
// api/utils/jwt.php

class JWT {
    private static function base64UrlEncode($text) {
        return str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($text));
    }

    private static function base64UrlDecode($text) {
        $b64 = str_replace(['-', '_'], ['+', '/'], $text);
        while (strlen($b64) % 4 != 0) {
            $b64 .= '=';
        }
        return base64_decode($b64);
    }

    public static function encode($payload, $secret) {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $base64UrlHeader = self::base64UrlEncode($header);
        $base64UrlPayload = self::base64UrlEncode(json_encode($payload));

        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $secret, true);
        $base64UrlSignature = self::base64UrlEncode($signature);

        return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
    }

    public static function decode($jwt, $secret) {
        $parts = explode('.', $jwt);
        if (count($parts) !== 3) {
            return false;
        }

        list($header64, $payload64, $signature64) = $parts;

        $signature = self::base64UrlDecode($signature64);
        $expectedSignature = hash_hmac('sha256', $header64 . "." . $payload64, $secret, true);

        if (!hash_equals($signature, $expectedSignature)) {
            return false;
        }

        $payload = json_decode(self::base64UrlDecode($payload64), true);

        if (isset($payload['exp']) && $payload['exp'] < time()) {
            return false; // Expired
        }

        return $payload;
    }
}
