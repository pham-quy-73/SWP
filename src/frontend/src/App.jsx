import { Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import MainLayout from './components/layout/MainLayout';
import AuthLayout from './components/layout/AuthLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import LoginForm from './feature/auth/components/LoginForm';
import RegisterForm from './feature/auth/components/RegisterForm';

export default function App() {
  return (
    <AnimatePresence mode="wait">
      <Routes>

        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />

          <Route element={<ProtectedRoute allowedRoles={['CUSTOMER', 'SALE', 'ADMIN']} />}>
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>

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
    </AnimatePresence>
  );
}