-- 創建違規記錄表
CREATE TABLE violations (
    id CHAR(36) PRIMARY KEY,
    camera_id VARCHAR(50) NOT NULL,
    violation_type VARCHAR(50) NOT NULL,
    location VARCHAR(255) NOT NULL,
    timestamp DATETIME NOT NULL,
    image_url VARCHAR(255),
    video_url VARCHAR(255),
    confidence DECIMAL(5,4),
    status ENUM('pending', 'confirmed', 'rejected') DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 創建罰單表
CREATE TABLE tickets (
    id CHAR(36) PRIMARY KEY,
    violation_id CHAR(36) NOT NULL,
    ticket_number VARCHAR(50) UNIQUE NOT NULL,
    fine_amount DECIMAL(10,2) NOT NULL,
    issuing_officer VARCHAR(100),
    status ENUM('pending', 'sent', 'paid', 'overdue') DEFAULT 'pending',
    payment_deadline DATE,
    payment_date DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (violation_id) REFERENCES violations(id)
);

-- 創建攝像頭表
CREATE TABLE cameras (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(255) NOT NULL,
    status ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
    ip_address VARCHAR(45),
    stream_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 創建統計數據表
CREATE TABLE statistics (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    camera_id VARCHAR(50) NOT NULL,
    violation_type VARCHAR(50) NOT NULL,
    count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (camera_id) REFERENCES cameras(id),
    UNIQUE KEY stats_unique (date, camera_id, violation_type)
);

-- 創建系統日誌表
CREATE TABLE system_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    level ENUM('info', 'warning', 'error') NOT NULL,
    message TEXT NOT NULL,
    context JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
); 