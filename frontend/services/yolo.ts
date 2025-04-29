import { DetectionResult } from '@/types/violations';

const YOLO_API_URL = process.env.NEXT_PUBLIC_YOLO_API_URL || 'http://localhost:8001';

export interface YoloConfig {
  confidence_threshold: number;
  iou_threshold: number;
  max_detections: number;
}

export interface YoloStatus {
  status: 'ready' | 'loading' | 'error';
  model: string;
  last_updated: string;
  config: YoloConfig;
}

export async function detectViolations(
  imageData: string,
  config?: Partial<YoloConfig>
): Promise<DetectionResult> {
  try {
    const response = await fetch(`${YOLO_API_URL}/detect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageData,
        config,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`YOLO檢測失敗: ${error}`);
    }

    return response.json();
  } catch (error) {
    console.error('YOLO API錯誤:', error);
    throw error;
  }
}

export async function getYoloStatus(): Promise<YoloStatus> {
  try {
    const response = await fetch(`${YOLO_API_URL}/status`);
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`獲取YOLO狀態失敗: ${error}`);
    }

    return response.json();
  } catch (error) {
    console.error('獲取YOLO狀態錯誤:', error);
    throw error;
  }
}

export async function updateYoloConfig(config: Partial<YoloConfig>): Promise<YoloConfig> {
  try {
    const response = await fetch(`${YOLO_API_URL}/config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`更新YOLO配置失敗: ${error}`);
    }

    return response.json();
  } catch (error) {
    console.error('更新YOLO配置錯誤:', error);
    throw error;
  }
}

export async function reloadYoloModel(): Promise<void> {
  try {
    const response = await fetch(`${YOLO_API_URL}/reload`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`重新載入YOLO模型失敗: ${error}`);
    }
  } catch (error) {
    console.error('重新載入YOLO模型錯誤:', error);
    throw error;
  }
} 