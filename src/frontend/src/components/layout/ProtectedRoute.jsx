import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';

export default function ProtectedRoute({ allowedRoles }) {
    const { user, isLoading } = useContext(AuthContext);

    // Đợi quá trình gọi API /me hoàn tất để tránh bị đá văng oan uổng
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50">
                <div className="w-6 h-6 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    // EARS [UNWANTED]: Chưa đăng nhập -> Đá về Login
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // EARS [UNWANTED]: Sai Role -> Đá về Trang chủ
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}