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
  // THÊM: State độc lập để chống giật UI
  const [apiError, setApiError] = useState(''); 

  const form = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '', email: '', first_name: '', last_name: '', password: '',
    },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setIsSuccess(false);
    
    // Lưu ý: Chúng ta KHÔNG xóa apiError ở đây để giữ nguyên hộp đỏ chờ kết quả

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/register`, data);
      
      setApiError(''); // Chỉ xóa hộp đỏ khi thực sự thành công
      setIsSuccess(true);
      form.reset(); 
      
    } catch (error) {
      // Cập nhật lại câu chữ lỗi một cách mượt mà
      setApiError(error.response?.data?.message || 'Có lỗi xảy ra khi kết nối đến máy chủ');
    } finally {
      setIsLoading(false);
    }
  };

  return { form, onSubmit, isLoading, isSuccess, apiError }; // Trả về apiError
};