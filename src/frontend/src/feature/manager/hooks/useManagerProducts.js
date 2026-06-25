import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

export const useManagerProducts = (queryParams = {}) => {
  const [data, setData] = useState({ items: [], totalElements: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const apiURL = import.meta.env.VITE_API_URL || '';

      // Đã thêm status: 'ALL' để Manager thấy cả sản phẩm ACTIVE và INACTIVE
      const mappedParams = {
        page: (queryParams.page !== undefined ? queryParams.page : 0) + 1,
        limit: queryParams.size || 10,
        search: queryParams.q || undefined,
        status: queryParams.status || 'ALL'
      };

      const token = localStorage.getItem('accessToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await axios.get(`${apiURL}/api/products`, {
        params: mappedParams,
        headers
      });

      if (response.data && response.data.result) {
        setData(response.data.result);
      } else {
        setData({ items: [], totalElements: 0, totalPages: 1 });
      }
    } catch (error) {
      console.error('Error fetching manager products:', error);
      setIsError(true);
      toast.error('Không thể tải danh sách sản phẩm');
    } finally {
      setIsLoading(false);
    }
  }, [JSON.stringify(queryParams)]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { data, isLoading, isError, refetch: fetchProducts };
};

export const useCreateManagerProduct = () => {
  const [isPending, setIsPending] = useState(false);

  // Đã sửa cấu trúc destructuring (payload)
  const mutate = async ({ productData, files }, { onSuccess, onError } = {}) => {
    setIsPending(true);
    const toastId = toast.loading('Đang khởi tạo sản phẩm...');
    try {
      const apiURL = import.meta.env.VITE_API_URL || '';
      const token = localStorage.getItem('accessToken');
      const headers = {
        'Content-Type': 'multipart/form-data',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };

      const formData = new FormData();
      formData.append('product', JSON.stringify(productData));
      if (files && files.length > 0) {
        files.forEach((file) => {
          formData.append('files', file);
        });
      }

      const response = await axios.post(`${apiURL}/api/products`, formData, { headers });
      toast.success('Thêm sản phẩm thành công!', { id: toastId });
      if (onSuccess) onSuccess(response.data.result);
      return response.data.result;
    } catch (error) {
      console.error('Create product failed:', error);
      toast.error('Lỗi khi thêm sản phẩm. Vui lòng thử lại!', { id: toastId });
      if (onError) onError(error);
    } finally {
      setIsPending(false);
    }
  };

  return { mutate, isPending };
};

export const useUpdateManagerProduct = () => {
  const [isPending, setIsPending] = useState(false);

  // Payload đã được xử lý chuẩn
  const mutate = async ({ id, payload }, { onSuccess, onError } = {}) => {
    setIsPending(true);
    const toastId = toast.loading('Đang cập nhật sản phẩm...');
    try {
      const apiURL = import.meta.env.VITE_API_URL || '';
      const token = localStorage.getItem('accessToken');
      const headers = {
        'Content-Type': 'multipart/form-data',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };

      const formData = new FormData();
      formData.append('product', JSON.stringify(payload.productData));
      if (payload.files && payload.files.length > 0) {
        payload.files.forEach((file) => {
          formData.append('files', file);
        });
      }

      const response = await axios.put(`${apiURL}/api/products/${id}`, formData, { headers });
      toast.success('Cập nhật sản phẩm thành công!', { id: toastId });
      if (onSuccess) onSuccess(response.data.result);
      return response.data.result;
    } catch (error) {
      console.error('Update product failed:', error);
      toast.error('Lỗi khi cập nhật sản phẩm. Vui lòng thử lại!', { id: toastId });
      if (onError) onError(error);
    } finally {
      setIsPending(false);
    }
  };

  return { mutate, isPending };
};

export const useDeleteManagerProduct = () => {
  const [isPending, setIsPending] = useState(false);

  const mutate = async (id, { onSuccess, onError } = {}) => {
    setIsPending(true);
    const toastId = toast.loading('Đang xóa sản phẩm...');
    try {
      const apiURL = import.meta.env.VITE_API_URL || '';
      const token = localStorage.getItem('accessToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      await axios.delete(`${apiURL}/api/products/${id}`, { headers });
      toast.success('Xóa sản phẩm thành công!', { id: toastId });
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Delete product failed:', error);
      toast.error('Lỗi khi xóa sản phẩm. Vui lòng thử lại!', { id: toastId });
      if (onError) onError(error);
    } finally {
      setIsPending(false);
    }
  };

  return { mutate, isPending };
};