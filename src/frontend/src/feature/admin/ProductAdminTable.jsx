import { motion } from 'framer-motion';
import { Trash2, Pencil, PackageX } from 'lucide-react';

const formatPrice = (price) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

export default function ProductAdminTable({ products, onDelete, onEdit, loading }) {
  if (!loading && products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-zinc-400">
        <PackageX className="w-12 h-12 mb-4 opacity-40" />
        <p className="text-sm font-bold tracking-widest uppercase">Chưa có sản phẩm nào</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-[24px] border border-zinc-100 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-100 bg-zinc-50">
            <th className="text-left px-6 py-4 text-[10px] uppercase tracking-[0.25em] text-zinc-400 font-bold">Ảnh</th>
            <th className="text-left px-6 py-4 text-[10px] uppercase tracking-[0.25em] text-zinc-400 font-bold">Tên sản phẩm</th>
            <th className="text-left px-6 py-4 text-[10px] uppercase tracking-[0.25em] text-zinc-400 font-bold">Thương hiệu</th>
            <th className="text-right px-6 py-4 text-[10px] uppercase tracking-[0.25em] text-zinc-400 font-bold">Giá</th>
            <th className="text-right px-6 py-4 text-[10px] uppercase tracking-[0.25em] text-zinc-400 font-bold">Tồn kho</th>
            <th className="px-6 py-4"></th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-zinc-50">
          {products.map((product, i) => (
            <motion.tr
              key={product._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="group hover:bg-zinc-50/80 transition-colors"
            >
              <td className="px-6 py-4">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-100 flex-shrink-0">
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="font-semibold text-zinc-900 line-clamp-1">{product.name}</span>
              </td>
              <td className="px-6 py-4">
                <span className="text-zinc-500">{product.brand}</span>
              </td>
              <td className="px-6 py-4 text-right">
                <span className="font-bold text-zinc-900">{formatPrice(product.price)}</span>
              </td>
              <td className="px-6 py-4 text-right">
                {product.stock_quantity === 0 ? (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-red-50 text-red-500 text-[10px] font-bold tracking-widest uppercase">
                    Hết hàng
                  </span>
                ) : (
                  <span className="font-medium text-zinc-700">{product.stock_quantity}</span>
                )}
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onEdit(product)}
                    className="w-9 h-9 rounded-xl bg-zinc-100 hover:bg-emerald-500 flex items-center justify-center transition-all duration-200 group/edit"
                  >
                    <Pencil className="w-4 h-4 text-zinc-400 group-hover/edit:text-white transition-colors" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Xóa sản phẩm "${product.name}"?`)) onDelete(product._id);
                    }}
                    className="w-9 h-9 rounded-xl bg-zinc-100 hover:bg-red-500 flex items-center justify-center transition-all duration-200 group/btn"
                  >
                    <Trash2 className="w-4 h-4 text-zinc-400 group-hover/btn:text-white transition-colors" />
                  </button>
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
