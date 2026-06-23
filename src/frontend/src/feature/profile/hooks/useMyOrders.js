import { useState, useEffect, useCallback } from 'react';
import { orderApi } from '../api/order-api';
import { toast } from 'sonner';
import axios from 'axios';

export const useMyOrders = (params = {}) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const result = await orderApi.getMyOrders(params);
      setData(result);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { data, isLoading, isError, refetch: fetchOrders };
};

export const useCheckoutRemaining = () => {
  const [isPending, setIsPending] = useState(false);

  const mutate = async (orderId) => {
    setIsPending(true);
    const toastId = toast.loading('Đang chuyển dịch sang cổng thanh toán...');
    try {
      const paymentUrl = await orderApi.checkoutRemaining(orderId);
      if (paymentUrl) {
        window.location.href = paymentUrl;
      } else {
        toast.error('Không tìm thấy đường dẫn thanh toán. Vui lòng thử lại!', { id: toastId });
      }
    } catch (error) {
      console.error('Checkout remaining failed:', error);
      let errorMessage = 'Lỗi kết nối đến cổng thanh toán';
      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message || errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast.error(errorMessage, { id: toastId });
    } finally {
      setIsPending(false);
    }
  };

  return { mutate, isPending };
};
