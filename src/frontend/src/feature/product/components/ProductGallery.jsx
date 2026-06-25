import { useState, useEffect } from 'react';
import { Tag, Box, Glasses, Layout, User, Target, Wrench, Scale } from 'lucide-react';

// HÀM XỬ LÝ LINK ẢNH
const getDisplayImageUrl = (imgObj) => {
  if (!imgObj) return null;
  const url = typeof imgObj === 'string' ? imgObj : imgObj.imageUrl;
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${url}`;
};

export default function ProductGallery({ product, isLoading, selectedVariant }) {
  const [selectedImage, setSelectedImage] = useState(null);

  // LOGIC ƯU TIÊN ẢNH: Lấy ảnh của biến thể đang chọn, nếu không có mới lấy ảnh gốc của SP
  useEffect(() => {
    setSelectedImage(null); // Reset lại ảnh chính mỗi khi đổi màu
  }, [selectedVariant]);

  if (isLoading || !product) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="aspect-square bg-zinc-100 rounded-[2rem]" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-square bg-zinc-50 border border-zinc-100 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  let rawImages = [];
  if (selectedVariant && selectedVariant.imageUrl && selectedVariant.imageUrl.length > 0) {
    rawImages = selectedVariant.imageUrl;
  } else if (product.imageUrl && product.imageUrl.length > 0) {
    rawImages = product.imageUrl;
  } else if (product.image) {
    rawImages = [product.image];
  }

  // Phân giải toàn bộ link ảnh trong mảng
  const images = rawImages.map(getDisplayImageUrl).filter(Boolean);
  const fallbackImg = 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=800';
  const activeImage = selectedImage || (images.length > 0 ? images[0] : fallbackImg);

  return (
    <div className="space-y-8 lg:sticky lg:top-24">
      <style>{`
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-product-in {
          animation: slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* --- VÙNG HIỂN THỊ ẢNH CHÍNH --- */}
      <div className="relative bg-zinc-50/50 rounded-[2rem] overflow-hidden aspect-square flex items-center justify-center group border border-zinc-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        <img
          key={activeImage}
          src={activeImage}
          alt={product.name}
          className="w-4/5 object-contain mix-blend-multiply transition-all duration-700 group-hover:scale-110 animate-product-in drop-shadow-xl"
          onError={(e) => {
            e.currentTarget.src = fallbackImg;
            e.currentTarget.onerror = null;
          }}
        />
      </div>

      {/* --- DANH SÁCH ẢNH THUMBNAILS --- */}
      {images.length > 1 && (
        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
          {images.map((imgStr, index) => {
            const isActive = activeImage === imgStr;
            return (
              <div
                key={`${product._id || product.id}-${index}`}
                onClick={() => setSelectedImage(imgStr)}
                className={`flex-shrink-0 w-20 h-20 rounded-2xl bg-white border-2 cursor-pointer flex items-center justify-center transition-all duration-300 overflow-hidden
                  ${isActive
                    ? 'border-zinc-900 shadow-md scale-105'
                    : 'border-zinc-100 opacity-60 hover:opacity-100 hover:border-zinc-300 hover:bg-zinc-50'
                  }`}
              >
                <img
                  src={imgStr}
                  className="w-5/6 object-contain mix-blend-multiply"
                  alt={`Thumb ${index}`}
                  onError={(e) => {
                    e.currentTarget.src = fallbackImg;
                    e.currentTarget.onerror = null;
                  }}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* --- THÔNG SỐ KỸ THUẬT --- */}
      <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-[0_10px_40px_rgba(0,0,0,0.02)] p-6 sm:p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-black text-zinc-900 tracking-tight">Thông số chi tiết</h3>
            <span className="px-3 py-1 bg-zinc-100 text-zinc-600 text-[10px] uppercase font-bold tracking-widest rounded-lg">
              Specs
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Thương hiệu', value: product.brand, icon: Tag },
            { label: 'Chất liệu', value: product.frameMaterial, icon: Box },
            { label: 'Kiểu dáng', value: product.shape, icon: Glasses },
            { label: 'Loại gọng', value: product.frameType, icon: Layout },
            { label: 'Giới tính', value: product.gender, icon: User },
            { label: 'Đệm mũi', value: product.nosePadType, icon: Target },
            { label: 'Bản lề', value: product.hingeType, icon: Wrench },
            {
              label: 'Trọng lượng',
              value: product.weightGram ? `${product.weightGram}g` : null,
              icon: Scale,
            },
          ]
            .filter((item) => item.value)
            .map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="group flex items-center gap-4 p-4 rounded-2xl bg-zinc-50/50 border border-transparent hover:border-zinc-200 hover:bg-white hover:shadow-lg hover:shadow-zinc-900/5 transition-all duration-300"
                >
                  <div className="w-10 h-10 flex shrink-0 items-center justify-center rounded-xl bg-white text-zinc-400 border border-zinc-100 group-hover:text-emerald-600 group-hover:scale-110 group-hover:border-emerald-200 transition-all duration-300">
                    <Icon className="w-4 h-4" strokeWidth={2.5} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 mb-1">
                      {item.label}
                    </span>
                    <span className="text-sm font-black text-zinc-900 capitalize truncate tracking-tight">
                      {item.value?.toString().replace(/_/g, ' ').toLowerCase()}
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}