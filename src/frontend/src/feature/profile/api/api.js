import { httpClient } from '../../../lib/httpClient';

export const profileApi = {
  // 1. Lấy thông tin cá nhân
  getProfile: async () => {
    const response = await httpClient.get('/users/me');
    return response.data.result;
  },

  // 2. Cập nhật thông tin cá nhân
  updateProfile: (data) => {
    return httpClient.put('/profile', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // 3. Thay đổi mật khẩu
  changePassword: (data) => {
    return httpClient.post('/profile/change-password', data);
  },

  // 4. Lấy đơn hàng của người dùng
  getOrders: async (page = 0, size = 10) => {
    const response = await httpClient.get(
      `/orders/me?page=${page}&size=${size}&sortBy=createdAt&sortDir=desc`,
    );
    return response.data.result;
  },

  // 5. Hủy đơn hàng (chỉ áp dụng cho PRE_ORDER chưa xử lý)
  cancelOrder: (orderId) => {
    return httpClient.put(`/orders/${orderId}/cancel`);
  },

  // 6. Address Book — CRUD địa chỉ đã lưu (persistent)
  getAddresses: async () => {
    const response = await httpClient.get('/api/addresses');
    return response.data.result || [];
  },

  createAddress: async (payload) => {
    const response = await httpClient.post('/api/addresses', payload);
    return response.data.result;
  },

  updateAddress: async (id, payload) => {
    const response = await httpClient.put(`/api/addresses/${id}`, payload);
    return response.data.result;
  },

  setDefaultAddress: async (id) => {
    const response = await httpClient.put(`/api/addresses/${id}/default`);
    return response.data.result;
  },

  deleteAddress: async (id) => {
    const response = await httpClient.delete(`/api/addresses/${id}`);
    return response.data;
  },

  // 6. Feedback APIs
  getFeedbackByOrder: (orderId) => {
    return httpClient.get(`/feedbacks/order/${orderId}`);
  },

  getFeedbackDetail: (feedbackId) => {
    return httpClient.get(`/feedbacks/${feedbackId}`);
  },

  getMyFeedbacks: () => {
    return httpClient.get('/feedbacks/me');
  },

  createFeedback: (data) => {
    return httpClient.post('/feedbacks', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  updateFeedback: (feedbackId, data) => {
    return httpClient.put(`/feedbacks/${feedbackId}`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  deleteFeedback: (feedbackId) => {
    return httpClient.delete(`/feedbacks/${feedbackId}`);
  },
};
