import React, { createContext, useState, useEffect } from 'react';
import { httpClient } from '../lib/httpClient';

// Khởi tạo Context
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Hàm hỗ trợ cập nhật State khi Đăng nhập thành công
    const loginContext = (userData, token) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('accessToken', token);
    };

    // Hàm hỗ trợ Đăng xuất
    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        window.location.href = '/login'; // Ép chuyển hướng về trang đăng nhập
    };

    // ⚠️ BẢO MẬT: Verify user từ server khi load app (Hướng A)
    // Thay vì tin tưởng 100% dữ liệu trong localStorage (có thể bị giả mạo role qua DevTools),
    // khi có token ta gọi /api/users/me để lấy role thật do server cấp qua JWT.
    // - Nếu server xác nhận: setUser với dữ liệu thật.
    // - Nếu token hết hạn/không hợp lệ/role đã bị thu hồi: tự logout + clear local.
    useEffect(() => {
        let isMounted = true;
        const token = localStorage.getItem('accessToken');

        const verifyWithServer = async () => {
            if (!token) {
                // Không có token → không đăng nhập. Clear mọi dữ liệu mồ côi.
                localStorage.removeItem('user');
                return null;
            }

            try {
                const response = await httpClient.get('/api/users/me');

                // getMe trả { code:0, result: <user object> }
                const serverUser = response.data?.result;
                if (!serverUser) {
                    throw new Error('Phản hồi server không hợp lệ');
                }

                // Cập nhật localStorage với dữ liệu thật để đồng bộ role mới nhất
                localStorage.setItem('user', JSON.stringify(serverUser));
                return serverUser;
            } catch (error) {
                // Token hết hạn, không hợp lệ, hoặc tài khoản đã bị khóa (deleted_at !== null)
                // → clear local để tránh dùng role giả mạo
                const status = error?.response?.status;
                if (status === 401 || status === 403) {
                    console.warn('[Auth] Token không hợp lệ hoặc tài khoản bị khóa, tự động đăng xuất.');
                } else {
                    console.warn('[Auth] Không thể verify phiên đăng nhập với server:', error.message);
                }
                localStorage.removeItem('user');
                localStorage.removeItem('accessToken');
                return null;
            }
        };

        verifyWithServer().then((verifiedUser) => {
            if (!isMounted) return;
            setUser(verifiedUser);
            setIsLoading(false);
        });

        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <AuthContext.Provider value={{ user, isLoading, loginContext, logout }}>
            {/* Chỉ render các component con khi đã kiểm tra xong trạng thái (tránh nháy giao diện) */}
            {!isLoading && children}
        </AuthContext.Provider>
    );
};
