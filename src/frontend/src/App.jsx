import { Routes, Route, Navigate } from 'react-router-dom';
import AuthLayout from './components/layout/AuthLayout.jsx';
import LoginForm from './feature/auth/components/LoginForm.jsx';
import RegisterForm from './feature/auth/components/RegisterForm.jsx';

function App() {
  return (
    <Routes>
      <Route path="/" element={<div className="mt-8 p-4 bg-white rounded shadow">Trang Chủ</div>} />
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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>

  );
}

export default App;
