import { httpClient } from '../../../lib/httpClient';

export const orderApi = {
  getMyOrders: async (params = {}) => {
    const { page = 0, size = 10, sortBy = 'createdAt', sortDir = 'desc' } = params;

    const response = await httpClient.get('/orders/me', {
      params: { page, size, sortBy, sortDir },
    });

    return response.data.result;
  },
  checkoutRemaining: async (orderId) => {
    const response = await httpClient.post('/payment/checkout', undefined, {
      params: { orderId },
    });
    return response.data.result;
  },
};
