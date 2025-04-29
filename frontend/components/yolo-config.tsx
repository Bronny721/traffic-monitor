"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RefreshCw, Settings2 } from "lucide-react"
import { useYolo } from "@/hooks/useYolo"
import { YoloConfig } from "@/services/yolo"

export default function YoloConfigPanel() {
  const { status, loading, error, config, updateConfig, reload, refreshStatus } = useYolo()
  const [tempConfig, setTempConfig] = useState<Partial<YoloConfig>>({
    confidence_threshold: config?.confidence_threshold || 0.5,
    iou_threshold: config?.iou_threshold || 0.45,
    max_detections: config?.max_detections || 100,
  })

  const handleConfigUpdate = async () => {
    try {
      await updateConfig(tempConfig)
    } catch (err) {
      console.error('更新配置失敗:', err)
    }
  }

  const handleReload = async () => {
    try {
      await reload()
    } catch (err) {
      console.error('重新載入模型失敗:', err)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="h-5 w-5" />
          YOLO 模型配置
        </CardTitle>
        <CardDescription>
          調整模型參數和監控狀態
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="confidence">置信度閾值</Label>
            <Input
              id="confidence"
              type="number"
              min="0"
              max="1"
              step="0.05"
              value={tempConfig.confidence_threshold}
              onChange={(e) =>
                setTempConfig((prev) => ({
                  ...prev,
                  confidence_threshold: parseFloat(e.target.value),
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="iou">IOU 閾值</Label>
            <Input
              id="iou"
              type="number"
              min="0"
              max="1"
              step="0.05"
              value={tempConfig.iou_threshold}
              onChange={(e) =>
                setTempConfig((prev) => ({
                  ...prev,
                  iou_threshold: parseFloat(e.target.value),
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxDetections">最大檢測數量</Label>
            <Input
              id="maxDetections"
              type="number"
              min="1"
              max="1000"
              value={tempConfig.max_detections}
              onChange={(e) =>
                setTempConfig((prev) => ({
                  ...prev,
                  max_detections: parseInt(e.target.value),
                }))
              }
            />
          </div>
        </div>

        <div className="pt-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">模型狀態</span>
            <span className="text-sm">{status?.status || '未知'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">當前模型</span>
            <span className="text-sm">{status?.model || '未知'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">最後更新時間</span>
            <span className="text-sm">
              {status?.last_updated
                ? new Date(status.last_updated).toLocaleString('zh-TW')
                : '未知'}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleReload}
          disabled={loading}
        >
          {loading ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          重新載入模型
        </Button>
        <Button
          onClick={handleConfigUpdate}
          disabled={loading}
        >
          更新配置
        </Button>
      </CardFooter>
    </Card>
  )
} 