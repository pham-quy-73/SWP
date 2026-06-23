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

export const profileApi = {
  // 1. Lấy thông tin cá nhân
  getProfile: async () => {
    const response = await api.get('/users/me');
    return response.data.result;
  },

  // 2. Cập nhật thông tin cá nhân
  updateProfile: (data) => {
    return api.put('/profile', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // 3. Thay đổi mật khẩu
  changePassword: (data) => {
    return api.post('/profile/change-password', data);
  },

  // 4. Lấy đơn hàng của người dùng
  getOrders: async (page = 0, size = 10) => {
    const response = await api.get(
      `/orders/me?page=${page}&size=${size}&sortBy=createdAt&sortDir=desc`,
    );
    return response.data.result;
  },

  // 5. Hủy đơn hàng (chỉ áp dụng cho PRE_ORDER chưa xử lý)
  cancelOrder: (orderId) => {
    return api.put(`/orders/${orderId}/cancel`);
  },

  // 6. Lấy địa chỉ của người dùng
  getAddresses: () => {
    return api.get('/profile/addresses');
  },

  // 6. Feedback APIs
  getFeedbackByOrder: (orderId) => {
    return api.get(`/feedbacks/order/${orderId}`);
  },

  getFeedbackDetail: (feedbackId) => {
    return api.get(`/feedbacks/${feedbackId}`);
  },

  getMyFeedbacks: () => {
    return api.get('/feedbacks/me');
  },

  createFeedback: (data) => {
    return api.post('/feedbacks', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  updateFeedback: (feedbackId, data) => {
    return api.put(`/feedbacks/${feedbackId}`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  deleteFeedback: (feedbackId) => {
    return api.delete(`/feedbacks/${feedbackId}`);
  },
};
