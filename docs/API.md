# API 文檔

## 基本信息

- 基礎 URL: `http://localhost:8000/api`
- 所有請求和響應均使用 JSON 格式
- 認證使用 Bearer Token

## 認證

### 獲取訪問令牌

```http
POST /auth/login
```

請求體：
```json
{
  "username": "string",
  "password": "string"
}
```

響應：
```json
{
  "access_token": "string",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

## 違規記錄 API

### 獲取違規記錄列表

```http
GET /violations
```

查詢參數：
- `page`: 頁碼 (默認: 1)
- `per_page`: 每頁數量 (默認: 10)
- `status`: 狀態過濾 (可選: pending, confirmed, rejected)
- `start_date`: 開始日期 (YYYY-MM-DD)
- `end_date`: 結束日期 (YYYY-MM-DD)

響應：
```json
{
  "data": [
    {
      "id": "uuid",
      "camera_id": "string",
      "violation_type": "string",
      "location": "string",
      "timestamp": "datetime",
      "image_url": "string",
      "video_url": "string",
      "confidence": 0.95,
      "status": "pending",
      "notes": "string",
      "created_at": "datetime",
      "updated_at": "datetime"
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 10,
    "total": 100
  }
}
```

### 創建違規記錄

```http
POST /violations
```

請求體：
```json
{
  "camera_id": "string",
  "violation_type": "string",
  "location": "string",
  "timestamp": "datetime",
  "image_url": "string",
  "video_url": "string",
  "confidence": 0.95,
  "notes": "string"
}
```

### 更新違規記錄

```http
PATCH /violations/{id}
```

請求體：
```json
{
  "status": "confirmed",
  "notes": "string"
}
```

## 罰單 API

### 創建罰單

```http
POST /tickets
```

請求體：
```json
{
  "violation_id": "uuid",
  "fine_amount": 1000.00,
  "issuing_officer": "string",
  "payment_deadline": "date"
}
```

### 獲取罰單列表

```http
GET /tickets
```

查詢參數：
- `page`: 頁碼
- `per_page`: 每頁數量
- `status`: 狀態過濾

響應：
```json
{
  "data": [
    {
      "id": "uuid",
      "violation_id": "uuid",
      "ticket_number": "string",
      "fine_amount": 1000.00,
      "issuing_officer": "string",
      "status": "pending",
      "payment_deadline": "date",
      "payment_date": "datetime",
      "created_at": "datetime",
      "updated_at": "datetime"
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 10,
    "total": 50
  }
}
```

## 統計數據 API

### 獲取統計數據

```http
GET /statistics
```

查詢參數：
- `time_range`: 時間範圍 (day, week, month, year)
- `camera_id`: 攝像頭 ID (可選)
- `violation_type`: 違規類型 (可選)

響應：
```json
{
  "total_violations": 100,
  "violations_by_type": {
    "speeding": 50,
    "red_light": 30,
    "illegal_parking": 20
  },
  "violations_by_camera": {
    "camera_1": 40,
    "camera_2": 35,
    "camera_3": 25
  },
  "violations_over_time": [
    {
      "date": "2024-01-01",
      "count": 10
    }
  ]
}
```

## 攝像頭 API

### 獲取攝像頭列表

```http
GET /cameras
```

響應：
```json
{
  "data": [
    {
      "id": "string",
      "name": "string",
      "location": "string",
      "status": "active",
      "stream_url": "string",
      "created_at": "datetime",
      "updated_at": "datetime"
    }
  ]
}
```

### 更新攝像頭狀態

```http
PATCH /cameras/{id}
```

請求體：
```json
{
  "status": "maintenance",
  "stream_url": "string"
}
```

## 錯誤響應

所有錯誤響應遵循以下格式：

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": {}
  }
}
```

常見錯誤代碼：
- `400`: 請求參數錯誤
- `401`: 未認證
- `403`: 無權限
- `404`: 資源不存在
- `422`: 數據驗證失敗
- `500`: 服務器錯誤 