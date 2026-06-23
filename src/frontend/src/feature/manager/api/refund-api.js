import axios from 'axios';

const getApi = () => {
  const apiURL = import.meta.env.VITE_API_URL || '';
  const token = localStorage.getItem('accessToken');
  return axios.create({
    baseURL: apiURL,
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
};

export const refundApi = {
  // Bước 1: Vô hiệu hóa variant
  inActivateVariant: async (variantId) => {
    const api = getApi();
    await api.patch(`/api/refund/variant/${variantId}/in-activate`);
  },

  // Bước 2: Lấy danh sách đơn hàng bị ảnh hưởng
  getAffectedOrders: async (variantId) => {
    const api = getApi();
    const res = await api.get(`/api/refund/affected-orders/${encodeURIComponent(variantId)}`);
    return res.data?.result || [];
  },

  // [Khách hủy] Lấy đơn đã hủy có thanh toán thành công
  getCancelledPaidOrders: async (params) => {
    const api = getApi();
    const res = await api.get(`/api/management/orders/cancelled/paid`, { params });
    return res.data?.result || { items: [], page: 0, size: 10, totalElements: 0, totalPages: 0 };
  },

  // Bước 3: Tạo batch hoàn tiền
  createBatch: async (orderIds) => {
    const api = getApi();
    const res = await api.post(`/api/refund/create-batch`, { orderIds });
    return res.data?.result || [];
  },

  // Bước 4: Lấy danh sách refund sẵn sàng xử lý
  getReadyRefunds: async () => {
    const api = getApi();
    const res = await api.get(`/api/refund/ready`);
    return res.data?.result || [];
  },

  // Bước 5: Xác nhận hoàn tiền -> trả về url VNPay
  checkoutRefund: async (refundId) => {
    const api = getApi();
    const res = await api.post(`/api/refund/${refundId}/refund-checkout`);
    return res.data?.result || null;
  },
};
