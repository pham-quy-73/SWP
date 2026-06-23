import axios from 'axios';

const getApi = () => {
  const apiURL = import.meta.env.VITE_API_URL || '';
  const token = localStorage.getItem('accessToken');
  return axios.create({
    baseURL: apiURL,
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
};

export const policyApi = {
  getAll: async (page = 0, size = 10) => {
    const api = getApi();
    const res = await api.get(`/api/policies`, { params: { page, size } });
    return res.data.result;
  },

  getById: async (id) => {
    const api = getApi();
    const res = await api.get(`/api/policies/${id}`);
    return res.data.result;
  },

  create: async (data) => {
    const api = getApi();
    const res = await api.post(`/api/policies`, data);
    return res.data.result;
  },

  update: async (id, data) => {
    const api = getApi();
    const res = await api.put(`/api/policies/${id}`, data);
    return res.data.result;
  },

  delete: async (id) => {
    const api = getApi();
    await api.delete(`/api/policies/${id}`);
  },
};
