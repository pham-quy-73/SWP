import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export function PaymentCallbackPage() {
  useEffect(() => {
    // Chuyển hướng trình duyệt sang backend API callback endpoint kèm đầy đủ tham số VNPay
    const queryString = window.location.search;
    window.location.href = `/api/payment/vnpay-callback${queryString}`;
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 font-sans">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 text-center max-w-md w-full animate-in fade-in duration-300">
        <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Loader2 className="w-8 h-8 animate-spin text-[#1e2575]" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Đang xử lý kết quả thanh toán...</h2>
        <p className="text-sm text-gray-500 font-medium leading-relaxed">
          Vui lòng đợi trong giây lát, hệ thống đang đối chiếu và xác nhận giao dịch từ cổng VNPay.
        </p>
      </div>
    </div>
  );
}

export default PaymentCallbackPage;
