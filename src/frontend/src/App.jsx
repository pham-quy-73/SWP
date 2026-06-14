import { Routes, Route, Navigate } from 'react-router-dom';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-blue-600 mb-4">Optics Management</h1>
      <p className="text-gray-600 text-lg">Hệ thống đang được xây dựng...</p>
      
      <Routes>
        <Route path="/" element={<div className="mt-8 p-4 bg-white rounded shadow">Trang Chủ</div>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
