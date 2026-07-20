import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  X,
  FileSpreadsheet,
  Download,
  Upload,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileText
} from 'lucide-react';

export default function ImportVariantModal({ open, onClose, productId, onSuccess }) {
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  if (!open) return null;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls') && !selectedFile.name.endsWith('.csv')) {
        toast.error('Vui lòng chọn file có định dạng Excel (.xlsx, .xls) hoặc CSV');
        return;
      }
      setFile(selectedFile);
      setImportResult(null);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent =
      '\uFEFF' +
      'Màu sắc,Mã SKU,Hoàn thiện gọng,Kích thước nhãn,Chiều rộng tròng (mm),Chiều rộng cầu (mm),Chiều dài càng (mm),Giá bán,Giá giảm,Số lượng tồn kho,Loại kho,Trạng thái\n' +
      'Đen Nhám,SKU-DEN-NHAM-M,Matte,M,52,18,140,450000,,50,IN_STOCK,ACTIVE\n' +
      'Vàng Kim,SKU-VANG-KIM-L,Glossy,L,54,19,145,500000,480000,30,IN_STOCK,ACTIVE\n' +
      'Bạc Sáng,SKU-BAC-SANG-S,Satin,S,50,17,138,420000,,0,PRE_ORDER,ACTIVE';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'mau_import_phien_ban_gong_kinh.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Vui lòng chọn file Excel trước khi bấm Import');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Đang đọc và import dữ liệu Excel...');

    try {
      const apiURL = import.meta.env.VITE_API_URL || '';
      const token = localStorage.getItem('accessToken');
      const headers = {
        'Content-Type': 'multipart/form-data',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };

      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        `${apiURL}/api/products/${productId}/variants/import-excel`,
        formData,
        { headers }
      );

      const data = response.data;
      setImportResult({
        success: true,
        count: data.result?.length || 0,
        errors: data.errors || []
      });

      toast.success(data.message || 'Import phiên bản thành công!', { id: toastId });
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Lỗi khi import Excel:', error);
      const msg = error.response?.data?.message || 'Gặp lỗi khi import file Excel. Vui lòng kiểm tra định dạng dữ liệu.';
      const errors = error.response?.data?.errors || [];
      setImportResult({
        success: false,
        message: msg,
        errors
      });
      toast.error(msg, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setImportResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] max-w-xl w-full p-8 shadow-2xl border border-zinc-100 relative max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <FileSpreadsheet className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-zinc-900 tracking-tight">
              Nhập Excel Phiên Bản
            </h3>
            <p className="text-xs font-semibold text-zinc-500 mt-1">
              Thêm hàng loạt biến thể màu sắc, kích thước và giá bán bằng file Excel.
            </p>
          </div>
        </div>

        {/* Download Template Banner */}
        <div className="mb-6 p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="text-xs">
              <p className="font-bold text-zinc-800">Chưa có file mẫu chuẩn?</p>
              <p className="text-zinc-500 font-medium">Tải file mẫu để điền thông tin chính xác nhất.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-bold text-zinc-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-all cursor-pointer shadow-xs shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Tải file mẫu</span>
          </button>
        </div>

        {/* Upload Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500">
              Chọn File Excel / CSV (.xlsx, .xls, .csv)
            </label>

            <div className="relative border-2 border-dashed border-zinc-200 rounded-2xl p-8 text-center hover:border-emerald-500 hover:bg-emerald-50/20 transition-all cursor-pointer group">
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                disabled={isSubmitting}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />

              <div className="flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-zinc-100 group-hover:bg-emerald-100 text-zinc-400 group-hover:text-emerald-600 flex items-center justify-center transition-colors">
                  <Upload className="w-6 h-6" />
                </div>
                {file ? (
                  <div>
                    <p className="font-bold text-emerald-700 text-sm">{file.name}</p>
                    <p className="text-xs text-zinc-400 font-medium mt-0.5">
                      {(file.size / 1024).toFixed(1)} KB — Bấm để chọn file khác
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="font-bold text-zinc-800 text-sm">Kéo & thả file vào đây hoặc bấm để tải lên</p>
                    <p className="text-xs text-zinc-400 font-medium mt-0.5">Hỗ trợ các file định dạng .xlsx, .xls, .csv</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Import Result Notification */}
          {importResult && (
            <div className={`p-4 rounded-2xl border text-xs font-medium ${
              importResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              <div className="flex items-center gap-2 font-bold mb-1 text-sm">
                {importResult.success ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Nhập dữ liệu thành công!</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-rose-600" />
                    <span>Import không thành công</span>
                  </>
                )}
              </div>

              {importResult.success && (
                <p className="mt-1 font-semibold">
                  Đã thêm thành công <span className="font-black text-emerald-700">{importResult.count}</span> phiên bản mới vào danh mục sản phẩm.
                </p>
              )}

              {importResult.errors && importResult.errors.length > 0 && (
                <div className="mt-3 pt-3 border-t border-current/10 space-y-1">
                  <p className="font-bold">Chi tiết cảnh báo / Lỗi dòng:</p>
                  <ul className="list-disc pl-4 space-y-0.5 max-h-32 overflow-y-auto">
                    {importResult.errors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4 border-t border-zinc-100">
            {importResult ? (
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 py-3.5 px-5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-2xl font-bold text-sm transition-all cursor-pointer"
              >
                Nhập file khác
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 py-3.5 px-5 border border-zinc-200 text-zinc-700 hover:bg-zinc-50 rounded-2xl font-bold text-sm transition-all cursor-pointer disabled:opacity-50"
              >
                Hủy bỏ
              </button>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !file}
              className="flex-1 py-3.5 px-5 bg-zinc-900 hover:bg-emerald-600 text-white rounded-2xl font-bold text-sm transition-all shadow-xl hover:shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <span>Bắt đầu Import</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
