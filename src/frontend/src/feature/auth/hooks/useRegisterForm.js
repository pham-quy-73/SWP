import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from 'axios';

const registerSchema = z.object({
  username: z.string().min(1, 'Vui lòng nhập tên đăng nhập'),
  email: z.string().email('Email không hợp lệ'),
  first_name: z.string().min(1, 'Vui lòng nhập tên'),
  last_name: z.string().min(1, 'Vui lòng nhập họ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});

export const useRegisterForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [apiError, setApiError] = useState(''); 
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const form = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '', email: '', first_name: '', last_name: '', password: '',
    },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setIsSuccess(false);
    setResendMessage(''); 

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/register`, data);
      
      setApiError(''); 
      setIsSuccess(true);
      
    } catch (error) {
      setApiError(error.response?.data?.message || 'Có lỗi xảy ra khi kết nối đến máy chủ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    const email = form.getValues('email'); 
    if (!email) return;

    setIsResending(true);
    setResendMessage('');
    setApiError('');

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/resend-verify-email`, { email });
      setResendMessage(response.data.message || 'Đã gửi lại email thành công!');
    } catch (error) {
      setApiError(error.response?.data?.message || 'Không thể gửi lại email lúc này.');
    } finally {
      setIsResending(false);
    }
  };

  return { form, onSubmit, isLoading, isSuccess, apiError, isResending, resendMessage, handleResendEmail }; 
};