import { motion } from 'framer-motion';
import { Loader2, PackageX, ChevronLeft, ChevronRight } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import ProductCard from './ProductCard';

export default function ProductGrid() {
  const { products = [], loading, error, pagination = { page: 1, totalPages: 1 }, setPage } = useProducts();

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-zinc-400">
        <PackageX className="w-12 h-12 mb-4 opacity-40" />
        <p className="text-sm font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Grid — 1 cột mobile → 2 tablet → 4 desktop */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-zinc-400">
          <PackageX className="w-12 h-12 mb-4 opacity-40" />
          <p className="text-sm font-bold tracking-widest uppercase">Không có sản phẩm</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {products.map((product, i) => (
            <motion.div
              key={product._id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Pagination — đồng bộ với URL query params */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-12">
          <button
            onClick={() => setPage(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="w-10 h-10 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center hover:border-zinc-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4 text-zinc-600" />
          </button>

          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-10 h-10 rounded-2xl text-sm font-bold transition-all duration-200 ${
                p === pagination.page
                  ? 'bg-zinc-900 text-white shadow-lg'
                  : 'bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-400'
              }`}
            >
              {p}
            </button>
          ))}

          <button
            onClick={() => setPage(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className="w-10 h-10 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center hover:border-zinc-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4 text-zinc-600" />
          </button>
        </div>
      )}
    </div>
  );
}
