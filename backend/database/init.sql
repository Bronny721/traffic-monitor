-- 創建數據庫
CREATE DATABASE IF NOT EXISTS traffic_monitor
    CHARACTER SET = utf8mb4
    COLLATE = utf8mb4_unicode_ci;

USE traffic_monitor;

-- 導入數據庫結構
SOURCE schema.sql;

-- 創建默認管理員用戶
INSERT INTO users (name, email, password, role) VALUES (
    'Admin',
    'admin@traffic-monitor.com',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: password
    'admin'
);

-- 插入默認系統設置
INSERT INTO settings (key_name, value, description) VALUES
    ('alert_notification_email', 'alerts@traffic-monitor.com', '警報通知郵件地址'),
    ('video_retention_days', '30', '視頻保留天數'),
    ('max_cameras', '10', '最大攝像頭數量'),
    ('analysis_interval', '5', '分析間隔（分鐘）');

-- 創建測試攝像頭
INSERT INTO cameras (name, location, stream_url, status, created_by) VALUES
    ('Camera 1', '主要十字路口', 'rtsp://camera1.test/stream', 'active', 1),
    ('Camera 2', '商業區入口', 'rtsp://camera2.test/stream', 'active', 1); 