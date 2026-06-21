import React, { createContext, useState, useEffect } from 'react';

// Khởi tạo Context
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Kiểm tra trạng thái đăng nhập mỗi khi ứng dụng khởi động lại (F5)
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (error) {
                console.error("Lỗi đọc dữ liệu người dùng:", error);
            }
        }
        setIsLoading(false);
    }, []);

    // Hàm hỗ trợ cập nhật State khi Đăng nhập thành công
    const loginContext = (userData, token) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('accessToken', token);
    };

    // Cập nhật thông tin user trong context + localStorage (dùng sau khi edit profile)
    const updateUser = (newUserData) => {
        const merged = { ...user, ...newUserData };
        setUser(merged);
        localStorage.setItem('user', JSON.stringify(merged));
    };

    // Hàm hỗ trợ Đăng xuất
    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        window.location.href = '/login'; // Ép chuyển hướng về trang đăng nhập
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, loginContext, updateUser, logout }}>
            {/* Chỉ render các component con khi đã kiểm tra xong trạng thái (tránh nháy giao diện) */}
            {!isLoading && children}
        </AuthContext.Provider>
    );
};