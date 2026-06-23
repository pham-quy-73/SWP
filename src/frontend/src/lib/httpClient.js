import axios from 'axios';

/**
 * httpClient — Axios instance tập trung cho toàn ứng dụng.
 *
 * Lý do tồn tại:
 *  1. Tự động đính kèm JWT (từ localStorage) vào header Authorization mỗi request,
 *     không cần mỗi api file phải tự `axios.create` rồi `headers: { Authorization }`.
 *  2. Interceptor 401/403 toàn cục: khi token hết hạn hoặc tài khoản bị khóa
 *     (backend `authMiddleware` trả 401/403), tự động clear localStorage + redirect /login.
 *     Tránh tình trạng user giữ role giả mạo trong localStorage sau khi server đã thu hồi.
 *
 * Cách dùng:
 *   import { httpClient } from '../lib/httpClient';
 *   const res = await httpClient.get('/api/users/me');
 */
const baseURL = import.meta.env.VITE_API_URL || '';

export const httpClient = axios.create({ baseURL, timeout: 30000 });

// Request interceptor: gắn Bearer token
httpClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor: phát hiện 401/403 từ authMiddleware → tự logout
httpClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error?.response?.status;
        const currentPath = window.location.pathname;

        // Chỉ auto-redirect khi token không còn hợp lệ (401) — không can thiệp 403
        // vì 403 có thể là lỗi phân quyền nghiệp vụ hợp lệ (vd: CUSTOMER gọi API admin).
        if (status === 401 && currentPath !== '/login') {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            // Dùng replace để không lưu history, tránh back quay lại trang cần auth
            window.location.replace('/login');
        }
        return Promise.reject(error);
    }
);

export default httpClient;
