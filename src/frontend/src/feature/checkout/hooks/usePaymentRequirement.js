import { useState, useEffect } from 'react';
import { useCartStore } from '../../product/store/useCartStore';
import { paymentApi } from '../api/checkout-api';

export const usePaymentRequirement = () => {
  const { items } = useCartStore();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (items.length === 0) {
      setData(null);
      return;
    }

    const payload = {
      items: items.map((item) => ({
        // Giỏ hàng có 2 nguồn thêm hàng với quy ước ID khác nhau:
        // - ProductsPage lưu variant ID vào productId
        // - ProductForm lưu variant ID riêng ở variantId (productId là Product ID)
        // Ưu tiên variantId, fallback productId để backend luôn nhận đúng ProductVariant ID.
        productVariantId: item.variantId || item.productId,
        lensId: item.lensId || null,
        quantity: item.quantity,
      })),
    };

    const fetchRequirement = async () => {
      setIsLoading(true);
      setIsError(false);
      try {
        const result = await paymentApi.getPaymentRequirement(payload);
        setData(result);
      } catch (error) {
        console.error('Lỗi khi lấy yêu cầu thanh toán:', error);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequirement();
  }, [items]);

  return { data, isLoading, isError };
};
