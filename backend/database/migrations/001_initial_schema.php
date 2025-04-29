<?php

namespace App\Database\Migrations;

use PDO;

class InitialSchema
{
    public function up(PDO $pdo): void
    {
        // 讀取並執行schema.sql文件
        $sql = file_get_contents(__DIR__ . '/../schema.sql');
        $pdo->exec($sql);
    }

    public function down(PDO $pdo): void
    {
        // 刪除所有表
        $tables = [
            'alerts',
            'alert_rules',
            'traffic_data',
            'cameras',
            'settings',
            'users'
        ];

        // 禁用外鍵檢查
        $pdo->exec('SET FOREIGN_KEY_CHECKS = 0');

        foreach ($tables as $table) {
            $pdo->exec("DROP TABLE IF EXISTS `{$table}`");
        }

        // 啟用外鍵檢查
        $pdo->exec('SET FOREIGN_KEY_CHECKS = 1');
    }
} 