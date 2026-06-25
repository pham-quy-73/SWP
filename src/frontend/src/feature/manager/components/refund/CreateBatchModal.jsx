import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAffectedOrders, useCreateBatch, useInActivateVariant } from '../../hooks/useRefunds';
import axios from 'axios';

const fmt = (num) => {
  if (num === null || num === undefined) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
};

const getDisplayImageUrl = (imgObj) => {
  const fallbackImg = 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=800';
  if (!imgObj) return fallbackImg;

  const url = typeof imgObj === 'string' ? imgObj : imgObj.imageUrl;
  if (!url) return fallbackImg;

  if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) return url;

  const apiURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  return `${apiURL}${url}`;
};

export function CreateBatchModal({ onClose }) {
  const [step, setStep] = useState(1);

  // States cho sản phẩm
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');

  // States cho biến thể
  const [variants, setVariants] = useState([]);
  const [isLoadingVariants, setIsLoadingVariants] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState('');

  const [confirmedVariantId, setConfirmedVariantId] = useState('');

  // Hooks Refund
  const { run: inactivate, loading: isActivating } = useInActivateVariant();
  const { run: createBatch, loading: isCreating } = useCreateBatch();
  const { data: affectedItems = [], refetch: refetchAffected } = useAffectedOrders(confirmedVariantId);

  // Fetch sản phẩm (giả lập giống hook cũ thông qua axios)
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoadingProducts(true);
      try {
        const apiURL = import.meta.env.VITE_API_URL || '';
        const token = localStorage.getItem('accessToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await axios.get(`${apiURL}/api/products`, {
          params: { search: searchTerm, limit: 10 },
          headers
        });
        if (res.data?.result?.items) {
          setProducts(res.data.result.items);
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingProducts(false);
      }
    };
    fetchProducts();
  }, [searchTerm]);

  // Fetch biến thể khi chọn sản phẩm
  useEffect(() => {
    const fetchVariants = async () => {
      if (!selectedProductId) return;
      setIsLoadingVariants(true);
      try {
        const apiURL = import.meta.env.VITE_API_URL || '';
        const token = localStorage.getItem('accessToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await axios.get(`${apiURL}/api/products/${selectedProductId}/variants`, { headers });
        if (res.data?.result) {
          setVariants(res.data.result);
        } else {
          setVariants([]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingVariants(false);
      }
    };
    fetchVariants();
  }, [selectedProductId]);

  const handleInActivate = async () => {
    if (!selectedVariantId) return;
    try {
      await inactivate(selectedVariantId);
      setConfirmedVariantId(selectedVariantId);
      setStep(2);
    } catch (error) {
      toast.error(error.message || 'Lỗi vô hiệu hóa');
    }
  };

  const handleCreateBatch = async () => {
    try {
      const orderIds = affectedItems.map((item) => item.order.orderId);
      await createBatch(orderIds);
      toast.success('Đã tạo batch hoàn tiền!');
      setTimeout(() => onClose(), 800);
    } catch (error) {
      toast.error(error.message || 'Lỗi tạo batch');
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center shrink-0">
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Tạo đợt hoàn tiền hàng loạt</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5 overflow-y-auto custom-scrollbar">
          {step === 1 && (
            <div className="space-y-6">
              {/* --- PHẦN 1: CHỌN SẢN PHẨM --- */}
              <section className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                    1. Chọn sản phẩm
                  </label>
                </div>

                <input
                  type="text"
                  placeholder="Tìm tên sản phẩm..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm bg-gray-55 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />

                <div className="space-y-1">
                  {isLoadingProducts ? (
                    <div className="py-4 text-center text-xs text-gray-400 animate-pulse">
                      Đang tìm sản phẩm...
                    </div>
                  ) : (
                    products.map((p) => (
                      <button
                        key={p._id || p.id}
                        onClick={() => {
                          setSelectedProductId(p._id || p.id);
                          setSelectedVariantId('');
                        }}
                        className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all border flex items-center justify-between gap-4 ${
                          selectedProductId === (p._id || p.id)
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-medium shadow-sm'
                            : 'border-transparent hover:bg-gray-50 text-gray-600'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-semibold">{p.name}</p>
                          <p className="text-[10px] opacity-60 font-normal uppercase tracking-tight">
                            {p.brand} • {p.category}
                          </p>
                        </div>

                        <div className="shrink-0 w-12 h-12 rounded-lg overflow-hidden border border-gray-100 bg-white">
                          <img
                            src={getDisplayImageUrl(p.imageUrl && p.imageUrl.length > 0 ? p.imageUrl[0] : null)}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </section>

              {/* --- PHẦN 2: CHỌN BIẾN THỂ --- */}
              {selectedProductId && (
                <section className="space-y-3 pt-4 border-t border-dashed animate-in fade-in slide-in-from-top-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                      2. Chọn màu sắc / Size
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {isLoadingVariants ? (
                      <div className="col-span-2 py-4 text-center text-xs text-gray-400">
                        Đang tải biến thể...
                      </div>
                    ) : variants.length === 0 ? (
                      <div className="col-span-2 py-4 text-center text-xs text-gray-400">
                        Sản phẩm này chưa có biến thể nào
                      </div>
                    ) : (
                      variants.map((v) => (
                        <button
                          key={v._id || v.id}
                          onClick={() => setSelectedVariantId(v._id || v.id)}
                          className={`p-3 rounded-xl border text-xs text-left transition-all ${
                            selectedVariantId === (v._id || v.id)
                              ? 'border-rose-500 bg-rose-50 text-rose-700 ring-1 ring-rose-500'
                              : 'border-gray-100 hover:border-gray-200 bg-white shadow-sm'
                          }`}
                        >
                          <p className="font-bold truncate">{v.color_name || v.colorName || 'Mặc định'}</p>
                          <p className="text-[10px] opacity-60">
                            Size: {v.size_label || v.sizeLabel || 'F'} | Kho: {v.quantity}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                </section>
              )}

              <div className="flex gap-3 pt-6">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 text-sm font-medium text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Đóng
                </button>
                <button
                  disabled={!selectedVariantId || isActivating}
                  onClick={handleInActivate}
                  className="flex-[2] py-3 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl disabled:opacity-40 transition-all shadow-lg shadow-rose-100 flex items-center justify-center gap-2"
                >
                  {isActivating && (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  Vô hiệu hóa & Tiếp tục
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
              <div className="flex justify-between items-center bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                <div>
                  <p className="text-[10px] text-indigo-400 font-bold uppercase">
                    Phát hiện ảnh hưởng
                  </p>
                  <h4 className="text-xl font-black text-indigo-900">
                    {affectedItems.length} <span className="text-sm font-medium">đơn hàng</span>
                  </h4>
                </div>
                <button
                  onClick={() => setStep(1)}
                  className="text-xs font-bold text-indigo-600 hover:underline"
                >
                  Quay lại sửa
                </button>
              </div>

              <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1 custom-scrollbar">
                {affectedItems.length === 0 ? (
                  <p className="text-center text-xs text-gray-400 py-6">Không có đơn hàng nào bị ảnh hưởng</p>
                ) : (
                  affectedItems.map((item, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100"
                    >
                      <span className="font-bold text-gray-700 text-xs">
                        #{item.order.orderId.slice(-8).toUpperCase()}
                      </span>
                      <span className="font-black text-indigo-600 text-xs">
                        {fmt(item.order.paidAmount)}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-4 border-t border-gray-100">
                <button
                  onClick={handleCreateBatch}
                  disabled={isCreating || affectedItems.length === 0}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl disabled:opacity-50 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3"
                >
                  {isCreating ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'XÁC NHẬN TẠO BATCH'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
