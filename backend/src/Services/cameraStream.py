import cv2
import base64
import asyncio
import websockets
import json
from datetime import datetime
import requests
import logging
import numpy as np
import urllib3
from urllib.parse import urlparse

# 禁用 SSL 警告
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# 設置詳細的日誌
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def stream_camera(websocket, path):
    url = 'https://tcnvr8.taichung.gov.tw/3d7db084'
    
    # 設置請求頭，模擬瀏覽器行為
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'multipart/x-mixed-replace, */*',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Referer': 'https://tcnvr8.taichung.gov.tw/',
        'Sec-Fetch-Dest': 'image',
        'Sec-Fetch-Mode': 'no-cors',
        'Sec-Fetch-Site': 'same-origin'
    }
    
    logger.info(f"嘗試連接到攝影機 URL: {url}")
    parsed_url = urlparse(url)
    logger.debug(f"URL 解析結果: {parsed_url}")
    
    try:
        # 使用 session 來保持連接
        session = requests.Session()
        session.verify = False  # 禁用 SSL 驗證
        
        # 先發送 HEAD 請求檢查服務器狀態
        try:
            head_response = session.head(url, headers=headers, timeout=5)
            logger.info(f"HEAD 請求狀態碼: {head_response.status_code}")
            logger.debug(f"HEAD 響應頭: {dict(head_response.headers)}")
        except requests.exceptions.RequestException as e:
            logger.warning(f"HEAD 請求失敗: {e}")
        
        # 開始串流請求
        response = session.get(url, headers=headers, stream=True, timeout=30)
        logger.info(f"GET 請求狀態碼: {response.status_code}")
        logger.debug(f"Content-Type: {response.headers.get('content-type', 'unknown')}")
        
        if not response.ok:
            error_msg = f"無法連接到攝影機，狀態碼: {response.status_code}"
            logger.error(error_msg)
            await websocket.send(json.dumps({
                'type': 'error',
                'message': error_msg,
                'status_code': response.status_code,
                'headers': dict(response.headers)
            }))
            return

        logger.info("成功建立連接，開始處理視頻流")
        
        # 處理 MJPEG 串流
        bytes_array = bytes()
        frame_count = 0
        start_time = datetime.now()
        
        for chunk in response.iter_content(chunk_size=8192):
            if not chunk:
                continue
                
            bytes_array += chunk
            a = bytes_array.find(b'\xff\xd8')  # JPEG 開始標記
            b = bytes_array.find(b'\xff\xd9')  # JPEG 結束標記
            
            if a != -1 and b != -1:
                jpg = bytes_array[a:b+2]
                bytes_array = bytes_array[b+2:]
                
                try:
                    # 解碼 JPEG 數據
                    frame = cv2.imdecode(np.frombuffer(jpg, dtype=np.uint8), cv2.IMREAD_COLOR)
                    
                    if frame is not None:
                        frame_count += 1
                        current_time = datetime.now()
                        elapsed_time = (current_time - start_time).total_seconds()
                        current_fps = frame_count / elapsed_time if elapsed_time > 0 else 0
                        
                        logger.debug(f"處理第 {frame_count} 幀，當前 FPS: {current_fps:.2f}")
                        
                        # 壓縮影像品質以提升傳輸效能
                        encode_params = [cv2.IMWRITE_JPEG_QUALITY, 70]
                        _, buffer = cv2.imencode('.jpg', frame, encode_params)
                        
                        # 轉換為 base64 字串
                        img_str = base64.b64encode(buffer).decode('utf-8')
                        
                        # 傳送影像資料
                        await websocket.send(json.dumps({
                            'type': 'frame',
                            'image': img_str,
                            'timestamp': current_time.isoformat(),
                            'camera_name': '中清路/環中路(右側車流往文心路)',
                            'frame_number': frame_count,
                            'fps': round(current_fps, 2)
                        }))
                        
                        # 控制串流速率
                        await asyncio.sleep(0.04)  # 約 25 FPS
                    else:
                        logger.warning(f"第 {frame_count + 1} 幀解碼後為空")
                        
                except Exception as decode_error:
                    logger.error(f"幀解碼錯誤: {str(decode_error)}")
                    continue
                    
    except requests.exceptions.Timeout:
        error_msg = "連接超時"
        logger.error(error_msg)
        await websocket.send(json.dumps({
            'type': 'error',
            'message': error_msg
        }))
    except requests.exceptions.SSLError as ssl_error:
        error_msg = f"SSL 錯誤: {str(ssl_error)}"
        logger.error(error_msg)
        await websocket.send(json.dumps({
            'type': 'error',
            'message': error_msg
        }))
    except requests.exceptions.RequestException as req_error:
        error_msg = f"請求錯誤: {str(req_error)}"
        logger.error(error_msg)
        await websocket.send(json.dumps({
            'type': 'error',
            'message': error_msg
        }))
    except Exception as e:
        error_msg = f"串流處理錯誤: {str(e)}"
        logger.error(error_msg)
        await websocket.send(json.dumps({
            'type': 'error',
            'message': error_msg
        }))
    finally:
        logger.info("關閉串流連接")
        try:
            session.close()
        except:
            pass

async def main():
    try:
        server = await websockets.serve(
            stream_camera, 
            "localhost", 
            8765,
            ping_interval=None,  # 禁用 ping 以避免連接中斷
            max_size=None  # 不限制消息大小
        )
        logger.info("串流伺服器已啟動於 ws://localhost:8765")
        await server.wait_closed()
    except Exception as e:
        logger.error(f"服務器啟動錯誤: {str(e)}")
        raise

if __name__ == "__main__":
    asyncio.run(main())