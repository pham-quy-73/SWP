import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

export const useDashboardRevenue = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [isError, setIsError] = useState(false);

  const fetchStats = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setIsFetching(true);
    setIsError(false);
    try {
      const apiURL = import.meta.env.VITE_API_URL || '';
      const token = localStorage.getItem('accessToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await axios.get(`${apiURL}/api/dashboard/revenue`, { headers });
      if (response.data && response.data.result) {
        setData(response.data.result);
      } else {
        setIsError(true);
      }
    } catch (error) {
      console.error('Error fetching dashboard revenue:', error);
      setIsError(true);
      toast.error('Không thể tải dữ liệu thống kê');
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    data,
    isLoading,
    isFetching,
    isError,
    refetch: () => fetchStats(false)
  };
};
