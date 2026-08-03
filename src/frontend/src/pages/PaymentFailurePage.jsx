import { XCircle, RefreshCw, HelpCircle, AlertCircle, Clock } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export const PaymentFailurePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // reason=user_cancelled: khách bấm "Quay lại" trên trang VNPay — đơn hàng
  // vẫn được giữ ở trạng thái chờ thanh toán, có thể thanh toán lại ngay.
  const isUserCancelled = searchParams.get('reason') === 'user_cancelled';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4 font-sans pt-24 pb-24">
      <div className="max-w-md w-full bg-white shadow-xl border border-gray-150 rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="p-8 text-center">
          {/* 1. Icon */}
          {isUserCancelled ? (
            <div className="mx-auto mb-6 w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center">
              <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center shadow-xs">
                <Clock className="w-8 h-8 text-amber-600" strokeWidth={3} />
              </div>
            </div>
          ) : (
            <div className="mx-auto mb-6 w-20 h-20 bg-red-50 rounded-full flex items-center justify-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center text-red-650 shadow-xs">
                <XCircle className="w-8 h-8 text-red-650" strokeWidth={3} />
              </div>
            </div>
          )}

          {/* 2. Thông báo */}
          <h1 className="text-2xl font-black text-gray-900 mb-2">
            {isUserCancelled ? 'Bạn đã hủy thanh toán' : 'Thanh toán thất bại'}
          </h1>
          <p className="text-gray-500 mb-6 font-semibold text-sm leading-relaxed">
            {isUserCancelled
              ? 'Đơn hàng của bạn vẫn được giữ lại. Bạn chưa bị trừ tiền.'
              : 'Chúng tôi không thể xử lý khoản thanh toán của bạn. Đừng lo lắng, bạn chưa bị trừ tiền.'}
          </p>

          {/* 3. Chi tiết */}
          {isUserCancelled ? (
            <div className="bg-amber-50/50 rounded-2xl p-4 mb-8 border border-amber-100 flex items-start gap-3 text-left">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-gray-900">Đơn hàng đang chờ thanh toán</h4>
                <p className="text-xs text-gray-600 mt-1 font-semibold leading-relaxed">
                  Bấm "Tiếp tục thanh toán" để hoàn tất với chính đơn hàng này — sẽ không tạo thêm đơn mới.
                  Nếu không thanh toán trong ít phút, đơn sẽ tự động hủy.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-red-50/50 rounded-2xl p-4 mb-8 border border-red-100 flex items-start gap-3 text-left">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-gray-900">Giao dịch bị từ chối</h4>
                <p className="text-xs text-gray-600 mt-1 font-semibold leading-relaxed">
                  Ngân hàng của bạn hoặc cổng thanh toán có thể đã từ chối yêu cầu ứng tiền. Vui lòng thử lại hoặc chọn một phương thức khác để hoàn thành đơn hàng.
                </p>
              </div>
            </div>
          )}

          {/* 4. Các nút điều hướng */}
          <div className="space-y-3">
            <button
              onClick={() => navigate('/checkout')}
              className="w-full h-11 bg-gray-900 hover:bg-black text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              {isUserCancelled ? 'Tiếp tục thanh toán' : 'Quay lại thanh toán'}
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/profile/orders')}
                className="w-full h-11 border border-gray-200 hover:bg-gray-50 text-gray-750 font-bold rounded-xl transition-all cursor-pointer text-xs uppercase tracking-wider"
              >
                Đơn hàng của tôi
              </button>
              <button
                onClick={() => navigate('/products')}
                className="w-full h-11 text-gray-500 hover:text-gray-900 font-bold rounded-xl transition-all cursor-pointer text-xs uppercase tracking-wider flex items-center justify-center gap-1.5"
              >
                <HelpCircle className="w-4 h-4" /> Cửa hàng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
