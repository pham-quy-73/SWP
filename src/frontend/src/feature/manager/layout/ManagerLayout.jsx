import { useState, useContext } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Search,
    Menu,
    X
} from 'lucide-react';
import { AuthContext } from '../../../contexts/AuthContext';

export default function ManagerLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const { user, logout } = useContext(AuthContext);

    const menuItems = [
        { name: 'Tổng quan', href: '/manager/dashboard', icon: LayoutDashboard },
        { name: 'Sản phẩm', href: '/manager/products', icon: Package },
        { name: 'Đơn hàng', href: '/manager/orders', icon: ShoppingCart },
    ];

    return (
        <div className="flex h-screen bg-zinc-50 font-sans">
            {/* Overlay cho mobile drawer */}
            {mobileOpen && (
                <div
                    onClick={() => setMobileOpen(false)}
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                />
            )}

            {/* SIDEBAR — off-canvas trên mobile, tĩnh trên desktop */}
            <aside
                className={`fixed md:relative inset-y-0 left-0 flex flex-col bg-zinc-900 text-zinc-400 transition-all duration-300 ease-in-out shrink-0 z-40 shadow-2xl
                    ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
                    ${collapsed ? 'md:w-20' : 'md:w-[280px]'} w-[280px]`}
            >
                {/* Nút đóng — chỉ mobile */}
                <button
                    onClick={() => setMobileOpen(false)}
                    className="md:hidden absolute top-6 right-4 text-zinc-500 hover:text-white transition-colors"
                    aria-label="Đóng menu"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Logo Area - Đã fix lỗi bị che chữ */}
                <div className="h-24 flex items-center justify-center shrink-0 px-6">
                    <Link to="/" className="flex items-center gap-3">
                        {/* Icon "O" như cũ */}
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
                            <p className="text-[9px] font-bold tracking-[0.2em] text-emerald-400 uppercase mb-1">Manager</p>
                            <p className="text-sm text-white font-bold truncate">{user?.username || 'Quản lý'}</p>
                        </div>
                    </div>
                )}

                {/* Nav */}
                <nav className={`flex-1 ${collapsed ? 'md:px-3' : 'md:px-5'} px-5 space-y-2`}>
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.href}
                            onClick={() => setMobileOpen(false)}
                            className={({ isActive }) =>
                                `flex items-center gap-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 ${isActive
                                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20'
                                    : 'hover:bg-zinc-800 hover:text-zinc-100'
                                } ${collapsed ? 'md:justify-center px-5' : 'px-5'}`
                            }
                        >
                            <item.icon className="w-5 h-5 shrink-0" />
                            {(!collapsed || mobileOpen) && <span className={collapsed ? 'md:hidden' : ''}>{item.name}</span>}
                        </NavLink>
                    ))}
                </nav>

                {/* Logout */}
                <div className="p-5">
                    <button
                        onClick={logout}
                        className={`w-full flex items-center gap-4 py-3.5 rounded-2xl text-sm font-bold text-zinc-500 hover:bg-rose-900/20 hover:text-rose-400 transition-all ${collapsed ? 'md:justify-center px-5' : 'px-5'
                            }`}
                    >
                        <LogOut className="w-5 h-5 shrink-0" />
                        <span className={collapsed ? 'md:hidden' : ''}>Đăng xuất</span>
                    </button>
                </div>

                {/* Toggle Button — chỉ desktop */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="hidden md:flex absolute -right-3.5 top-10 bg-white text-zinc-900 w-7 h-7 items-center justify-center rounded-full shadow-lg hover:bg-emerald-500 hover:text-white transition-all z-30"
                >
                    {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
            </aside>

            {/* MAIN CONTENT */}
            <div className="flex-1 flex flex-col min-w-0 bg-white">
                <header className="h-16 md:h-20 border-b border-zinc-100 flex items-center justify-between px-4 md:px-10 gap-3">
                    {/* Hamburger — chỉ mobile */}
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="md:hidden p-2 -ml-2 text-zinc-700 hover:text-emerald-600 transition-colors shrink-0"
                        aria-label="Mở menu"
                    >
                        <Menu className="w-6 h-6" />
                    </button>

                    <div className="relative flex-1 md:w-96 md:flex-none">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm..."
                            className="w-full h-11 pl-11 pr-4 rounded-xl bg-zinc-50 border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        {/* User Info */}
                        <div className="hidden md:flex flex-col items-end">
                            <span className="text-sm font-bold text-zinc-900">
                                {user?.username || 'Manager'}
                            </span>
                            <span className="text-xs text-zinc-500">
                                Quản lý hệ thống
                            </span>
                        </div>

                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center font-bold text-zinc-700 shrink-0">
                            {(user?.username || 'M').charAt(0).toUpperCase()}
                        </div>

                        {/* Logout */}
                        <button
                            onClick={logout}
                            className="flex items-center gap-2 px-3 md:px-4 h-10 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all duration-300 font-semibold shrink-0"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="hidden md:inline">Đăng xuất</span>
                        </button>
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto p-4 md:p-10">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}