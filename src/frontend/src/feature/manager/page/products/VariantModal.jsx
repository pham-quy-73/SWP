import { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';

const EMPTY_FORM = {
  colorName: '',
  frameFinish: '',
  lensWidthMm: 0,
  bridgeWidthMm: 0,
  templeLengthMm: 0,
  sizeLabel: '',
  price: 0,
  quantity: 0,
  status: 'ACTIVE',
  orderItemType: 'IN_STOCK',
};

export default function VariantModal({
  open,
  onClose,
  onSubmit,
  variant,
  isSubmitting = false,
}) {
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (open) {
      if (variant) {
        setForm({
          colorName: variant.colorName ?? '',
          frameFinish: variant.frameFinish ?? '',
          lensWidthMm: variant.lensWidthMm ?? 0,
          bridgeWidthMm: variant.bridgeWidthMm ?? 0,
          templeLengthMm: variant.templeLengthMm ?? 0,
          sizeLabel: variant.sizeLabel ?? '',
          price: variant.price ?? 0,
          quantity: variant.quantity ?? 0,
          status: variant.status ?? 'ACTIVE',
          orderItemType: variant.orderItemType ?? 'IN_STOCK',
        });
      } else {
        setForm(EMPTY_FORM);
      }
    }
  }, [open, variant]);

  if (!open) return null;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const inputClass =
    'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50 transition-all';
  const labelClass = 'block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide';

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl shadow-slate-900/20 animate-in zoom-in-95 fade-in duration-200 max-h-[90vh] flex flex-col font-sans">
        {/* Title (Header) */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {variant ? 'Chỉnh sửa biến thể' : 'Thêm biến thể mới'}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {variant
                ? 'Cập nhật các thông tin chi tiết cho biến thể này.'
                : 'Điền các thông tin cần thiết để tạo biến thể mới.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content (Body) */}
        <div className="overflow-y-auto px-7 py-6 flex-1">
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <div>
              <label className={labelClass}>Tên màu sắc *</label>
              <input
                name="colorName"
                placeholder="Ví dụ: Đen nhám, Vàng đồng..."
                value={form.colorName}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Kiểu hoàn thiện</label>
              <input
                name="frameFinish"
                placeholder="Ví dụ: Bóng, Nhám, Mạ titan..."
                value={form.frameFinish}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Nhãn kích thước</label>
              <input
                name="sizeLabel"
                placeholder="Ví dụ: Lớn, Nhỏ, 52-18-140..."
                value={form.sizeLabel}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Giá bán (VNĐ)</label>
              <input
                type="number"
                name="price"
                placeholder="Ví dụ: 4700000"
                value={form.price || ''}
                onChange={handleChange}
                className={inputClass}
                min={0}
              />
            </div>

            <div>
              <label className={labelClass}>Chiều rộng tròng (mm)</label>
              <input
                type="number"
                name="lensWidthMm"
                placeholder="Ví dụ: 62"
                value={form.lensWidthMm || ''}
                onChange={handleChange}
                className={inputClass}
                min={0}
              />
            </div>

            <div>
              <label className={labelClass}>Chiều rộng cầu mắt (mm)</label>
              <input
                type="number"
                name="bridgeWidthMm"
                placeholder="Ví dụ: 14"
                value={form.bridgeWidthMm || ''}
                onChange={handleChange}
                className={inputClass}
                min={0}
              />
            </div>

            <div>
              <label className={labelClass}>Chiều dài càng kính (mm)</label>
              <input
                type="number"
                name="templeLengthMm"
                placeholder="Ví dụ: 140"
                value={form.templeLengthMm || ''}
                onChange={handleChange}
                className={inputClass}
                min={0}
              />
            </div>

            <div>
              <label className={labelClass}>Số lượng trong kho</label>
              <input
                type="number"
                name="quantity"
                placeholder="Ví dụ: 50"
                value={form.quantity || ''}
                onChange={handleChange}
                className={inputClass}
                min={0}
              />
            </div>

            <div>
              <label className={labelClass}>Loại kho hàng</label>
              <select
                name="orderItemType"
                value={form.orderItemType}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="IN_STOCK">Có sẵn (In Stock)</option>
                <option value="PRE_ORDER">Đặt trước (Pre Order)</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Trạng thái</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="ACTIVE">Đang hoạt động</option>
                <option value="INACTIVE">Tạm ngưng</option>
              </select>
            </div>
          </div>
        </div>

        {/* Chân trang (Footer) */}
        <div className="flex items-center justify-end gap-3 px-7 py-5 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-all disabled:opacity-50"
          >
            Hủy bỏ
          </button>
          <button
            onClick={() => onSubmit(form)}
            disabled={isSubmitting || !form.colorName}
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-slate-900/20"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {variant ? 'Lưu thay đổi' : 'Tạo biến thể'}
          </button>
        </div>
      </div>
    </div>
  );
}
