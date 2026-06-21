import { motion } from 'framer-motion';
import ProductGrid from '../feature/products/components/ProductGrid';

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 py-16">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-400 font-bold">Bộ sưu tập</span>
          <h1 className="text-5xl font-black text-zinc-900 tracking-tight mt-2 mb-4">
            Tất Cả Sản Phẩm
          </h1>
          <div className="w-12 h-1 bg-emerald-500 rounded-full"></div>
        </motion.div>

        {/* Grid + Pagination */}
        <ProductGrid />
      </div>
    </div>
  );
}
