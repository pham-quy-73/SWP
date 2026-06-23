import { useState, useEffect, useCallback } from 'react';
import { refundApi } from '../api/refund-api';

// 1. Hook lấy đơn bị ảnh hưởng
export function useAffectedOrders(variantId) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(async () => {
    if (!variantId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await refundApi.getAffectedOrders(variantId);
      setData(result);
    } catch (err) {
      setError(err.message || 'Lỗi tải đơn hàng ảnh hưởng');
    } finally {
      setLoading(false);
    }
  }, [variantId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { data, loading, error, refetch: fetchOrders };
}

// 2. Hook lấy danh sách đơn hủy có thanh toán thành công
export function useCancelledPaidOrders(initialParams = {}) {
  const [data, setData] = useState({ items: [], page: 0, size: 10, totalElements: 0, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetch = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    try {
      const result = await refundApi.getCancelledPaidOrders(params);
      setData(result);
    } catch (err) {
      setError(err.message || 'Lỗi tải đơn hàng đã hủy');
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, fetch };
}

// 3. Hook lấy danh sách refund sẵn sàng xử lý
export function useReadyRefunds() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await refundApi.getReadyRefunds();
      setData(result);
    } catch (err) {
      setError(err.message || 'Lỗi tải danh sách hoàn tiền sẵn sàng');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// 4. Hook vô hiệu hóa variant
export function useInActivateVariant() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const run = useCallback(async (variantId) => {
    setLoading(true);
    setError(null);
    try {
      await refundApi.inActivateVariant(variantId);
    } catch (err) {
      setError(err.message || 'Lỗi vô hiệu hóa variant');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { run, loading, error };
}

// 5. Hook tạo lô hoàn tiền (create batch)
export function useCreateBatch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const run = useCallback(async (orderIds) => {
    setLoading(true);
    setError(null);
    try {
      const result = await refundApi.createBatch(orderIds);
      return result;
    } catch (err) {
      setError(err.message || 'Lỗi tạo batch hoàn tiền');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { run, loading, error };
}

// 6. Hook xác nhận hoàn tiền VNPay
export function useCheckoutRefund() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const run = useCallback(async (refundId) => {
    setLoading(true);
    setError(null);
    try {
      const url = await refundApi.checkoutRefund(refundId);
      return url;
    } catch (err) {
      setError(err.message || 'Lỗi thanh toán hoàn tiền');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { run, loading, error };
}
