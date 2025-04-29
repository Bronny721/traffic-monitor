import { useState, useEffect, useCallback } from 'react';
import { DetectionResult } from '@/types/violations';
import {
  YoloConfig,
  YoloStatus,
  detectViolations,
  getYoloStatus,
  updateYoloConfig,
  reloadYoloModel,
} from '@/services/yolo';

interface UseYoloResult {
  status: YoloStatus | null;
  loading: boolean;
  error: Error | null;
  config: YoloConfig | null;
  detect: (imageData: string) => Promise<DetectionResult>;
  updateConfig: (newConfig: Partial<YoloConfig>) => Promise<void>;
  reload: () => Promise<void>;
  refreshStatus: () => Promise<void>;
}

const DEFAULT_CONFIG: YoloConfig = {
  confidence_threshold: 0.5,
  iou_threshold: 0.45,
  max_detections: 100,
};

export function useYolo(): UseYoloResult {
  const [status, setStatus] = useState<YoloStatus | null>(null);
  const [config, setConfig] = useState<YoloConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // 獲取 YOLO 服務狀態
  const refreshStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const currentStatus = await getYoloStatus();
      setStatus(currentStatus);
      setConfig(currentStatus.config);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('獲取YOLO狀態失敗'));
      console.error('獲取YOLO狀態錯誤:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始化時獲取狀態
  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  // 檢測違規
  const detect = useCallback(async (imageData: string): Promise<DetectionResult> => {
    try {
      setLoading(true);
      setError(null);
      const result = await detectViolations(imageData, config || DEFAULT_CONFIG);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('YOLO檢測失敗');
      setError(error);
      console.error('YOLO檢測錯誤:', err);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [config]);

  // 更新配置
  const updateConfig = useCallback(async (newConfig: Partial<YoloConfig>) => {
    try {
      setLoading(true);
      setError(null);
      const updatedConfig = await updateYoloConfig(newConfig);
      setConfig(updatedConfig);
      await refreshStatus(); // 更新狀態以反映新配置
    } catch (err) {
      setError(err instanceof Error ? err : new Error('更新YOLO配置失敗'));
      console.error('更新YOLO配置錯誤:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refreshStatus]);

  // 重新載入模型
  const reload = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await reloadYoloModel();
      await refreshStatus(); // 重新載入後更新狀態
    } catch (err) {
      setError(err instanceof Error ? err : new Error('重新載入YOLO模型失敗'));
      console.error('重新載入YOLO模型錯誤:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refreshStatus]);

  return {
    status,
    loading,
    error,
    config,
    detect,
    updateConfig,
    reload,
    refreshStatus,
  };
} 