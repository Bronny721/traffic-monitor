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
        const errorTime = new Date().toISOString();
        const readyStateText = ws.readyState === 0 ? '正在連接' :
                             ws.readyState === 1 ? '已連接' :
                             ws.readyState === 2 ? '正在關閉' :
                             ws.readyState === 3 ? '已關閉' : '未知狀態';

        const errorMessage = event.error instanceof Error 
          ? `${event.error.name}: ${event.error.message}`
          : typeof event.message === 'string' 
            ? event.message 
            : '未知錯誤';

        // 簡化錯誤日誌
        console.error(`WebSocket 連接錯誤 - ${errorTime} - ${errorMessage} - ${wsUrl} - ${readyStateText}`);

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