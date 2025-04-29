import { Violation, Camera, Statistics, DetectionResult } from '@/types/violations';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// 攝影機相關API
export const fetchCameraStreams = async (): Promise<Camera[]> => {
  // 直接返回固定的攝影機列表
  return [];  // 返回空列表，因為特定攝影機會在組件中添加
};

// 違規記錄相關API
export const fetchViolations = async (filters: Record<string, any> = {}): Promise<Violation[]> => {
  const queryParams = new URLSearchParams(filters).toString();
  const response = await fetch(`${API_BASE_URL}/violations?${queryParams}`);
  if (!response.ok) throw new Error('獲取違規記錄失敗');
  return response.json();
};

export const createViolation = async (violation: Partial<Violation>): Promise<Violation> => {
  const response = await fetch(`${API_BASE_URL}/violations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(violation),
  });
  if (!response.ok) throw new Error('創建違規記錄失敗');
  return response.json();
};

export const updateViolation = async (id: string, data: Partial<Violation>): Promise<Violation> => {
  const response = await fetch(`${API_BASE_URL}/violations/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('更新違規記錄失敗');
  return response.json();
};

export const deleteViolation = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/violations/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('刪除違規記錄失敗');
};

// 統計數據相關API
export const fetchStatistics = async (timeRange: string = 'day'): Promise<Statistics> => {
  const response = await fetch(`${API_BASE_URL}/statistics?timeRange=${timeRange}`);
  if (!response.ok) throw new Error('獲取統計數據失敗');
  return response.json();
};

// 罰單相關API
export interface Ticket {
  id: string;
  ticketNumber: string;
  violationId: string;
  violationDate: string;
  violationType: string;
  location: string;
  fineAmount: number;
  issuingOfficer: string;
  notes?: string;
  status: '待處理' | '已發送' | '已繳費' | '逾期未繳';
  createdAt: string;
  updatedAt: string;
}

export const createTicket = async (ticketData: Partial<Ticket>): Promise<Ticket> => {
  const response = await fetch(`${API_BASE_URL}/tickets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(ticketData),
  });
  if (!response.ok) throw new Error('創建罰單失敗');
  return response.json();
};

export const sendTicket = async (ticketNumber: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/tickets/${ticketNumber}/send`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('發送罰單失敗');
};

// WebSocket連接URL
export const getWebSocketUrl = (cameraId: string): string => {
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsHost = process.env.NEXT_PUBLIC_WS_HOST || window.location.hostname;
  const wsPort = process.env.NEXT_PUBLIC_WS_PORT || '8765';
  return `${wsProtocol}//${wsHost}:${wsPort}`;
}; 