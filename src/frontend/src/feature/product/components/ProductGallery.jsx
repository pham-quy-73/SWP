import { useState } from 'react';
import { Tag, Box, Glasses, Layout, User, Target, Wrench, Scale } from 'lucide-react';

export default function ProductGallery({ product, isLoading }) {
  const [selectedImage, setSelectedImage] = useState(null);

  if (isLoading || !product) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="aspect-square bg-gray-200 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-square bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // 1. Khai báo mảng ảnh an toàn
  let images = [];
  if (Array.isArray(product.imageUrl)) {
    // Trường hợp mảng đối tượng [{ imageUrl: "..." }]
    images = product.imageUrl.map((imgObj) => imgObj.imageUrl).filter(Boolean);
  } else if (typeof product.image === 'string') {
    // Trường hợp thuộc tính image là string đơn lẻ
    images = [product.image];
  } else if (typeof product.imageUrl === 'string') {
    images = [product.imageUrl];
  }

  const fallbackImg =
    'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=800';

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
      <div className="relative bg-gradient-to-b from-[#F8FAFB] to-[#F1F4F6] rounded-3xl overflow-hidden aspect-square flex items-center justify-center group border border-white shadow-inner">
        <img
          key={activeImage}
          src={activeImage}
          alt={product.name}
          className="w-4/5 object-contain mix-blend-multiply transition-all duration-700 group-hover:scale-110 animate-product-in"
          onError={(e) => {
            e.currentTarget.src = fallbackImg;
            e.currentTarget.onerror = null;
          }}
        />
      </div>

      {/* --- DANH SÁCH ẢNH THUMBNAILS --- */}
      {images.length > 1 && (
        <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
          {images.map((imgStr, index) => {
            const isActive = activeImage === imgStr;
            return (
              <div
                key={`${product._id || product.id}-${index}`}
                onClick={() => setSelectedImage(imgStr)}
                className={`flex-shrink-0 w-20 h-20 rounded-2xl bg-white border-2 cursor-pointer flex items-center justify-center transition-all duration-300 overflow-hidden
                  ${
                    isActive
                      ? 'border-[#4A8795] shadow-lg scale-105'
                      : 'border-transparent opacity-60 hover:opacity-100 hover:border-gray-200'
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
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-black text-gray-900 tracking-tight">Thông số chi tiết</h3>
            <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-[10px] uppercase font-bold tracking-widest rounded-full">
              Specs
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
                  className="group flex items-center gap-4 p-4 rounded-2xl bg-[#F8FAFB] border border-transparent hover:border-[#4A8795]/20 hover:bg-white hover:shadow-[0_4px_20px_rgb(0,0,0,0.03)] transition-all duration-300"
                >
                  <div className="w-10 h-10 flex shrink-0 items-center justify-center rounded-full bg-white text-gray-400 shadow-sm group-hover:text-[#4A8795] group-hover:scale-110 transition-all duration-300">
                    <Icon className="w-4 h-4" strokeWidth={2.5} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-400 mb-0.5">
                      {item.label}
                    </span>
                    <span className="text-sm font-bold text-gray-900 capitalize truncate">
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
