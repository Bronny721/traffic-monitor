<?php

namespace App\Services\Auth;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use UnexpectedValueException;

class JWTService
{
    public function __construct(
        private string $secretKey,
        private string $algorithm = 'HS256',
        private int $expirationTime = 3600 // 默認1小時
    ) {}

    public function generateToken(array $payload): string
    {
        $issuedAt = time();
        $expire = $issuedAt + $this->expirationTime;

        $tokenPayload = array_merge(
            $payload,
            [
                'iat' => $issuedAt,
                'exp' => $expire
            ]
        );

        return JWT::encode($tokenPayload, $this->secretKey, $this->algorithm);
    }

    public function verifyToken(string $token): ?array
    {
        try {
            return (array) JWT::decode(
                $token,
                new Key($this->secretKey, $this->algorithm)
            );
        } catch (UnexpectedValueException $e) {
            return null;
        }
    }

    public function refreshToken(string $token): ?string
    {
        $payload = $this->verifyToken($token);
        if ($payload === null) {
            return null;
        }

        // 移除舊的時間戳
        unset($payload['iat']);
        unset($payload['exp']);

        return $this->generateToken($payload);
    }
} 