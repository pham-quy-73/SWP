import { useState, useEffect } from 'react';
import { ShoppingBag, CheckCircle2, Circle } from 'lucide-react';
import { useCartStore } from '../../product/store/useCartStore'; // Sửa lại đường dẫn import store nếu cần
import { toast } from 'sonner';
import axios from 'axios';

// HÀM XỬ LÝ LINK ẢNH
const getDisplayImageUrl = (imgObj) => {
  if (!imgObj) return 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=800';
  const url = typeof imgObj === 'string' ? imgObj : imgObj.imageUrl;
  if (!url) return 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=800';
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${url}`;
};

export default function ProductForm({ product, isLoading, onVariantChange }) {
  const { addToCart } = useCartStore();
  const [variants, setVariants] = useState([]);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [isLoadingVariants, setIsLoadingVariants] = useState(false);

  useEffect(() => {
    const fetchVariants = async () => {
      if (!product) return;
      setIsLoadingVariants(true);
      try {
        const apiURL = import.meta.env.VITE_API_URL || '';
        const res = await axios.get(`${apiURL}/api/products/${product._id || product.id}/variants`);
        
        if (res.data?.result && res.data.result.length > 0) {
          setVariants(res.data.result);
          setSelectedVariantId(res.data.result[0]._id || res.data.result[0].id);
        } else {
          // Fallback mặc định nếu chưa có biến thể
          const defaultVariant = {
            id: product._id || product.id,
            colorName: 'Mặc định',
            sizeLabel: 'Freesize',
            lensWidthMm: 52, bridgeWidthMm: 18, templeLengthMm: 140,
            price: product.discountPrice || product.price,
            orderItemType: 'IN_STOCK'
          };
          setVariants([defaultVariant]);
          setSelectedVariantId(defaultVariant.id);
        }
      } catch (err) {
        console.error('Error fetching product variants:', err);
      } finally {
        setIsLoadingVariants(false);
      }
    };

    fetchVariants();
  }, [product]);

  const selectedVariant = variants.find((v) => (v._id || v.id) === selectedVariantId) || variants[0];

  // BÁO CHO COMPONENT CHA BIẾT MỖI KHI ĐỔI MÀU SẮC
  useEffect(() => {
    if (onVariantChange && selectedVariant) {
      onVariantChange(selectedVariant);
    }
  }, [selectedVariant, onVariantChange]);

  if (isLoading || !product) {
    return (
      <div className="p-10 text-center animate-pulse text-zinc-400 font-bold tracking-widest text-xs uppercase">
        Đang tải thông tin...
      </div>
    );
  }

  const totalPrice = selectedVariant?.price || product.discountPrice || product.price;

  const handleAddToCart = () => {
    if (!selectedVariant) {
      toast.error('Vui lòng chọn phiên bản gọng kính!');
      return;
    }

    // Xác định ảnh cho giỏ hàng
    const displayImageObj = 
      (selectedVariant.imageUrl && selectedVariant.imageUrl.length > 0)
        ? selectedVariant.imageUrl[0]
        : (product.imageUrl && product.imageUrl.length > 0)
          ? product.imageUrl[0]
          : null;
          
    const safeProductImage = getDisplayImageUrl(displayImageObj);

    const cartPayload = {
      productId: selectedVariant._id || selectedVariant.id,
      name: `${product.name} - ${selectedVariant.colorName} (${selectedVariant.sizeLabel || ''})`,
      price: totalPrice,
      image: safeProductImage,
      quantity: 1,
      lensId: null,
      orderType: 'buy-now',
      prescription: null,
    };

    addToCart(cartPayload);
    toast.success('Đã thêm sản phẩm vào giỏ hàng!');
  };

  return (
    <div className="space-y-8">
      {/* 1. CHỌN PHIÊN BẢN (MÀU SẮC) */}
      <div className="space-y-4">
        <h3 className="text-xs font-black text-zinc-900 uppercase tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          Tùy chọn phiên bản
        </h3>
        
        <div className="flex flex-col gap-3">
          {variants.map((v) => {
            const variantId = v._id || v.id;
            const isSelected = selectedVariantId === variantId;
            return (
              <button
                key={variantId}
                type="button"
                onClick={() => setSelectedVariantId(variantId)}
                className={`relative flex items-start gap-4 p-4 w-full text-left rounded-2xl border transition-all duration-300 ${
                  isSelected
                    ? 'border-zinc-900 bg-zinc-50 shadow-md'
                    : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/50'
                }`}
              >
                <div className="mt-0.5 shrink-0 text-zinc-900 transition-transform">
                  {isSelected ? (
                    <CheckCircle2 className="w-5 h-5 fill-zinc-900 text-white animate-in zoom-in" />
                  ) : (
                    <Circle className="w-5 h-5 text-zinc-300" />
                  )}
                </div>

                <div className="flex-1">
                  <p className="font-black text-zinc-900 text-base uppercase tracking-tight">
                    {v.colorName}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {v.sizeLabel && (
                      <span className="text-[10px] font-bold px-2 py-1 bg-white text-zinc-600 rounded-lg border border-zinc-200 uppercase">
                        Size {v.sizeLabel}
                      </span>
                    )}
                    {(v.lensWidthMm > 0) && (
                      <span className="text-[10px] font-bold text-zinc-400 flex items-center gap-1 uppercase tracking-widest">
                        {v.lensWidthMm}-{v.bridgeWidthMm}-{v.templeLengthMm} mm
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right flex flex-col items-end shrink-0 gap-1.5">
                  <p className="font-black text-zinc-900 text-base tracking-tight">
                    {v.price.toLocaleString('vi-VN')} ₫
                  </p>
                  <span className={`px-2 py-1 text-[9px] font-black uppercase tracking-widest rounded border ${
                    v.orderItemType === 'PRE_ORDER' 
                      ? 'text-amber-700 bg-amber-50 border-amber-200' 
                      : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  }`}>
                    {v.orderItemType === 'PRE_ORDER' ? 'Đặt trước' : 'Có sẵn'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* TỔNG CỘNG VÀ NÚT MUA HÀNG */}
      <div className="pt-6 border-t border-zinc-100">
        <div className="flex justify-between items-end mb-6">
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Tổng thanh toán</p>
          <p className="text-3xl font-black text-zinc-900 tracking-tight">
            {totalPrice.toLocaleString('vi-VN')} ₫
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          className="w-full h-14 text-sm font-bold bg-zinc-900 hover:bg-emerald-600 text-white shadow-xl hover:shadow-emerald-500/20 transition-all duration-300 active:scale-95 rounded-2xl flex items-center justify-center gap-3 tracking-widest uppercase"
        >
          <ShoppingBag className="w-5 h-5" />
          Thêm vào giỏ hàng
        </button>
      </div>
    </div>
  );
}