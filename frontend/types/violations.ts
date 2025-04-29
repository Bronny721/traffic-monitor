export interface VehicleInfo {
  licensePlate: string
  type: string
  color: string
}

export interface Violation {
  id: string
  type: string
  timestamp: string
  location: string
  cameraId: string
  confidence: number
  image: string
  status: '待審核' | '已確認' | '已駁回' | '已開罰'
  objects: DetectedObject[]
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
  vehicleInfo: VehicleInfo
}

export interface DetectedObject {
  id: string
  type: string
  x: number
  y: number
  width: number
  height: number
  confidence: number
  metadata?: Record<string, any>
}

export interface Camera {
  id: string
  name: string
  location: string
  status?: 'online' | 'offline' | 'error'
  streamUrl: string
  lastActive?: string
  metadata?: Record<string, any>
}

export interface ViolationType {
  type: string
  confidence: number
}

export interface DetectionResult {
  objects: DetectedObject[]
  violations: ViolationDetection[]
  timestamp: number
  processingTime: number
}

export interface ViolationDetection {
  type: string
  confidence: number
  objects: DetectedObject[]
  timestamp: number
  metadata?: Record<string, any>
}

export interface Statistics {
  totalViolations: number
  violationsByType: Record<string, number>
  violationsByHour: Record<string, number>
  violationsByCamera: Record<string, number>
  detectionAccuracy: number
  processingTime: number
  timeRange: string
}
