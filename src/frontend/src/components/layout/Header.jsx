import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Search, User, Menu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "../../feature/product/store/useCartStore";
import { AuthContext } from "../../contexts/AuthContext";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { items, openCart } = useCartStore();
  const { user, logout } = useContext(AuthContext);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        isScrolled
          ? "bg-white/80 backdrop-blur-md py-4 shadow-sm"
          : "bg-transparent py-6"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center group-hover:bg-emerald-600 transition-colors duration-300">
            <span className="text-white font-bold text-xs">O</span>
          </div>
          <span className="text-xl font-black tracking-tighter text-zinc-900">
            OPTICSTORE
          </span>
        </Link>

        {/* Menu giữa */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            to="/products"
            className="text-sm font-bold uppercase tracking-widest text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            Cửa hàng
          </Link>
          {/* <a href="#" className="text-sm font-bold uppercase tracking-widest text-zinc-600 hover:text-zinc-900 transition-colors">
                        Bộ sưu tập
                    </a>
                    <a href="#" className="text-sm font-bold uppercase tracking-widest text-zinc-600 hover:text-zinc-900 transition-colors">
                        Về chúng tôi
                    </a> */}
          {user && user.role && user.role.toUpperCase() === "ADMIN" && (
            <Link
              to="/admin"
              className="text-sm font-bold uppercase tracking-widest text-red-650 hover:text-red-800 transition-colors"
            >
              Admin
            </Link>
          )}
          {user &&
            user.role &&
            (user.role.toUpperCase() === "MANAGER" ||
              user.role.toUpperCase() === "ADMIN") && (
              <Link
                to="/manager"
                className="text-sm font-bold uppercase tracking-widest text-indigo-600 hover:text-indigo-850 transition-colors"
              >
                Quản lý
              </Link>
            )}
        </div>

        {/* Icons & Auth */}
        <div className="flex items-center gap-5">
          <div className="group relative flex items-center">
            <div className="relative">
              {" "}
              {/* ICON */}{" "}
              <Search
                size={18}
                className=" absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none z-10 "
              />{" "}
              {/* INPUT */}{" "}
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                className=" w-[260px] h-11 pl-12 pr-5 rounded-full border border-zinc-200 bg-white text-sm text-zinc-700 placeholder:text-zinc-400 shadow-sm outline-none transition-all duration-300 focus:w-[300px] focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 focus:shadow-lg "
              />{" "}
            </div>
          </div>

          {/* Cart Indicator Icon */}
          <button
            type="button"
            onClick={openCart}
            className="relative p-2 text-zinc-750 hover:text-emerald-600 transition-colors duration-250 shrink-0"
          >
            <ShoppingBag size={20} />
            {items.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-emerald-600 text-white text-[9px] min-w-[17px] h-[17px] flex items-center justify-center rounded-full font-bold px-0.5 shadow-sm border border-white">
                {items.reduce((acc, item) => acc + item.quantity, 0)}
              </span>
            )}
          </button>

          {user ? (
            <div className="flex items-center gap-4 border-l border-zinc-200 pl-5">
              <Link
                to="/profile"
                className="flex items-center gap-1.5 hover:text-emerald-600 transition-colors"
              >
                <User size={18} className="text-zinc-700" />
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-900">
                  {user.firstName || user.username}
                </span>
              </Link>
              <button
                onClick={logout}
                className="text-xs font-bold uppercase tracking-wider text-rose-600 hover:text-rose-800 transition-colors cursor-pointer"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 border-l border-zinc-200 pl-5">
              <Link
                to="/login"
                className="text-xs font-bold uppercase tracking-wider text-zinc-900 hover:text-emerald-600 transition-colors"
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="bg-zinc-900 text-white px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-emerald-600 transition-all shadow-lg hover:shadow-emerald-500/20 active:scale-95"
              >
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
