import { toast } from 'sonner';
import { useCheckoutRefund } from '../../hooks/useRefunds';

const fmt = (num) => {
  if (num === null || num === undefined) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
};

const getProductName = (order) => {
  if (!order) return '';
  return order.productName || order.orderName || (order.items && order.items[0]?.product_id?.name) || 'Sản phẩm kính';
};

export function RefundDetailModal({ refund, onClose }) {
  const { run: checkoutRefund, loading: isCheckingOut } = useCheckoutRefund();

  if (!refund || !refund.order) return null;

  const order = refund.order;

  const handleCheckout = async () => {
    try {
      const paymentUrl = await checkoutRefund(refund._id || refund.refundId);

      toast.success('Đang chuyển hướng đến cổng thanh toán...');

      if (paymentUrl && paymentUrl.startsWith('http')) {
        window.location.href = paymentUrl;
      } else {
        toast.success('Xác nhận hoàn tiền thành công!');
        onClose();
      }
    } catch (error) {
      toast.error(error.message || 'Lỗi xác nhận hoàn tiền');
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest">Chi tiết hoàn tiền</p>
            <p className="text-sm font-bold text-gray-800 mt-0.5 font-mono">
              #{String(refund._id || refund.refundId).slice(0, 8)}...
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {[
              ['Sản phẩm', getProductName(order) || '—'],
              ['Mã đơn hàng', `#${String(order._id || order.orderId).slice(0, 8)}...`],
              ['SĐT khách', order.phoneNumber || order.user_id?.phone || '—'],
              ['Số tiền hoàn', fmt(order.paidAmount || order.paid_amount || order.total_amount || 0)],
              ['Đặt cọc', fmt(order.depositAmount || order.deposit_amount || 0)],
              ['Trạng thái đơn', order.status || order.orderStatus || '—'],
            ].map(([k, v]) => (
              <div key={k} className="bg-gray-50 rounded-xl px-3 py-2.5">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">{k}</p>
                <p className="text-sm font-semibold text-gray-800 mt-0.5 truncate">{v}</p>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 rounded-xl px-3 py-2.5">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Địa chỉ giao hàng</p>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">
              {order.deliveryAddress || order.shipping_address || '—'}
            </p>
          </div>

          {(order.bankInfo?.bankName || order.bank_info?.bankName) && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5">
              <p className="text-[10px] text-blue-600 uppercase tracking-wide font-semibold mb-1">
                Thông tin hoàn tiền
              </p>
              <p className="text-sm text-gray-700">
                <span className="text-gray-400">Ngân hàng:</span>{' '}
                <span className="font-medium">{order.bankInfo?.bankName || order.bank_info?.bankName}</span>
              </p>
              <p className="text-sm text-gray-700">
                <span className="text-gray-400">STK:</span>{' '}
                <span className="font-medium">{order.bankInfo?.bankAccountNumber || order.bank_info?.bankAccountNumber}</span>
              </p>
              <p className="text-sm text-gray-700">
                <span className="text-gray-400">Chủ TK:</span>{' '}
                <span className="font-medium">{order.bankInfo?.accountHolderName || order.bank_info?.accountHolderName}</span>
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            Đóng
          </button>
          <button
            onClick={handleCheckout}
            disabled={isCheckingOut}
            className="flex-1 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {isCheckingOut && (
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            ✓ Xác nhận hoàn tiền
          </button>
        </div>
      </div>
    </div>
  );
}
