import { useState, useEffect, useCallback } from 'react';
import { Violation } from '@/types/violations';
import { fetchViolations, createViolation, updateViolation, deleteViolation } from '@/services/api';

interface UseViolationsResult {
  violations: Violation[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  addViolation: (violation: Partial<Violation>) => Promise<void>;
  updateViolationStatus: (id: string, status: Violation['status']) => Promise<void>;
  deleteViolationRecord: (id: string) => Promise<void>;
  filters: Record<string, any>;
  setFilters: (filters: Record<string, any>) => void;
}

export function useViolations(): UseViolationsResult {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<Record<string, any>>({});

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchViolations(filters);
      setViolations(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('獲取違規記錄失敗'));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addViolation = async (violationData: Partial<Violation>) => {
    try {
      setLoading(true);
      const newViolation = await createViolation(violationData);
      setViolations(prev => [...prev, newViolation]);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('添加違規記錄失敗'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateViolationStatus = async (id: string, status: Violation['status']) => {
    try {
      setLoading(true);
      const updatedViolation = await updateViolation(id, { status });
      setViolations(prev =>
        prev.map(v => (v.id === id ? updatedViolation : v))
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error('更新違規狀態失敗'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteViolationRecord = async (id: string) => {
    try {
      setLoading(true);
      await deleteViolation(id);
      setViolations(prev => prev.filter(v => v.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('刪除違規記錄失敗'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    violations,
    loading,
    error,
    refetch: fetchData,
    addViolation,
    updateViolationStatus,
    deleteViolationRecord,
    filters,
    setFilters,
  };
} 