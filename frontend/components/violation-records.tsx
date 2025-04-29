"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Search, Filter, FileText, CheckCircle, XCircle, Send } from "lucide-react"
import type { Violation } from "@/types/violations"
import { fetchViolations, createViolation } from "@/services/api"

interface ViolationRecordsProps {
  violations: Violation[]
  selectedViolation: Violation | null
  onViolationSelect: (violation: Violation) => void
  onGenerateTicket: () => void
}

export default function ViolationRecords({
  violations,
  selectedViolation,
  onViolationSelect,
  onGenerateTicket,
}: ViolationRecordsProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [isGenerated, setIsGenerated] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 可編輯的罰單欄位
  const [ticketData, setTicketData] = useState({
    ticketNumber: "",
    violationDate: "",
    violationType: "",
    location: "",
    fineAmount: "2400",
    issuingOfficer: "系統自動生成",
    notes: "",
    confidence: 0,
  })

  // 當選擇新的違規記錄時更新可編輯欄位
  useEffect(() => {
    if (selectedViolation) {
      setTicketData({
        ticketNumber: `TKT-${Math.floor(Math.random() * 100000)}`,
        violationDate: new Date(selectedViolation.timestamp).toLocaleDateString("zh-TW"),
        violationType: selectedViolation.type,
        location: selectedViolation.location,
        fineAmount: "2400",
        issuingOfficer: "系統自動生成",
        notes: "",
        confidence: selectedViolation.confidence,
      })
      setIsGenerated(false)
      setIsSent(false)
    }
  }, [selectedViolation])

  // 過濾違規記錄
  let filteredViolations = violations

  // 根據狀態過濾
  if (statusFilter !== "all") {
    filteredViolations = filteredViolations.filter(
      (violation) => violation.status === statusFilter
    )
  }

  // 根據類型過濾
  if (typeFilter !== "all") {
    filteredViolations = filteredViolations.filter(
      (violation) => violation.type === typeFilter
    )
  }

  // 根據搜索查詢過濾
  if (searchQuery) {
    filteredViolations = filteredViolations.filter((violation) =>
      violation.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      violation.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      violation.location.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }

  // 獲取所有違規類型
  const violationTypes = Array.from(new Set(violations.map((v) => v.type)))

  // 更新違規狀態
  const updateViolationStatus = async (id: string, status: Violation["status"]) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/violations/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) throw new Error("更新違規狀態失敗")

      const updatedViolation = await response.json()
      onViolationSelect(updatedViolation)
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新違規狀態時發生錯誤")
    } finally {
      setLoading(false)
    }
  }

  // 生成罰單
  const handleGenerateTicket = async () => {
    if (!selectedViolation) return

    try {
      setLoading(true)
      setError(null)

      // 創建罰單記錄
      const ticketResponse = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...ticketData,
          violationId: selectedViolation.id,
        }),
      })

      if (!ticketResponse.ok) throw new Error("生成罰單失敗")

      // 更新違規狀態為已開罰
      await updateViolationStatus(selectedViolation.id, "已開罰")

    setIsGenerated(true)
    setIsSent(false)
      onGenerateTicket()
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成罰單時發生錯誤")
    } finally {
      setLoading(false)
    }
  }

  // 發送罰單
  const handleSendTicket = async () => {
    if (!selectedViolation) return

    try {
      setLoading(true)
      setError(null)

      // 發送罰單
      const response = await fetch(`/api/tickets/${ticketData.ticketNumber}/send`, {
        method: "POST",
      })

      if (!response.ok) throw new Error("發送罰單失敗")

    setIsSent(true)
      await updateViolationStatus(selectedViolation.id, "已確認")
    } catch (err) {
      setError(err instanceof Error ? err.message : "發送罰單時發生錯誤")
    } finally {
      setLoading(false)
    }
  }

  // 獲取信心度顏色
  const getConfidenceColor = (value: number) => {
    if (value >= 0.9) return "text-green-600"
    if (value >= 0.75) return "text-blue-600"
    if (value >= 0.6) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>違規記錄</CardTitle>
            <CardDescription>檢視並管理檢測到的違規行為</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="搜尋違規ID或位置"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button variant="ghost" size="icon">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="狀態篩選" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有狀態</SelectItem>
                  <SelectItem value="待審核">待審核</SelectItem>
                  <SelectItem value="已確認">已確認</SelectItem>
                  <SelectItem value="已駁回">已駁回</SelectItem>
                  <SelectItem value="已開罰">已開罰</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="違規類型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有類型</SelectItem>
                  {violationTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
          <div className="px-6 pb-6">
            <div className="border rounded-lg overflow-hidden">
              <div className="max-h-[500px] overflow-y-auto">
                {filteredViolations.length > 0 ? (
                  filteredViolations.map((violation) => (
                    <div
                      key={violation.id}
                      className={`p-3 border-b last:border-b-0 hover:bg-muted/50 cursor-pointer ${
                        selectedViolation && selectedViolation.id === violation.id ? "bg-muted" : ""
                      }`}
                      onClick={() => onViolationSelect(violation)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{violation.type}</h4>
                          <p className="text-sm">位置: {violation.location}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(violation.timestamp).toLocaleString("zh-TW")}
                          </p>
                        </div>
                        <Badge
                          variant={
                            violation.status === "待審核"
                              ? "outline"
                              : violation.status === "已確認"
                                ? "secondary"
                                : violation.status === "已駁回"
                                  ? "destructive"
                                  : "default"
                          }
                        >
                          {violation.status}
                        </Badge>
                      </div>
                      <div className="mt-2">
                        <span
                          className={`text-xs ${getConfidenceColor(violation.confidence)}`}
                        >
                          信心度: {(violation.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-muted-foreground">
                    沒有找到符合條件的違規記錄
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="lg:col-span-2">
        {selectedViolation ? (
            <Card>
              <CardHeader>
              <CardTitle>違規詳情</CardTitle>
              <CardDescription>
                違規ID: {selectedViolation.id} | 檢測時間:{" "}
                {new Date(selectedViolation.timestamp).toLocaleString("zh-TW")}
              </CardDescription>
              </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <img
                    src={selectedViolation.image}
                    alt="Violation evidence"
                    className="w-full aspect-video object-cover rounded-lg"
                  />
                </div>
                <div className="space-y-4">
                  <div>
                    <Label>違規類型</Label>
                    <div className="font-medium">{selectedViolation.type}</div>
                  </div>
                  <div>
                    <Label>位置</Label>
                    <div className="font-medium">{selectedViolation.location}</div>
                  </div>
                  <div>
                    <Label>信心度</Label>
                    <div className={`font-medium ${getConfidenceColor(selectedViolation.confidence)}`}>
                      {(selectedViolation.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div>
                    <Label>狀態</Label>
                    <div>
                      <Badge
                        variant={
                          selectedViolation.status === "待審核"
                            ? "outline"
                            : selectedViolation.status === "已確認"
                            ? "secondary"
                            : selectedViolation.status === "已駁回"
                            ? "destructive"
                            : "default"
                        }
                      >
                        {selectedViolation.status}
                      </Badge>
                  </div>
                  </div>
                </div>
                </div>

              {/* 罰單生成部分 */}
              {!isGenerated ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>罰單編號</Label>
                      <Input value={ticketData.ticketNumber} disabled />
                    </div>
                <div className="space-y-2">
                      <Label>違規日期</Label>
                      <Input value={ticketData.violationDate} disabled />
                </div>
                <div className="space-y-2">
                      <Label>罰款金額</Label>
                  <Input
                        type="number"
                        value={ticketData.fineAmount}
                        onChange={(e) =>
                          setTicketData({ ...ticketData, fineAmount: e.target.value })
                        }
                  />
                </div>
                    <div className="space-y-2">
                      <Label>開立人員</Label>
                      <Input value={ticketData.issuingOfficer} disabled />
                    </div>
                  </div>
                <div className="space-y-2">
                    <Label>備註</Label>
                  <Textarea
                      value={ticketData.notes}
                      onChange={(e) => setTicketData({ ...ticketData, notes: e.target.value })}
                      placeholder="輸入備註..."
                  />
                </div>
                  <Button
                    className="w-full"
                    onClick={handleGenerateTicket}
                    disabled={loading}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    生成罰單
                  </Button>
                </div>
              ) : (
                  <div className="space-y-4">
                  <div className="p-4 border rounded-lg bg-muted">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="font-medium">罰單已生成</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      罰單編號: {ticketData.ticketNumber}
                    </p>
                  </div>
                  {!isSent && (
                    <Button className="w-full" onClick={handleSendTicket} disabled={loading}>
                      <Send className="mr-2 h-4 w-4" />
                      發送罰單
                    </Button>
                  )}
                  {isSent && (
                    <div className="p-4 border rounded-lg bg-muted">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="font-medium">罰單已發送</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="p-4 border rounded-lg bg-red-50 text-red-600">
                  <p className="text-sm">{error}</p>
                </div>
              )}
              </CardContent>
            </Card>
        ) : (
          <Card>
            <div className="p-6 text-center text-muted-foreground">
              請從左側選擇一個違規記錄以查看詳情
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
