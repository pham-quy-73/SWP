import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, PackageX } from 'lucide-react';

const formatPrice = (price) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

export default function ProductCard({ product }) {
  const isOutOfStock = product.stock_quantity === 0;

  return (
    <Link to={`/products/${product._id}`} className="block">
    <motion.div
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
      className="group relative bg-white rounded-[28px] border border-zinc-100 shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden"
    >
      {/* Image — fixed aspect ratio 4/5 */}
      <div className="relative aspect-[4/5] overflow-hidden bg-zinc-100">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />

        {/* Hết hàng badge (EARS-STD-02) */}
        {isOutOfStock && (
          <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 bg-black/70 backdrop-blur-sm rounded-full">
            <PackageX className="w-3 h-3 text-white" />
            <span className="text-[10px] font-bold tracking-widest text-white uppercase">Hết hàng</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-5">
        <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-400 font-bold mb-1">{product.brand}</p>
        <h3 className="font-bold text-zinc-900 text-sm leading-snug line-clamp-2 mb-3">{product.name}</h3>

        <div className="flex items-center justify-between gap-3">
          <span className="text-base font-black text-zinc-900">{formatPrice(product.price)}</span>

          {/* Add to cart — disabled khi hết hàng (EARS-STD-02) */}
          <button
            disabled={isOutOfStock}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold tracking-widest uppercase transition-all duration-300 ${
              isOutOfStock
                ? 'bg-zinc-100 text-zinc-300 cursor-not-allowed'
                : 'bg-zinc-900 text-white hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/20'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            {isOutOfStock ? 'Hết' : 'Mua'}
          </button>
        </div>
      </div>
    </motion.div>
    </Link>
  );
}
