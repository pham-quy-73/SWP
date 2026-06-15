import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Search, User, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Header() {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

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
                        <div className="relative"> {/* ICON */} <Search size={18} className=" absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none z-10 " /> {/* INPUT */} <input type="text" placeholder="Tìm kiếm sản phẩm..." className=" w-[260px] h-11 pl-12 pr-5 rounded-full border border-zinc-200 bg-white text-sm text-zinc-700 placeholder:text-zinc-400 shadow-sm outline-none transition-all duration-300 focus:w-[300px] focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 focus:shadow-lg " /> </div>
                    </div>

                    <div className="flex items-center gap-2 border-l border-zinc-200 pl-5">
                        <Link to="/login" className="text-xs font-bold uppercase tracking-wider text-zinc-900 hover:text-emerald-600 transition-colors">
                            Đăng nhập
                        </Link>
                        <Link to="/register" className="bg-zinc-900 text-white px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-emerald-600 transition-all shadow-lg hover:shadow-emerald-500/20 active:scale-95">
                            Đăng ký
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}