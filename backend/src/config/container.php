<?php

use Psr\Container\ContainerInterface;
use App\Services\Database\DatabaseService;
use App\Services\Auth\JWTService;
use Monolog\Logger;
use Monolog\Handler\StreamHandler;

return [
    // 數據庫服務
    DatabaseService::class => function (ContainerInterface $container) {
        return new DatabaseService(
            $_ENV['DB_HOST'],
            $_ENV['DB_DATABASE'],
            $_ENV['DB_USERNAME'],
            $_ENV['DB_PASSWORD']
        );
    },

    // JWT 服務
    JWTService::class => function (ContainerInterface $container) {
        return new JWTService($_ENV['JWT_SECRET']);
    },

    // 日誌服務
    Logger::class => function (ContainerInterface $container) {
        $logger = new Logger('app');
        $logger->pushHandler(new StreamHandler(__DIR__ . '/../../logs/app.log', Logger::DEBUG));
        return $logger;
    },

    // Redis 客戶端
    Redis::class => function (ContainerInterface $container) {
        $redis = new Redis();
        $redis->connect(
            $_ENV['REDIS_HOST'],
            $_ENV['REDIS_PORT']
        );
        if (!empty($_ENV['REDIS_PASSWORD'])) {
            $redis->auth($_ENV['REDIS_PASSWORD']);
        }
        return $redis;
    },
]; 