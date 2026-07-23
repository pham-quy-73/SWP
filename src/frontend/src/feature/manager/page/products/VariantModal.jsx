import { useEffect, useRef, useState } from 'react';
import { X, Loader2, Upload } from 'lucide-react';

const EMPTY_FORM = {
  sku: '', 
  colorName: '',
  frameFinish: '',
  lensWidthMm: 0,
  bridgeWidthMm: 0,
  templeLengthMm: 0,
  sizeLabel: '',
  price: 0,
  discountPrice: '', 
  quantity: 0,
  status: 'ACTIVE',
  orderItemType: 'IN_STOCK',
  imageUrl: [],
};

export default function VariantModal({ open, onClose, onSubmit, variant, isSubmitting = false }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (open) {
      if (variant) {
        const normalizedImageUrl = Array.isArray(variant.imageUrl)
          ? variant.imageUrl.map((img) => (typeof img === 'string' ? img : (img.imageUrl ?? ''))).filter(Boolean)
          : [];
        setForm({
          sku: variant.sku ?? '',
          colorName: variant.colorName ?? '',
          frameFinish: variant.frameFinish ?? '',
          lensWidthMm: variant.lensWidthMm ?? 0,
          bridgeWidthMm: variant.bridgeWidthMm ?? 0,
          templeLengthMm: variant.templeLengthMm ?? 0,
          sizeLabel: variant.sizeLabel ?? '',
          price: variant.price ?? 0,
          discountPrice: variant.discountPrice ?? '',
          quantity: variant.quantity ?? 0,
          status: variant.status ?? 'ACTIVE',
          orderItemType: variant.orderItemType ?? 'IN_STOCK',
          imageUrl: normalizedImageUrl,
        });
        setImagePreviews(normalizedImageUrl);
      } else {
        setForm(EMPTY_FORM);
        setImagePreviews([]);
      }
      setSelectedFiles([]);
    }
  }, [open, variant]);

  if (!open) return null;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setSelectedFiles((prev) => [...prev, ...files]);
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeImage = (indexToRemove) => {
    const existingImageCount = form.imageUrl.length;
    if (indexToRemove < existingImageCount) {
      setForm((prev) => ({
        ...prev,
        imageUrl: prev.imageUrl.filter((_, i) => i !== indexToRemove),
      }));
    } else {
      const fileIndex = indexToRemove - existingImageCount;
      setSelectedFiles((prev) => prev.filter((_, i) => i !== fileIndex));
    }
    setImagePreviews((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  const inputClass =
    'w-full border border-zinc-200 rounded-2xl px-4 py-3.5 text-sm font-medium text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 bg-zinc-50/50 hover:bg-zinc-50 transition-all';
  const labelClass = 'block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 ml-1';

  return (
    <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl shadow-zinc-900/20 animate-in zoom-in-95 fade-in duration-300 max-h-[90vh] flex flex-col font-sans overflow-hidden">

        {/* HEADER */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-zinc-100 bg-white z-10">
          <div>
            <h2 className="text-2xl font-black text-zinc-900 tracking-tight">
              {variant ? 'Cập Nhật Phiên Bản' : 'Thêm Phiên Bản Mới'}
            </h2>
            <p className="text-xs text-zinc-500 mt-1 font-medium">
              {variant ? 'Sửa đổi cấu hình chi tiết cho biến thể này.' : 'Thiết lập màu sắc, kích thước và mã kho cho cấu hình mới.'}
            </p>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-2xl text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY */}
        <div className="overflow-y-auto px-8 py-8 flex-1 custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">

            {/* Hàng 1: Mã SKU & Tên màu */}
            <div className="col-span-2 sm:col-span-1">
              <label className={labelClass}>Mã kho (SKU)</label>
              <input name="sku" placeholder="Ví dụ: RB-BLK-M-01" value={form.sku} onChange={handleChange} className={inputClass} />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className={labelClass}>Tên màu sắc *</label>
              <input name="colorName" placeholder="Ví dụ: Đen nhám, Vàng hồng..." value={form.colorName} onChange={handleChange} className={inputClass} />
            </div>

            {/* Hàng 2: Giá cả */}
            <div>
              <label className={labelClass}>Giá bán gốc (VNĐ) *</label>
              <input type="number" name="price" placeholder="Ví dụ: 4700000" value={form.price !== undefined ? form.price : ''} onChange={handleChange} className={inputClass} min={0} />
            </div>
            <div>
              <label className={labelClass}>Giá khuyến mãi (VNĐ)</label>
              <input type="number" name="discountPrice" placeholder="Để trống nếu không Sale" value={form.discountPrice !== undefined ? form.discountPrice : ''} onChange={handleChange} className={inputClass} min={0} />
            </div>

            {/* Các trường còn lại */}
            <div>
              <label className={labelClass}>Số lượng tồn kho *</label>
              {/* Đã fix lỗi không cho phép nhập hoặc hiển thị số 0 */}
              <input type="number" name="quantity" placeholder="Ví dụ: 50" value={form.quantity !== undefined ? form.quantity : ''} onChange={handleChange} className={inputClass} min={0} />
            </div>
            <div>
              <label className={labelClass}>Nhãn kích thước</label>
              <input name="sizeLabel" placeholder="Ví dụ: M, L..." value={form.sizeLabel} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Kiểu hoàn thiện</label>
              <input name="frameFinish" placeholder="Ví dụ: Bóng, Nhám..." value={form.frameFinish} onChange={handleChange} className={inputClass} />
            </div>

            {/* Thông số kính */}
            <div className="col-span-2 mt-2 border-t border-zinc-100 pt-6">
              <h3 className="text-sm font-bold text-zinc-900 mb-4">Thông số kỹ thuật</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Tròng (mm)</label>
                  <input type="number" name="lensWidthMm" value={form.lensWidthMm !== undefined ? form.lensWidthMm : ''} onChange={handleChange} className={inputClass} min={0} />
                </div>
                <div>
                  <label className={labelClass}>Cầu mắt (mm)</label>
                  <input type="number" name="bridgeWidthMm" value={form.bridgeWidthMm !== undefined ? form.bridgeWidthMm : ''} onChange={handleChange} className={inputClass} min={0} />
                </div>
                <div>
                  <label className={labelClass}>Càng kính (mm)</label>
                  <input type="number" name="templeLengthMm" value={form.templeLengthMm !== undefined ? form.templeLengthMm : ''} onChange={handleChange} className={inputClass} min={0} />
                </div>
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className={labelClass}>Loại kho hàng</label>
              <select name="orderItemType" value={form.orderItemType} onChange={handleChange} className={inputClass}>
                <option value="IN_STOCK">Có sẵn (In Stock)</option>
                <option value="PRE_ORDER">Đặt trước (Pre Order)</option>
              </select>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className={labelClass}>Trạng thái hiển thị</label>
              <select name="status" value={form.status} onChange={handleChange} className={inputClass}>
                <option value="ACTIVE">Hiển thị trên Cửa hàng</option>
                <option value="INACTIVE">Tạm ẩn</option>
              </select>
            </div>

            {/* UP ẢNH */}
            <div className="col-span-2 mt-2">
              <label className={labelClass}>Hình ảnh Biến thể (Màu này)</label>
              <div className="flex flex-col gap-4">
                <div onClick={() => fileInputRef.current?.click()} className="flex-1 flex flex-col items-center justify-center gap-2 px-4 py-8 border-2 border-dashed border-zinc-200 rounded-[2rem] bg-zinc-50/50 hover:border-emerald-400 hover:bg-emerald-50/30 cursor-pointer transition-all group">
                  <Upload className="w-6 h-6 text-zinc-400 group-hover:text-emerald-500 shrink-0 transition-colors mb-1" />
                  <span className="text-sm font-bold text-zinc-600 group-hover:text-emerald-600 transition-colors">Click để tải ảnh lên</span>
                  <span className="text-xs text-zinc-400">Hỗ trợ JPG, PNG (Max 5MB)</span>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
                </div>
                {imagePreviews.length > 0 && (
                  <div className="flex gap-4 flex-wrap mt-2">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative w-20 h-20 rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden shrink-0 group">
                        <img src={preview.startsWith('http') ? preview : (import.meta.env.VITE_API_URL || 'http://localhost:5000') + preview} alt={`preview-${index}`} className="w-full h-full object-cover" />
                        <button type="button" onClick={() => removeImage(index)} className="absolute inset-0 bg-zinc-950/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"><X className="w-5 h-5 text-white" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-end gap-3 px-8 py-6 border-t border-zinc-100 bg-white z-10">
          <button onClick={onClose} disabled={isSubmitting} className="px-6 py-3 border border-zinc-200 rounded-2xl text-sm font-bold text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-all disabled:opacity-50">Hủy bỏ</button>
          <button onClick={() => onSubmit({ variantData: form, files: selectedFiles })} disabled={isSubmitting || !form.colorName} className="flex items-center justify-center gap-2 px-8 py-3 bg-zinc-900 text-white rounded-2xl text-sm font-bold tracking-wide hover:bg-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-emerald-500/20 active:scale-95">
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />} {variant ? 'LƯU THAY ĐỔI' : 'TẠO PHIÊN BẢN'}
          </button>
        </div>
      </div>
    </div>
  );
}