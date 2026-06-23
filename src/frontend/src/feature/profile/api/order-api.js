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

export const orderApi = {
  getMyOrders: async (params = {}) => {
    const { page = 0, size = 10, sortBy = 'createdAt', sortDir = 'desc' } = params;

    const response = await api.get('/orders/me', {
      params: { page, size, sortBy, sortDir },
    });

    return response.data.result;
  },
  checkoutRemaining: async (orderId) => {
    const response = await api.post('/payment/checkout', undefined, {
      params: { orderId },
    });
    return response.data.result;
  },
};
