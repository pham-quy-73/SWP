import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Loader2, ImageIcon, Pencil } from 'lucide-react';

const INITIAL_FORM = { name: '', brand: '', price: '', stock_quantity: '', description: '' };

export default function ProductFormModal({ isOpen, onClose, onCreate, onUpdate, editingProduct }) {
  const isEditMode = !!editingProduct;

  const [form, setForm] = useState(INITIAL_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  // Sync form state khi mở modal edit
  useEffect(() => {
    if (isOpen && isEditMode) {
      setForm({
        name: editingProduct.name || '',
        brand: editingProduct.brand || '',
        price: String(editingProduct.price ?? ''),
        stock_quantity: String(editingProduct.stock_quantity ?? ''),
        description: editingProduct.description || '',
      });
      setImagePreview(editingProduct.image_url || null);
      setImageFile(null);
      setErrors({});
    } else if (isOpen && !isEditMode) {
      setForm(INITIAL_FORM);
      setImageFile(null);
      setImagePreview(null);
      setErrors({});
    }
  }, [isOpen, editingProduct]);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Tên sản phẩm không được để trống';
    if (!form.brand.trim()) errs.brand = 'Thương hiệu không được để trống';
    if (form.price === '') errs.price = 'Vui lòng nhập giá';
    else if (Number(form.price) < 0) errs.price = 'Giá không được âm';
    if (form.stock_quantity === '') errs.stock_quantity = 'Vui lòng nhập số lượng';
    else if (!Number.isInteger(Number(form.stock_quantity)) || Number(form.stock_quantity) < 0)
      errs.stock_quantity = 'Số lượng phải là số nguyên ≥ 0';
    // Ảnh chỉ bắt buộc khi tạo mới
    if (!isEditMode && !imageFile) errs.image = 'Vui lòng chọn ảnh sản phẩm';
    return errs;
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setErrors((prev) => ({ ...prev, image: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== '') formData.append(k, v); });
      if (imageFile) formData.append('image', imageFile);

      if (isEditMode) {
        await onUpdate(editingProduct._id, formData);
      } else {
        await onCreate(formData);
      }
      handleClose();
    } catch (err) {
      setErrors({ root: err.response?.data?.message || 'Có lỗi xảy ra' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setForm(INITIAL_FORM);
    setImageFile(null);
    setImagePreview(null);
    setErrors({});
    onClose();
  };

  const inputClass = (field) =>
    `w-full h-12 px-4 rounded-2xl bg-zinc-50 border-2 text-sm font-medium transition-all duration-200 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-zinc-900/5 ${
      errors[field] ? 'border-red-300 focus:border-red-400' : 'border-transparent focus:border-zinc-200 hover:bg-zinc-100'
    }`;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-[32px] shadow-[0_30px_80px_rgba(0,0,0,0.18)] w-full max-w-xl max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-8 pb-0">
              <div>
                <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-400 font-bold">Admin</span>
                <h2 className="text-2xl font-black text-zinc-900 tracking-tight mt-1">
                  {isEditMode ? 'Sửa Sản Phẩm' : 'Thêm Sản Phẩm'}
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="w-10 h-10 rounded-2xl bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-zinc-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              {/* Image Upload */}
              <div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full aspect-[16/7] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all duration-200 overflow-hidden ${
                    errors.image ? 'border-red-300 bg-red-50' : 'border-zinc-200 bg-zinc-50 hover:border-zinc-400 hover:bg-zinc-100'
                  }`}
                >
                  {imagePreview ? (
                    <div className="relative w-full h-full group">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs font-bold tracking-widest uppercase">Đổi ảnh</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-zinc-400">
                      <ImageIcon className="w-8 h-8" />
                      <span className="text-xs font-bold tracking-widest uppercase">Chọn ảnh sản phẩm</span>
                      <span className="text-[10px]">JPG, PNG, WebP · Tối đa 5MB</span>
                    </div>
                  )}
                </button>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} className="hidden" />
                {isEditMode && !imageFile && (
                  <p className="mt-1.5 text-[11px] text-zinc-400 font-medium pl-1">Bỏ qua nếu không muốn đổi ảnh</p>
                )}
                {errors.image && <p className="mt-1.5 text-[11px] text-red-500 font-medium pl-1">{errors.image}</p>}
              </div>

              {/* Name + Brand */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input name="name" value={form.name} onChange={handleChange} placeholder="Tên sản phẩm" className={inputClass('name')} />
                  {errors.name && <p className="mt-1 text-[11px] text-red-500 font-medium pl-1">{errors.name}</p>}
                </div>
                <div>
                  <input name="brand" value={form.brand} onChange={handleChange} placeholder="Thương hiệu" className={inputClass('brand')} />
                  {errors.brand && <p className="mt-1 text-[11px] text-red-500 font-medium pl-1">{errors.brand}</p>}
                </div>
              </div>

              {/* Price + Stock */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input name="price" type="number" min="0" value={form.price} onChange={handleChange} placeholder="Giá (VNĐ)" className={inputClass('price')} />
                  {errors.price && <p className="mt-1 text-[11px] text-red-500 font-medium pl-1">{errors.price}</p>}
                </div>
                <div>
                  <input name="stock_quantity" type="number" min="0" step="1" value={form.stock_quantity} onChange={handleChange} placeholder="Số lượng" className={inputClass('stock_quantity')} />
                  {errors.stock_quantity && <p className="mt-1 text-[11px] text-red-500 font-medium pl-1">{errors.stock_quantity}</p>}
                </div>
              </div>

              {/* Description */}
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Mô tả sản phẩm (tuỳ chọn)"
                rows={3}
                className="w-full px-4 py-3 rounded-2xl bg-zinc-50 border-2 border-transparent text-sm font-medium resize-none transition-all duration-200 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-200 focus:ring-4 focus:ring-zinc-900/5 hover:bg-zinc-100"
              />

              {errors.root && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-100">
                  <p className="text-sm text-red-600 font-medium text-center">{errors.root}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 h-12 rounded-2xl border border-zinc-200 text-zinc-600 font-bold text-sm hover:bg-zinc-50 transition-all duration-200"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 h-12 rounded-2xl bg-zinc-900 hover:bg-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-60"
                >
                  {isSubmitting
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : isEditMode
                      ? <><Pencil className="w-4 h-4" /><span>CẬP NHẬT</span></>
                      : <><Upload className="w-4 h-4" /><span>ĐĂNG SẢN PHẨM</span></>
                  }
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
