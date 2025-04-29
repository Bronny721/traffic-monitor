import { useState, useEffect, useRef, useCallback } from 'react';
import { getWebSocketUrl } from '@/services/api';

interface CameraStream {
  imageUrl: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface UseCameraResult {
  stream: CameraStream | null;
  loading: boolean;
  error: Error | null;
  isConnected: boolean;
  reconnect: () => void;
}

interface WebSocketErrorEvent extends Event {
  error?: Error;
  message?: string;
}

export function useCamera(cameraId: string): UseCameraResult {
  const [stream, setStream] = useState<CameraStream | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const reconnectAttemptsRef = useRef<number>(0);
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_INTERVAL = 3000;

  const connectToCamera = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 關閉現有連接
      if (wsRef.current) {
        wsRef.current.close();
      }

      // 創建新的WebSocket連接
      const wsUrl = getWebSocketUrl(cameraId);
      console.log('正在連接到WebSocket服務器:', wsUrl);
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket連接已建立');
        setIsConnected(true);
        setLoading(false);
        setError(null);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'frame') {
            setStream({
              imageUrl: `data:image/jpeg;base64,${data.image}`,
              timestamp: new Date(data.timestamp).getTime(),
              metadata: {
                cameraName: data.camera_name,
                frameNumber: data.frame_number
              }
            });
            setLoading(false);
          } else if (data.type === 'error') {
            console.error('收到錯誤消息:', data.message);
            setError(new Error(data.message));
            setLoading(false);
          }
        } catch (err) {
          console.error('解析攝影機數據失敗:', err);
          setError(new Error('解析攝影機數據失敗'));
        }
      };

      ws.onerror = (event: WebSocketErrorEvent) => {
        // 基本錯誤資訊
        const timestamp = new Date().toISOString();
        const readyStateText = ws.readyState === 0 ? '正在連接' :
                             ws.readyState === 1 ? '已連接' :
                             ws.readyState === 2 ? '正在關閉' :
                             ws.readyState === 3 ? '已關閉' : '未知狀態';

        // 取得錯誤訊息
        let errorMessage = '未知錯誤';
        if (event.error instanceof Error) {
          errorMessage = `${event.error.name}: ${event.error.message}`;
        } else if (typeof event.message === 'string') {
          errorMessage = event.message;
        }

        // 記錄基本錯誤資訊
        console.error('WebSocket 連接錯誤 - 基本資訊：');
        console.error('時間：', timestamp);
        console.error('錯誤訊息：', errorMessage);
        console.error('連接 URL：', wsUrl);
        console.error('連接狀態：', readyStateText);
        console.error('狀態碼：', ws.readyState);

        // 記錄技術細節
        console.error('WebSocket 連接錯誤 - 技術細節：');
        try {
          console.error('協議：', ws.protocol || '無');
          console.error('擴展：', ws.extensions || '無');
          console.error('二進制類型：', ws.binaryType);
          console.error('緩衝區大小：', ws.bufferedAmount);
        } catch (e) {
          console.error('無法獲取完整的協議資訊：', e instanceof Error ? e.message : String(e));
        }

        // 記錄錯誤堆疊（如果有）
        if (event.error instanceof Error && event.error.stack) {
          console.error('錯誤堆疊：');
          console.error(event.error.stack);
        }

        // 更新狀態
        setError(new Error(`攝影機連接錯誤: ${errorMessage}`));
        setIsConnected(false);
        setLoading(false);
      };

      ws.onclose = (event) => {
        console.log('WebSocket連接已關閉:', {
          code: event.code,
          reason: event.reason || '無原因提供',
          wasClean: event.wasClean,
          timestamp: new Date().toISOString()
        });
        setIsConnected(false);
        
        // 嘗試重連
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`嘗試重新連接 (${reconnectAttemptsRef.current + 1}/${MAX_RECONNECT_ATTEMPTS})`);
            reconnectAttemptsRef.current += 1;
            connectToCamera();
          }, RECONNECT_INTERVAL);
        } else {
          setError(new Error(`無法連接到攝影機，已嘗試 ${MAX_RECONNECT_ATTEMPTS} 次`));
        }
      };

    } catch (err) {
      console.error('連接錯誤:', err);
      setError(err instanceof Error ? err : new Error('連接攝影機時發生錯誤'));
      setLoading(false);
    }
  }, [cameraId]);

  // 手動重連函數
  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    connectToCamera();
  }, [connectToCamera]);

  useEffect(() => {
    connectToCamera();

    // 清理函數
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connectToCamera]);

  return { stream, loading, error, isConnected, reconnect };
} 