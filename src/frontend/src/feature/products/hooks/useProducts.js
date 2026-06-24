import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/api/products`;

const getAuthHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
});

// Auth không bắt buộc cho GET: nếu đã đăng nhập thì gửi token để SALE/ADMIN nhận stock_quantity thật,
// nếu chưa đăng nhập thì không gửi (backend xử lý như khách ẩn danh).
const getOptionalAuthHeader = () => {
  const token = localStorage.getItem('accessToken');
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

export const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 12, totalPages: 1 });

  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1', 10);

  const fetchProducts = useCallback(async (extraParams = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(API_URL, {
        params: { page, limit: 12, ...extraParams },
        ...getOptionalAuthHeader(),
      });
      setProducts(response.data.products || []);
      setPagination(response.data.pagination || { total: 0, page: 1, limit: 12, totalPages: 1 });
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const setPage = (newPage) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', String(newPage));
      return next;
    });
  };

  const createProduct = async (formData) => {
    const response = await axios.post(API_URL, formData, getAuthHeader());
    await fetchProducts();
    return response.data;
  };

  const updateProduct = async (id, formData) => {
    const response = await axios.put(`${API_URL}/${id}`, formData, getAuthHeader());
    await fetchProducts();
    return response.data;
  };

  const removeProduct = async (id) => {
    await axios.delete(`${API_URL}/${id}`, getAuthHeader());
    await fetchProducts();
  };

  return { products, loading, error, pagination, fetchProducts, createProduct, updateProduct, removeProduct, setPage };
};
