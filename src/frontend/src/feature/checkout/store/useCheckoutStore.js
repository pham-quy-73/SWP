import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Persist qua sessionStorage: state phải sống sót qua redirect sang VNPay và
// quay về (full page reload) — đặc biệt pendingOrder để thanh toán lại trên
// CÙNG đơn thay vì tạo đơn trùng lặp. sessionStorage tự xóa khi đóng tab.
export const useCheckoutStore = create(
  persist(
    (set) => ({
      step: 1,

      // Khởi tạo giá trị mặc định
      shippingData: {
        name: '',
        address: '',
        phone: '',
        email: '',
      },
      paymentMethod: 'VNPAY',
      bankInfo: {
        bankName: '',
        bankAccountNumber: '',
        accountHolderName: '',
      },

      // Đơn PENDING đã tạo nhưng chưa thanh toán xong (khách hủy giữa chừng
      // trên trang VNPay): { orderId, signature } — signature là snapshot nội
      // dung đơn để chỉ tái sử dụng khi giỏ hàng/địa chỉ không đổi.
      pendingOrder: null,

      setStep: (step) => set({ step }),

      nextStep: () =>
        set((state) => ({
          step: Math.min(state.step + 1, 3),
        })),

      prevStep: () =>
        set((state) => ({
          step: Math.max(state.step - 1, 1),
        })),

      updateShippingData: (data) =>
        set((state) => ({
          shippingData: { ...state.shippingData, ...data },
        })),

      setPaymentMethod: (method) => set({ paymentMethod: method }),

      updateBankInfo: (data) =>
        set((state) => ({
          bankInfo: state.bankInfo
            ? { ...state.bankInfo, ...data }
            : { bankName: '', bankAccountNumber: '', accountHolderName: '', ...data },
        })),

      setPendingOrder: (pendingOrder) => set({ pendingOrder }),

      // Reset về trạng thái ban đầu
      resetCheckout: () =>
        set({
          step: 1,
          shippingData: {
            name: '',
            address: '',
            phone: '',
            email: '',
          },
          paymentMethod: 'VNPAY',
          bankInfo: {
            bankName: '',
            bankAccountNumber: '',
            accountHolderName: '',
          },
          pendingOrder: null,
        }),
    }),
    {
      name: 'checkout-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
