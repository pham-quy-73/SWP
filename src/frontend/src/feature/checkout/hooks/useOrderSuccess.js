import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCartStore } from '../../product/store/useCartStore';
import { useCheckoutStore } from '../store/useCheckoutStore';
import { paymentApi } from '../api/checkout-api';

export const useOrderSuccess = () => {
  const [searchParams] = useSearchParams();
  const clearCart = useCartStore((state) => state.clearCart);
  const resetCheckout = useCheckoutStore((state) => state.resetCheckout);

  const [isLoading, setIsLoading] = useState(true);
  const [orderData, setOrderData] = useState(null);

  const orderId = searchParams.get('orderId') || '#UNKNOWN';
  const email = searchParams.get('email') || 'customer@example.com';

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setIsLoading(true);
        const data = await paymentApi.getOrderDetails(orderId);
        if (data?.result) {
          setOrderData(data.result);
        }
      } catch (error) {
        console.error('Lỗi khi lấy thông tin đơn hàng:', error);
      } finally {
        setIsLoading(false);
        clearCart();
        resetCheckout();
      }
    };

    if (orderId !== '#UNKNOWN') {
      fetchOrderDetails();
    } else {
      setIsLoading(false);
      clearCart();
      resetCheckout();
    }
  }, [orderId, clearCart, resetCheckout]);

  const deliveryDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 3);
    return date.toLocaleDateString('vi-VN', {
      weekday: 'short',
      month: 'numeric',
      day: 'numeric',
    });
  }, []);

  return {
    orderId,
    email,
    deliveryDate,
    isLoading,
    orderData,
  };
};
