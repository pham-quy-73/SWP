import { useEffect, useRef, useState } from 'react';
import { X, Loader2, Upload } from 'lucide-react';

const EMPTY_FORM = {
  name: '',
  brand: '',
  category: '',
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
        setForm({ ...product, imageUrl: normalizedImageUrl });
        setImagePreviews(normalizedImageUrl);
        setSelectedFiles([]);
      } else {
        setForm(EMPTY_FORM);
        setImagePreviews([]);
        setSelectedFiles([]);
      }
    }
  }, [open, product]);

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
    if (indexToRemove >= (imagePreviews.length - selectedFiles.length)) {
      const fileIndex = indexToRemove - (imagePreviews.length - selectedFiles.length);
      setSelectedFiles((prev) => prev.filter((_, i) => i !== fileIndex));
    }
    setImagePreviews((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  const inputClass =
    'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50 transition-all';
  const labelClass = 'block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide';

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl shadow-slate-900/20 animate-in zoom-in-95 fade-in duration-200 max-h-[90vh] flex flex-col font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {product ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {product
                ? 'Cập nhật các thông tin chi tiết của sản phẩm dưới đây.'
                : 'Điền các trường thông tin để tạo mới sản phẩm.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-7 py-6 flex-1">
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <div className="col-span-2">
              <label className={labelClass}>Tên sản phẩm *</label>
              <input
                name="name"
                placeholder="Ví dụ: Kính Mát Classic Aviator"
                value={form.name}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Thương hiệu *</label>
              <input
                name="brand"
                placeholder="Ví dụ: Ray-Ban"
                value={form.brand}
                onChange={handleChange}
                className={inputClass}
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
                <option value="">Chọn danh mục</option>
                <option value="FRAME">Gọng kính (Frame)</option>
                <option value="SUNGLASSES">Kính râm (Sunglasses)</option>
                <option value="ACCESSORIES">Phụ kiện (Accessories)</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Loại viền kính *</label>
              <select
                name="frameType"
                value={form.frameType}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Chọn viền kính</option>
                <option value="Full-Rim">Nguyên khung (Full-Rim)</option>
                <option value="Semi-Rimless">Nửa khung (Semi-Rimless)</option>
                <option value="Rimless">Không khung (Rimless)</option>
                <option value="Other">Khác (Other)</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Giới tính *</label>
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Chọn giới tính phù hợp</option>
                <option value="MALE">Nam</option>
                <option value="FEMALE">Nữ</option>
                <option value="UNISEX">Unisex</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Kiểu dáng mắt kính</label>
              <input
                name="shape"
                placeholder="Ví dụ: Round, Oval, Rectangular"
                value={form.shape}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Chất liệu gọng</label>
              <input
                name="frameMaterial"
                placeholder="Ví dụ: Titanium, Acetate"
                value={form.frameMaterial}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Bản lề</label>
              <input
                name="hingeType"
                placeholder="Ví dụ: Standard, Spring"
                value={form.hingeType}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Đệm mũi</label>
              <input
                name="nosePadType"
                placeholder="Ví dụ: Adjustable, Fixed"
                value={form.nosePadType}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Trọng lượng (gram)</label>
              <input
                type="number"
                name="weightGram"
                placeholder="e.g. 25"
                value={form.weightGram || ''}
                onChange={handleChange}
                className={inputClass}
                min={0}
              />
            </div>

            <div>
              <label className={labelClass}>Trạng thái</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="ACTIVE">Hoạt động (Active)</option>
                <option value="INACTIVE">Ẩn (Inactive)</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className={labelClass}>Hình ảnh sản phẩm</label>
              <div className="flex flex-col gap-3">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-3 px-4 py-6 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 hover:border-indigo-400 hover:bg-indigo-50/30 cursor-pointer transition-all group"
                >
                  <Upload className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 shrink-0 transition-colors" />
                  <span className="text-sm text-slate-500 group-hover:text-indigo-600 transition-colors">
                    Click để tải lên nhiều hình ảnh
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>

                {imagePreviews.length > 0 && (
                  <div className="flex gap-3 flex-wrap mt-2">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative w-16 h-16 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden shrink-0 group">
                        <img
                          src={preview}
                          alt={`preview-${index}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-7 py-5 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-150 transition-all disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={() => onSubmit({ productData: form, files: selectedFiles })}
            disabled={isSubmitting || !form.name || !form.brand}
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-slate-900/20"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {product ? 'Lưu thay đổi' : 'Tạo mới'}
          </button>
        </div>
      </div>
    </div>
  );
}
