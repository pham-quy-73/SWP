import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Package, LogOut, ChevronLeft, ChevronRight, ClipboardList, LayoutDashboard } from 'lucide-react';

export default function ManagerLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const menuItems = [
    { name: 'Tổng quan', href: '/manager/dashboard', icon: LayoutDashboard },
    { name: 'Sản phẩm', href: '/manager/products', icon: Package },
    { name: 'Đơn hàng', href: '/manager/orders', icon: ClipboardList },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Sidebar */}
      <aside className={`bg-slate-900 border-r border-slate-800 text-slate-400 transition-all duration-300 flex flex-col shrink-0 ${collapsed ? 'w-16' : 'w-64'}`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 shrink-0">
          {!collapsed && <span className="font-extrabold text-white text-lg tracking-tight px-2">MANAGER BOARD</span>}
          <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 rounded hover:bg-slate-800 hover:text-white transition-colors mx-auto">
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'hover:bg-slate-800 hover:text-slate-200'
                } ${collapsed ? 'justify-center px-2' : ''}`
              }
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-800 shrink-0">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-rose-950/30 hover:text-rose-450 transition-all text-slate-400 ${
              collapsed ? 'justify-center px-2' : ''
            }`}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-205 flex items-center justify-between px-8 shrink-0 shadow-sm">
          <span className="font-bold text-slate-800 tracking-tight">Trang Quản Lý Hệ Thống</span>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full uppercase border">
              Manager
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
