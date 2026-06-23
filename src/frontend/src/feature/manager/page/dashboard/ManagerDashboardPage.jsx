import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Package,
  ArrowRight,
  ChevronRight,
  Activity,
} from 'lucide-react';

import { useDashboardRevenue } from '../../hooks/useManagerDashboard';

export default function ManagerDashboardPage() {
  const navigate = useNavigate();
  const { data: stats, isLoading, isError, refetch, isFetching } = useDashboardRevenue();

  // Màn hình tải dữ liệu bằng loading skeleton thuần Tailwind CSS
  if (isLoading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-10 w-[200px] bg-slate-200 rounded-lg" />
          <div className="h-10 w-[100px] bg-slate-200 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-48 bg-slate-200 rounded-3xl" />
          <div className="h-48 bg-slate-200 rounded-3xl" />
        </div>
      </div>
    );
  }

  // Màn hình khi gặp lỗi
  if (isError || !stats) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center gap-4 text-center">
        <div className="bg-red-50 p-4 rounded-full text-red-500">
          <AlertTriangle size={48} />
        </div>
        <h2 className="text-xl font-bold uppercase tracking-tight text-slate-800">Lỗi tải dữ liệu</h2>
        <p className="text-slate-500 max-w-sm">
          Hệ thống không thể kết nối tới máy chủ. Vui lòng thử lại sau.
        </p>
        <button
          onClick={() => refetch()}
          className="px-6 py-2 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 text-slate-655 font-bold transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
        >
          Thử lại ngay
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight italic flex items-center gap-2 text-slate-900">
            <Activity className="text-indigo-650" /> TỔNG QUAN HỒ SƠ QUẢN LÝ
          </h1>
          <p className="text-slate-500 mt-1">
            Chào mừng trở lại! Đây là số liệu hệ thống hôm nay.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-semibold shadow-sm hover:bg-slate-50 text-slate-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={`mr-2 text-slate-500 ${isFetching ? 'animate-spin' : ''}`} />
          Làm mới dữ liệu
        </button>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Doanh thu */}
        <div className="border border-slate-200/80 rounded-2xl shadow-sm p-6 bg-white overflow-hidden relative group hover:ring-2 hover:ring-indigo-500/20 transition-all">
          <div className="flex flex-row items-center justify-between pb-2">
            <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">
              Doanh thu
            </span>
            <div className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                stats.revenue,
              )}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                stats.revenueGrowth >= 0
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-rose-50 text-rose-700'
              }`}>
                {stats.revenueGrowth >= 0 ? (
                  <TrendingUp size={12} className="mr-1" />
                ) : (
                  <TrendingDown size={12} className="mr-1" />
                )}
                {Math.abs(stats.revenueGrowth)}%
              </span>
              <span className="text-[11px] text-slate-400 font-semibold uppercase">
                vs tháng trước
              </span>
            </div>
          </div>
        </div>

        {/* Đơn hàng */}
        <div
          className="border border-slate-200/80 rounded-2xl shadow-sm p-6 bg-white hover:ring-2 hover:ring-indigo-500/20 transition-all cursor-pointer group"
          onClick={() => navigate('/manager/orders')}
        >
          <div className="flex flex-row items-center justify-between pb-2">
            <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">
              Đơn hàng mới
            </span>
            <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
              <ShoppingCart size={20} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900">
              {stats.activeOrders}{' '}
              <span className="text-xs text-slate-400 font-normal">ĐANG XỬ LÝ</span>
            </div>
            <p className="text-[11px] mt-2.5 text-blue-600 font-bold uppercase flex items-center gap-1">
              + {stats.ordersToday} đơn phát sinh hôm nay <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </p>
          </div>
        </div>

        {/* Tồn kho */}
        <div
          className="border border-slate-200/80 rounded-2xl shadow-sm p-6 bg-white border-b-4 border-b-red-500 hover:ring-2 hover:ring-indigo-500/20 transition-all cursor-pointer relative"
          onClick={() => navigate('/manager/products')}
        >
          {stats.lowStockItems > 0 && (
            <span className="absolute top-3 right-3 flex h-2.5 w-2.5 rounded-full bg-red-500 animate-ping" />
          )}
          <div className="flex flex-row items-center justify-between pb-2">
            <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">
              Cảnh báo kho
            </span>
            <div className="h-10 w-10 bg-red-50 rounded-xl flex items-center justify-center text-red-650">
              <Package size={20} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-red-600">
              {stats.lowStockItems}{' '}
              <span className="text-xs text-slate-400 font-normal">SẢN PHẨM</span>
            </div>
            <p className="text-[11px] mt-2.5 text-red-500 font-bold uppercase">
              Yêu cầu nhập thêm hàng
            </p>
          </div>
        </div>
      </div>

      {/* Action Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div
          onClick={() => navigate('/manager/products')}
          className="group relative bg-slate-900 rounded-[2rem] p-8 text-white cursor-pointer overflow-hidden shadow-xl transition-all hover:-translate-y-1 hover:shadow-indigo-500/10"
        >
          <div className="relative z-10 flex flex-col h-full justify-between gap-8">
            <div>
              <h3 className="text-2xl font-black italic mb-2 tracking-tight">KHO HÀNG & SẢN PHẨM</h3>
              <p className="text-slate-405 text-sm max-w-xs leading-relaxed">
                Quản lý danh mục gọng kính, thông tin chi tiết và kiểm soát tồn kho trong hệ thống.
              </p>
            </div>
            <div className="flex items-center gap-3 font-semibold group-hover:text-indigo-400 transition-colors text-sm">
              ĐẾN TRANG QUẢN TRỊ{' '}
              <ArrowRight
                size={18}
                className="group-hover:translate-x-2 transition-transform duration-300"
              />
            </div>
          </div>
          <Package
            size={160}
            className="absolute -bottom-8 -right-8 text-white/5 rotate-12 group-hover:scale-105 transition-transform duration-500 pointer-events-none"
          />
        </div>

        <div
          onClick={() => navigate('/manager/orders')}
          className="group relative bg-indigo-600 rounded-[2rem] p-8 text-white cursor-pointer overflow-hidden shadow-xl transition-all hover:-translate-y-1 hover:shadow-indigo-600/20"
        >
          <div className="relative z-10 flex flex-col h-full justify-between gap-8">
            <div>
              <h3 className="text-2xl font-black italic mb-2 tracking-tight">XỬ LÝ ĐƠN HÀNG</h3>
              <p className="text-indigo-100 text-sm max-w-xs leading-relaxed">
                Theo dõi và cập nhật tiến độ giao hàng, thanh toán của các đơn kính và phụ kiện.
              </p>
            </div>
            <div className="flex items-center gap-3 font-semibold group-hover:text-amber-399 transition-colors text-sm">
              XEM DANH SÁCH ĐƠN{' '}
              <ArrowRight
                size={18}
                className="group-hover:translate-x-2 transition-transform duration-300"
              />
            </div>
          </div>
          <ShoppingCart
            size={160}
            className="absolute -bottom-8 -right-8 text-white/10 -rotate-12 group-hover:scale-105 transition-transform duration-500 pointer-events-none"
          />
        </div>
      </div>
    </div>
  );
}
