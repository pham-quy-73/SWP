import { useState, useEffect } from 'react';
import { profileApi } from '../api/api';

export const useProfileQuery = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setIsLoading(false);
        setIsError(true);
        return;
      }

      setIsLoading(true);
      setIsError(false);
      try {
        const result = await profileApi.getProfile();
        setData(result);
      } catch (error) {
        console.error('Error fetching profile:', error);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  return { data, isLoading, isError };
};
