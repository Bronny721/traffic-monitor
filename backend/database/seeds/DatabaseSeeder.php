<?php

namespace App\Database\Seeds;

use PDO;

class DatabaseSeeder
{
    public function run(PDO $pdo): void
    {
        // 讀取並執行init.sql文件
        $sql = file_get_contents(__DIR__ . '/../init.sql');
        $pdo->exec($sql);

        // 生成測試數據
        $this->generateTestData($pdo);
    }

    private function generateTestData(PDO $pdo): void
    {
        // 生成一些測試用戶
        $users = [
            ['Test User 1', 'user1@test.com', 'password', 'user'],
            ['Test User 2', 'user2@test.com', 'password', 'user']
        ];

        $stmt = $pdo->prepare("
            INSERT INTO users (name, email, password, role)
            VALUES (?, ?, ?, ?)
        ");

        foreach ($users as $user) {
            $stmt->execute([
                $user[0],
                $user[1],
                password_hash($user[2], PASSWORD_DEFAULT),
                $user[3]
            ]);
        }

        // 生成一些測試交通數據
        $trafficData = [];
        $cameras = [1, 2]; // 使用init.sql中創建的攝像頭ID
        $now = time();

        for ($i = 0; $i < 100; $i++) {
            $timestamp = date('Y-m-d H:i:s', $now - ($i * 3600)); // 每小時一條數據
            foreach ($cameras as $cameraId) {
                $trafficData[] = [
                    $cameraId,
                    $timestamp,
                    rand(10, 100), // 車輛數
                    rand(5, 50),   // 行人數
                    rand(30, 70),  // 平均速度
                    ['low', 'medium', 'high'][rand(0, 2)], // 交通密度
                    ['sunny', 'rainy', 'cloudy'][rand(0, 2)] // 天氣狀況
                ];
            }
        }

        $stmt = $pdo->prepare("
            INSERT INTO traffic_data 
            (camera_id, timestamp, vehicle_count, pedestrian_count, average_speed, traffic_density, weather_condition)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");

        foreach ($trafficData as $data) {
            $stmt->execute($data);
        }

        // 生成一些警報規則
        $alertRules = [
            ['High Traffic Alert', 1, 'vehicle_count', 80, '>', 1],
            ['Speed Alert', 1, 'speed', 60, '>', 1],
            ['Pedestrian Alert', 2, 'pedestrian_count', 40, '>', 1]
        ];

        $stmt = $pdo->prepare("
            INSERT INTO alert_rules 
            (name, camera_id, condition_type, threshold_value, comparison_operator, created_by)
            VALUES (?, ?, ?, ?, ?, ?)
        ");

        foreach ($alertRules as $rule) {
            $stmt->execute($rule);
        }
    }
} 