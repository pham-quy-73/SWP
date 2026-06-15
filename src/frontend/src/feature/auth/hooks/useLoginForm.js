import { useState, useContext } from 'react'; 
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../../contexts/AuthContext'; 

const loginSchema = z.object({
  username: z.string().min(1, 'Vui lòng nhập tên đăng nhập'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});

export const useLoginForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { loginContext } = useContext(AuthContext); 

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  // Hàm xử lý Đăng nhập truyền thống
  const onSubmit = async (data) => {
    setIsLoading(true);
    form.clearErrors('root');

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, data);
      const { token, user } = response.data;
      
      loginContext(user, token);
      navigate('/');
    } catch (error) {
      const message = error.response?.data?.message || 'Có lỗi xảy ra khi kết nối đến máy chủ';
      form.setError('root', { type: 'manual', message });
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm xử lý Đăng nhập bằng Google MỚI ĐƯỢC THÊM VÀO
  const handleGoogleLogin = async (idToken) => {
    setIsLoading(true);
    form.clearErrors('root');

    try {
      // Gửi idToken mà Google trả về xuống Backend của chúng ta
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/google`, { idToken });
      const { token, user } = response.data;
      
      loginContext(user, token);
      navigate('/');
    } catch (error) {
      const message = error.response?.data?.message || 'Xác thực tài khoản Google thất bại';
      form.setError('root', { type: 'manual', message });
    } finally {
      setIsLoading(false);
    }
  };

  return { form, onSubmit, isLoading, handleGoogleLogin };
};