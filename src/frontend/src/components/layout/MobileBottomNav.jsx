import { useContext } from "react";
import { NavLink } from "react-router-dom";
import { Home, Store, ShoppingBag, User } from "lucide-react";
import { useCartStore } from "../../feature/product/store/useCartStore";
import { AuthContext } from "../../contexts/AuthContext";

/**
 * Thanh điều hướng dưới đáy — CHỈ hiển thị trên mobile (<768px).
 * Không thay đổi logic; tái dùng cart store & auth context có sẵn.
 */
export default function MobileBottomNav() {
  const { items, openCart } = useCartStore();
  const { user } = useContext(AuthContext);

  const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0);

  const linkClass = ({ isActive }) =>
    `flex flex-col items-center justify-center gap-1 flex-1 h-full text-[10px] font-bold uppercase tracking-wider transition-colors ${
      isActive ? "text-emerald-600" : "text-zinc-500"
    }`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 backdrop-blur-md border-t border-zinc-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      <div className="flex items-center h-16 pb-[env(safe-area-inset-bottom)]">
        <NavLink to="/" end className={linkClass}>
          <Home size={20} />
          <span>Trang chủ</span>
        </NavLink>

        <NavLink to="/products" className={linkClass}>
          <Store size={20} />
          <span>Cửa hàng</span>
        </NavLink>

        <button
          type="button"
          onClick={openCart}
          className="flex flex-col items-center justify-center gap-1 flex-1 h-full text-[10px] font-bold uppercase tracking-wider text-zinc-500"
        >
          <span className="relative">
            <ShoppingBag size={20} />
            {totalQuantity > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-emerald-600 text-white text-[9px] min-w-[16px] h-[16px] flex items-center justify-center rounded-full font-bold px-0.5 border border-white">
                {totalQuantity}
              </span>
            )}
          </span>
          <span>Giỏ hàng</span>
        </button>

        <NavLink to={user ? "/profile" : "/login"} className={linkClass}>
          <User size={20} />
          <span>{user ? "Tài khoản" : "Đăng nhập"}</span>
        </NavLink>
      </div>
    </nav>
  );
}
