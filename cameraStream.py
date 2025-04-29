import asyncio
import websockets
import cv2
import numpy as np
import requests
import logging
from urllib.parse import urlparse
import json
from datetime import datetime
import time

# 配置日誌
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

async def stream_camera(websocket):
    session = None
    camera_url = None
    reconnect_attempts = 0
    MAX_RECONNECT_ATTEMPTS = 3
    
    try:
        # 從客戶端接收攝像頭 URL
        camera_url = await websocket.recv()
        logging.info(f"收到攝像頭 URL: {camera_url}")

        while reconnect_attempts < MAX_RECONNECT_ATTEMPTS:
            try:
                # 驗證 URL 格式
                parsed_url = urlparse(camera_url)
                if not all([parsed_url.scheme, parsed_url.netloc]):
                    raise ValueError("無效的攝像頭 URL")

                # 設置請求頭
                headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'multipart/x-mixed-replace; boundary=frame',
                    'Connection': 'keep-alive'
                }

                # 嘗試建立視頻流連接
                if session is None:
                    session = requests.Session()
                
                response = session.get(camera_url, headers=headers, stream=True, timeout=10)
                if response.status_code != 200:
                    raise ConnectionError(f"無法連接到攝像頭，狀態碼：{response.status_code}")

                # 重置重連計數
                reconnect_attempts = 0
                
                # 讀取和處理視頻流
                bytes_array = bytes()
                for chunk in response.iter_content(chunk_size=1024):
                    if not chunk:
                        continue
                        
                    bytes_array += chunk
                    a = bytes_array.find(b'\xff\xd8')
                    b = bytes_array.find(b'\xff\xd9')
                    
                    if a != -1 and b != -1:
                        jpg = bytes_array[a:b+2]
                        bytes_array = bytes_array[b+2:]
                        
                        try:
                            # 解碼圖像
                            frame = cv2.imdecode(np.frombuffer(jpg, dtype=np.uint8), cv2.IMREAD_COLOR)
                            if frame is None:
                                continue

                            # 將圖像編碼為 JPEG
                            _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
                            jpg_as_text = buffer.tobytes()

                            # 發送幀到客戶端
                            await websocket.send(jpg_as_text)
                            
                        except cv2.error as cv_err:
                            logging.warning(f"OpenCV 錯誤: {str(cv_err)}")
                            continue
                            
                        except websockets.exceptions.ConnectionClosed:
                            logging.info("WebSocket 連接已關閉")
                            return
                            
            except (requests.exceptions.RequestException, ConnectionError) as e:
                reconnect_attempts += 1
                if reconnect_attempts >= MAX_RECONNECT_ATTEMPTS:
                    raise
                    
                logging.warning(f"連接錯誤，正在重試 ({reconnect_attempts}/{MAX_RECONNECT_ATTEMPTS}): {str(e)}")
                await asyncio.sleep(2)  # 等待 2 秒後重試
                continue

    except Exception as e:
        error_message = {
            "error": str(e),
            "timestamp": datetime.now().isoformat(),
            "details": {
                "type": type(e).__name__,
                "camera_url": camera_url,
                "reconnect_attempts": reconnect_attempts
            }
        }
        logging.error(f"流處理錯誤: {json.dumps(error_message, ensure_ascii=False)}")
        try:
            await websocket.send(json.dumps(error_message))
        except:
            pass
    finally:
        if session:
            session.close()

async def main():
    try:
        server = await websockets.serve(
            stream_camera, 
            "localhost", 
            8765,
            ping_interval=30,  # 每 30 秒發送一次 ping
            ping_timeout=10    # 10 秒內沒有收到 pong 就斷開連接
        )
        logging.info("WebSocket 服務器已啟動於 ws://localhost:8765")
        await server.wait_closed()
    except Exception as e:
        logging.error(f"服務器啟動錯誤: {str(e)}")

if __name__ == "__main__":
    asyncio.run(main()) 