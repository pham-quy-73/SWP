import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

export const useManagerLenses = (queryParams = {}) => {
  const [lenses, setLenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const fetchLenses = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const apiURL = import.meta.env.VITE_API_URL || '';
      const token = localStorage.getItem('accessToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await axios.get(`${apiURL}/api/lenses`, {
        params: {
          search: queryParams.search || undefined,
          status: queryParams.status || 'ALL'
        },
        headers
      });

      if (response.data && response.data.data) {
        setLenses(response.data.data);
      } else {
        setLenses([]);
      }
    } catch (error) {
      console.error('Error fetching manager lenses:', error);
      setIsError(true);
      toast.error('Không thể tải danh sách tròng kính');
    } finally {
      setIsLoading(false);
    }
  }, [JSON.stringify(queryParams)]);

  useEffect(() => {
    fetchLenses();
  }, [fetchLenses]);

  return { lenses, isLoading, isError, refetch: fetchLenses };
};

export const useCreateManagerLens = () => {
  const [isPending, setIsPending] = useState(false);

  const mutate = async (lensData, { onSuccess, onError } = {}) => {
    setIsPending(true);
    const toastId = toast.loading('Đang khởi tạo tròng kính...');
    try {
      const apiURL = import.meta.env.VITE_API_URL || '';
      const token = localStorage.getItem('accessToken');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };

      const response = await axios.post(`${apiURL}/api/lenses`, lensData, { headers });
      toast.success('Thêm tròng kính thành công!', { id: toastId });
      if (onSuccess) onSuccess(response.data.data);
      return response.data.data;
    } catch (error) {
      console.error('Create lens failed:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi thêm tròng kính', { id: toastId });
      if (onError) onError(error);
    } finally {
      setIsPending(false);
    }
  };

  return { mutate, isPending };
};

export const useUpdateManagerLens = () => {
  const [isPending, setIsPending] = useState(false);

  const mutate = async ({ id, payload }, { onSuccess, onError } = {}) => {
    setIsPending(true);
    const toastId = toast.loading('Đang cập nhật tròng kính...');
    try {
      const apiURL = import.meta.env.VITE_API_URL || '';
      const token = localStorage.getItem('accessToken');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };

      const response = await axios.put(`${apiURL}/api/lenses/${id}`, payload, { headers });
      toast.success('Cập nhật tròng kính thành công!', { id: toastId });
      if (onSuccess) onSuccess(response.data.data);
      return response.data.data;
    } catch (error) {
      console.error('Update lens failed:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi cập nhật tròng kính', { id: toastId });
      if (onError) onError(error);
    } finally {
      setIsPending(false);
    }
  };

  return { mutate, isPending };
};

export const useDeleteManagerLens = () => {
  const [isPending, setIsPending] = useState(false);

  const mutate = async (id, { onSuccess, onError } = {}) => {
    setIsPending(true);
    const toastId = toast.loading('Đang xóa tròng kính...');
    try {
      const apiURL = import.meta.env.VITE_API_URL || '';
      const token = localStorage.getItem('accessToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      await axios.delete(`${apiURL}/api/lenses/${id}`, { headers });
      toast.success('Đã ẩn tròng kính khỏi danh sách!', { id: toastId });
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Delete lens failed:', error);
      toast.error('Lỗi khi xóa tròng kính', { id: toastId });
      if (onError) onError(error);
    } finally {
      setIsPending(false);
    }
  };

  return { mutate, isPending };
};
