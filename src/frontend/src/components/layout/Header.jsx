import { useState, useEffect, useRef, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Search, User, ChevronDown, LayoutDashboard, LogOut } from 'lucide-react';
import { AuthContext } from '../../contexts/AuthContext';

export default function Header() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    const { user, logout } = useContext(AuthContext);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Đóng dropdown khi click bên ngoài
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${isScrolled ? 'bg-white/80 backdrop-blur-md py-4 shadow-sm' : 'bg-transparent py-6'}`}>
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center group-hover:bg-emerald-600 transition-colors duration-300">
                        <span className="text-white font-bold text-xs">O</span>
                    </div>
                    <span className="text-xl font-black tracking-tighter text-zinc-900">OPTICSTORE</span>
                </Link>

                {/* Menu giữa */}
                <div className="hidden md:flex items-center gap-8">
                    {[{ label: 'Cửa hàng', to: '/products' }, { label: 'Bộ sưu tập', to: '/products' }, { label: 'Về chúng tôi', to: '/' }].map((item) => (
                        <Link key={item.label} to={item.to} className="text-sm font-bold uppercase tracking-widest text-zinc-600 hover:text-zinc-900 transition-colors">
                            {item.label}
                        </Link>
                    ))}
                </div>

                {/* Icons & Auth */}
                <div className="flex items-center gap-5">
                    {/* Search */}
                    <div className="group relative flex items-center">
                        <div className="relative">
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none z-10" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm sản phẩm..."
                                className="w-[240px] h-11 pl-12 pr-5 rounded-full border border-zinc-200 bg-white text-sm text-zinc-700 placeholder:text-zinc-400 shadow-sm outline-none transition-all duration-300 focus:w-[280px] focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 focus:shadow-lg"
                            />
                        </div>
                    </div>

                    {/* Auth section */}
                    <div className="flex items-center gap-2 border-l border-zinc-200 pl-5">
                        {user ? (
                            /* Đã đăng nhập → dropdown */
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setShowDropdown((v) => !v)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-200 bg-white hover:border-zinc-400 transition-all text-sm font-bold text-zinc-900"
                                >
                                    <div className="w-6 h-6 rounded-full bg-zinc-900 flex items-center justify-center flex-shrink-0">
                                        {user.avatar_url
                                            ? <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover rounded-full" />
                                            : <User className="w-3.5 h-3.5 text-white" />
                                        }
                                    </div>
                                    <span className="max-w-[100px] truncate">{user.first_name} {user.last_name}</span>
                                    <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
                                </button>

                                {showDropdown && (
                                    <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-zinc-100 py-2 z-50">
                                        <div className="px-4 py-3 border-b border-zinc-50">
                                            <p className="text-xs font-black text-zinc-900 truncate">{user.first_name} {user.last_name}</p>
                                            <p className="text-[11px] text-zinc-400 mt-0.5 truncate">@{user.username}</p>
                                        </div>

                                        <Link
                                            to="/profile"
                                            onClick={() => setShowDropdown(false)}
                                            className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
                                        >
                                            <User className="w-4 h-4 text-zinc-400" />
                                            Tài khoản của tôi
                                        </Link>

                                        {user.role === 'ADMIN' && (
                                            <Link
                                                to="/admin/products"
                                                onClick={() => setShowDropdown(false)}
                                                className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
                                            >
                                                <LayoutDashboard className="w-4 h-4 text-zinc-400" />
                                                Quản trị sản phẩm
                                            </Link>
                                        )}

                                        <div className="border-t border-zinc-50 mt-1 pt-1">
                                            <button
                                                onClick={() => { setShowDropdown(false); logout(); }}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                Đăng xuất
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Chưa đăng nhập → Login / Register */
                            <>
                                <Link to="/login" className="text-xs font-bold uppercase tracking-wider text-zinc-900 hover:text-emerald-600 transition-colors">
                                    Đăng nhập
                                </Link>
                                <Link to="/register" className="bg-zinc-900 text-white px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-emerald-600 transition-all shadow-lg hover:shadow-emerald-500/20 active:scale-95">
                                    Đăng ký
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
