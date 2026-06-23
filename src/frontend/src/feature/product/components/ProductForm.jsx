import { useState, useEffect } from 'react';
import { ShoppingBag, CheckCircle2, Circle } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { toast } from 'sonner';
import axios from 'axios';

export default function ProductForm({ product, isLoading }) {
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
          // Fallback về thiết lập mặc định
          const defaultVariant = {
            id: product._id || product.id,
            colorName: 'Mô hình mặc định',
            sizeLabel: 'M',
            lensWidthMm: 52,
            bridgeWidthMm: 18,
            templeLengthMm: 140,
            price: product.discountPrice && product.discountPrice < product.price ? product.discountPrice : product.price,
            orderItemType: 'IN_STOCK'
          };
          setVariants([defaultVariant]);
          setSelectedVariantId(defaultVariant.id);
        }
      } catch (err) {
        console.error('Error fetching product variants:', err);
        const defaultVariant = {
          id: product._id || product.id,
          colorName: 'Mô hình mặc định',
          sizeLabel: 'M',
          lensWidthMm: 52,
          bridgeWidthMm: 18,
          templeLengthMm: 140,
          price: product.discountPrice && product.discountPrice < product.price ? product.discountPrice : product.price,
          orderItemType: 'IN_STOCK'
        };
        setVariants([defaultVariant]);
        setSelectedVariantId(defaultVariant.id);
      } finally {
        setIsLoadingVariants(false);
      }
    };

    fetchVariants();
  }, [product]);

  if (isLoading || !product) {
    return (
      <div className="p-10 text-center animate-pulse text-gray-400">
        Đang tải thông tin...
      </div>
    );
  }

  const selectedVariant = variants.find((v) => (v._id || v.id) === selectedVariantId) || variants[0];
  const totalPrice = selectedVariant?.price || product.price;


  const handleAddToCart = () => {
    if (!product) return;

    if (!selectedVariant) {
      toast.error('Vui lòng chọn phiên bản gọng kính!');
      return;
    }

    // Xác định ảnh cart
    let safeProductImage = 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=800';
    if (Array.isArray(product.imageUrl) && product.imageUrl.length > 0) {
      safeProductImage = product.imageUrl[0].imageUrl;
    } else if (typeof product.image === 'string') {
      safeProductImage = product.image;
    } else if (typeof product.imageUrl === 'string') {
      safeProductImage = product.imageUrl;
    }

    const cartPayload = {
      productId: selectedVariant._id || selectedVariant.id,
      name: `${product.name} - ${selectedVariant.colorName || 'Mặc định'} (${selectedVariant.sizeLabel || ''})`,
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
    <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100 space-y-8 mt-8">
      {/* 1. CHỌN PHIÊN BẢN */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-[#4A8795] uppercase tracking-wider">
          1. Chọn phiên bản gọng
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
                className={`relative flex items-start gap-4 p-4 w-full text-left rounded-xl border-2 transition-all duration-200 ${
                  isSelected
                    ? 'border-[#4A8795] bg-teal-50/20 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="mt-0.5 shrink-0 text-[#4A8795]">
                  {isSelected ? (
                    <CheckCircle2 className="w-5 h-5 fill-[#4A8795] text-white" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-300" />
                  )}
                </div>

                <div className="flex-1">
                  <p className="font-bold text-gray-900 text-base uppercase tracking-wide">
                    {v.colorName}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="text-xs font-semibold px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md border border-gray-200">
                      Size {v.sizeLabel}
                    </span>
                    <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                      {v.lensWidthMm}-{v.bridgeWidthMm}-{v.templeLengthMm} mm
                    </span>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end shrink-0 gap-1.5">
                  <p className="font-bold text-[#4A8795] text-base">
                    {v.price.toLocaleString('vi-VN')} ₫
                  </p>
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-green-700 bg-green-100 rounded-sm border border-green-200">
                    {v.orderItemType === 'PRE_ORDER' ? 'Đặt trước' : 'Có sẵn'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* TỔNG CỘNG VÀ NÚT MUA HÀNG */}
      <div className="mt-8 pt-6 border-t-2 border-dashed border-gray-200">
        <div className="flex justify-between items-end mb-4">
          <div>
            <p className="text-sm text-gray-500 font-medium">Tổng thanh toán</p>
          </div>
          <p className="text-2xl font-black text-[#1e2575]">
            {totalPrice.toLocaleString('vi-VN')} ₫
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          className="w-full h-14 text-lg font-bold bg-[#1e2575] hover:bg-[#151b54] text-white shadow-lg transition-all active:scale-[0.98] rounded-xl flex items-center justify-center gap-2"
        >
          <ShoppingBag className="w-5 h-5" />
          Thêm vào giỏ hàng
        </button>
      </div>
    </div>
  );
}
