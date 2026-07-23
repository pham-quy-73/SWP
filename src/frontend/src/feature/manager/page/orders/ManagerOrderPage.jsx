import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  Loader2, Package, ChevronLeft, ChevronRight, Eye, User, Phone, MapPin,
  Receipt, Calendar, Glasses, Info, ClipboardList, FileText, ImageIcon, X, Trash2
} from 'lucide-react';

import { CreateBatchModal } from '../../components/refund/CreateBatchModal';
import { CustomerCancelModal } from '../../components/refund/CustomerCancelModal';
import { ReadyRefundsModal } from '../../components/refund/ReadyRefundsModal';

const STATUS_CONFIG = {
  PENDING: {
    label: 'Chờ xử lý',
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
    className: 'bg-amber-100 text-amber-700 hover:bg-amber-100 border-none',
  },
  AWAITING_VERIFICATION: {
    label: 'Chờ xác minh',
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    dot: 'bg-orange-500',
    className: 'bg-orange-100 text-orange-700 border-none',
  },
  CONFIRMED: {
    label: 'Đã xác nhận',
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
    className: 'bg-blue-100 text-blue-700 border-none',
  },
  COMPLETED: {
    label: 'Hoàn thành',
    bg: 'bg-emerald-100',
    text: 'text-emerald-800',
    dot: 'bg-emerald-600',
    className: 'bg-emerald-100 text-emerald-800 border-none',
  },
  CANCELLED: {
    label: 'Đã huỷ',
    bg: 'bg-red-100',
    text: 'text-red-750',
    dot: 'bg-red-500',
    className: 'bg-red-100 text-red-755 border-none',
  },
  REFUNDED: {
    label: 'Đã hoàn tiền',
    bg: 'bg-pink-100',
    text: 'text-pink-700',
    dot: 'bg-pink-500',
    className: 'bg-pink-100 text-pink-700 border-none',
  },
};

const fmt = (num) => {
  if (num === null || num === undefined) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
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

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? {
    label: status,
    dot: 'bg-gray-400',
    className: 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-transparent',
  };

  return (
    <span
      className={`inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-wide w-[140px] shadow-sm transition-all ${cfg.className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function OrderDetailModal({ orderId, onClose, onUpdateStatus, onDeleteOrder, isAdmin }) {
  const [orderDetail, setOrderDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      setIsLoading(true);
      try {
        const apiURL = import.meta.env.VITE_API_URL || '';
        const token = localStorage.getItem('accessToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await axios.get(`${apiURL}/api/management/orders/${orderId}`, { headers });
        if (res.data && res.data.result) {
          setOrderDetail(res.data.result);
        }
      } catch (err) {
        console.error(err);
        toast.error('Không thể lấy chi tiết đơn hàng');
      } finally {
        setIsLoading(false);
      }
    };
    if (orderId) {
      fetchDetail();
    }
  }, [orderId]);

  if (isLoading || !orderDetail) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl p-8 shadow-xl flex items-center gap-3">
          <Loader2 className="animate-spin text-indigo-650" size={24} />
          <span className="text-sm font-bold text-slate-700">Đang tải chi tiết đơn hàng...</span>
        </div>
      </div>
    );
  }

  const { order, items } = orderDetail;
  const statusInfo = STATUS_CONFIG[order.status] || {
    label: order.status,
    className: 'bg-slate-100 text-slate-700',
  };

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    setUpdating(true);
    try {
      await onUpdateStatus(order._id, newStatus);
      setOrderDetail(prev => ({
        ...prev,
        order: { ...prev.order, status: newStatus }
      }));
    } finally {
      setUpdating(false);
    }
  };

  const userObj = order.user_id || {};
  const customerName = userObj.first_name || userObj.last_name
    ? `${userObj.first_name || ''} ${userObj.last_name || ''}`.trim()
    : userObj.username || 'N/A';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col font-sans overflow-hidden">
        {/* Header Section */}
        <div className="bg-slate-50/80 px-8 py-6 border-b flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-3">
              <span className={`px-4 py-1 rounded-full uppercase text-[10px] font-black tracking-widest ${statusInfo.className}`}>
                {statusInfo.label}
              </span>
              <span className="text-xs font-mono text-slate-400 font-bold px-2 py-0.5 bg-slate-100 rounded">
                #{order._id}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-2 flex items-center gap-2">
              <ClipboardList className="text-indigo-650" size={24} /> Chi tiết đơn hàng
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-150 rounded-xl transition-all">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content Section */}
        <div className="overflow-y-auto p-8 flex-1 space-y-8 bg-slate-50/20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Cột 1: Thông tin khách hàng */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-black uppercase tracking-widest text-[11px]">
                <User size={16} className="text-indigo-650" /> Khách hàng
              </div>
              <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-3 shadow-sm">
                <p className="text-slate-900 font-bold text-base">
                  {customerName}
                </p>
                <div className="space-y-2">
                  <p className="text-sm flex items-center gap-2 text-slate-500 font-medium">
                    <Phone size={14} className="text-slate-400" /> {userObj.phone || 'Chưa cung cấp SĐT'}
                  </p>
                  <p className="text-sm flex items-start gap-2 text-slate-500 font-medium leading-relaxed">
                    <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                    {userObj.email || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Cột 2: Cập nhật & Kiểm soát */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-black uppercase tracking-widest text-[11px]">
                <Receipt size={16} className="text-indigo-650" /> Cập nhật trạng thái
              </div>
              <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-sm">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 font-bold">Tổng doanh thu:</span>
                  <span className="font-extrabold text-lg text-slate-900">{fmt(order.total_amount)}</span>
                </div>

                <div className="flex flex-col gap-1.5 mt-2">
                  <label className="text-xs text-slate-405 font-bold uppercase tracking-wider">Chọn Trạng Thái Mới</label>
                  <div className="relative">
                    <select
                      value={order.status}
                      onChange={handleStatusChange}
                      disabled={updating}
                      className="w-full bg-slate-55 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all select-none"
                    >
                      {Object.keys(STATUS_CONFIG).map((statusKey) => {
                        if (statusKey === 'AWAITING_VERIFICATION') return null;
                        return (
                          <option key={statusKey} value={statusKey}>
                            {STATUS_CONFIG[statusKey].label}
                          </option>
                        );
                      })}
                    </select>
                    {updating && (
                      <Loader2 className="absolute right-3 top-2.5 w-4 h-4 animate-spin text-slate-500" />
                    )}
                  </div>
                </div>

                {isAdmin && (
                  <div className="border-t border-slate-100 pt-3 flex justify-end">
                    <button
                      onClick={() => onDeleteOrder(order._id)}
                      className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-800 transition-colors font-bold uppercase tracking-wide px-3 py-1.5 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={13} /> Xóa đơn hàng này
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Đơn thuốc mắt kính nếu có */}
          {(order.prescription_text || order.prescription_image) && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-black uppercase tracking-widest text-[11px]">
                <FileText size={16} className="text-indigo-650" /> Thông tin đơn thuốc mắt kính
              </div>
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
                {order.prescription_text && (
                  <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-700 whitespace-pre-line font-medium leading-relaxed">
                    {order.prescription_text}
                  </div>
                )}
                {order.prescription_image && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowImagePreview(!showImagePreview)}
                      className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-805 bg-indigo-50/50 hover:bg-indigo-50 px-3 py-2 rounded-xl transition-all"
                    >
                      <ImageIcon size={14} /> {showImagePreview ? 'Ẩn ảnh thuốc kính' : 'Xem ảnh đơn kính gốc'}
                    </button>
                    {showImagePreview && (
                      <div className="mt-3 border rounded-2xl overflow-hidden bg-slate-900/5 max-w-md p-1 shadow-sm">
                        <img
                          src={getDisplayImageUrl(order.prescription_image)}
                          alt="Đơn thuốc kính gốc"
                          className="w-full h-auto object-contain max-h-[300px] rounded-xl bg-white"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Lịch sử xử lý đơn hàng */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-black uppercase tracking-widest text-[11px]">
              <ClipboardList size={16} className="text-indigo-650" /> Lịch sử xử lý đơn hàng
            </div>
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              {(!order.status_history || order.status_history.length === 0) ? (
                <p className="text-sm text-slate-400 italic font-medium">Chưa có lịch sử cập nhật cho đơn hàng này.</p>
              ) : (
                <div className="relative border-l border-slate-200 ml-3 pl-6 space-y-6">
                  {order.status_history.slice().sort((a, b) => new Date(a.updated_at) - new Date(b.updated_at)).map((log, idx) => {
                    const updater = log.updated_by || {};
                    const updaterName = updater.first_name || updater.last_name
                      ? `${updater.first_name || ''} ${updater.last_name || ''}`.trim()
                      : updater.username || 'Hệ thống';

                    return (
                      <div key={idx} className="relative">
                        {/* Checkpoint Dot */}
                        <span className="absolute -left-[30px] top-1.5 w-3.5 h-3.5 rounded-full bg-indigo-600 border-4 border-white shadow-sm" />

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <span className="text-sm font-bold text-slate-800">
                            Trạng thái: {STATUS_CONFIG[log.to_status]?.label || log.to_status}
                          </span>
                          <span className="text-xs text-slate-400 font-semibold font-mono">
                            {new Date(log.updated_at).toLocaleString('vi-VN')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1.5 font-medium">
                          Người thao tác: <span className="font-bold text-slate-700">{updaterName}</span>
                          {log.is_override && (
                            <span className="text-rose-600 font-extrabold ml-2 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 uppercase text-[9px] tracking-wide inline-block">
                              ADMIN ghi đè (Override)
                            </span>
                          )}
                        </p>
                        {log.note && (
                          <p className="text-xs text-indigo-700 bg-indigo-50/50 border border-dashed border-indigo-100 px-3 py-1.5 rounded-xl mt-2 inline-block font-medium">
                            Ghi chú: {log.note}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Danh sách sản phẩm mua */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 font-black uppercase tracking-widest text-[11px]">
                <Package size={16} className="text-indigo-650" /> Danh mục sản phẩm ({items.length})
              </div>
            </div>
            <div className="space-y-3">
              {items.map((item) => {
                const prod = item.product_id || {};
                const variant = item.variant_id || {};
                const lens = item.lens_id || {};
                const p = item.prescription;

                const rawUrl = Array.isArray(variant.imageUrl) && variant.imageUrl[0]
                  ? variant.imageUrl[0]
                  : (Array.isArray(prod.imageUrl) && prod.imageUrl[0]
                    ? prod.imageUrl[0]
                    : (typeof prod.imageUrl === 'string' ? prod.imageUrl : (prod.image || '')));
                const imageUrl = getDisplayImageUrl(rawUrl);

                return (
                  <div key={item._id} className="group bg-white border border-slate-200/80 rounded-2xl p-4 hover:border-indigo-200 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 border overflow-hidden mt-0.5">
                        {imageUrl ? (
                          <img src={imageUrl} alt={prod.name} className="w-full h-full object-cover" />
                        ) : (
                          <Glasses className="text-slate-350 w-6 h-6" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-slate-900 text-sm leading-tight flex items-center gap-2">
                          {prod.name || 'Sản phẩm mẫu'}
                          {prod.brand && (
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                              {prod.brand}
                            </span>
                          )}
                        </h4>

                        {/* Phiên bản gọng kính (Màu sắc, Size, SKU) */}
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          {variant.colorName && (
                            <span className="font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-100/80">
                              Màu: {variant.colorName}
                            </span>
                          )}
                          {(variant.sizeLabel || (variant.lensWidthMm && variant.bridgeWidthMm && variant.templeLengthMm)) && (
                            <span className="text-slate-600 font-medium bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200/60">
                              Size: {variant.sizeLabel || `${variant.lensWidthMm}-${variant.bridgeWidthMm}-${variant.templeLengthMm}`}
                            </span>
                          )}
                          {variant.sku && (
                            <span className="text-slate-400 text-[10px] font-mono">
                              SKU: {variant.sku}
                            </span>
                          )}
                        </div>

                        {/* Thấu kính / Tròng kính mua kèm */}
                        {lens._id || lens.name ? (
                          <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-bold bg-emerald-50/80 px-2.5 py-1 rounded-xl border border-emerald-200/60 inline-flex mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Tròng kính: {lens.name} {lens.brand ? `(${lens.brand})` : ''}
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400 italic font-medium">
                            Chỉ mua gọng (không kèm tròng)
                          </div>
                        )}

                        {/* Thông số đơn kính thuốc nếu có */}
                        {p && (p.od_sphere || p.od_cylinder || p.os_sphere || p.os_cylinder || p.note || p.imageUrl) && (
                          <div className="mt-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 space-y-1.5">
                            <div className="font-extrabold text-slate-700 text-[11px] uppercase tracking-wider flex items-center gap-1">
                              📋 Thông số kính thuốc:
                            </div>

                            {/* Trường hợp 1: Nhập số độ (OD / OS) */}
                            {(p.od_sphere !== 0 || p.od_cylinder !== 0 || p.os_sphere !== 0 || p.os_cylinder !== 0) && (
                              <div className="grid grid-cols-2 gap-x-4 text-[11px] font-mono text-slate-800">
                                <div><span className="font-bold text-blue-700">OD (Phải):</span> SPH {p.od_sphere > 0 ? `+${p.od_sphere}` : p.od_sphere} | CYL {p.od_cylinder} | AX {p.od_axis}°</div>
                                <div><span className="font-bold text-indigo-700">OS (Trái):</span> SPH {p.os_sphere > 0 ? `+${p.os_sphere}` : p.os_sphere} | CYL {p.os_cylinder} | AX {p.os_axis}°</div>
                              </div>
                            )}

                            {/* Trường hợp 2: Tải ảnh đơn thuốc cho sản phẩm này */}
                            {p.imageUrl && (
                              <div className="pt-1">
                                <a
                                  href={getDisplayImageUrl(p.imageUrl)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 transition-colors"
                                >
                                  <ImageIcon size={13} /> Xem ảnh đơn kính của sản phẩm này ↗
                                </a>
                              </div>
                            )}

                            {p.note && <div className="text-[10px] text-amber-800 font-medium italic mt-0.5">Ghi chú: {p.note}</div>}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-base font-black text-slate-900">{fmt(item.unit_price * item.quantity)}</p>
                      <p className="text-xs font-bold text-slate-400 mt-0.5 uppercase tracking-wide">
                        {fmt(item.unit_price)} × SL {item.quantity}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Section */}
        <div className="bg-slate-50/80 px-8 py-5 flex items-center justify-between border-t shrink-0">
          <div className="hidden md:flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest">
            <Calendar size={14} /> Dữ liệu thời gian thực
          </div>
          <button
            onClick={onClose}
            className="rounded-xl font-bold px-8 bg-slate-900 hover:bg-slate-800 text-white transition-all uppercase text-xs tracking-widest h-11"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ManagerOrderPage() {
  const [status, setStatus] = useState('ALL');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showReadyModal, setShowReadyModal] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role && user.role.toUpperCase() === 'ADMIN';

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const apiURL = import.meta.env.VITE_API_URL || '';
      const token = localStorage.getItem('accessToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await axios.get(`${apiURL}/api/management/orders`, {
        params: status === 'ALL' ? {} : { status },
        headers
      });

      if (response.data && response.data.result) {
        setOrders(response.data.result);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast.error('Không thể lấy danh sách đơn điện tử');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [status]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    const toastId = toast.loading('Đang cập nhật trạng thái...');
    try {
      const apiURL = import.meta.env.VITE_API_URL || '';
      const token = localStorage.getItem('accessToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      await axios.put(
        `${apiURL}/api/management/orders/${orderId}/status`,
        { status: newStatus },
        { headers }
      );

      toast.success('Cập nhật trạng thái thành công!', { id: toastId });
      fetchOrders();
    } catch (error) {
      console.error(error);
      toast.error('Cập nhật trạng thái thất bại', { id: toastId });
      throw error;
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa đơn hàng này vĩnh viễn không?')) {
      return;
    }

    const toastId = toast.loading('Đang xóa đơn hàng...');
    try {
      const apiURL = import.meta.env.VITE_API_URL || '';
      const token = localStorage.getItem('accessToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      await axios.delete(`${apiURL}/api/management/orders/${orderId}`, { headers });

      toast.success('Xóa đơn hàng thành công!', { id: toastId });
      setSelectedOrderId(null);
      fetchOrders();
    } catch (error) {
      console.error(error);
      toast.error('Không thể xóa đơn hàng lúc này', { id: toastId });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans">
      {selectedOrderId && (
        <OrderDetailModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
          onUpdateStatus={handleUpdateStatus}
          onDeleteOrder={handleDeleteOrder}
          isAdmin={isAdmin}
        />
      )}

      <div className="max-w-6xl mx-auto px-6 py-10">
        <header className="mb-10 flex flex-col xl:flex-row xl:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-200 text-white">
                <Package size={24} />
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                Quản lý đơn hàng
              </h1>
            </div>
            <p className="text-slate-500 font-medium text-sm">
              Quản lý và theo dõi tiến độ đơn hàng hệ thống
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowCancelModal(true)}
              className="h-11 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md font-bold text-xs tracking-tight transition-all flex items-center justify-center gap-1.5"
            >
              ⚡ Đơn khách hủy
            </button>
            <button
              onClick={() => setShowBatchModal(true)}
              className="h-11 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md font-bold text-xs tracking-tight transition-all flex items-center justify-center gap-1.5"
            >
              📦 Tạo lô hoàn tiền
            </button>
            <button
              onClick={() => setShowReadyModal(true)}
              className="h-11 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md font-bold text-xs tracking-tight transition-all flex items-center justify-center gap-1.5"
            >
              💰 Yêu cầu hoàn tiền
            </button>

            <div className="w-[180px] relative">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full h-11 bg-white border border-slate-205 pl-4 pr-10 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-semibold text-slate-700 appearance-none cursor-pointer text-xs"
              >
                <option value="ALL" className="font-bold text-slate-800 py-2">
                  Tất cả trạng thái
                </option>
                {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                  if (key === 'AWAITING_VERIFICATION') return null;
                  return (
                    <option key={key} value={key} className="font-medium text-slate-650 py-2">
                      {config.label}
                    </option>
                  );
                })}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 font-extrabold text-[10px]">
                ▼
              </div>
            </div>
          </div>
        </header>

        <div className="bg-white rounded-[32px] shadow-sm border border-slate-200/60 overflow-hidden relative">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="pl-8 pr-4 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    Mã đơn
                  </th>
                  <th className="px-4 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    Khách hàng
                  </th>
                  <th className="px-4 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">
                    Giá trị
                  </th>
                  <th className="px-4 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">
                    Trạng thái
                  </th>
                  <th className="pl-4 pr-8 py-5"></th>
                </tr>
              </thead>

              <tbody className={`divide-y divide-slate-50 transition-opacity duration-300 ${loading ? 'opacity-40' : 'opacity-100'}`}>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center text-slate-400 italic font-semibold">
                      Không tìm thấy đơn hàng nào phù hợp
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => {
                    const userObj = o.user_id || {};
                    const customerName = userObj.first_name || userObj.last_name
                      ? `${userObj.first_name || ''} ${userObj.last_name || ''}`.trim()
                      : userObj.username || 'Ẩn danh';

                    return (
                      <tr
                        key={o._id}
                        className="group hover:bg-blue-50/30 transition-colors cursor-pointer"
                        onClick={() => setSelectedOrderId(o._id)}
                      >
                        <td className="pl-8 pr-4 py-5 font-bold text-slate-900 text-sm">
                          #{o._id.slice(-8)}
                        </td>
                        <td className="px-4 py-5">
                          <div className="font-bold text-slate-700 text-sm">
                            {customerName}
                          </div>
                          <div className="text-xs text-slate-400 font-medium mt-0.5">{userObj.phone || 'N/A'}</div>
                        </td>
                        <td className="px-4 py-5 text-right font-black text-slate-900 text-sm">
                          {fmt(o.total_amount)}
                        </td>
                        <td className="px-4 py-5 text-center">
                          <StatusBadge status={o.status} />
                        </td>
                        <td className="pl-4 pr-8 py-5 text-right">
                          <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm group-hover:shadow-md ml-auto">
                            <Eye size={16} />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {loading && (
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-100">
                <Loader2 className="animate-spin text-blue-605" size={20} />
                <span className="text-sm font-bold text-slate-700">Đang tải đơn hàng...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {showCancelModal && <CustomerCancelModal onClose={() => { setShowCancelModal(false); fetchOrders(); }} />}
      {showBatchModal && <CreateBatchModal onClose={() => { setShowBatchModal(false); fetchOrders(); }} />}
      {showReadyModal && <ReadyRefundsModal onClose={() => { setShowReadyModal(false); fetchOrders(); }} />}
    </div>
  );
}
