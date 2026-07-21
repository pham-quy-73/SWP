import { httpClient } from '../../../lib/httpClient';

export const policyApi = {
  getAll: async (page = 0, size = 10) => {
    const res = await httpClient.get(`/policies`, { params: { page, size } });
    return res.data.result;
  },

  getById: async (id) => {
    const res = await httpClient.get(`/policies/${id}`);
    return res.data.result;
  },

  create: async (data) => {
    const res = await httpClient.post(`/policies`, data);
    return res.data.result;
  },

  update: async (id, data) => {
    const res = await httpClient.put(`/policies/${id}`, data);
    return res.data.result;
  },

  delete: async (id) => {
    await httpClient.delete(`/policies/${id}`);
  },
};
