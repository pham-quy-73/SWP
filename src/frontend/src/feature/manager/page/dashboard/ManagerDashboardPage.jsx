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
  Activity,
  ArrowUpRight
} from 'lucide-react';

import { useDashboardRevenue } from '../../hooks/useManagerDashboard';

export default function ManagerDashboardPage() {
  const navigate = useNavigate();
  const { data: stats, isLoading, isError, refetch, isFetching } = useDashboardRevenue();

  // Màn hình tải dữ liệu (Skeleton) phong cách Minimalism
  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-12 animate-pulse">
        <div className="flex justify-between items-end">
          <div className="space-y-4">
            <div className="h-3 w-24 bg-zinc-200 rounded-full" />
            <div className="h-12 w-64 bg-zinc-200 rounded-2xl" />
          </div>
          <div className="h-10 w-32 bg-zinc-200 rounded-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[180px] bg-zinc-100 rounded-[2rem]" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="h-[250px] bg-zinc-100 rounded-[2.5rem]" />
          <div className="h-[250px] bg-zinc-100 rounded-[2.5rem]" />
        </div>
      </div>
    );
  }

  // Màn hình khi gặp lỗi
  if (isError || !stats) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-5 text-center px-6">
        <div className="w-20 h-20 bg-rose-50 rounded-[2rem] flex items-center justify-center text-rose-500 mb-2 shadow-lg shadow-rose-500/10">
          <AlertTriangle size={32} strokeWidth={2.5} />
        </div>
        <h2 className="text-2xl font-black tracking-tight text-zinc-900">Gián đoạn kết nối</h2>
        <p className="text-zinc-500 max-w-sm text-sm leading-relaxed">
          Không thể lấy dữ liệu thống kê từ máy chủ lúc này. Vui lòng kiểm tra đường truyền hoặc thử lại.
        </p>
        <button
          onClick={() => refetch()}
          className="mt-4 px-8 py-3.5 bg-zinc-900 rounded-2xl hover:bg-zinc-800 text-white font-bold text-sm transition-all shadow-xl hover:shadow-zinc-900/20 active:scale-95"
        >
          Thử lại ngay
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-12 max-w-7xl mx-auto animate-[fadeIn_0.5s_ease-out]">

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          {/* Tag chuẩn phong cách Lookbook */}
          <span className="inline-flex items-center px-4 py-1.5 bg-white border border-zinc-200 text-zinc-500 text-[10px] font-bold tracking-[0.3em] uppercase rounded-full shadow-sm mb-4">
            <Activity size={12} className="mr-2 text-emerald-500" />
            Dashboard
          </span>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-zinc-900">
            Tổng Quan Hệ Thống.
          </h1>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="group flex items-center gap-2 px-6 py-3 bg-white border border-zinc-200 rounded-full text-xs font-bold tracking-widest uppercase text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-all disabled:opacity-50 shadow-sm"
        >
          <RefreshCw size={14} className={`${isFetching ? 'animate-spin text-emerald-500' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
          {isFetching ? 'Đang tải...' : 'Làm mới'}
        </button>
      </div>

      {/* KPI SECTION (3 Cột) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* Card 1: Doanh Thu */}
        <div className="bg-white rounded-[2rem] p-8 border border-zinc-100 shadow-[0_10px_40px_rgba(0,0,0,0.04)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-[100px] -z-10 transition-transform duration-500 group-hover:scale-110"></div>

          <div className="flex items-center justify-between mb-6">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
              Doanh thu
            </span>
            <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-900 border border-zinc-100">
              <DollarSign size={18} strokeWidth={2.5} />
            </div>
          </div>

          <div>
            <div className="text-3xl font-black text-zinc-900 tracking-tight">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.revenue)}
            </div>
            <div className="mt-4 flex items-center gap-2.5">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold ${stats.revenueGrowth >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}>
                {stats.revenueGrowth >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {Math.abs(stats.revenueGrowth)}%
              </span>
              <span className="text-xs text-zinc-400 font-medium">so với tháng trước</span>
            </div>
          </div>
        </div>

        {/* Card 2: Đơn hàng mới */}
        <div
          onClick={() => navigate('/manager/orders')}
          className="bg-white rounded-[2rem] p-8 border border-zinc-100 shadow-[0_10px_40px_rgba(0,0,0,0.04)] relative overflow-hidden group cursor-pointer hover:-translate-y-1 transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-6">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
              Đơn hàng xử lý
            </span>
            <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-900 border border-zinc-100 group-hover:bg-zinc-900 group-hover:text-white transition-colors">
              <ShoppingCart size={18} strokeWidth={2.5} />
            </div>
          </div>

          <div>
            <div className="text-3xl font-black text-zinc-900 tracking-tight flex items-baseline gap-2">
              {stats.activeOrders}
              <span className="text-sm font-semibold text-zinc-400">ĐƠN</span>
            </div>
            <p className="text-xs mt-4 text-zinc-500 font-medium flex items-center gap-1.5">
              <span className="flex w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="font-bold text-zinc-900">+{stats.ordersToday}</span> phát sinh hôm nay
            </p>
          </div>
        </div>

        {/* Card 3: Cảnh báo Kho */}
        <div
          onClick={() => navigate('/manager/products')}
          className="bg-white rounded-[2rem] p-8 border border-zinc-100 shadow-[0_10px_40px_rgba(0,0,0,0.04)] relative overflow-hidden group cursor-pointer hover:-translate-y-1 hover:border-rose-200 transition-all duration-300"
        >
          {stats.lowStockItems > 0 && (
            <span className="absolute top-8 right-8 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
          )}

          <div className="flex items-center justify-between mb-6">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
              Cảnh báo tồn kho
            </span>
          </div>

          <div>
            <div className="text-3xl font-black text-rose-600 tracking-tight flex items-baseline gap-2">
              {stats.lowStockItems}
              <span className="text-sm font-semibold text-rose-400/70">MẶT HÀNG</span>
            </div>
            <p className="text-xs mt-4 text-rose-600 font-bold uppercase tracking-wide flex items-center gap-1">
              Yêu cầu nhập thêm hàng <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </p>
          </div>
        </div>

      </div>

      {/* QUICK ACTIONS SECTION (2 Cột, thiết kế chuẩn Lookbook) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">

        {/* Action 1: Dark Mode Box */}
        <div
          onClick={() => navigate('/manager/products')}
          className="group relative overflow-hidden rounded-[2.5rem] bg-zinc-950 p-10 cursor-pointer shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)]"
        >
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

          <div className="relative z-10 flex flex-col h-full justify-between min-h-[220px]">
            <div>
              <h3 className="text-white text-3xl font-black tracking-tight mb-4">
                Kho hàng & <br /> Sản phẩm.
              </h3>
              <p className="text-zinc-400 text-sm max-w-[250px] leading-relaxed">
                Kiểm soát danh mục gọng kính cao cấp, cập nhật thuộc tính và quản lý số lượng tồn kho.
              </p>
            </div>

            <div className="mt-8 flex items-center gap-3 text-xs font-bold tracking-widest uppercase text-emerald-400 group-hover:text-emerald-300 transition-colors">
              Đến trang quản trị
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            </div>
          </div>

          {/* Background Icon */}
          <Package size={180} strokeWidth={1} className="absolute -bottom-10 -right-10 text-white/5 rotate-12 group-hover:rotate-0 group-hover:scale-110 transition-all duration-700 pointer-events-none" />
        </div>

        {/* Action 2: Light Mode Box */}
        <div
          onClick={() => navigate('/manager/orders')}
          className="group relative overflow-hidden rounded-[2.5rem] bg-zinc-100 p-10 cursor-pointer border border-zinc-200 shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:border-zinc-300"
        >
          <div className="relative z-10 flex flex-col h-full justify-between min-h-[220px]">
            <div>
              <h3 className="text-zinc-900 text-3xl font-black tracking-tight mb-4">
                Xử lý <br /> Đơn hàng.
              </h3>
              <p className="text-zinc-500 text-sm max-w-[250px] leading-relaxed">
                Theo dõi tiến độ thanh toán, duyệt đơn và điều phối giao hàng cho khách.
              </p>
            </div>

            <div className="mt-8 flex items-center gap-3 text-xs font-bold tracking-widest uppercase text-zinc-900">
              Xem danh sách
              <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:bg-zinc-900 group-hover:text-white transition-all duration-300">
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            </div>
          </div>

          {/* Background Icon */}
          <ShoppingCart size={180} strokeWidth={1} className="absolute -bottom-10 -right-10 text-zinc-900/5 -rotate-12 group-hover:rotate-0 group-hover:scale-110 transition-all duration-700 pointer-events-none" />
        </div>

      </div>
    </div>
  );
}