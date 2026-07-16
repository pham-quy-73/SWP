import { httpClient } from '../../../lib/httpClient';

export const paymentApi = {
  getPaymentRequirement: async (payload) =>
    await httpClient
      .post('/payment/orders/requirement', payload)
      .then((res) => res.data),
  createOrder: async (formData, paymentMethod) =>
    await httpClient
      .post('/orders/create', formData, {
        params: {
          PaymentMethod: paymentMethod,
        },
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((res) => res.data),

  // Lấy link thanh toán VNPay
  checkoutVnpay: async (orderId) =>
    await httpClient
      .post('/payment/checkout', null, {
        params: { orderId: orderId },
      })
      .then((res) => res.data),
  // Mô phỏng thanh toán
  mockCheckout: async (orderId, simulateStatus) =>
    await httpClient
      .post('/payment/mock-checkout', { orderId, simulateStatus })
      .then((res) => res.data),
  getOrderDetails: async (orderId) =>
    await httpClient.get(`/orders/${orderId}`).then((res) => res.data),
};
