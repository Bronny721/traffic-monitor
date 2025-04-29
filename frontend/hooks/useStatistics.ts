import { useState, useEffect } from 'react';
import { Statistics } from '@/types/violations';
import { fetchStatistics } from '@/services/api';

interface UseStatisticsResult {
  statistics: Statistics | null;
  loading: boolean;
  error: Error | null;
  refetch: (timeRange?: string) => Promise<void>;
}

export function useStatistics(initialTimeRange: string = 'day'): UseStatisticsResult {
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [timeRange, setTimeRange] = useState(initialTimeRange);

  const fetchData = async (range: string = timeRange) => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchStatistics(range);
      setStatistics(data);
      setTimeRange(range);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('獲取統計數據失敗'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    statistics,
    loading,
    error,
    refetch: fetchData,
  };
} 