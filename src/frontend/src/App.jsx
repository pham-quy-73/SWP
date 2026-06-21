import { Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import AuthLayout from './components/layout/AuthLayout';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import AdminProductsPage from './pages/AdminProductsPage';
import ProfilePage from './pages/ProfilePage';
import ProductDetailPage from './pages/ProductDetailPage';
import LoginForm from './feature/auth/components/LoginForm';
import RegisterForm from './feature/auth/components/RegisterForm';

export default function App() {
  return (
    <Routes>

      {/* Trang thường */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/admin/products" element={<AdminProductsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
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
  );
}