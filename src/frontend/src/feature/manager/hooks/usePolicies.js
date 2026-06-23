import { useState, useCallback } from 'react';
import { policyApi } from '../api/policy-api';

// Hook 1: Lấy danh sách chính sách
export function usePolicies() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetch = useCallback(async (page = 0, size = 10) => {
    setLoading(true);
    setError(null);
    try {
      const result = await policyApi.getAll(page, size);
      setData(result);
    } catch (e) {
      setError(e.message ?? 'Lỗi tải danh sách chính sách');
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, fetch };
}

// Hook 2: Tạo chính sách mới
export function useCreatePolicy() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const run = useCallback(async (form) => {
    setLoading(true);
    setError(null);
    try {
      return await policyApi.create(form);
    } catch (e) {
      const msg = e.response?.data?.message ?? e.message ?? 'Lỗi tạo chính sách';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, run };
}

// Hook 3: Cập nhật chính sách
export function useUpdatePolicy() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const run = useCallback(async (id, form) => {
    setLoading(true);
    setError(null);
    try {
      return await policyApi.update(id, form);
    } catch (e) {
      const msg = e.response?.data?.message ?? e.message ?? 'Lỗi cập nhật chính sách';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, run };
}

// Hook 4: Xóa chính sách
export function useDeletePolicy() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const run = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      await policyApi.delete(id);
    } catch (e) {
      const msg = e.response?.data?.message ?? e.message ?? 'Lỗi xóa chính sách';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, run };
}
