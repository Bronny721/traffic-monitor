<?php

use DI\ContainerBuilder;
use Slim\Factory\AppFactory;
use Dotenv\Dotenv;

require __DIR__ . '/../vendor/autoload.php';

// 載入環境變數
$dotenv = Dotenv::createImmutable(__DIR__ . '/../../');
$dotenv->load();

// 創建 DI 容器
$containerBuilder = new ContainerBuilder();

// 添加依賴定義
$containerBuilder->addDefinitions(__DIR__ . '/config/container.php');

// 構建容器
$container = $containerBuilder->build();

// 創建應用
$app = AppFactory::createFromContainer($container);

// 添加中間件
$app->addBodyParsingMiddleware();
$app->addErrorMiddleware(true, true, true);

// 跨域設置
$app->add(function ($request, $handler) {
    $response = $handler->handle($request);
    return $response
        ->withHeader('Access-Control-Allow-Origin', $_ENV['FRONTEND_URL'] ?? '*')
        ->withHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Origin, Authorization')
        ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
});

// 載入路由
require __DIR__ . '/routes/api.php';

return $app; 