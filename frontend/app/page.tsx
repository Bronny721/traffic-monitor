"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, BarChart2, Video } from "lucide-react"
import CameraStream from "@/components/camera-stream"
import ViolationRecords from "@/components/violation-records"
import Statistics from "@/components/statistics"
import type { Violation } from "@/types/violations"

export default function TrafficMonitorPage() {
  const [activeTab, setActiveTab] = useState<string>("stream")
  const [violations, setViolations] = useState<Violation[]>([])
  const [selectedViolation, setSelectedViolation] = useState<Violation | null>(null)

  const handleViolationDetected = (violation: Partial<Violation>) => {
    const newViolation: Violation = {
      id: `VIO-${Math.floor(Math.random() * 10000)}`,
      timestamp: new Date().toISOString(),
      location: "台北市信義區忠孝東路五段",
      cameraId: "CAM-123",
      vehicleInfo: {
        licensePlate: `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}-${Math.floor(Math.random() * 10000)}`,
        type: "小客車",
        color: "白色",
      },
      type: violation.type || "",
      confidence: violation.confidence || 0,
      status: "待審核",
      image: violation.image || "",
      objects: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setViolations((prev) => [newViolation, ...prev])
  }

  // Update violation status in the main violations array
  const handleViolationUpdate = (updatedViolation: Violation) => {
    setViolations((prev) => prev.map((v) => (v.id === updatedViolation.id ? updatedViolation : v)))
    setSelectedViolation(updatedViolation)
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold text-center mb-8">交通違規自動檢測與罰單系統</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-8">
          <TabsTrigger value="stream">
            <Video className="mr-2 h-4 w-4" />
            攝影機串流
          </TabsTrigger>
          <TabsTrigger value="violations">
            <FileText className="mr-2 h-4 w-4" />
            違規記錄與罰單
          </TabsTrigger>
          <TabsTrigger value="statistics">
            <BarChart2 className="mr-2 h-4 w-4" />
            統計分析
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stream">
          <CameraStream
            onViolationDetected={handleViolationDetected}
            recentViolations={violations.slice(0, 5)}
            onSelectViolation={setSelectedViolation}
            onViewAllViolations={() => setActiveTab("violations")}
          />
        </TabsContent>

        <TabsContent value="violations">
          <ViolationRecords
            violations={violations}
            selectedViolation={selectedViolation}
            onViolationSelect={handleViolationUpdate}
            onGenerateTicket={() => {}}
          />
        </TabsContent>

        <TabsContent value="statistics">
          <Statistics violations={violations} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
