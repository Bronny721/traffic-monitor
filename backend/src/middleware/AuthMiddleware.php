<?php

namespace App\Middleware;

use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use Slim\Psr7\Response;
use App\Services\Auth\JWTService;

class AuthMiddleware
{
    public function __construct(private JWTService $jwtService)
    {}

    public function __invoke(Request $request, RequestHandler $handler): Response
    {
        $response = new Response();
        
        // 獲取 Authorization header
        $header = $request->getHeaderLine('Authorization');
        
        // 檢查 header 格式
        if (empty($header) || !preg_match('/Bearer\s+(.*)$/i', $header, $matches)) {
            $response->getBody()->write(json_encode([
                'error' => '未授權訪問'
            ]));
            return $response
                ->withStatus(401)
                ->withHeader('Content-Type', 'application/json');
        }

        $token = $matches[1];
        $payload = $this->jwtService->verifyToken($token);

        if ($payload === null) {
            $response->getBody()->write(json_encode([
                'error' => 'token無效或已過期'
            ]));
            return $response
                ->withStatus(401)
                ->withHeader('Content-Type', 'application/json');
        }

        // 將用戶信息添加到請求屬性中
        $request = $request->withAttribute('user', $payload);
        
        return $handler->handle($request);
    }
} 