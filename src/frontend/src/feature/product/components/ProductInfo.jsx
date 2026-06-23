import { Loader2 } from 'lucide-react';

export default function ProductInfo({ product, isLoading, isError }) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <Loader2 className="w-8 h-8 animate-spin text-[#4A8795]" />
        <p className="text-sm text-gray-500 mt-2">Đang tải thông tin sản phẩm...</p>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
        Không thể tải thông tin sản phẩm. Vui lòng thử lại sau.
      </div>
    );
  }

  // Xác định giá gốc và giá bán
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  const currentPrice = hasDiscount ? product.discountPrice : product.price;
  const originalPrice = product.price;

  return (
    <div className="space-y-6">
      {/* Category & Title */}
      <div>
        <div className="flex gap-2 mb-3">
          <span className="inline-flex items-center justify-center rounded-md border border-transparent bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs font-semibold px-2.5 py-0.5 uppercase">
            {product.category || 'Mắt Kính'}
          </span>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-2">{product.name}</h1>
        <p className="text-gray-500 italic">
          {product.brand} — {product.frameMaterial || 'Chất liệu cao cấp'} và {product.shape || 'Kiểu dáng thời trang'}
        </p>
      </div>

      {/* Price */}
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold text-[#4A8795]">
          {(currentPrice ?? 0).toLocaleString('vi-VN')}₫
        </span>
        {hasDiscount && (
          <span className="text-lg text-gray-400 line-through decoration-gray-300">
            {(originalPrice ?? 0).toLocaleString('vi-VN')}₫
          </span>
        )}
      </div>

      {/* Description */}
      {product.description && (
        <div className="text-sm text-gray-600 leading-relaxed bg-[#F8FAFB] p-4 rounded-xl border border-gray-100">
          <p className="font-semibold text-gray-800 mb-1">Mô tả sản phẩm:</p>
          {product.description}
        </div>
      )}
    </div>
  );
}
