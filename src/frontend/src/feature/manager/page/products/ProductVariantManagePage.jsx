import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import {
  Search,
  Plus,
  MoreHorizontal,
  Trash2,
  Edit,
  ArrowLeft,
  ImageIcon,
  Package,
  Tag,
  Loader2,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import VariantModal from './VariantModal';

export default function ProductVariantManagePage() {
  const { productId } = useParams();
  const navigate = useNavigate();

  // --- States ---
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [openActionId, setOpenActionId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [variants, setVariants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchVariants = async () => {
    if (!productId) return;
    setIsLoading(true);
    setIsError(false);
    try {
      const apiURL = import.meta.env.VITE_API_URL || '';
      const token = localStorage.getItem('accessToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await axios.get(`${apiURL}/api/products/${productId}/variants`, { headers });
      if (response.data) {
        const items = response.data.result?.items || response.data.result || response.data;
        setVariants(Array.isArray(items) ? items : []);
      } else {
        setVariants([]);
      }
    } catch (error) {
      console.error('Error fetching variants:', error);
      try {
        const apiURL = import.meta.env.VITE_API_URL || '';
        const prodResp = await axios.get(`${apiURL}/api/products/${productId}`);
        const product = prodResp.data?.result || prodResp.data;
        if (product) {
          setVariants([{
            id: product._id || product.id,
            colorName: 'Mô hình mặc định',
            sizeLabel: 'M',
            lensWidthMm: 52,
            bridgeWidthMm: 18,
            templeLengthMm: 140,
            price: product.discountPrice || product.price,
            orderItemType: 'IN_STOCK',
            status: 'ACTIVE',
            quantity: 0 // Thêm trường quantity mặc định
          }]);
        }
      } catch (err) {
        setVariants([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVariants();
  }, [productId]);

  // Đóng menu thả xuống khi click ra ngoài
  useEffect(() => {
    const handleClickGlobal = () => setOpenActionId(null);
    window.addEventListener('click', handleClickGlobal);
    return () => window.removeEventListener('click', handleClickGlobal);
  }, []);

  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleOpenAdd = () => {
    setEditingVariant(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (variant) => {
    setEditingVariant(variant);
    setIsModalOpen(true);
    setOpenActionId(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingVariant(null);
  };

  const getDisplayImageUrl = (imgObj) => {
    if (!imgObj) return null;
    const url = typeof imgObj === 'string' ? imgObj : imgObj.imageUrl;
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('blob:')) return url;
    const apiURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${apiURL}${url}`;
  };

  const handleSubmit = async (form) => {
    setIsSubmitting(true);
    const toastId = toast.loading('Đang xử lý thông tin biến thể...');
    try {
      const apiURL = import.meta.env.VITE_API_URL || '';
      const token = localStorage.getItem('accessToken');
      const headers = {
        'Content-Type': 'multipart/form-data', 
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };

      const formData = new FormData();
      // Đảm bảo convert quantity sang Number trước khi gửi lên API
      const safeData = { ...form.variantData, quantity: Number(form.variantData.quantity) || 0 };
      formData.append('variant', JSON.stringify(safeData));

      if (form.files && form.files.length > 0) {
        form.files.forEach((file) => {
          formData.append('files', file);
        });
      }

      if (editingVariant) {
        await axios.put(`${apiURL}/api/products/${productId}/variants/${editingVariant.id || editingVariant._id}`, formData, { headers });
        toast.success('Cập nhật thành công!', { id: toastId });
      } else {
        await axios.post(`${apiURL}/api/products/${productId}/variants`, formData, { headers });
        toast.success('Thêm phiên bản thành công!', { id: toastId });
      }
      handleCloseModal();
      fetchVariants();
    } catch (error) {
      console.error('Error saving variant:', error);
      toast.error('Gặp lỗi khi lưu. Vui lòng thử lại!', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa phiên bản này không?')) return;
    const toastId = toast.loading('Đang xóa...');
    try {
      const apiURL = import.meta.env.VITE_API_URL || '';
      const token = localStorage.getItem('accessToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      await axios.delete(`${apiURL}/api/products/${productId}/variants/${id}`, { headers });
      toast.success('Xóa thành công!', { id: toastId });
      setOpenActionId(null);
      fetchVariants();
    } catch (error) {
      console.error('Error deleting variant:', error);
      toast.error('Gặp lỗi khi xóa. Vui lòng thử lại!', { id: toastId });
    }
  };

  const getStatusBadge = (status) =>
    status === 'ACTIVE'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : 'bg-zinc-100 text-zinc-500 border-zinc-200';

  const getOrderTypeBadge = (type) =>
    type === 'IN_STOCK'
      ? 'bg-zinc-50 text-zinc-700 border-zinc-200'
      : 'bg-amber-50 text-amber-700 border-amber-200';

  const filteredVariants = variants.filter(v =>
    !debouncedSearch ||
    (v.colorName && v.colorName.toLowerCase().includes(debouncedSearch.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-zinc-50 p-6 md:p-10 font-sans text-zinc-800 animate-in fade-in duration-700">

      {/* HEADER */}
      <div className="max-w-7xl mx-auto flex flex-col gap-6 mb-10">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-zinc-400 hover:text-zinc-900 transition-colors w-fit font-bold text-xs tracking-widest uppercase group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Quay lại danh mục
        </button>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-black tracking-tight text-zinc-900">
                Phiên Bản Sản Phẩm.
              </h1>
              <span className="px-3 py-1 bg-zinc-900 text-white text-[10px] font-bold rounded-full tracking-widest uppercase shadow-sm">
                ID: {(productId || '').slice(-6)}
              </span>
            </div>
            <p className="text-zinc-500 text-sm max-w-lg leading-relaxed">
              Quản lý các biến thể màu sắc, kích thước, cấu hình kho hàng và mức giá riêng biệt cho sản phẩm này.
            </p>
          </div>
        </div>
      </div>

      {/* MAIN CARD */}
      <div className="max-w-7xl mx-auto bg-white rounded-[2rem] border border-zinc-100 shadow-[0_10px_40px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col min-h-[600px]">

        {/* TOOLBAR */}
        <div className="px-8 py-6 border-b border-zinc-100 bg-white flex flex-col sm:flex-row justify-between items-center gap-5 sticky top-0 z-10">
          <div className="relative w-full sm:w-[400px] group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-zinc-400 group-focus-within:text-emerald-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm màu sắc..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-11 pr-4 py-3.5 border border-zinc-200 rounded-2xl bg-zinc-50/50 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-sm font-medium shadow-sm"
            />
          </div>

          <div className="flex items-center gap-6 w-full sm:w-auto">
            <div className="text-sm text-zinc-500 font-medium hidden md:block">
              Tổng cộng: <span className="text-zinc-900 font-black text-lg">{filteredVariants.length}</span>
            </div>
            <button
              onClick={handleOpenAdd}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-zinc-900 text-white rounded-2xl text-sm font-bold tracking-wide hover:bg-emerald-600 transition-all shadow-xl hover:shadow-emerald-500/20 active:scale-95 shrink-0"
            >
              <Plus className="w-5 h-5" />
              <span>Thêm Phiên Bản</span>
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-x-auto custom-scrollbar relative">
          {isError ? (
            <div className="flex flex-col items-center justify-center h-[400px]">
              <AlertCircle className="w-12 h-12 text-rose-400 mb-4" />
              <p className="font-bold text-zinc-900">Không thể tải dữ liệu phiên bản</p>
            </div>
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center h-[400px]">
              <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-4" />
              <p className="text-[10px] font-bold text-zinc-400 tracking-widest uppercase">Đang đồng bộ dữ liệu...</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/50">
                  <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
                    Màu sắc & Hoàn thiện
                  </th>
                  <th className="px-6 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
                    Variant ID
                  </th>
                  <th className="px-6 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
                    Kích thước (mm)
                  </th>
                  <th className="px-6 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
                    Giá bán
                  </th>
                  {/* NÂNG CẤP: Cột hiển thị Tồn Kho */}
                  <th className="px-6 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] text-center">
                    Tồn kho
                  </th>
                  <th className="px-6 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] text-center">
                    Loại kho
                  </th>
                  <th className="px-6 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] text-center">
                    Trạng thái
                  </th>
                  <th className="px-6 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] text-center">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 bg-white">
                {filteredVariants.length > 0 ? (
                  filteredVariants.map((variant, index) => {
                    const quantity = variant.quantity || 0;
                    return (
                      <tr
                        key={variant.id || variant._id}
                        className="group hover:bg-zinc-50/80 transition-all duration-300 animate-in slide-in-from-bottom-2 fade-in fill-mode-backwards"
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        <td className="px-8 py-6 align-middle">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-zinc-100 border border-zinc-200/60 flex items-center justify-center overflow-hidden shrink-0">
                              {variant.imageUrl && variant.imageUrl.length > 0 ? (
                                <img
                                  src={getDisplayImageUrl(variant.imageUrl[0])}
                                  alt={variant.colorName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <ImageIcon className="w-5 h-5 text-zinc-300" />
                              )}
                            </div>

                            <div className="flex flex-col gap-1.5">
                              <span className="font-black text-zinc-900 text-base group-hover:text-emerald-600 transition-colors tracking-tight">
                                {variant.colorName}
                              </span>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Tag className="w-3 h-3 text-zinc-300" />
                                {variant.frameFinish && (
                                  <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 bg-white px-2 py-1 rounded border border-zinc-200">
                                    {variant.frameFinish}
                                  </span>
                                )}
                                {variant.sizeLabel && (
                                  <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 bg-white px-2 py-1 rounded border border-zinc-200">
                                    {variant.sizeLabel}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-6 align-middle">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-zinc-500 bg-zinc-50 border border-zinc-200 px-2 py-1 rounded-lg">
                              {(variant.id || variant._id || '').slice(0, 8)}...
                            </span>
                            <button
                              onClick={() => handleCopyId(variant.id || variant._id)}
                              title="Sao chép ID đầy đủ"
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                            >
                              {copiedId === (variant.id || variant._id) ? (
                                <Check className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>

                        <td className="px-6 py-6 align-middle">
                          <div className="flex flex-col gap-1 text-xs text-zinc-500 font-medium">
                            <span>
                              Tròng: <span className="font-black text-zinc-900 text-sm">{variant.lensWidthMm}</span>
                            </span>
                            <span>
                              Cầu: <span className="font-black text-zinc-900 text-sm">{variant.bridgeWidthMm}</span>
                            </span>
                            <span>
                              Càng: <span className="font-black text-zinc-900 text-sm">{variant.templeLengthMm}</span>
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-6 align-middle">
                          <div className="flex items-baseline gap-1 font-black text-zinc-900 text-lg tracking-tight">
                            {Number(variant.price ?? 0).toLocaleString('vi-VN')}
                            <span className="text-xs font-bold text-zinc-400">đ</span>
                          </div>
                        </td>

                        {/* NÂNG CẤP: Giao diện Tồn Kho (Badge Cảnh báo) */}
                        <td className="px-6 py-6 align-middle text-center">
                          <div className="flex flex-col items-center justify-center gap-1">
                            <span className={`font-black text-lg ${quantity === 0 ? 'text-rose-500' : 'text-zinc-900'}`}>
                              {quantity}
                            </span>
                            {quantity === 0 ? (
                              <span className="text-[9px] font-bold uppercase tracking-widest text-rose-500 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">Hết hàng</span>
                            ) : quantity <= 5 ? (
                              <span className="text-[9px] font-bold uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Sắp hết</span>
                            ) : (
                              <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Còn hàng</span>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-6 align-middle text-center">
                          <span
                            className={`inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase border ${getOrderTypeBadge(
                              variant.orderItemType,
                            )}`}
                          >
                            {variant.orderItemType === 'IN_STOCK' ? 'Có sẵn' : 'Đặt trước'}
                          </span>
                        </td>

                        <td className="px-6 py-6 align-middle text-center">
                          <span
                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase border gap-1.5 ${getStatusBadge(
                              variant.status,
                            )}`}
                          >
                            {variant.status === 'ACTIVE' && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            )}
                            {variant.status === 'ACTIVE' ? 'Hiển thị' : 'Đã ẩn'}
                          </span>
                        </td>

                        <td className="px-6 py-6 align-middle text-center">
                          <div className="flex items-center justify-center relative" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() =>
                                setOpenActionId(openActionId === (variant.id || variant._id) ? null : (variant.id || variant._id))
                              }
                              className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 ${openActionId === (variant.id || variant._id)
                                ? 'bg-zinc-900 text-white shadow-lg'
                                : 'text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100'
                                }`}
                            >
                              <MoreHorizontal className="w-5 h-5" />
                            </button>

                            {openActionId === (variant.id || variant._id) && (
                              <div
                                className={`absolute right-0 w-48 bg-white border border-zinc-100 rounded-2xl shadow-xl shadow-zinc-200/50 z-50 py-2 text-left animate-in fade-in zoom-in-95 duration-200 ${
                                  index >= filteredVariants.length - 2 && index > 1
                                    ? 'bottom-full mb-2 origin-bottom-right'
                                    : 'top-full mt-2 origin-top-right'
                                  }`}
                              >
                                <div className="px-5 py-2 border-b border-zinc-50 mb-1">
                                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                    Tùy chọn
                                  </p>
                                </div>
                                <button
                                  onClick={() => handleOpenEdit(variant)}
                                  className="w-full px-5 py-2.5 text-sm text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 flex items-center gap-3 transition-colors font-semibold"
                                >
                                  <Edit className="w-4 h-4" /> Chỉnh sửa
                                </button>
                                <div className="h-px bg-zinc-100 my-1 mx-3"></div>
                                <button
                                  onClick={() => handleDelete(variant.id || variant._id)}
                                  className="w-full px-5 py-2.5 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-3 transition-colors font-semibold"
                                >
                                  <Trash2 className="w-4 h-4" /> Xóa vĩnh viễn
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-32 text-center">
                      <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                        <div className="w-24 h-24 bg-zinc-50 border border-zinc-100 rounded-[2rem] flex items-center justify-center mb-6">
                          <Package className="w-10 h-10 text-zinc-300" />
                        </div>
                        <h3 className="text-xl font-black text-zinc-900 mb-2">
                          Không tìm thấy phiên bản
                        </h3>
                        <p className="text-zinc-500 text-sm leading-relaxed">
                          Sản phẩm này chưa có phiên bản nào, hoặc không có kết quả khớp với tìm kiếm của bạn. Hãy tạo mới để bắt đầu kinh doanh.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <VariantModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        variant={editingVariant}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}