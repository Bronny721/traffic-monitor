"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Info, Pause, Play } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import type { Camera, DetectedObject, Violation } from "@/types/violations"
import { useCamera } from "@/hooks/useCamera"
import { fetchCameraStreams } from "@/services/api"
import { detectViolations } from "@/services/yolo"

interface CameraStreamProps {
  onViolationDetected: (violation: Partial<Violation>) => void
  recentViolations: Violation[]
  onSelectViolation: (violation: Violation) => void
  onViewAllViolations: () => void
}

export default function CameraStream({
  onViolationDetected,
  recentViolations,
  onSelectViolation,
  onViewAllViolations,
}: CameraStreamProps) {
  const [cameras, setCameras] = useState<Camera[]>([])
  const [selectedCamera, setSelectedCamera] = useState<string>("")
  const [isStreaming, setIsStreaming] = useState<boolean>(true)
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(70)
  const [fps, setFps] = useState<number>(24)
  const [error, setError] = useState<string | null>(null)

  // 獲取攝影機列表
  useEffect(() => {
    async function loadCameras() {
      try {
        const camerasData = await fetchCameraStreams()
        // 加入特定攝影機
        const specificCamera: Camera = {
          id: "taichung-traffic-1",
          name: "中清路/環中路(右側車流往文心路)",
          location: "台中市",
          streamUrl: "https://tcnvr8.taichung.gov.tw/3d7db084"
        }
        setCameras([specificCamera, ...camerasData])
        setSelectedCamera(specificCamera.id)
      } catch (err) {
        setError("無法載入攝影機列表")
        console.error("無法載入攝影機列表:", err)
      }
    }
    loadCameras()
  }, [])

  // 使用自定義Hook連接到選定的攝影機
  const { stream, loading, error: streamError, isConnected, reconnect } = useCamera(selectedCamera)

  // 顯示錯誤信息
  useEffect(() => {
    if (streamError) {
      setError(streamError.message)
    } else {
      setError(null)
    }
  }, [streamError])

  // 處理攝影機串流和物體檢測
  useEffect(() => {
    if (!isStreaming || !stream || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const processFrame = async () => {
      try {
        // 創建一個Image對象來顯示串流
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = async () => {
          // 繪製圖像
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

          try {
            // 將canvas轉換為base64以發送到API
            const imageData = canvas.toDataURL("image/jpeg")
            const detections = await detectViolations(imageData)

            // 過濾低於閾值的檢測結果
            const filteredObjects = detections.objects.filter(
              obj => obj.confidence * 100 >= confidenceThreshold
            )

      setDetectedObjects(filteredObjects)

            // 繪製檢測框
            drawDetections(filteredObjects)

            // 處理檢測到的違規
            detections.violations.forEach(violation => {
              if (violation.confidence * 100 >= confidenceThreshold) {
          onViolationDetected({
                  type: violation.type,
                  confidence: violation.confidence,
                  image: imageData,
                  objects: violation.objects,
                  timestamp: new Date().toISOString(),
                  cameraId: selectedCamera,
                  location: cameras.find(cam => cam.id === selectedCamera)?.location || "",
          })
        }
            })
          } catch (err) {
            console.error("Detection error:", err)
          }
        }
        img.src = stream.imageUrl
      } catch (err) {
        console.error("Frame processing error:", err)
      }
    }

    const interval = setInterval(processFrame, 1000 / fps)
    return () => clearInterval(interval)
  }, [isStreaming, stream, selectedCamera, confidenceThreshold, fps, cameras, onViolationDetected])

  const drawDetections = (objects: DetectedObject[]) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    objects.forEach((obj) => {
      // 設置顏色基於對象類型
      ctx.strokeStyle = obj.type === "行人" ? "#3b82f6" : "#10b981"
      ctx.lineWidth = 2
      ctx.strokeRect(obj.x, obj.y, obj.width, obj.height)

      // 繪製標籤背景
      ctx.fillStyle = obj.type === "行人" ? "#3b82f6" : "#10b981"
      ctx.fillRect(obj.x, obj.y - 20, 70, 20)

      // 繪製標籤文本
      ctx.fillStyle = "white"
      ctx.font = "12px sans-serif"
      ctx.fillText(`${obj.type} ${(obj.confidence * 100).toFixed(0)}%`, obj.x + 5, obj.y - 5)
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>即時攝影機串流</CardTitle>
            <CardDescription>自動檢測交通違規行為</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Select value={selectedCamera} onValueChange={setSelectedCamera}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="選擇攝影機" />
                    </SelectTrigger>
                    <SelectContent>
                      {cameras.map((camera) => (
                        <SelectItem key={camera.id} value={camera.id}>
                          {camera.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant={isStreaming ? "outline" : "default"}
                    size="icon"
                    onClick={() => setIsStreaming(!isStreaming)}
                  >
                    {isStreaming ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  {!isConnected && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={reconnect}
                    >
                      重新連接
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">處理速率:</span>
                  <Select value={fps.toString()} onValueChange={(value) => setFps(Number.parseInt(value))}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue placeholder="FPS" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12">12 FPS</SelectItem>
                      <SelectItem value="24">24 FPS</SelectItem>
                      <SelectItem value="30">30 FPS</SelectItem>
                    </SelectContent>
                  </Select>
                  <Badge variant="outline" className={`ml-2 ${isConnected ? 'bg-green-100' : 'bg-red-100'}`}>
                    {isConnected ? '已連接' : '未連接'}
                  </Badge>
                  <Badge variant="outline" className="ml-2">
                    {detectedObjects.length} 個物體
                  </Badge>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <Info className="h-4 w-4" />
                  <AlertTitle>錯誤</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* 信心度閾值滑塊 */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">信心度篩選:</span>
                  <span className="text-sm font-medium">{confidenceThreshold}%</span>
                </div>
                <Slider
                  value={[confidenceThreshold]}
                  min={50}
                  max={95}
                  step={1}
                  onValueChange={(value) => setConfidenceThreshold(value[0])}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">僅顯示信心度高於閾值的檢測結果</p>
              </div>

              <div className="relative border rounded-lg overflow-hidden">
                <div className="relative">
                  {loading ? (
                    <div className="w-full h-[480px] flex items-center justify-center bg-muted">
                      <p>正在載入攝影機串流...</p>
                    </div>
                  ) : streamError ? (
                    <div className="w-full h-[480px] flex items-center justify-center bg-muted">
                      <p>載入攝影機串流時發生錯誤</p>
                    </div>
                  ) : (
                    <>
                      {stream?.imageUrl && (
                  <img
                          src={stream.imageUrl}
                    alt="Camera stream"
                    className="w-full h-[480px] object-cover"
                  />
                      )}
                      <canvas
                        ref={canvasRef}
                        width={640}
                        height={480}
                        className="absolute top-0 left-0 w-full h-full"
                      />
                    </>
                  )}
                </div>
                <div className="absolute top-4 left-4 right-4 flex justify-between">
                  <div className="bg-black/70 text-white px-3 py-1 rounded-md text-sm flex items-center">
                    <span className="mr-2">
                      {cameras.find((cam) => cam.id === selectedCamera)?.name}
                    </span>
                    <div
                      className={`w-2 h-2 rounded-full ${
                        isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
                      }`}
                    />
                  </div>
                </div>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>AI輔助檢測中</AlertTitle>
                <AlertDescription>
                  系統正在自動檢測交通違規行為。檢測到的違規將顯示在右側面板中。
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 違規列表部分 */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>最近違規</CardTitle>
            <CardDescription>最近檢測到的違規行為</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={onViewAllViolations}>
                查看全部
              </Button>
            </div>
          </CardHeader>
          <CardContent>
              <div className="space-y-4">
              {recentViolations.map((violation) => (
                  <div
                  key={violation.id}
                  className="flex items-center gap-4 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => onSelectViolation(violation)}
                  >
                  <div className="relative w-16 h-16">
                    <img
                      src={violation.image}
                      alt={violation.type}
                      className="w-full h-full object-cover rounded-md"
                    />
                      </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{violation.type}</span>
                      <Badge variant="outline" className="shrink-0">
                        {(violation.confidence * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {new Date(violation.timestamp).toLocaleTimeString()}
                    </p>
                    </div>
                  </div>
                ))}
              </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
