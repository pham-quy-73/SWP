import { useState, useEffect } from 'react';
import { PackageOpen, AlertCircle, ShoppingBag, RefreshCcw, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { profileApi } from '../api/api';
import FeedbackModal from "../components/feedback/FeedbackModal.jsx";
import FeedbackPreview from "../components/feedback/FeedbackPreview.jsx";
import { useMyOrders } from '../hooks/useMyOrders';
import axios from 'axios';
import { VnpayCheckoutButton } from '../../checkout/components/VnpayCheckoutButton';

const STATUS_CONFIG = {
  PENDING: {
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    label: 'Chờ xử lý',
    dot: 'bg-amber-500',
    tab: 'text-amber-600 border-amber-500 bg-amber-50',
  },
  ON_HOLD: {
    color: 'bg-gray-100 text-gray-600 border-gray-200',
    label: 'Tạm giữ',
    dot: 'bg-gray-400',
    tab: 'text-gray-600 border-gray-400 bg-gray-100',
  },
  CONFIRMED: {
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    label: 'Đã xác nhận',
    dot: 'bg-emerald-500',
    tab: 'text-emerald-600 border-emerald-500 bg-emerald-50',
  },
  PROCESSING: {
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    label: 'Đang xử lý',
    dot: 'bg-blue-500',
    tab: 'text-blue-600 border-blue-500 bg-blue-50',
  },
  PREPARING: {
    color: 'bg-violet-50 text-violet-700 border-violet-200',
    label: 'Đang chuẩn bị',
    dot: 'bg-violet-500',
    tab: 'text-violet-600 border-violet-500 bg-violet-50',
  },
  PRODUCED: {
    color: 'bg-teal-50 text-teal-700 border-teal-200',
    label: 'Đã sản xuất',
    dot: 'bg-teal-500',
    tab: 'text-teal-600 border-teal-500 bg-teal-50',
  },
  DELIVERING: {
    color: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    label: 'Đang giao hàng',
    dot: 'bg-cyan-500',
    tab: 'text-cyan-600 border-cyan-500 bg-cyan-50',
  },
  SHIPPED: {
    color: 'bg-sky-50 text-sky-700 border-sky-200',
    label: 'Đã gửi hàng',
    dot: 'bg-sky-500',
    tab: 'text-sky-600 border-sky-500 bg-sky-50',
  },
  COMPLETED: {
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    label: 'Hoàn thành',
    dot: 'bg-emerald-500',
    tab: 'text-emerald-600 border-emerald-500 bg-emerald-50',
  },
  CANCELLED: {
    color: 'bg-rose-50 text-rose-700 border-rose-200',
    label: 'Đã huỷ',
    dot: 'bg-rose-500',
    tab: 'text-rose-600 border-rose-500 bg-rose-50',
  },
  REFUNDED: {
    color: 'bg-orange-50 text-orange-700 border-orange-200',
    label: 'Đã hoàn tiền',
    dot: 'bg-orange-500',
    tab: 'text-orange-600 border-orange-500 bg-orange-50',
  },
  AWAITING_VERIFICATION: {
    color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    label: 'Chờ xác minh',
    dot: 'bg-yellow-500',
    tab: 'text-yellow-600 border-yellow-500 bg-yellow-50',
  },
  AWAITING_FINAL_PAYMENT: {
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    label: 'Chờ thanh toán',
    dot: 'bg-indigo-500',
    tab: 'text-indigo-600 border-indigo-500 bg-indigo-50',
  },
};

const ITEM_STATUS = {
  IN_PRODUCTION: 'Đang sản xuất',
  PRODUCED: 'Đã sản xuất',
  PENDING: 'Chờ xử lý',
  COMPLETED: 'Hoàn thành',
};

const ALL_STATUSES = Object.keys(STATUS_CONFIG);

const fmt = (num) => {
  if (num == null) return '0 ₫';
  return num.toLocaleString('vi-VN') + ' ₫';
};

const getDisplayImageUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${apiBase}${cleanPath}`;
};

function PrescriptionImage({ imageUrl }) {
  const [open, setOpen] = useState(false);
  if (!imageUrl) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mt-2 flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 underline underline-offset-2 cursor-pointer font-bold"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        Xem ảnh đơn kính
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setOpen(false)}
        >
          <div className="relative max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setOpen(false)}
              className="absolute -top-3 -right-3 w-7 h-7 bg-white rounded-full shadow-md flex items-center justify-center text-gray-500 hover:text-gray-800 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={getDisplayImageUrl(imageUrl)}
              alt="Ảnh đơn kính"
              className="w-full rounded-2xl shadow-2xl object-contain max-h-[80vh] bg-white"
            />
          </div>
        </div>
      )}
    </>
  );
}

function OrderItemCard({ item, orderName }) {
  const productLabel =
    item.productName ||
    item.itemName ||
    orderName ||
    (item.orderItemType === 'PRE_ORDER' ? 'Sản phẩm đặt trước' : 'Sản phẩm có sẵn');

  const p = item.prescription;
  const imageUrl = getDisplayImageUrl(item.imageUrl);

  const hasManualDegree = !!(
    (p?.od_sphere || p?.odSphere) ||
    (p?.od_cylinder || p?.odCylinder) ||
    (p?.os_sphere || p?.osSphere) ||
    (p?.os_cylinder || p?.osCylinder)
  );

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3 shadow-xs">
      <div className="flex justify-between items-start gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {imageUrl && (
            <div className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0">
              <img src={imageUrl} alt={productLabel} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${item.orderItemType === 'PRE_ORDER' ? 'bg-violet-100 text-violet-700' : 'bg-emerald-100 text-emerald-700'}`}
              >
                {item.orderItemType === 'PRE_ORDER' ? 'Đặt trước' : 'Hàng có sẵn'}
              </span>
              {item.status && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 font-bold">
                  {ITEM_STATUS[item.status] ?? item.status}
                </span>
              )}
            </div>
            <p className="text-sm font-bold text-gray-800">{productLabel}</p>
            
            {/* Chi tiết phiên bản gọng */}
            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-500">
              {(item.colorName || item.variantName) && (
                <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                  🎨 Màu: {item.colorName || item.variantName}
                </span>
              )}
              {item.sizeLabel && (
                <span className="font-medium bg-gray-50 px-2 py-0.5 rounded-md text-gray-600 border border-gray-100">
                  Size: {item.sizeLabel}
                </span>
              )}
            </div>

            {/* Chi tiết tròng kính */}
            {item.lensName ? (
              <p className="text-xs text-emerald-600 mt-1 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md inline-block">
                👓 Tròng kính: {item.lensName} {item.lensBrand ? `(${item.lensBrand})` : ''} {item.lensPrice ? `(+${fmt(item.lensPrice)})` : ''}
              </p>
            ) : (
              <p className="text-[11px] text-gray-400 italic mt-0.5">Chỉ mua gọng</p>
            )}
          </div>
        </div>
        <p className="text-sm font-bold text-gray-800 shrink-0">{fmt(item.totalPrice)}</p>
      </div>

      <div className="grid grid-cols-3 gap-2 text-sm">
        <div className="bg-gray-50 rounded-xl p-2 text-center">
          <p className="text-[10px] text-gray-400 font-bold mb-0.5 uppercase tracking-wider">Số lượng</p>
          <p className="font-bold text-gray-700">{item.quantity}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-2 text-center">
          <p className="text-[10px] text-gray-400 font-bold mb-0.5 uppercase tracking-wider">Đơn giá</p>
          <p className="font-bold text-gray-700 text-xs">{fmt(item.unitPrice)}</p>
        </div>
        <div className="bg-indigo-50/50 rounded-xl p-2 text-center">
          <p className="text-[10px] text-indigo-400 font-bold mb-0.5 uppercase tracking-wider">Thành tiền</p>
          <p className="font-black text-indigo-700 text-xs">{fmt(item.totalPrice)}</p>
        </div>
      </div>

      {p && (hasManualDegree || p.note || p.imageUrl) && (
        <div className="pt-3 border-t border-dashed border-gray-100 space-y-2">
          <p className="text-xs font-bold text-gray-700 flex items-center gap-1">
            📋 Thông số đơn kính thuốc
          </p>
          
          {hasManualDegree && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-blue-50/50 rounded-xl p-2.5">
                <p className="text-blue-600 font-bold mb-1">Mắt phải (OD)</p>
                {[
                  ['SPH (Cầu)', p.od_sphere ?? p.odSphere],
                  ['CYL (Trụ)', p.od_cylinder ?? p.odCylinder],
                  ['AXIS (Trục)', (p.od_axis ?? p.odAxis) ? `${p.od_axis ?? p.odAxis}°` : null],
                  ['PD', (p.od_pd ?? p.odPd) ? `${p.od_pd ?? p.odPd}mm` : null],
                ].filter(([_, v]) => v != null).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-gray-600 font-medium text-[11px]">
                    <span className="text-gray-400">{k}:</span>
                    <span className="font-bold text-gray-800">{v}</span>
                  </div>
                ))}
              </div>
              <div className="bg-purple-50/50 rounded-xl p-2.5">
                <p className="text-purple-600 font-bold mb-1">Mắt trái (OS)</p>
                {[
                  ['SPH (Cầu)', p.os_sphere ?? p.osSphere],
                  ['CYL (Trụ)', p.os_cylinder ?? p.osCylinder],
                  ['AXIS (Trục)', (p.os_axis ?? p.osAxis) ? `${p.os_axis ?? p.osAxis}°` : null],
                  ['PD', (p.os_pd ?? p.osPd) ? `${p.os_pd ?? p.osPd}mm` : null],
                ].filter(([_, v]) => v != null).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-gray-600 font-medium text-[11px]">
                    <span className="text-gray-400">{k}:</span>
                    <span className="font-bold text-gray-800">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {p.note && (
            <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-100 font-medium">
              Ghi chú: {p.note}
            </p>
          )}

          {p.imageUrl && (
            <PrescriptionImage imageUrl={p.imageUrl} />
          )}
        </div>
      )}
    </div>
  );
}

function OrderCard({ order, allFeedbacks, onRefresh }) {
  const [expanded, setExpanded] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState('Đổi ý, không muốn mua nữa');
  const [customReason, setCustomReason] = useState('');

  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  const orderFeedback = allFeedbacks.find(f => f.orderId === order.orderId) || null;
  const hasFeedback = !!orderFeedback;
  const hasPreOrder = order.items?.some(item => item.orderItemType === 'PRE_ORDER');

  const statusCfg = STATUS_CONFIG[order.orderStatus] ?? {
    color: 'bg-gray-50 text-gray-600 border-gray-200',
    label: order.orderStatus,
    dot: 'bg-gray-400',
  };

  const canCancel = ['PENDING', 'AWAITING_VERIFICATION', 'CONFIRMED'].includes(order.orderStatus);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const finalReason = cancelReason === 'Lý do khác' ? (customReason.trim() || 'Lý do khác') : cancelReason;
      await profileApi.cancelOrder(order.orderId, { reason: finalReason });
      if (onRefresh) onRefresh();
      setShowConfirm(false);
    } catch (e) {
      let msg = 'Lỗi khi hủy đơn hàng';
      if (axios.isAxiosError(e)) {
        msg = e.response?.data?.message || msg;
      } else if (e instanceof Error) {
        msg = e.message;
      }
      alert(msg);
    } finally {
      setCancelling(false);
    }
  };

  const handleFeedbackClick = () => {
    if (order.orderStatus !== 'COMPLETED') return;
    setSelectedItem(order.items[0]);
    setSelectedFeedback(orderFeedback);
    setFeedbackModalOpen(true);
  };

  return (
    <div
      className={`border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-xs hover:shadow-md transition-all duration-200 ${order.orderStatus === 'CANCELLED' ? 'opacity-90' : ''}`}
    >
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setShowConfirm(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-gray-900">Xác nhận hủy đơn hàng?</p>
                <p className="text-xs text-gray-500 mt-0.5 font-semibold">
                  {order.orderName || `Đơn #${order.orderId.slice(0, 8).toUpperCase()}`}
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed font-semibold">
              Đơn hàng {hasPreOrder ? <span className="font-bold text-violet-700">PRE_ORDER </span> : ''}sẽ chuyển sang <span className="font-bold text-rose-600">Đã hủy</span>
              {['CONFIRMED', 'AWAITING_VERIFICATION'].includes(order.orderStatus) ? ' và đưa vào danh sách chờ duyệt hoàn tiền' : ''}.
            </p>

            {/* Vùng chọn lý do hủy */}
            <div className="space-y-2 pt-1">
              <label className="text-xs font-bold text-gray-700 block">Vui lòng chọn lý do hủy đơn (*):</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              >
                <option value="Đổi ý, không muốn mua nữa">Đổi ý, không muốn mua nữa</option>
                <option value="Đặt nhầm sản phẩm / sai kích thước">Đặt nhầm sản phẩm / sai kích thước</option>
                <option value="Muốn thay đổi thông tin nhận hàng">Muốn thay đổi thông tin nhận hàng</option>
                <option value="Thời gian giao hàng quá lâu">Thời gian giao hàng quá lâu</option>
                <option value="Tìm thấy sản phẩm tốt hơn ở nơi khác">Tìm thấy sản phẩm tốt hơn ở nơi khác</option>
                <option value="Lý do khác">Lý do khác...</option>
              </select>

              {cancelReason === 'Lý do khác' && (
                <textarea
                  placeholder="Nhập lý do chi tiết của bạn..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  rows={2}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={cancelling}
                className="flex-1 py-2.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
              >
                Không hủy
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                {cancelling && (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                )}
                Xác nhận hủy
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
            <svg className="w-4.5 h-4.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="font-bold text-gray-800 text-sm">
              {order.orderName || `Đơn #${order.orderId.slice(0, 8).toUpperCase()}`}
            </p>
            <p className="text-xs text-gray-400 truncate max-w-xs mt-0.5 font-semibold">
              {order.deliveryAddress}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 ml-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border hidden sm:flex items-center gap-1.5 ${statusCfg.color}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
            {statusCfg.label}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-gray-800 text-sm">
              {fmt(order.finalTotalAfterRefund)}
            </span>
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 px-5 py-4 bg-gray-50/30 space-y-4">
          <div className="space-y-3">
            {order.items.map((item) => (
              <OrderItemCard
                key={item.orderItemId}
                item={item}
                orderName={order.orderName}
              />
            ))}
          </div>

          <div className={`rounded-xl px-5 py-4 border ${order.orderStatus === 'AWAITING_FINAL_PAYMENT' ? 'bg-indigo-50/55 border-indigo-100 shadow-inner' : 'bg-white border-gray-100 shadow-xs'}`}>
            <div className="flex justify-between items-center text-sm font-medium">
              <span className={order.orderStatus === 'AWAITING_FINAL_PAYMENT' ? 'text-indigo-900 font-bold' : 'text-gray-500 font-bold'}>
                {order.orderStatus === 'AWAITING_FINAL_PAYMENT' ? 'Tổng tiền cần thanh toán' : 'Còn phải trả'}
              </span>

              {order.orderStatus === 'CANCELLED' || order.orderStatus === 'REFUNDED' ? (
                <span className="text-sm font-bold text-gray-400">0 ₫</span>
              ) : order.remainingAmount <= 0 ? (
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">Đã thanh toán đủ ✓</span>
              ) : (
                <span className="text-lg font-black text-rose-600 tracking-tight">
                  {fmt(order.remainingAmount)}
                </span>
              )}
            </div>

            {(order.orderStatus === 'AWAITING_FINAL_PAYMENT' || order.orderStatus === 'PENDING') && (
              <div className="mt-4 pt-4 border-t border-indigo-100/50">
                <VnpayCheckoutButton
                  orderId={order.orderId}
                  className="w-full shadow-md"
                />
              </div>
            )}
          </div>

          {order.orderStatus === 'COMPLETED' && (
            <div className="pt-2">
              {hasFeedback ? (
                <div className="bg-white border border-indigo-50 rounded-2xl p-4 shadow-xs">
                  <p className="text-xs font-bold text-indigo-600 mb-2.5 flex items-center gap-1.5">
                    <span className="w-1 h-3 bg-indigo-600 rounded-full" />
                    ĐÁNH GIÁ CỦA BẠN CHO ĐƠN HÀNG NÀY
                  </p>
                  <FeedbackPreview
                    feedback={orderFeedback}
                    onEdit={handleFeedbackClick}
                  />
                </div>
              ) : (
                <button
                  onClick={handleFeedbackClick}
                  className="w-full h-11 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 flex items-center justify-center gap-2 cursor-pointer"
                >
                  Viết đánh giá cho đơn hàng
                </button>
              )}
            </div>
          )}

          {canCancel && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowConfirm(true);
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-xl transition-colors cursor-pointer"
            >
              {['CONFIRMED', 'AWAITING_VERIFICATION'].includes(order.orderStatus)
                ? 'Yêu cầu hoàn tiền (Hủy đơn hàng)'
                : hasPreOrder
                  ? 'Hủy đơn PRE_ORDER (Trả hàng / Không muốn mua nữa)'
                  : 'Hủy đơn hàng (Chưa thanh toán)'}
            </button>
          )}
        </div>
      )}

      {order.orderStatus === 'COMPLETED' && (
        <FeedbackModal
          isOpen={feedbackModalOpen}
          onClose={() => setFeedbackModalOpen(false)}
          orderId={order.orderId}
          productId={selectedItem?.productId || ''}
          existingFeedback={selectedFeedback}
          onSuccess={onRefresh}
        />
      )}
    </div>
  );
}

export default function MyOrders() {
  const [activeTab, setActiveTab] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [feedbacks, setFeedbacks] = useState([]);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const PAGE_SIZE = 10;

  const { data, isLoading, isError, refetch } = useMyOrders({ page: 0, size: 500 });
  const allOrders = data?.items || [];

  const fetchFeedbacks = async () => {
    try {
      const resp = await profileApi.getMyFeedbacks();
      setFeedbacks(resp.data?.result || []);
    } catch (error) {
      console.error("Error fetching all feedbacks:", error);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const handleRefresh = () => {
    refetch();
    fetchFeedbacks();
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-4 font-sans">
        <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse mb-6"></div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-3xl mx-auto p-12 flex flex-col items-center justify-center text-center bg-gray-50 rounded-3xl mt-6 border border-gray-100 font-sans">
        <AlertCircle className="w-12 h-12 text-rose-400 mb-4" />
        <h3 className="text-lg font-bold text-gray-800">Không thể tải đơn hàng</h3>
        <p className="text-sm text-gray-500 mt-1 mb-6 font-semibold">Đã có lỗi xảy ra trong quá trình lấy dữ liệu.</p>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 border rounded-xl hover:bg-gray-100 flex items-center justify-center gap-2 text-sm font-semibold transition-all cursor-pointer"
        >
          <RefreshCcw className="w-4 h-4" /> Thử lại
        </button>
      </div>
    );
  }

  if (allOrders.length === 0) {
    return (
      <div className="max-w-3xl mx-auto p-12 flex flex-col items-center justify-center text-center bg-gray-50/50 rounded-3xl mt-6 border border-dashed border-gray-200 font-sans">
        <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-4">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-bold text-gray-800">Bạn chưa có đơn hàng nào</h3>
        <p className="text-sm text-gray-500 mt-2 mb-6 max-w-sm font-semibold">
          Hãy khám phá các sản phẩm tuyệt vời của chúng tôi và đặt đơn hàng đầu tiên nhé.
        </p>
        <a
          href="/products"
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md cursor-pointer block"
        >
          Tiếp tục mua sắm
        </a>
      </div>
    );
  }

  const countByStatus = (status) => allOrders.filter((o) => o.orderStatus === status).length;
  const filteredOrders = activeTab === 'ALL' ? allOrders : allOrders.filter((o) => o.orderStatus === activeTab);
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const paginated = filteredOrders.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const visibleStatuses = ['ALL', ...ALL_STATUSES.filter((s) => countByStatus(s) > 0)];

  const handleTabChange = (status) => {
    setActiveTab(status);
    setCurrentPage(1);
    setIsSelectOpen(false);
  };

  return (
    <div className="max-w-3xl mx-auto p-6 animate-in fade-in slide-in-from-bottom-4 duration-500 font-sans min-h-[500px]">

      {/* Header & Filter Dropdown */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-150 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Đơn hàng của tôi</h1>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5 font-semibold">
            <PackageOpen className="w-4 h-4 text-[#4A8795]" />
            Đang hiển thị {filteredOrders.length} đơn hàng
          </p>
        </div>

        {/* Custom interactive dropdown */}
        <div className="w-full md:w-[260px] relative">
          <button
            onClick={() => setIsSelectOpen(!isSelectOpen)}
            className="w-full bg-white h-11 border border-gray-205 focus:outline-none rounded-xl px-4 flex items-center justify-between hover:bg-gray-50/80 cursor-pointer shadow-xs font-semibold text-sm"
          >
            {activeTab === 'ALL' ? (
              <span className="font-bold text-gray-800">Tất cả trạng thái</span>
            ) : (
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${STATUS_CONFIG[activeTab]?.dot || 'bg-gray-400'}`} />
                <span className="font-bold text-gray-800">{STATUS_CONFIG[activeTab]?.label}</span>
              </div>
            )}
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isSelectOpen ? 'rotate-180' : ''}`} />
          </button>

          {isSelectOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setIsSelectOpen(false)} />
              <div className="absolute top-12 left-0 right-0 max-h-[300px] overflow-y-auto bg-white rounded-xl border border-gray-100 shadow-xl p-1 z-40">
                {visibleStatuses.map((status) => {
                  const count = status === 'ALL' ? allOrders.length : countByStatus(status);

                  if (status === 'ALL') {
                    return (
                      <button
                        key={status}
                        onClick={() => handleTabChange('ALL')}
                        className="w-full text-left cursor-pointer py-2.5 px-3 rounded-lg mb-1 hover:bg-gray-100 flex items-center justify-between text-sm"
                      >
                        <span className="font-bold text-gray-700">Tất cả trạng thái</span>
                        <span className="text-[10px] font-bold text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                          {count}
                        </span>
                      </button>
                    );
                  }

                  const cfg = STATUS_CONFIG[status];
                  return (
                    <button
                      key={status}
                      onClick={() => handleTabChange(status)}
                      className={`w-full text-left cursor-pointer py-2 px-3 rounded-lg mb-1 hover:bg-gray-100/50 flex items-center justify-between text-sm font-semibold ${cfg?.color || 'bg-gray-50 text-gray-700'}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg?.dot || 'bg-gray-400'}`} />
                        <span className="font-bold">{cfg?.label}</span>
                      </div>
                      <span className="text-[10px] font-bold bg-white/60 px-2 py-0.5 rounded-full border border-black/5">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {paginated.length === 0 && activeTab !== 'ALL' && (
        <div className="py-12 text-center text-gray-500 font-semibold">
          Không có đơn hàng nào ở trạng thái <span className="font-bold text-gray-700">{STATUS_CONFIG[activeTab]?.label}</span>.
        </div>
      )}

      {/* Danh sách đơn hàng */}
      <div className="space-y-4">
        {paginated.map((order) => (
          <div key={order.orderId}>
            <OrderCard
              order={order}
              allFeedbacks={feedbacks}
              onRefresh={handleRefresh}
            />
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-8 pt-6 border-t border-gray-100 gap-4">
          <p className="text-sm text-gray-500 font-semibold">
            Hiển thị <span className="text-gray-900">{(currentPage - 1) * PAGE_SIZE + 1}</span>–
            <span className="text-gray-900">{Math.min(currentPage * PAGE_SIZE, filteredOrders.length)}</span> / {filteredOrders.length}
          </p>
          <div className="flex items-center gap-2 shadow-xs border border-gray-200 rounded-xl p-1 bg-white">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1 px-2">
              {Array.from({ length: totalPages }, (_, i) => {
                const page = i + 1;
                const isActive = page === currentPage;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 text-sm font-semibold rounded-lg transition-all cursor-pointer ${isActive
                        ? 'bg-indigo-650 bg-[#1e2575] text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-100'
                      }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
