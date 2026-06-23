import { useState } from 'react';
import { useReadyRefunds } from '../../hooks/useRefunds';
import { RefundDetailModal } from './RefundDetailModal';

const fmt = (num) => {
  if (num === null || num === undefined) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
};

const getProductName = (order) => {
  if (!order) return '';
  return order.productName || order.orderName || (order.items && order.items[0]?.product_id?.name) || 'Sản phẩm kính';
};

export function ReadyRefundsModal({ onClose }) {
  const { data: refunds = [], loading, refetch } = useReadyRefunds();
  const [selectedRefund, setSelectedRefund] = useState(null);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h3 className="text-base font-bold text-gray-900">Yêu cầu hoàn tiền đang chờ</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Danh sách hoàn tiền PENDING sẵn sàng xử lý ({refunds.length} yêu cầu)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refetch}
              disabled={loading}
              className="px-2.5 py-1 text-xs text-indigo-600 bg-indigo-55 hover:bg-indigo-100 rounded-lg transition-colors"
            >
              Làm mới
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto flex-1">
          {loading && refunds.length === 0 ? (
            <div className="flex flex-col items-center py-10 gap-3 text-gray-400">
              <div className="w-7 h-7 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-sm">Đang tải danh sách hoàn tiền...</p>
            </div>
          ) : refunds.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <p className="text-4xl mb-3">🎉</p>
              <p className="text-sm font-medium">Tất cả yêu cầu hoàn tiền đã được xử lý xong</p>
            </div>
          ) : (
            <div className="space-y-3">
              {refunds.map((refund) => {
                const order = refund.order || {};
                const name = getProductName(order);
                const refundId = refund._id || refund.refundId;
                return (
                  <div
                    key={refundId}
                    onClick={() => setSelectedRefund(refund)}
                    className="flex items-center justify-between px-4 py-4 rounded-xl border border-gray-100 bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50/20 cursor-pointer transition-all shadow-sm"
                  >
                    <div className="flex-1 min-w-0 pr-3">
                      <p className="text-sm font-bold text-gray-800 truncate">
                        {name}
                      </p>
                      <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                        Lô #{String(refundId).slice(-6).toUpperCase()} • Đơn #{String(order._id || order.orderId).slice(-6).toUpperCase()}
                      </p>
                      <p className="text-[10px] text-zinc-400 mt-1 italic leading-tight truncate">
                        Lý do: {refund.reason || '—'}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black text-rose-600">
                        {fmt(refund.amount || order.paidAmount || 0)}
                      </p>
                      <span className="inline-block mt-1 px-2 py-0.5 text-[9px] font-bold text-amber-700 bg-amber-50 rounded-full border border-amber-200 uppercase">
                        {refund.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 shrink-0 bg-white flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl text-sm transition-colors"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>

      {selectedRefund && (
        <RefundDetailModal
          refund={selectedRefund}
          onClose={() => {
            setSelectedRefund(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}
