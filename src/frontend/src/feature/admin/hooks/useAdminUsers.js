import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

// 1. LẤY DANH SÁCH NGƯỜI DÙNG
export const useAdminUsers = (queryParams = {}) => {
    const [users, setUsers] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        setIsError(false);
        try {
            const apiURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const token = localStorage.getItem('accessToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            const params = {
                page: queryParams.page || 1,
                limit: queryParams.limit || 10,
            };
            if (queryParams.search) params.search = queryParams.search;
            if (queryParams.role && queryParams.role !== 'ALL') params.role = queryParams.role;

            const response = await axios.get(`${apiURL}/api/users`, { params, headers });

            if (response.data && response.data.code === 0) {
                setUsers(response.data.result || []);
                setPagination(response.data.pagination || { page: 1, totalPages: 1, total: 0 });
            }
        } catch (error) {
            console.error('Lỗi khi tải danh sách người dùng:', error);
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    }, [JSON.stringify(queryParams)]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    return { users, pagination, isLoading, isError, refetch: fetchUsers };
};

// 2. ĐỔI QUYỀN (ROLE)
export const useUpdateUserRole = () => {
    const [isPending, setIsPending] = useState(false);

    const mutate = async ({ id, role }, { onSuccess } = {}) => {
        setIsPending(true);
        const toastId = toast.loading('Đang cập nhật quyền...');
        try {
            const apiURL = import.meta.env.VITE_API_URL || '';
            const token = localStorage.getItem('accessToken');
            await axios.put(`${apiURL}/api/users/${id}/role`, { role }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Cập nhật quyền thành công!', { id: toastId });
            if (onSuccess) onSuccess();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi cập nhật quyền', { id: toastId });
        } finally {
            setIsPending(false);
        }
    };

    return { mutate, isPending };
};

// 3. KHÓA / MỞ KHÓA TÀI KHOẢN (STATUS)
export const useUpdateUserStatus = () => {
    const [isPending, setIsPending] = useState(false);

    const mutate = async ({ id, status }, { onSuccess } = {}) => {
        setIsPending(true);
        const toastId = toast.loading('Đang thay đổi trạng thái...');
        try {
            const apiURL = import.meta.env.VITE_API_URL || '';
            const token = localStorage.getItem('accessToken');
            await axios.put(`${apiURL}/api/users/${id}/status`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Cập nhật trạng thái thành công!', { id: toastId });
            if (onSuccess) onSuccess();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi đổi trạng thái', { id: toastId });
        } finally {
            setIsPending(false);
        }
    };

    return { mutate, isPending };
};

// 4. XÓA VĨNH VIỄN
export const useDeleteUser = () => {
    const [isPending, setIsPending] = useState(false);

    const mutate = async (id, { onSuccess } = {}) => {
        setIsPending(true);
        const toastId = toast.loading('Đang xóa tài khoản...');
        try {
            const apiURL = import.meta.env.VITE_API_URL || '';
            const token = localStorage.getItem('accessToken');
            await axios.delete(`${apiURL}/api/users/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Đã xóa vĩnh viễn tài khoản!', { id: toastId });
            if (onSuccess) onSuccess();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Không thể xóa tài khoản này', { id: toastId });
        } finally {
            setIsPending(false);
        }
    };

    return { mutate, isPending };
};

// 5. CẤP LẠI MẬT KHẨU
export const useResetUserPassword = () => {
    const [isPending, setIsPending] = useState(false);

    const mutate = async ({ id, newPassword }, { onSuccess } = {}) => {
        setIsPending(true);
        const toastId = toast.loading('Đang cấp lại mật khẩu...');
        try {
            const apiURL = import.meta.env.VITE_API_URL || '';
            const token = localStorage.getItem('accessToken');
            await axios.put(`${apiURL}/api/users/${id}/reset-password`, { newPassword }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Đã cấp lại mật khẩu thành công!', { id: toastId });
            if (onSuccess) onSuccess();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi cấp lại mật khẩu', { id: toastId });
        } finally {
            setIsPending(false);
        }
    };

    return { mutate, isPending };
};

// 6. TẠO TÀI KHOẢN MỚI (CẤP PHÁT CHO MANAGER/ADMIN)
export const useCreateUser = () => {
    const [isPending, setIsPending] = useState(false);

    const mutate = async (userData, { onSuccess } = {}) => {
        setIsPending(true);
        const toastId = toast.loading('Đang tạo tài khoản...');
        try {
            const apiURL = import.meta.env.VITE_API_URL || '';
            const token = localStorage.getItem('accessToken');
            
            await axios.post(`${apiURL}/api/users`, userData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            toast.success('Tạo tài khoản thành công!', { id: toastId });
            if (onSuccess) onSuccess();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi tạo tài khoản', { id: toastId });
        } finally {
            setIsPending(false);
        }
    };

    return { mutate, isPending };
};