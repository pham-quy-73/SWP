import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // EARS [STATE-DRIVEN]: Đồng bộ thông tin user từ Backend mỗi khi F5
    useEffect(() => {
        const fetchMe = async () => {
            const token = localStorage.getItem('accessToken');
            if (token) {
                try {
                    // Gọi API /me đã tạo ở Task T003
                    const response = await fetch('http://localhost:5000/api/users/me', {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    
                    const data = await response.json();

                    if (response.ok && data.user) {
                        setUser(data.user);
                    } else {
                        // Token hết hạn hoặc không hợp lệ
                        logout();
                    }
                } catch (error) {
                    console.error("Lỗi đồng bộ dữ liệu người dùng:", error);
                    logout();
                }
            }
            setIsLoading(false);
        };

        fetchMe();
    }, []);

    const loginContext = (userData, token) => {
        setUser(userData);
        // Chỉ lưu Token. Không lưu userData vào localStorage để bảo vệ field 'role'
        localStorage.setItem('accessToken', token); 
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('accessToken');
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, loginContext, logout }}>
            {!isLoading && children}
        </AuthContext.Provider>
    );
};