import { create } from 'zustand';

export const useCheckoutStore = create((set) => ({
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
    }),
}));
