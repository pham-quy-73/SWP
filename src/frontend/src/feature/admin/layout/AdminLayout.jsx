import { useState, useContext } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import {
  Users,
  ClipboardList,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Search
} from 'lucide-react';
import { AuthContext } from '../../../contexts/AuthContext';

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useContext(AuthContext);

  const menuItems = [
    { name: 'Người dùng', href: '/admin/users', icon: Users },
    { name: 'Đơn hàng', href: '/admin/orders', icon: ClipboardList },
  ];

  return (
    <div className="flex h-screen bg-zinc-50 font-sans">
      {/* SIDEBAR */}
      <aside
        className={`relative flex flex-col bg-zinc-900 text-zinc-400 transition-all duration-300 ease-in-out shrink-0 z-20 shadow-2xl ${
          collapsed ? 'w-20' : 'w-[280px]'
        }`}
      >
        {/* Logo Area */}
        <div className="h-24 flex items-center justify-center shrink-0 px-6">
          <Link to="/" className="flex items-center gap-3">
            {/* Icon "O" */}
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-lg">
              <span className="text-zinc-950 font-black text-lg">O</span>
            </div>
            {/* Chữ OPTICSTORE chỉ hiện khi sidebar mở */}
            {!collapsed && (
              <span className="text-lg font-black tracking-widest text-white whitespace-nowrap animate-in fade-in duration-500">
                OPTICSTORE
              </span>
            )}
          </Link>
        </div>

        {/* Role Info */}
        {!collapsed && (
          <div className="px-8 pb-8 pt-2 animate-in fade-in duration-500">
            <div className="bg-zinc-800/50 p-4 rounded-2xl border border-zinc-700/50">
              <p className="text-[9px] font-bold tracking-[0.2em] text-rose-400 uppercase mb-1">Admin</p>
              <p className="text-sm text-white font-bold truncate">{user?.username || 'Quản trị'}</p>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className={`flex-1 ${collapsed ? 'px-3' : 'px-5'} space-y-2`}>
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center gap-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 ${
                  isActive
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/20'
                    : 'hover:bg-zinc-800 hover:text-zinc-100'
                } ${collapsed ? 'justify-center' : 'px-5'}`
              }
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-5">
          <button
            onClick={logout}
            className={`w-full flex items-center gap-4 py-3.5 rounded-2xl text-sm font-bold text-zinc-500 hover:bg-rose-900/20 hover:text-rose-400 transition-all ${
              collapsed ? 'justify-center' : 'px-5'
            }`}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span>Đăng xuất</span>}
          </button>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3.5 top-10 bg-white text-zinc-900 w-7 h-7 flex items-center justify-center rounded-full shadow-lg hover:bg-rose-500 hover:text-white transition-all z-30"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </aside>

      {/* MAIN CONTENT Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <header className="h-20 border-b border-zinc-100 flex items-center justify-between px-10">
          <div className="relative w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              className="w-full h-11 pl-11 pr-4 rounded-xl bg-zinc-50 border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-bold text-zinc-900">
                {user?.username || 'Admin'}
              </span>
              <span className="text-xs text-zinc-500">
                Quản trị hệ thống
              </span>
            </div>

            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center font-bold text-zinc-700">
              {(user?.username || 'A').charAt(0).toUpperCase()}
            </div>

            {/* Logout */}
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 h-10 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all duration-300 font-semibold"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Đăng xuất</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
