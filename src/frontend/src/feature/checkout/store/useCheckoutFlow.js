import { useState } from 'react';
import { useCartStore } from '../../product/store/useCartStore';
import { useCheckoutStore } from './useCheckoutStore';
import { toast } from 'sonner';
import axios from 'axios';
import { paymentApi } from '../api/checkout-api';

export const useCheckoutFlow = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { step, setStep, nextStep, prevStep, shippingData, paymentMethod, bankInfo } =
    useCheckoutStore();
  const { items, clearCart } = useCartStore();

  const submitOrder = async () => {
    if (isSubmitting) return;
    const toastId = toast.loading('Đang khởi tạo đơn hàng...');

    try {
      setIsSubmitting(true);

      // --- VALIDATION NHANH ---
      if (!shippingData.phone || !shippingData.address || !shippingData.name) {
        toast.error('Thiếu thông tin giao hàng', {
          id: toastId,
          description: 'Vui lòng kiểm tra lại họ tên, số điện thoại và địa chỉ, cũng như thông tin ngân hàng nếu chọn thanh toán chuyển khoản.',
        });
        setIsSubmitting(false);
        setStep(1);
        return;
      }
      // --- VALIDATION NHÀN RỖI TRUYỀN THỐNG ---
      const hasSomeBankInfo = !!(bankInfo?.bankName || bankInfo?.bankAccountNumber || bankInfo?.accountHolderName);
      if (hasSomeBankInfo && (!bankInfo?.bankName || !bankInfo?.bankAccountNumber || !bankInfo?.accountHolderName)) {
        toast.error('Thông tin ngân hàng không đầy đủ', {
          id: toastId,
          description: 'Vui lòng điền đầy đủ Tên ngân hàng, Số tài khoản và Tên chủ tài khoản (nếu muốn bổ sung).',
        });
        setIsSubmitting(false);
        setStep(2);
        return;
      }


      // --- BƯỚC 1: CHUẨN BỊ DATA ---
      const deliveryAddress = `${shippingData.address || ''}`.trim();

      const orderItems = items.map((item) => {
        let mappedPrescription = null;
        if (item.prescription) {
          const p = item.prescription;
          mappedPrescription = {
            odSphere: parseFloat(p.od?.sphere) || 0,
            odCylinder: parseFloat(p.od?.cylinder) || 0,
            odAxis: parseFloat(p.od?.axis) || 0,
            odAdd: parseFloat(p.od?.add) || 0,
            odPd: parseFloat(p.od?.pd) || 0,
            osSphere: parseFloat(p.os?.sphere) || 0,
            osCylinder: parseFloat(p.os?.cylinder) || 0,
            osAxis: parseFloat(p.os?.axis) || 0,
            osAdd: parseFloat(p.os?.add) || 0,
            osPd: parseFloat(p.os?.pd) || 0,
            hasImage: !!p.imageUrl,
            note: p.notes || '',
          };
        }
        return {
          productVariantId: item.variantId || item.productId,
          quantity: item.quantity,
          lensId: item.lensId || null,
          prescription: mappedPrescription,
        };
      });

      const validBankInfo =
        bankInfo?.bankName && bankInfo?.bankAccountNumber && bankInfo?.accountHolderName
          ? bankInfo
          : null;

      const orderInfo = {
        deliveryAddress: deliveryAddress,
        recipientName: shippingData.name,
        phoneNumber: shippingData.phone,
        items: orderItems,
        comboId: null,
        bankInfo: validBankInfo,
      };

      const formData = new FormData();
      formData.append('orderInfo', JSON.stringify(orderInfo));

      // --- XỬ LÝ ẢNH ---
      const itemWithImage = items.find((item) => item.prescription?.imageUrl);
      const imageUrl = itemWithImage?.prescription?.imageUrl;

      if (imageUrl && imageUrl.startsWith('data:image/')) {
        const response = await fetch(imageUrl);
        const blobData = await response.blob();
        formData.append('prescriptionImage', blobData, 'prescription.jpg');
      } else {
        formData.append('prescriptionImage', '');
      }

      // --- BƯỚC 2: TẠO ĐƠN HÀNG (SỬ DỤNG API ĐÃ TÁCH) ---
      // Nếu là thanh toán giả lập, chuyển đổi phương thức thành 'VNPAY' lên server để khớp CSDL.
      const apiPaymentMethod = (paymentMethod === 'MOCK_SUCCESS' || paymentMethod === 'MOCK_FAILURE')
        ? 'VNPAY'
        : paymentMethod;

      const orderResponseData = await paymentApi.createOrder(formData, apiPaymentMethod);
      const actualOrderId = orderResponseData?.result?.orderId || orderResponseData?.orderId;

      if (!actualOrderId) throw new Error('Không lấy được mã đơn hàng.');

      // --- BƯỚC 3: XỬ LÝ THANH TOÁN (SỬ DỤNG API ĐÃ TÁCH) ---
      if (paymentMethod === 'MOCK_SUCCESS' || paymentMethod === 'MOCK_FAILURE') {
        toast.loading('Đang xử lý mô phỏng thanh toán...', { id: toastId });

        const mockResult = await paymentApi.mockCheckout(
          actualOrderId,
          paymentMethod === 'MOCK_SUCCESS' ? 'SUCCESS' : 'FAILURE'
        );
        const redirectUrl = mockResult?.result?.redirectUrl;

        if (redirectUrl) {
          clearCart();
          setTimeout(() => {
            window.location.href = redirectUrl;
          }, 1000);
        } else {
          throw new Error('Không nhận được URL chuyển hướng từ API mô phỏng.');
        }
      } else {
        toast.loading('Đang kết nối cổng thanh toán VNPay...', { id: toastId });

        const paymentResponseData = await paymentApi.checkoutVnpay(actualOrderId);
        const paymentUrl = paymentResponseData?.result || paymentResponseData;

        if (paymentUrl && typeof paymentUrl === 'string') {
          clearCart();
          setTimeout(() => {
            window.location.href = paymentUrl;
          }, 1000);
        } else {
          toast.error('Lỗi cổng thanh toán VNPay', { id: toastId });
          setIsSubmitting(false);
        }
      }
    } catch (error) {
      console.error('Checkout Error:', error);

      let errorMessage = 'Có lỗi xảy ra, vui lòng thử lại sau.';

      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message || errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast.error('Đặt hàng thất bại', {
        id: toastId,
        description: errorMessage,
      });
      setIsSubmitting(false);
    }
  };

  const handleContinue = () => {
    if (isSubmitting) return;
    if (step === 1) {
      if (!shippingData.name?.trim() || !shippingData.phone?.trim() || !shippingData.address?.trim()) {
        toast.error('Thiếu thông tin giao hàng', {
          description: 'Vui lòng cung cấp đầy đủ Họ tên, Số điện thoại và Địa chỉ nhận hàng để tiếp tục.'
        });
        return;
      }

      const phoneClean = shippingData.phone.replace(/\s/g, '');
      const phoneRegex = /^[0-9+]{9,15}$/;
      if (!phoneRegex.test(phoneClean)) {
        toast.error('Số điện thoại không hợp lệ', {
          description: 'Số điện thoại phải từ 9 đến 15 chữ số.'
        });
        return;
      }

      nextStep();
    } else if (step === 2) {
      nextStep();
    } else {
      submitOrder();
    }
  };

  return {
    step,
    setStep,
    handleContinue,
    handleBack: prevStep,
    isSubmitting,
  };
};
