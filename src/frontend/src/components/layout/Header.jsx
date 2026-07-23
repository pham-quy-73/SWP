import { useState, useEffect, useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShoppingBag, Search, User, Menu, X, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "../../feature/product/store/useCartStore";
import { AuthContext } from "../../contexts/AuthContext";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { items, openCart } = useCartStore();
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();

  const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0);

  const isManager =
    user?.role && ["MANAGER", "ADMIN"].includes(user.role.toUpperCase());
  const isAdmin = user?.role && user.role.toUpperCase() === "ADMIN";

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Đóng drawer khi đổi route
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <>
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-500 ${
          isScrolled
            ? "bg-white/80 backdrop-blur-md py-3 md:py-4 shadow-sm"
            : "bg-transparent py-4 md:py-6"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center">
          {/* Hamburger button — chỉ mobile */}
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-2 -ml-2 text-zinc-700 hover:text-emerald-600 transition-colors"
            aria-label="Mở menu"
          >
            <Menu size={22} />
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group md:mr-0 mx-auto md:mx-0">
            <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center group-hover:bg-emerald-600 transition-colors duration-300">
              <span className="text-white font-bold text-xs">O</span>
            </div>
            <span className="text-lg md:text-xl font-black tracking-tighter text-zinc-900">
              OPTICSTORE
            </span>
          </Link>

          {/* Menu giữa — chỉ desktop */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              to="/products"
              className="ml-8 text-sm font-bold uppercase tracking-widest text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              Cửa hàng
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                className="text-sm font-bold uppercase tracking-widest text-red-650 hover:text-red-800 transition-colors"
              >
                Admin
              </Link>
            )}
            {isManager && (
              <Link
                to="/manager"
                className="text-sm font-bold uppercase tracking-widest text-indigo-600 hover:text-indigo-850 transition-colors"
              >
                Quản lý
              </Link>
            )}
          </div>

          {/* Icons & Auth */}
          <div className="ml-auto flex items-center gap-3 md:gap-5">
            {/* Search — chỉ desktop */}
            <div className="hidden md:block group relative">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none z-10"
                />
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  className="w-[260px] h-11 pl-12 pr-5 rounded-full border border-zinc-200 bg-white text-sm text-zinc-700 placeholder:text-zinc-400 shadow-sm outline-none transition-all duration-300 focus:w-[300px] focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 focus:shadow-lg"
                />
              </div>
            </div>

            {/* Cart — giữ cả mobile & desktop */}
            <button
              type="button"
              onClick={openCart}
              className="relative p-2 text-zinc-750 hover:text-emerald-600 transition-colors duration-250 shrink-0"
            >
              <ShoppingBag size={20} />
              {totalQuantity > 0 && (
                <span
                  aria-label={`${totalQuantity} sản phẩm trong giỏ hàng`}
                  className="absolute -top-0.5 -right-0.5 bg-emerald-600 text-white text-[9px] min-w-[17px] h-[17px] flex items-center justify-center rounded-full font-bold px-0.5 shadow-sm border border-white"
                >
                  {totalQuantity}
                </span>
              )}
            </button>

            {/* Auth block — chỉ desktop */}
            {user ? (
              <div className="hidden md:flex items-center gap-4 border-l border-zinc-200 pl-5">
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
              <div className="hidden md:flex items-center gap-2 border-l border-zinc-200 pl-5">
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

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/50 z-[60] md:hidden"
            />

            {/* Drawer Panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-0 left-0 h-full w-[280px] bg-white z-[70] shadow-2xl md:hidden flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-zinc-100">
                <Link
                  to="/"
                  className="flex items-center gap-2"
                  onClick={() => setMobileOpen(false)}
                >
                  <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xs">O</span>
                  </div>
                  <span className="text-lg font-black tracking-tighter text-zinc-900">
                    OPTICSTORE
                  </span>
                </Link>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 text-zinc-500 hover:text-zinc-900 transition-colors"
                  aria-label="Đóng menu"
                >
                  <X size={20} />
                </button>
              </div>

              {/* User Info nếu đã đăng nhập */}
              {user && (
                <div className="p-6 bg-zinc-50 border-b border-zinc-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold">
                      {(user.firstName || user.username || "U")
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-zinc-900">
                        {user.firstName || user.username}
                      </span>
                      <span className="text-xs text-zinc-500">{user.email}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Nav Links */}
              <nav className="flex-1 overflow-y-auto p-4">
                <div className="space-y-1">
                  <Link
                    to="/"
                    className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-zinc-700 hover:bg-zinc-50 hover:text-emerald-600 rounded-xl transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    Trang chủ
                  </Link>
                  <Link
                    to="/products"
                    className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-zinc-700 hover:bg-zinc-50 hover:text-emerald-600 rounded-xl transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    Cửa hàng
                  </Link>
                  {user && (
                    <Link
                      to="/profile"
                      className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-zinc-700 hover:bg-zinc-50 hover:text-emerald-600 rounded-xl transition-colors"
                      onClick={() => setMobileOpen(false)}
                    >
                      <User size={18} />
                      Tài khoản
                    </Link>
                  )}
                  {isManager && (
                    <Link
                      to="/manager"
                      className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                      onClick={() => setMobileOpen(false)}
                    >
                      Quản lý
                    </Link>
                  )}
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      onClick={() => setMobileOpen(false)}
                    >
                      Admin
                    </Link>
                  )}
                </div>
              </nav>

              {/* Footer: Auth actions */}
              <div className="p-4 border-t border-zinc-100">
                {user ? (
                  <button
                    onClick={() => {
                      logout();
                      setMobileOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-sm font-bold transition-colors"
                  >
                    <LogOut size={18} />
                    Đăng xuất
                  </button>
                ) : (
                  <div className="space-y-2">
                    <Link
                      to="/login"
                      onClick={() => setMobileOpen(false)}
                      className="block w-full text-center px-4 py-3 border-2 border-zinc-900 text-zinc-900 hover:bg-zinc-900 hover:text-white rounded-xl text-sm font-bold transition-all"
                    >
                      Đăng nhập
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileOpen(false)}
                      className="block w-full text-center px-4 py-3 bg-zinc-900 text-white hover:bg-emerald-600 rounded-xl text-sm font-bold transition-all"
                    >
                      Đăng ký
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
