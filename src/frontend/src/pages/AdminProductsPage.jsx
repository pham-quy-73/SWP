import { useState, useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Loader2 } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import { useProducts } from '../feature/products/hooks/useProducts';
import ProductFormModal from '../feature/admin/ProductFormModal';
import ProductAdminTable from '../feature/admin/ProductAdminTable';

export default function AdminProductsPage() {
  const { user } = useContext(AuthContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const { products, loading, error, pagination, createProduct, updateProduct, removeProduct, setPage } = useProducts();

  const handleEdit = (product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  // TODO: bật lại sau khi test xong
  // if (user?.role !== 'ADMIN') return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-7xl mx-auto px-6 py-12">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-10"
        >
          <div>
            <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-400 font-bold">Admin Dashboard</span>
            <h1 className="text-4xl font-black text-zinc-900 tracking-tight mt-2">Quản Lý Sản Phẩm</h1>
            <div className="w-12 h-1 bg-emerald-500 rounded-full mt-3"></div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-zinc-900 hover:bg-emerald-600 text-white font-bold text-sm px-6 py-3 rounded-2xl transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            THÊM SẢN PHẨM
          </button>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Tổng sản phẩm', value: pagination.total },
            { label: 'Trang hiện tại', value: `${pagination.page} / ${pagination.totalPages}` },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl border border-zinc-100 px-6 py-4 shadow-sm">
              <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-400 font-bold">{stat.label}</p>
              <p className="text-2xl font-black text-zinc-900 mt-1">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100">
            <p className="text-sm text-red-600 font-medium text-center">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
          </div>
        ) : (
          <ProductAdminTable products={products} onDelete={removeProduct} onEdit={handleEdit} loading={loading} />
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
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
          </div>
        )}
      </div>

      <ProductFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onCreate={createProduct}
        onUpdate={updateProduct}
        editingProduct={editingProduct}
      />
    </div>
  );
}
