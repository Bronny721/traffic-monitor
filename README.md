# Traffic Monitor System

基於 AI 的交通監控系統，使用 YOLOv5 進行車輛檢測和違規分析。

## 項目結構

```
traffic-monitor2/
├── frontend/                      # 前端應用
│   ├── app/                      # Next.js 應用主目錄
│   │   ├── globals.css          # 全局樣式
│   │   ├── layout.tsx           # 主佈局組件
│   │   └── page.tsx             # 首頁組件
│   ├── components/              # React 組件
│   │   ├── ui/                 # UI 組件庫
│   │   ├── camera-stream.tsx   # 攝像頭流組件
│   │   ├── statistics.tsx      # 統計數據組件
│   │   ├── violation-records.tsx # 違規記錄組件
│   │   └── yolo-config.tsx     # YOLO 配置組件
│   ├── hooks/                   # React Hooks
│   │   ├── useCamera.ts        # 攝像頭控制 Hook
│   │   ├── useStatistics.ts    # 統計數據 Hook
│   │   ├── useViolations.ts    # 違規記錄 Hook
│   │   └── useYolo.ts          # YOLO 配置 Hook
│   ├── services/                # API 服務
│   │   ├── api.ts             # API 請求封裝
│   │   └── yolo.ts            # YOLO 服務封裝
│   ├── styles/                  # 樣式文件
│   └── types/                   # TypeScript 類型定義
│
├── backend/                      # 後端應用
│   ├── src/                     # 源代碼目錄
│   │   ├── Services/           # 服務層
│   │   │   ├── Auth/          # 認證服務
│   │   │   ├── Database/      # 數據庫服務
│   │   │   └── cameraStream.py # 攝像頭流處理服務
│   │   ├── controllers/        # 控制器
│   │   ├── middleware/         # 中間件
│   │   ├── models/            # 數據模型
│   │   └── routes/            # 路由定義
│   ├── ai/                      # AI 模型和配置
│   │   ├── config/            # AI 配置文件
│   │   └── models/            # 預訓練模型
│   ├── database/               # 數據庫相關
│   │   ├── migrations/        # 數據庫遷移
│   │   └── seeds/            # 數據填充
│   └── public/                 # 公共資源
│
├── docker/                      # Docker 配置
│   └── nginx/                  # Nginx 配置
│       └── conf.d/            # Nginx 站點配置
│
└── docs/                       # 項目文檔
    └── API.md                 # API 文檔
```

## 技術棧

### 前端
- Next.js 14
- React
- TypeScript
- Tailwind CSS
- Shadcn/ui

### 後端
- PHP 8.1
- MySQL 8.0
- Redis
- Python (AI 服務)
- YOLOv5

### 基礎設施
- Docker
- Nginx
- Git

## 開發環境設置

1. 克隆項目
```bash
git clone [repository-url]
cd traffic-monitor2
```

2. 啟動 Docker 容器
```bash
docker-compose up -d
```

3. 安裝前端依賴
```bash
cd frontend
npm install
```

4. 啟動開發服務器
```bash
npm run dev
```

## API 文檔

詳細的 API 文檔請參考 [docs/API.md](docs/API.md)。

## 貢獻指南

1. Fork 本項目
2. 創建您的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打開一個 Pull Request

## 許可證

本項目採用 MIT 許可證 - 查看 [LICENSE](LICENSE) 文件了解詳細信息。 