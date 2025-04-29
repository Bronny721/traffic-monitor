<?php

use Slim\App;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Controllers\AuthController;
use App\Controllers\UserController;
use App\Controllers\TrafficController;
use App\Middleware\AuthMiddleware;

return function (App $app) {
    // 健康檢查路由
    $app->get('/health', function (Request $request, Response $response) {
        $response->getBody()->write(json_encode(['status' => 'ok']));
        return $response->withHeader('Content-Type', 'application/json');
    });

    // API 路由組
    $app->group('/api', function ($group) {
        // 認證相關路由
        $group->post('/auth/login', [AuthController::class, 'login']);
        $group->post('/auth/register', [AuthController::class, 'register']);
        
        // 需要認證的路由
        $group->group('', function ($group) {
            // 用戶相關路由
            $group->get('/users/profile', [UserController::class, 'getProfile']);
            $group->put('/users/profile', [UserController::class, 'updateProfile']);
            
            // 流量監控相關路由
            $group->get('/traffic/stats', [TrafficController::class, 'getStats']);
            $group->get('/traffic/realtime', [TrafficController::class, 'getRealtime']);
            $group->post('/traffic/alerts', [TrafficController::class, 'createAlert']);
            $group->get('/traffic/alerts', [TrafficController::class, 'getAlerts']);
        })->add(AuthMiddleware::class);
    });
}; 