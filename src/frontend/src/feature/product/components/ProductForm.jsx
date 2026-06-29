import { useState, useEffect } from 'react';
import { ShoppingBag, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { useCartStore } from '../../product/store/useCartStore'; // Đảm bảo đường dẫn import chính xác
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

  const [lenses, setLenses] = useState([]);
  const [selectedLensId, setSelectedLensId] = useState('none');
  const [isLoadingLenses, setIsLoadingLenses] = useState(false);

  // Fetch Biến thể của Gọng
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
          const defaultVariant = {
            id: product._id || product.id,
            colorName: 'Mặc định',
            sizeLabel: 'Freesize',
            lensWidthMm: 52, bridgeWidthMm: 18, templeLengthMm: 140,
            price: product.discountPrice || product.price,
            orderItemType: 'IN_STOCK',
            quantity: 0 // Mặc định hết hàng nếu không có biến thể thực
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

  // Fetch danh sách Tròng kính
  useEffect(() => {
    const fetchLenses = async () => {
      if (!product || product.category === 'LENS') return;

      setIsLoadingLenses(true);
      try {
        const apiURL = import.meta.env.VITE_API_URL || '';
        const res = await axios.get(`${apiURL}/api/products`, {
          params: { category: 'LENS', limit: 100 }
        });

        if (res.data?.result?.items) {
          setLenses(res.data.result.items);
        }
      } catch (err) {
        console.error('Error fetching lenses:', err);
      } finally {
        setIsLoadingLenses(false);
      }
    };

    fetchLenses();
  }, [product]);

  const selectedVariant = variants.find((v) => (v._id || v.id) === selectedVariantId) || variants[0];
  const selectedLens = selectedLensId !== 'none' ? lenses.find(l => (l._id || l.id) === selectedLensId) : null;

  // KIỂM TRA TỒN KHO
  const isOutOfStock = selectedVariant ? selectedVariant.quantity <= 0 : true;

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

  const basePrice = selectedVariant?.price || product.discountPrice || product.price;
  const lensPrice = selectedLens ? (selectedLens.discountPrice || selectedLens.price) : 0;
  const totalPrice = basePrice + lensPrice;

  const handleAddToCart = () => {
    if (!selectedVariant) {
      toast.error('Vui lòng chọn phiên bản gọng kính!');
      return;
    }

    // NÂNG CẤP: Chặn Logic Frontend không cho thêm nếu hết hàng
    if (isOutOfStock) {
      toast.error('Rất tiếc, phiên bản bạn chọn đã hết hàng!');
      return;
    }

    const displayImageObj =
      (selectedVariant.imageUrl && selectedVariant.imageUrl.length > 0)
        ? selectedVariant.imageUrl[0]
        : (product.imageUrl && product.imageUrl.length > 0)
          ? product.imageUrl[0]
          : null;

    const safeProductImage = getDisplayImageUrl(displayImageObj);

    const cartPayload = {
      productId: product._id || product.id,
      variantId: selectedVariant._id || selectedVariant.id, // Đã bổ sung Variant ID
      name: `${product.name} - ${selectedVariant.colorName}`,
      price: basePrice,
      image: safeProductImage,
      quantity: 1,
      orderType: 'buy-now',
      lensId: selectedLens ? (selectedLens._id || selectedLens.id) : null,
      lensName: selectedLens ? selectedLens.name : null,
      lensPrice: lensPrice,
      prescription: null,
    };

    addToCart(cartPayload);
    toast.success('Đã thêm sản phẩm vào giỏ hàng!');
  };

  return (
    <div className="space-y-10">
      {/* 1. CHỌN PHIÊN BẢN */}
      <div className="space-y-4">
        <h3 className="text-xs font-black text-zinc-900 uppercase tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          1. Lựa chọn phiên bản
        </h3>

        <div className="flex flex-col gap-3">
          {variants.map((v) => {
            const variantId = v._id || v.id;
            const isSelected = selectedVariantId === variantId;
            const hasStock = v.quantity > 0; // Biến kiểm tra tồn kho

            return (
              <button
                key={variantId}
                type="button"
                onClick={() => setSelectedVariantId(variantId)}
                className={`relative flex items-start gap-4 p-4 w-full text-left rounded-2xl border transition-all duration-300 ${isSelected
                    ? 'border-zinc-900 bg-zinc-50 shadow-md'
                    : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/50'
                  } ${!hasStock ? 'opacity-60 grayscale-[50%]' : ''}`} // Làm mờ nếu hết hàng
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

                  {/* NÂNG CẤP: Hiển thị trạng thái Tồn kho */}
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider ${hasStock
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        : 'bg-rose-50 text-rose-600 border border-rose-100'
                      }`}>
                      {hasStock ? `Còn ${v.quantity} SP` : 'Hết hàng'}
                    </span>

                    {v.sizeLabel && (
                      <span className="text-[10px] font-bold px-2 py-1 bg-white text-zinc-600 rounded-lg border border-zinc-200 uppercase">
                        Size {v.sizeLabel}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right flex flex-col items-end shrink-0 gap-1.5">
                  <p className="font-black text-zinc-900 text-base tracking-tight">
                    {v.price.toLocaleString('vi-VN')} ₫
                  </p>
                  <span className={`px-2 py-1 text-[9px] font-black uppercase tracking-widest rounded border ${v.orderItemType === 'PRE_ORDER'
                      ? 'text-amber-700 bg-amber-50 border-amber-200'
                      : 'text-zinc-500 bg-zinc-50 border-zinc-200'
                    }`}>
                    {v.orderItemType === 'PRE_ORDER' ? 'Đặt trước' : 'Có sẵn'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. CHỌN TRÒNG KÍNH */}
      {(product.category === 'FRAME' || product.category === 'SUNGLASSES') && lenses.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-zinc-100">
          <h3 className="text-xs font-black text-zinc-900 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            2. Lựa chọn Thấu kính
          </h3>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => setSelectedLensId('none')}
              className={`relative flex items-start gap-4 p-4 w-full text-left rounded-2xl border transition-all duration-300 ${selectedLensId === 'none'
                  ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                  : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/50'
                }`}
            >
              <div className="mt-0.5 shrink-0 text-emerald-600">
                {selectedLensId === 'none' ? (
                  <CheckCircle2 className="w-5 h-5 fill-emerald-500 text-white animate-in zoom-in" />
                ) : (
                  <Circle className="w-5 h-5 text-zinc-300" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-bold text-zinc-900 text-sm">Chỉ mua gọng (không kèm tròng)</p>
                <p className="text-xs text-zinc-500 mt-1">Sử dụng tròng nhựa mẫu mặc định của nhà sản xuất.</p>
              </div>
            </button>

            {lenses.map((lens) => {
              const lensId = lens._id || lens.id;
              const isSelected = selectedLensId === lensId;
              const currentLensPrice = lens.discountPrice || lens.price;

              return (
                <button
                  key={lensId}
                  type="button"
                  onClick={() => setSelectedLensId(lensId)}
                  className={`relative flex items-start gap-4 p-4 w-full text-left rounded-2xl border transition-all duration-300 ${isSelected
                      ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                      : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/50'
                    }`}
                >
                  <div className="mt-0.5 shrink-0 text-emerald-600">
                    {isSelected ? (
                      <CheckCircle2 className="w-5 h-5 fill-emerald-500 text-white animate-in zoom-in" />
                    ) : (
                      <Circle className="w-5 h-5 text-zinc-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-zinc-900 text-sm">{lens.name}</p>
                    {lens.brand && <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-1">{lens.brand}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-zinc-900 text-sm">
                      +{currentLensPrice.toLocaleString('vi-VN')}đ
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. TỔNG CỘNG VÀ NÚT MUA HÀNG */}
      <div className="pt-6 border-t border-zinc-100">
        <div className="flex flex-col gap-2 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Giá sản phẩm:</span>
            <span className="font-bold text-zinc-900">{basePrice.toLocaleString('vi-VN')} ₫</span>
          </div>
          {selectedLens && (
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500 text-emerald-600">Phụ phí tròng:</span>
              <span className="font-bold text-emerald-600">+{lensPrice.toLocaleString('vi-VN')} ₫</span>
            </div>
          )}
          <div className="h-px bg-zinc-100 my-2"></div>
          <div className="flex justify-between items-end">
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Tổng thanh toán</p>
            <p className="text-3xl font-black text-zinc-900 tracking-tight">
              {totalPrice.toLocaleString('vi-VN')} ₫
            </p>
          </div>
        </div>

        {/* NÂNG CẤP: Khóa nút nếu hết hàng */}
        <button
          type="button"
          disabled={isOutOfStock}
          onClick={handleAddToCart}
          className={`w-full h-14 text-sm font-bold shadow-xl transition-all duration-300 rounded-2xl flex items-center justify-center gap-3 tracking-widest uppercase ${isOutOfStock
              ? 'bg-zinc-200 text-zinc-500 cursor-not-allowed'
              : 'bg-zinc-900 hover:bg-emerald-600 text-white hover:shadow-emerald-500/20 active:scale-95'
            }`}
        >
          {isOutOfStock ? (
            <>
              <AlertCircle className="w-5 h-5" /> Sản phẩm tạm hết hàng
            </>
          ) : (
            <>
              <ShoppingBag className="w-5 h-5" /> Thêm vào giỏ hàng
            </>
          )}
        </button>
      </div>
    </div>
  );
}