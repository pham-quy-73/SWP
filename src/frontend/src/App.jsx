import { Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import MainLayout from './components/layout/MainLayout';
import AuthLayout from './components/layout/AuthLayout';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CheckoutPage from './pages/CheckoutPage';
import { PaymentSuccessPage } from './pages/PaymentSuccessPage';
import { PaymentFailurePage } from './pages/PaymentFailurePage';
import { ProfileLayout } from './feature/profile/layout/ProfileLayout';
import ProfilePage from './feature/profile/page/ProfilePage';
import MyOrders from './feature/profile/page/MyOrder';
import LoginForm from './feature/auth/components/LoginForm';
import RegisterForm from './feature/auth/components/RegisterForm';
import { Toaster } from 'sonner';
import { CartDrawer } from './feature/product/components/CartDrawer';
import PrivateRoute from './components/layout/PrivateRoute';

// Import manager routes
import ManagerLayout from './feature/manager/layout/ManagerLayout';
import ManagerDashboardPage from './feature/manager/page/dashboard/ManagerDashboardPage';
import ProductManagePage from './feature/manager/page/products/ProductManagePage';
import ProductVariantManagePage from './feature/manager/page/products/ProductVariantManagePage';
import ManagerOrderPage from './feature/manager/page/orders/ManagerOrderPage';

// Import admin routes
import AdminLayout from './feature/admin/layout/AdminLayout';
import UserManagePage from './feature/admin/page/UserManagePage';

export default function App() {
  return (
    <>
      <Toaster richColors closeButton position="top-right" />
      <CartDrawer />
      <Routes>

        {/* Trang thường */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:productId" element={<ProductDetailPage />} />
          {/* Yêu cầu đăng nhập — PrivateRoute redirect về /login nếu chưa xác thực */}
          <Route path="/checkout" element={<PrivateRoute><CheckoutPage /></PrivateRoute>} />
          <Route path="/checkout/success" element={<PrivateRoute><PaymentSuccessPage /></PrivateRoute>} />
          <Route path="/checkout/failure" element={<PrivateRoute><PaymentFailurePage /></PrivateRoute>} />

          {/* Hồ sơ cá nhân & Đơn hàng của khách hàng */}
          <Route path="/profile" element={<PrivateRoute><ProfileLayout /></PrivateRoute>}>
            <Route index element={<ProfilePage />} />
            <Route path="orders" element={<MyOrders />} />
          </Route>
        </Route>

        {/* Manager routes */}
        <Route path="/manager" element={<PrivateRoute allowedRoles={['MANAGER', 'ADMIN']}><ManagerLayout /></PrivateRoute>}>
          <Route index element={<ManagerDashboardPage />} />
          <Route path="dashboard" element={<ManagerDashboardPage />} />
          <Route path="products" element={<ProductManagePage />} />
          <Route path="products/:productId/variants" element={<ProductVariantManagePage />} />
          <Route path="orders" element={<ManagerOrderPage />} />
        </Route>

        {/* Admin routes */}
        <Route path="/admin" element={<PrivateRoute allowedRoles={['ADMIN']}><AdminLayout /></PrivateRoute>}>
          <Route index element={<UserManagePage />} />
          <Route path="users" element={<UserManagePage />} />
          <Route path="orders" element={<ManagerOrderPage />} />
        </Route>

        {/* Trang auth */}
        <Route
          path="/login"
          element={
            <AuthLayout>
              <LoginForm />
            </AuthLayout>
          }
        />

        <Route
          path="/register"
          element={
            <AuthLayout>
              <RegisterForm />
            </AuthLayout>
          }
        />

      </Routes>
    </>
  );
}