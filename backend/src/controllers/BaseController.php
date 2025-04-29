<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Log\LoggerInterface;
use App\Services\Database\DatabaseService;

abstract class BaseController
{
    public function __construct(
        protected DatabaseService $db,
        protected LoggerInterface $logger
    ) {}

    protected function jsonResponse(
        Response $response,
        array $data,
        int $status = 200
    ): Response {
        $response->getBody()->write(json_encode($data));
        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus($status);
    }

    protected function errorResponse(
        Response $response,
        string $message,
        int $status = 400
    ): Response {
        return $this->jsonResponse($response, ['error' => $message], $status);
    }
} 