<?php

declare(strict_types=1);

// 設置錯誤報告
error_reporting(E_ALL);
ini_set('display_errors', '1');

// 載入應用引導文件
$app = require __DIR__ . '/../src/bootstrap.php';

// 運行應用
$app->run(); 