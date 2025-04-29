"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Violation } from "@/types/violations"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"

interface StatisticsProps {
  violations: Violation[]
}

export default function Statistics({ violations }: StatisticsProps) {
  // 計算總罰款金額
  const totalFines = violations
    .filter(v => v.status === '已開罰')
    .length * 2400

  // 計算確認率
  const confirmationRate = violations.length > 0
    ? (violations.filter(v => ['已確認', '已開罰'].includes(v.status)).length / violations.length) * 100
    : 0

  // 按違規類型分組
  const violationsByType = violations.reduce((acc, v) => {
    acc[v.type] = (acc[v.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const violationTypeData = Object.entries(violationsByType).map(([name, value]) => ({
    name,
    value,
          }))

  // 按小時分組
  const violationsByHour = violations.reduce((acc, v) => {
    const hour = new Date(v.timestamp).getHours()
    acc[hour] = (acc[hour] || 0) + 1
    return acc
  }, {} as Record<number, number>)

  const hourlyData = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    count: violationsByHour[i] || 0,
  }))

  // 計算平均信心度
  const averageConfidence = violations.length > 0
    ? (violations.reduce((sum, v) => sum + v.confidence, 0) / violations.length) * 100
    : 0

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>統計數據</CardTitle>
        <CardDescription>違規檢測系統的統計分析</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="summary" className="space-y-4">
          <TabsList>
            <TabsTrigger value="summary">總覽</TabsTrigger>
            <TabsTrigger value="hourly">時段分析</TabsTrigger>
            <TabsTrigger value="types">類型分析</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">總違規數</CardTitle>
          </CardHeader>
          <CardContent>
                  <div className="text-2xl font-bold">{violations.length}</div>
          </CardContent>
        </Card>
        <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">總罰款金額</CardTitle>
          </CardHeader>
          <CardContent>
                  <div className="text-2xl font-bold">${totalFines}</div>
          </CardContent>
        </Card>
        <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">確認率</CardTitle>
          </CardHeader>
          <CardContent>
                  <div className="text-2xl font-bold">{confirmationRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">平均信心度</CardTitle>
          </CardHeader>
          <CardContent>
                  <div className="text-2xl font-bold">{averageConfidence.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>
          </TabsContent>

          <TabsContent value="hourly">
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" name="違規數量" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="types">
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={violationTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={150}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {violationTypeData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
  )
}
