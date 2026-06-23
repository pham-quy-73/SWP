import { Link } from 'react-router-dom';
import { Check, ArrowRight, Loader2 } from 'lucide-react';
import { useOrderSuccess } from '../feature/checkout/hooks/useOrderSuccess';

export const PaymentSuccessPage = () => {
  const { orderId, email, deliveryDate, isLoading, orderData } = useOrderSuccess();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4 animate-in fade-in duration-500 font-sans pt-24 pb-24">
      <div className="max-w-lg w-full bg-white shadow-xl rounded-3xl overflow-hidden relative border border-gray-150">
        {isLoading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center z-50">
            <Loader2 className="w-8 h-8 animate-spin text-[#1e2575]" />
          </div>
        )}

        <div className="p-8 md:p-12 text-center">
          <div className="mx-auto mb-8 w-24 h-24 bg-green-50 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center shadow-xs text-green-650">
              <Check className="w-10 h-10 text-green-600" strokeWidth={4} />
            </div>
          </div>

          <h1 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">
            Đặt hàng thành công!
          </h1>

          <p className="text-gray-500 mb-8 leading-relaxed max-w-sm mx-auto font-semibold">
            Cảm ơn{' '}
            {orderData?.recipientName ? (
              <span className="font-extrabold text-gray-800">{orderData.recipientName}</span>
            ) : (
              'bạn'
            )}{' '}
            đã mua sắm tại cửa hàng. Chúng tôi đã gửi biên lai đến{' '}
            <span className="font-extrabold text-gray-800">{email}</span>.
          </p>

          <div className="bg-gray-50/80 border border-gray-100 rounded-2xl p-6 mb-8 text-left grid grid-cols-2 gap-6">
            <div>
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                Mã đơn hàng
              </span>
              <span className="block text-sm font-extrabold text-gray-900 font-mono">{orderId}</span>
            </div>
            <div className="text-right">
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                Dự kiến giao hàng
              </span>
              <span className="block text-sm font-extrabold text-gray-900">{deliveryDate}</span>
            </div>

            {orderData?.totalAmount !== undefined && (
              <div className="col-span-2 pt-4 border-t border-gray-200 flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Tổng thanh toán
                </span>
                <span className="text-lg font-black text-[#1e2575]">
                  {orderData.totalAmount.toLocaleString('vi-VN')} ₫
                </span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <Link to="/profile/orders" className="block focus:outline-none">
              <button className="w-full h-12 text-sm bg-[#1e2575] hover:bg-[#151b5e] text-white font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.99] rounded-xl flex items-center justify-center gap-2 cursor-pointer">
                Xem chi tiết đơn hàng <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </Link>

            <Link to="/products" className="block focus:outline-none">
              <button className="w-full h-12 text-sm font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors rounded-xl cursor-pointer">
                Tiếp tục mua sắm
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
