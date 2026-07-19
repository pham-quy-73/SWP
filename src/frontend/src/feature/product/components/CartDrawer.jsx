import { useContext, useEffect } from 'react';
import { X, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { useNavigate } from 'react-router-dom';
import { CartItemRow } from './CartItemRow';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../../../contexts/AuthContext';

export const CartDrawer = () => {
  const { items, isOpen, closeCart, removeFromCart, updateQuantity, getCartTotal } = useCartStore();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const totalAmount = getCartTotal();
  // Đồng nhất với badge trên Header: đếm tổng quantity, không đếm số dòng
  const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0);

  // Khóa cuộn trang nền (body scroll lock) khi mở Cart Drawer
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* BACKGROUND BLUR OVERLAY */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-black z-[100] pointer-events-auto cursor-pointer"
          />

          {/* DRAWER CONTAINER */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.35, ease: 'easeInOut' }}
            className="fixed right-0 top-0 bottom-0 w-full sm:max-w-md bg-[#F4F4F5] z-[105] shadow-2xl flex flex-col pointer-events-auto"
          >
            {/* HEADER */}
            <div className="flex items-center justify-between p-5 border-b bg-white shrink-0 z-10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <ShoppingBag className="w-6 h-6 text-zinc-900" />
                  <span
                    aria-label={`${totalQuantity} sản phẩm trong giỏ hàng`}
                    className="absolute -top-2 -right-2 bg-zinc-900 text-white text-[10px] min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full font-black border-2 border-white shadow-sm"
                  >
                    {totalQuantity}
                  </span>
                </div>
                <h3 className="text-xl font-black uppercase tracking-tighter text-zinc-900">
                  Giỏ hàng
                </h3>
              </div>
              <button
                type="button"
                onClick={closeCart}
                className="p-2 rounded-full hover:bg-zinc-100 transition-transform active:scale-90 text-zinc-500 hover:text-zinc-950"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* BODY LIST */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {items.length === 0 ? (
                <div className="h-[75vh] flex flex-col items-center justify-center text-center p-10 bg-white rounded-3xl m-2 border border-zinc-100">
                  <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mb-4">
                    <ShoppingBag className="w-10 h-10 text-zinc-200" />
                  </div>
                  <h4 className="text-lg font-black text-zinc-900 tracking-tight mb-2 uppercase">
                    Giỏ hàng trống
                  </h4>
                  <p className="text-sm text-zinc-500 mb-6">Có vẻ như bạn chưa thêm sản phẩm nào.</p>
                  <button
                    type="button"
                    onClick={() => {
                      closeCart();
                      navigate('/products');
                    }}
                    className="bg-zinc-900 text-white hover:bg-zinc-800 rounded-xl px-8 py-3 font-bold transition-all active:scale-95 text-sm"
                  >
                    Mua sắm ngay
                  </button>
                </div>
              ) : (
                items.map((item) => (
                  <CartItemRow
                    key={item.id}
                    item={item}
                    updateQuantity={updateQuantity}
                    removeFromCart={removeFromCart}
                  />
                ))
              )}
            </div>

            {/* FOOTER */}
            {items.length > 0 && (
              <div className="p-5 border-t bg-white shrink-0 space-y-4 shadow-[0_-15px_30px_-15px_rgba(0,0,0,0.05)] z-10 rounded-t-3xl">
                <div className="space-y-1.5 px-1">
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-sm font-black text-zinc-900 uppercase tracking-tighter">
                      Thành tiền
                    </span>
                    <span className="text-2xl font-black text-zinc-900 tracking-tighter">
                      {totalAmount.toLocaleString()}₫
                    </span>
                  </div>
                 </div>

                <button
                  type="button"
                  onClick={() => {
                    closeCart();
                    if (user) {
                      navigate('/checkout');
                    } else {
                      navigate('/login', { state: { from: { pathname: '/checkout' } } });
                    }
                  }}
                  className="w-full h-14 bg-zinc-900 hover:bg-black text-white font-black rounded-2xl shadow-xl shadow-zinc-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3 group tracking-widest text-[13px]"
                >
                  TIẾN HÀNH THANH TOÁN
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
