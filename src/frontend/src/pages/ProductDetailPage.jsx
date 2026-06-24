import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ShoppingBag, PackageX, Loader2 } from 'lucide-react';
import axios from 'axios';

const API_BASE = `${import.meta.env.VITE_API_URL}/api/products`;

const formatPrice = (price) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`${API_BASE}/${id}`);
        setProduct(res.data.data);
      } catch (err) {
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6">
        <p className="text-5xl font-black text-zinc-200">404</p>
        <p className="text-zinc-500 font-medium text-center">Sản phẩm không tồn tại hoặc đã ngừng kinh doanh.</p>
        <Link
          to="/products"
          className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-2xl text-sm font-bold hover:bg-emerald-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  // Trang chi tiết là public → thường chỉ có cờ in_stock; SALE/ADMIN mới có stock_quantity.
  const isOutOfStock = product.in_stock != null ? !product.in_stock : product.stock_quantity === 0;

  return (
    <div className="min-h-screen bg-white pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-6">

        {/* Breadcrumb */}
        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-zinc-900 transition-colors mb-10"
        >
          <ArrowLeft className="w-4 h-4" />
          Tất cả sản phẩm
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">

          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <div className="relative aspect-[4/5] rounded-[32px] overflow-hidden bg-zinc-100 shadow-[0_20px_60px_rgba(0,0,0,0.12)]">
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {isOutOfStock && (
                <div className="absolute top-5 left-5 flex items-center gap-1.5 px-3 py-1.5 bg-black/70 backdrop-blur-sm rounded-full">
                  <PackageX className="w-3 h-3 text-white" />
                  <span className="text-[10px] font-bold tracking-widest text-white uppercase">Hết hàng</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col gap-6 pt-2"
          >
            <div>
              <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-400 font-bold">{product.brand}</span>
              <h1 className="text-3xl font-black text-zinc-900 tracking-tight mt-2 leading-snug">{product.name}</h1>
              <div className="w-10 h-1 bg-emerald-500 rounded-full mt-4" />
            </div>

            <p className="text-4xl font-black text-zinc-900">{formatPrice(product.price)}</p>

            {/* Stock info */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isOutOfStock ? 'bg-red-400' : 'bg-emerald-500'}`} />
              <span className={`text-sm font-semibold ${isOutOfStock ? 'text-red-500' : 'text-emerald-600'}`}>
                {isOutOfStock
                  ? 'Hết hàng'
                  : product.stock_quantity != null
                    ? `Còn hàng (${product.stock_quantity} sản phẩm)`
                    : 'Còn hàng'}
              </span>
            </div>

            {/* Description */}
            {product.description && (
              <div className="border-t border-zinc-100 pt-6">
                <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-400 font-bold mb-3">Mô tả sản phẩm</p>
                <p className="text-zinc-600 text-sm leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Add to cart */}
            <div className="border-t border-zinc-100 pt-6">
              <button
                disabled={isOutOfStock}
                className={`w-full flex items-center justify-center gap-3 h-14 rounded-2xl font-bold text-sm tracking-widest uppercase transition-all duration-300 ${
                  isOutOfStock
                    ? 'bg-zinc-100 text-zinc-300 cursor-not-allowed'
                    : 'bg-zinc-900 text-white hover:bg-emerald-600 hover:shadow-xl hover:shadow-emerald-500/20 hover:-translate-y-0.5'
                }`}
              >
                <ShoppingBag className="w-5 h-5" />
                {isOutOfStock ? 'Sản phẩm tạm hết' : 'Thêm vào giỏ hàng'}
              </button>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
