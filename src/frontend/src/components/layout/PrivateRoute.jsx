import { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';

/**
 * PrivateRoute — Bảo vệ các route yêu cầu đăng nhập và phân quyền.
 * - Nếu người dùng chưa đăng nhập: redirect về /login
 * - Nếu có cấu hình allowedRoles và vai trò người dùng không trùng khớp: redirect về trang chủ /
 */
export default function PrivateRoute({ children, allowedRoles }) {
  const { user, isLoading } = useContext(AuthContext);
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && (!user.role || !allowedRoles.includes(user.role.toUpperCase()))) {
    // Không đủ thẩm quyền, điều hướng về Trang chủ
    return <Navigate to="/" replace />;
  }

  return children;
}
