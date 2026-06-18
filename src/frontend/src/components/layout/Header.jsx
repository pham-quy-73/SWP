import { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Search, User, Menu, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../../contexts/AuthContext'; 

export default function Header() {
    const [isScrolled, setIsScrolled] = useState(false);
    
    // Gọi Context và Hook điều hướng
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Xử lý đăng xuất
    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${isScrolled ? 'bg-white/80 backdrop-blur-md py-4 shadow-sm' : 'bg-transparent py-6'
            }`}>
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center group-hover:bg-emerald-600 transition-colors duration-300">
                        <span className="text-white font-bold text-xs">O</span>
                    </div>
                    <span className="text-xl font-black tracking-tighter text-zinc-900">OPTICSTORE</span>
                </Link>

                {/* Menu giữa - Chỉ để demo giao diện */}
                <div className="hidden md:flex items-center gap-8">
                    {['Cửa hàng', 'Bộ sưu tập', 'Về chúng tôi'].map((item) => (
                        <a key={item} href="#" className="text-sm font-bold uppercase tracking-widest text-zinc-600 hover:text-zinc-900 transition-colors">
                            {item}
                        </a>
                    ))}
                </div>

                {/* Icons & Auth */}
                <div className="flex items-center gap-5">
                    <div className="group relative flex items-center">
                        <div className="relative">
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none z-10" />
                            <input type="text" placeholder="Tìm kiếm sản phẩm..." className="w-[260px] h-11 pl-12 pr-5 rounded-full border border-zinc-200 bg-white text-sm text-zinc-700 placeholder:text-zinc-400 shadow-sm outline-none transition-all duration-300 focus:w-[300px] focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 focus:shadow-lg" />
                        </div>
                    </div>

                    {/* LOGIC HIỂN THỊ TÙY TRẠNG THÁI */}
                    {user ? (
                        <div className="flex items-center gap-4 border-l border-zinc-200 pl-5">
                            <Link to="/profile" className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-900 hover:text-emerald-600 transition-colors">
                                <User className="w-4 h-4" />
                                {user.first_name} {user.last_name}
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-100 text-zinc-500 hover:bg-red-50 hover:text-red-500 transition-all"
                                title="Đăng xuất"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 border-l border-zinc-200 pl-5">
                            <Link to="/login" className="text-xs font-bold uppercase tracking-wider text-zinc-900 hover:text-emerald-600 transition-colors">
                                Đăng nhập
                            </Link>
                            <Link to="/register" className="bg-zinc-900 text-white px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-emerald-600 transition-all shadow-lg hover:shadow-emerald-500/20 active:scale-95">
                                Đăng ký
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}