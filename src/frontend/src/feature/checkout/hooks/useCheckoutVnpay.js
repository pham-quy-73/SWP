import { useState } from 'react';
import { toast } from 'sonner';
import axios from 'axios';
import { paymentApi } from '../api/checkout-api';

export const useCheckoutVnpay = () => {
  const [isPending, setIsPending] = useState(false);

  const mutate = async (orderId) => {
    setIsPending(true);
    const toastId = toast.loading('Đang chuyển hướng đến VNPay...');
    try {
      const data = await paymentApi.checkoutVnpay(orderId);
      const url = typeof data === 'string' ? data : data?.result || data?.paymentUrl || data?.url;

      if (url) {
        toast.success('Thành công! Đang chuyển hướng...', { id: toastId });
        window.location.href = url;
      } else {
        toast.error('Không tìm thấy link thanh toán từ hệ thống!', { id: toastId });
      }
    } catch (error) {
      console.error('Error initiating VNPay checkout:', error);
      let errorMessage = 'Có lỗi xảy ra khi tạo link thanh toán';
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
