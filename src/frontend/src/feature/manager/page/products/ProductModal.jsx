import { useEffect, useRef, useState } from 'react';
import { X, Loader2, Upload } from 'lucide-react';

const EMPTY_FORM = {
  name: '',
  brand: '',
  price: 0,
  category: '',
  // Đã trả về rỗng hoàn toàn, không cần lách luật nữa
  frameType: '',
  gender: '',
  shape: '',
  frameMaterial: '',
  hingeType: '',
  nosePadType: '',
  weightGram: 0,
  status: 'ACTIVE',
  imageUrl: [],
};

export default function ProductModal({
  open,
  onClose,
  onSubmit,
  product,
  isSubmitting = false,
  initialType = 'FRAME', // Nhận từ trang Quản lý để biết đang click nút Thêm Kính hay Thêm Tròng
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (open) {
      if (product) {
        const normalizedImageUrl = Array.isArray(product.imageUrl)
          ? product.imageUrl.map((img) =>
            typeof img === 'string' ? img : (img.imageUrl ?? ''),
          ).filter(Boolean)
          : [];
        setForm({ ...product, price: product.price ?? 0, imageUrl: normalizedImageUrl });
        setImagePreviews(normalizedImageUrl);
        setSelectedFiles([]);
      } else {
        // Tự động gán category dựa trên nút mà Admin bấm
        setForm({ ...EMPTY_FORM, category: initialType === 'LENS' ? 'LENS' : 'FRAME' });
        setImagePreviews([]);
        setSelectedFiles([]);
      }
    }
  }, [open, product, initialType]);

  if (!open) return null;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

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

  // LOGIC FRONTEND VALIDATION CHUẨN MỰC
  const isFormValid = () => {
    // 1. Nếu là Tròng kính (LENS)
    if (form.category === 'LENS') {
      if (!form.name || !form.material || form.price === '' || form.price === null || form.price === undefined) return false;
      return true;
    }

    // 2. Các trường cơ bản bắt buộc cho Gọng kính / Kính mát
    if (!form.name || !form.brand || form.price === '' || form.price === null || form.price === undefined) return false;
    if (!form.frameType || !form.gender) return false;

    return true;
  };

  const inputClass =
    'w-full border border-zinc-200 rounded-2xl px-4 py-3.5 text-sm font-medium text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 bg-zinc-50/50 hover:bg-zinc-50 transition-all';
  const labelClass = 'block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 ml-1';

  return (
    <div
      className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl shadow-zinc-900/20 animate-in zoom-in-95 fade-in duration-300 max-h-[90vh] flex flex-col font-sans overflow-hidden">

        <div className="flex items-center justify-between px-8 py-6 border-b border-zinc-100 bg-white z-10">
          <div>
            <h2 className="text-2xl font-black text-zinc-900 tracking-tight">
              {product ? (form.category === 'LENS' ? 'Cập Nhật Tròng Kính' : 'Cập Nhật Sản Phẩm') : (form.category === 'LENS' ? 'Thêm Tròng Kính Mới' : 'Thêm Kính/Gọng')}
            </h2>
            <p className="text-xs text-zinc-500 mt-1 font-medium">
              {product
                ? 'Sửa đổi các thông số chi tiết bên dưới.'
                : 'Điền đầy đủ thông tin để khởi tạo sản phẩm.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-2xl text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-8 py-8 flex-1 custom-scrollbar">
          <div className="grid grid-cols-2 gap-x-6 gap-y-6">

            {/* CÁC TRƯỜNG CƠ BẢN (LUÔN HIỂN THỊ) */}
            <div className="col-span-2">
              <label className={labelClass}>Tên sản phẩm *</label>
              <input
                name="name"
                placeholder={form.category === 'LENS' ? "Ví dụ: Tròng kính chống ánh sáng xanh" : "Ví dụ: Kính Mát Classic Aviator"}
                value={form.name || ''}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            {form.category === 'LENS' ? (
              <div>
                <label className={labelClass}>Chất liệu tròng *</label>
                <input
                  name="material"
                  placeholder="Ví dụ: Nhựa CR-39, Polycarbonate, Trivex..."
                  value={form.material || ''}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            ) : (
              <div>
                <label className={labelClass}>Thương hiệu *</label>
                <input
                  name="brand"
                  placeholder="Ví dụ: Ray-Ban"
                  value={form.brand || ''}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            )}

            <div>
              <label className={labelClass}>Giá bán (VNĐ) *</label>
              <input
                type="number"
                name="price"
                placeholder="Ví dụ: 350000"
                value={form.price || ''}
                onChange={handleChange}
                className={inputClass}
                min={0}
              />
            </div>

            <div>
              <label className={labelClass}>Danh mục *</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="FRAME">Gọng kính (Frame)</option>
                <option value="SUNGLASSES">Kính râm (Sunglasses)</option>
                <option value="LENS">Tròng kính (Lens)</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Trạng thái hiển thị</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="ACTIVE">Hiển thị trên Store</option>
                <option value="INACTIVE">Tạm ẩn</option>
              </select>
            </div>

            {form.category === 'LENS' && (
              <div className="col-span-2">
                <label className={labelClass}>Mô tả công dụng / đặc điểm</label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Ví dụ: Giảm ánh sáng xanh từ màn hình, bảo vệ mắt khi làm việc máy tính."
                  value={form.description || ''}
                  onChange={handleChange}
                  className={`${inputClass} resize-none`}
                />
              </div>
            )}

            {/* CÁC TRƯỜNG CHỈ HIỂN THỊ KHI KHÔNG PHẢI LÀ TRÒNG KÍNH (LENS) */}
            {form.category !== 'LENS' && (
              <>
                <div className="col-span-2 border-t border-zinc-100 pt-4 mt-2">
                  <h3 className="text-sm font-bold text-zinc-900 mb-4">Thông số gọng kính</h3>
                </div>

                <div>
                  <label className={labelClass}>Loại viền kính *</label>
                  <select name="frameType" value={form.frameType} onChange={handleChange} className={inputClass}>
                    <option value="">-- Chọn viền --</option>
                    <option value="Full-Rim">Nguyên khung (Full-Rim)</option>
                    <option value="Semi-Rimless">Nửa khung (Semi-Rimless)</option>
                    <option value="Rimless">Không khung (Rimless)</option>
                    <option value="Other">Khác</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Giới tính *</label>
                  <select name="gender" value={form.gender} onChange={handleChange} className={inputClass}>
                    <option value="">-- Chọn đối tượng --</option>
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                    <option value="UNISEX">Unisex</option>
                  </select>
                </div>

                <div><label className={labelClass}>Kiểu dáng mắt kính</label><input name="shape" placeholder="Ví dụ: Round, Oval..." value={form.shape} onChange={handleChange} className={inputClass} /></div>
                <div><label className={labelClass}>Chất liệu gọng</label><input name="frameMaterial" placeholder="Ví dụ: Titanium..." value={form.frameMaterial} onChange={handleChange} className={inputClass} /></div>
                <div><label className={labelClass}>Bản lề</label><input name="hingeType" placeholder="Ví dụ: Standard..." value={form.hingeType} onChange={handleChange} className={inputClass} /></div>
                <div><label className={labelClass}>Đệm mũi</label><input name="nosePadType" placeholder="Ví dụ: Adjustable..." value={form.nosePadType} onChange={handleChange} className={inputClass} /></div>
                <div><label className={labelClass}>Trọng lượng (gram)</label><input type="number" name="weightGram" placeholder="Ví dụ: 25" value={form.weightGram || ''} onChange={handleChange} className={inputClass} min={0} /></div>

                {/* UP ẢNH CHO GỌNG KÍNH */}
                <div className="col-span-2 mt-2 border-t border-zinc-100 pt-6">
                  <label className={labelClass}>Hình ảnh đại diện</label>
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
                            <img src={preview} alt={`preview-${index}`} className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} />
                            <button type="button" onClick={() => removeImage(index)} className="absolute inset-0 bg-zinc-950/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"><X className="w-5 h-5 text-white" /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-8 py-6 border-t border-zinc-100 bg-white z-10">
          <button onClick={onClose} disabled={isSubmitting} className="px-6 py-3 border border-zinc-200 rounded-2xl text-sm font-bold text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-all disabled:opacity-50">Hủy bỏ</button>

          {/* NÚT SUBMIT THÔNG MINH */}
          <button
            onClick={() => onSubmit({ productData: form, files: selectedFiles })}
            disabled={isSubmitting || !isFormValid()}
            className="flex items-center justify-center gap-2 px-8 py-3 bg-zinc-900 text-white rounded-2xl text-sm font-bold tracking-wide hover:bg-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-emerald-500/20 active:scale-95"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />} {product ? 'LƯU THAY ĐỔI' : 'TẠO MỚI'}
          </button>
        </div>

      </div>
    </div>
  );
}