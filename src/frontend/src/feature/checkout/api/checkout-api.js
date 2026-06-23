import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const paymentApi = {
  getPaymentRequirement: async (payload) =>
    await api
      .post('/payment/orders/requirement', payload)
      .then((res) => res.data),
  createOrder: async (formData, paymentMethod) =>
    await api
      .post('/orders/create', formData, {
        params: {
          PaymentMethod: paymentMethod,
        },
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((res) => res.data),

  // Lấy link thanh toán VNPay
  checkoutVnpay: async (orderId) =>
    await api
      .post('/payment/checkout', null, {
        params: { orderId: orderId },
      })
      .then((res) => res.data),
  getOrderDetails: async (orderId) =>
    await api.get(`/orders/${orderId}`).then((res) => res.data),
};
