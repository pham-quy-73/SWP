import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useCancelledPaidOrders, useCreateBatch } from '../../hooks/useRefunds';
import { refundApi } from '../../api/refund-api';

const fmt = (num) => {
  if (num === null || num === undefined) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
};

const getProductName = (order) => {
  if (!order) return '';
  return order.productName || order.orderName || (order.items && order.items[0]?.product_id?.name) || 'Sản phẩm kính';
};

export function CustomerCancelModal({ onClose }) {
  const [params, setParams] = useState({
    page: 0,
    size: 50,
    sortBy: 'createdAt',
    sortDir: 'desc',
  });

  const { data: paginatedData, loading: isLoading, fetch: fetchOrders } = useCancelledPaidOrders();
  const { run: createBatch, loading: isCreating } = useCreateBatch();

  const [selectedOrders, setSelectedOrders] = useState(new Set());
  const [rejectingOrder, setRejectingOrder] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  useEffect(() => {
    fetchOrders(params);
  }, [params, fetchOrders]);

  const cancelledOrders = paginatedData?.items || [];
  const totalElements = paginatedData?.totalElements || 0;
  const hasMore = cancelledOrders.length < totalElements;

  const toggleOrder = (orderId) => {
    setSelectedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedOrders.size === cancelledOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(cancelledOrders.map((o) => o._id || o.orderId)));
    }
  };

  const handleCreateBatch = async () => {
    if (selectedOrders.size === 0) return;
    try {
      const orderIds = Array.from(selectedOrders);
      await createBatch(orderIds);
      toast.success('Đã tạo batch hoàn tiền!');
      setTimeout(() => onClose(), 800);
    } catch (error) {
      toast.error(error.message || 'Lỗi tạo batch');
    }
  };

  const handleRejectCancellation = async () => {
    if (!rejectingOrder) return;
    setIsRejecting(true);
    try {
      const orderId = rejectingOrder._id || rejectingOrder.orderId;
      await refundApi.rejectCancellation(orderId, rejectReason.trim() || 'Hàng đã xuất kho / Đã chuẩn bị giao');
      toast.success('Đã từ chối yêu cầu hủy đơn và khôi phục trạng thái đơn hàng!');
      setRejectingOrder(null);
      setRejectReason('');
      fetchOrders(params);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Không thể từ chối hủy đơn');
    } finally {
      setIsRejecting(false);
    }
  };

  const handleLoadMore = () => {
    setParams((prev) => ({ ...prev, size: prev.size + 50 }));
  };

  const totalSelected = cancelledOrders
    .filter((o) => selectedOrders.has(o._id || o.orderId))
    .reduce((s, o) => s + (o.paidAmount || o.paid_amount || o.total_amount || 0), 0);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h3 className="text-base font-bold text-gray-900">Hoàn tiền & Duyệt đơn khách hủy</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Tổng cộng có {totalElements} đơn đã thanh toán yêu cầu xử lý
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto">
          {isLoading && cancelledOrders.length === 0 ? (
            <div className="flex flex-col items-center py-10 gap-3 text-gray-400">
              <div className="w-7 h-7 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-sm">Đang tải danh sách đơn hủy...</p>
            </div>
          ) : cancelledOrders.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <p className="text-4xl mb-3">✅</p>
              <p className="text-sm font-medium">Không có đơn hủy nào cần xử lý</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Chọn tất cả */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={
                      selectedOrders.size > 0 && selectedOrders.size === cancelledOrders.length
                    }
                    onChange={toggleAll}
                    className="w-4 h-4 rounded accent-indigo-600 cursor-pointer"
                  />
                  <span className="text-sm font-semibold text-gray-700">
                    Chọn tất cả ({cancelledOrders.length} đơn hiển thị)
                  </span>
                </label>
                <span className="text-xs text-rose-600 font-bold bg-rose-50 px-2.5 py-1 rounded-full">
                  {selectedOrders.size} đã chọn
                </span>
              </div>

              {/* Danh sách đơn */}
              <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-2 custom-scrollbar">
                {cancelledOrders.map((order) => {
                  const name = getProductName(order);
                  const orderId = order._id || order.orderId;
                  const checked = selectedOrders.has(orderId);
                  const paidAmount = order.paidAmount || order.paid_amount || order.total_amount || 0;
                  return (
                    <div
                      key={orderId}
                      className={`p-4 rounded-xl border transition-all space-y-2.5 ${checked
                          ? 'border-indigo-500 bg-indigo-50/40 shadow-sm'
                          : 'border-gray-200 bg-gray-50/50 hover:border-gray-300'
                        }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <label className="flex items-start gap-3 cursor-pointer flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleOrder(orderId)}
                            className="w-4 h-4 rounded accent-indigo-600 shrink-0 cursor-pointer mt-0.5"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-800 truncate">
                              {name}
                            </p>
                            <p className="text-[11px] text-gray-500 font-mono mt-0.5 uppercase tracking-wider">
                              #{String(orderId).slice(-8)} • {order.phoneNumber || order.user_id?.phone || 'N/A'}
                            </p>
                          </div>
                        </label>
                        <div className="text-right shrink-0">
                          <p className={`text-sm font-black ${checked ? 'text-indigo-700' : 'text-gray-900'}`}>
                            {fmt(paidAmount)}
                          </p>
                          <p className="text-[10px] text-emerald-600 font-bold uppercase mt-0.5">
                            Đã thanh toán
                          </p>
                        </div>
                      </div>

                      {/* Lý do hủy từ khách */}
                      <div className="bg-white border border-gray-100 rounded-lg p-2.5 text-xs text-slate-700 flex justify-between items-center gap-2">
                        <div className="min-w-0">
                          <span className="font-bold text-slate-400 text-[10px] uppercase block">Lý do hủy từ khách:</span>
                          <span className="font-semibold text-rose-700 truncate block">{order.cancelReason || 'Không có ghi chú'}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setRejectingOrder(order)}
                          className="shrink-0 px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 text-xs font-bold rounded-lg transition-all cursor-pointer"
                        >
                          🚫 Từ chối hủy
                        </button>
                      </div>
                    </div>
                  );
                })}

                {hasMore && (
                  <div className="pt-2 pb-1 flex justify-center">
                    <button
                      type="button"
                      onClick={handleLoadMore}
                      disabled={isLoading}
                      className="px-4 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      {isLoading ? (
                        <div className="w-3 h-3 border-2 border-indigo-400 border-t-indigo-600 rounded-full animate-spin" />
                      ) : null}
                      {isLoading
                        ? 'Đang tải thêm...'
                        : `Hiển thị thêm (${totalElements - cancelledOrders.length} đơn nữa)`}
                    </button>
                  </div>
                )}
              </div>

              {/* Tổng tiền hoàn */}
              {selectedOrders.size > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex justify-between items-center shadow-sm">
                  <span className="text-amber-800 font-bold text-xs uppercase tracking-wider">
                    Tổng tiền cần hoàn
                  </span>
                  <span className="text-lg font-black text-amber-700">{fmt(totalSelected)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isLoading && cancelledOrders.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 flex gap-3 shrink-0 bg-white">
            <button
              onClick={onClose}
              className="flex-1 py-3 text-sm font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleCreateBatch}
              disabled={isCreating || selectedOrders.size === 0}
              className="flex-[2] py-3 text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:grayscale rounded-xl transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isCreating ? (
                <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                `⚡ TẠO BATCH HOÀN TIỀN (${selectedOrders.size})`
              )}
            </button>
          </div>
        )}
      </div>

      {/* Modal xác nhận Từ chối hủy cho Manager */}
      {rejectingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <span className="text-xl">⚠️</span>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Từ chối yêu cầu hủy đơn?</h4>
                <p className="text-xs text-gray-500 font-mono mt-0.5">
                  #{String(rejectingOrder._id || rejectingOrder.orderId).slice(-8)}
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-600 font-semibold leading-relaxed">
              Đơn hàng sẽ khôi phục lại trạng thái cũ (ví dụ: <span className="font-bold text-blue-600">Đã xác nhận</span>) và loại khỏi danh sách hoàn tiền.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 block">Lý do từ chối hủy (*):</label>
              <textarea
                placeholder="Ví dụ: Đơn hàng đã xuất kho và giao cho bên vận chuyển..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={2}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setRejectingOrder(null); setRejectReason(''); }}
                disabled={isRejecting}
                className="flex-1 py-2 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleRejectCancellation}
                disabled={isRejecting}
                className="flex-1 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                {isRejecting ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : 'Xác nhận từ chối'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

