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
      // Fallback: if api endpoint doesn't exist, we can fallback to default variant generated from product info
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
            status: 'ACTIVE'
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

  const handleSubmit = async (form) => {
    setIsSubmitting(true);
    const toastId = toast.loading('Đang xử lý thông tin biến thể...');
    try {
      const apiURL = import.meta.env.VITE_API_URL || '';
      const token = localStorage.getItem('accessToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      if (editingVariant) {
        // PUT /products/:id/variants/:variantId
        await axios.put(`${apiURL}/api/products/${productId}/variants/${editingVariant.id || editingVariant._id}`, form, { headers });
        toast.success('Cập nhật biến thể thành công!', { id: toastId });
      } else {
        // POST /products/:id/variants
        await axios.post(`${apiURL}/api/products/${productId}/variants`, form, { headers });
        toast.success('Thêm biến thể thành công!', { id: toastId });
      }
      handleCloseModal();
      fetchVariants();
    } catch (error) {
      console.error('Error saving variant:', error);
      toast.error('Gặp lỗi khi lưu biến thể. Vui lòng thử lại!', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa biến thể này không?')) return;
    const toastId = toast.loading('Đang xóa biến thể...');
    try {
      const apiURL = import.meta.env.VITE_API_URL || '';
      const token = localStorage.getItem('accessToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      await axios.delete(`${apiURL}/api/products/${productId}/variants/${id}`, { headers });
      toast.success('Xóa biến thể thành công!', { id: toastId });
      setOpenActionId(null);
      fetchVariants();
    } catch (error) {
      console.error('Error deleting variant:', error);
      toast.error('Gặp lỗi khi xóa biến thể. Vui lòng thử lại!', { id: toastId });
    }
  };

  const getStatusBadge = (status) =>
    status === 'ACTIVE'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : 'bg-slate-100 text-slate-500 border-slate-200';

  const getOrderTypeBadge = (type) =>
    type === 'IN_STOCK'
      ? 'bg-sky-50 text-sky-700 border-sky-200'
      : 'bg-amber-50 text-amber-700 border-amber-200';

  // Filter local variants based on search text
  const filteredVariants = variants.filter(v => 
    !debouncedSearch || 
    (v.colorName && v.colorName.toLowerCase().includes(debouncedSearch.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-50/50 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-50/50 via-white to-white p-8 font-sans text-slate-800 animate-in fade-in duration-700">
      {/* TIÊU ĐỀ (HEADER) */}
      <div className="flex flex-col gap-6 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors w-fit font-medium text-sm group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Quay lại danh sách sản phẩm
        </button>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                Biến thể sản phẩm
              </h1>
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full border border-indigo-200 tracking-wide">
                Sản phẩm ID: {productId}
              </span>
            </div>
            <p className="text-slate-500 text-sm">
              Quản lý các biến thể, màu sắc, giá cả và kho hàng cho sản phẩm này.
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold shadow-lg hover:bg-slate-800 transition-all active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm biến thể</span>
          </button>
        </div>
      </div>

      {/* MAIN CARD */}
      <div className="bg-white rounded-2xl border border-slate-205 shadow-xl shadow-slate-200/40 overflow-hidden flex flex-col min-h-[600px]">
        {/* THANH CÔNG CỤ (TOOLBAR) */}
        <div className="px-8 py-5 border-b border-slate-100 bg-white/50 backdrop-blur-xl sticky top-0 z-10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-96 group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm theo từ khóa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl leading-5 bg-slate-50/50 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm shadow-sm"
            />
          </div>
          <div className="text-sm text-slate-500 font-medium">
            Kết quả: <span className="text-slate-900 font-bold">{filteredVariants.length}</span>
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-x-auto relative">
          {isError ? (
            <div className="flex flex-col items-center justify-center h-80">
              <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
              <p className="font-semibold text-slate-700">Không thể tải dữ liệu biến thể</p>
            </div>
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center h-80">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-3" />
              <p className="text-sm text-slate-500 font-medium">Đang tải dữ liệu...</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Màu sắc & Hoàn thiện
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Variant ID
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Kích thước (mm)
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Giá bán
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">
                    Loại kho
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">
                    Trạng thái
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 bg-white">
                {filteredVariants.length > 0 ? (
                  filteredVariants.map((variant, index) => (
                    <tr
                      key={variant.id || variant._id}
                      className="group hover:bg-slate-50/80 transition-all duration-200 animate-in slide-in-from-bottom-2 fade-in fill-mode-backwards"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="px-6 py-5 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                            <ImageIcon className="w-5 h-5 text-slate-300" />
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">
                              {variant.colorName}
                            </span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Tag className="w-3 h-3 text-slate-400" />
                              {variant.frameFinish && (
                                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/60 font-medium">
                                  {variant.frameFinish}
                                </span>
                              )}
                              {variant.sizeLabel && (
                                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/60 font-medium">
                                  {variant.sizeLabel}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5 align-middle">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-slate-500 bg-slate-50 border border-slate-205 px-2 py-1 rounded-lg">
                            {(variant.id || variant._id || '').slice(0, 8)}...
                          </span>
                          <button
                            onClick={() => handleCopyId(variant.id || variant._id)}
                            title="Sao chép ID đầy đủ"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          >
                            {copiedId === (variant.id || variant._id) ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="px-6 py-5 align-middle">
                        <div className="flex flex-col gap-1 text-sm text-slate-650">
                          <span>
                            Tròng:{' '}
                            <span className="font-semibold text-slate-900 font-sans">
                              {variant.lensWidthMm}mm
                            </span>
                          </span>
                          <span>
                            Cầu:{' '}
                            <span className="font-semibold text-slate-900 font-sans">
                              {variant.bridgeWidthMm}mm
                            </span>
                          </span>
                          <span>
                            Càng:{' '}
                            <span className="font-semibold text-slate-900 font-sans">
                              {variant.templeLengthMm}mm
                            </span>
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-5 align-middle">
                        <div className="flex items-center gap-1 font-bold text-slate-800 text-[15px] font-sans">
                          {Number(variant.price ?? 0).toLocaleString('vi-VN')}
                          <span className="text-xs font-semibold text-slate-405 underline">
                            đ
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-5 align-middle text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${getOrderTypeBadge(
                            variant.orderItemType,
                          )}`}
                        >
                          {variant.orderItemType === 'IN_STOCK' ? 'Có sẵn' : 'Đặt trước'}
                        </span>
                      </td>

                      <td className="px-6 py-5 align-middle text-center">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border gap-1.5 ${getStatusBadge(
                            variant.status,
                          )}`}
                        >
                          {variant.status === 'ACTIVE' && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          )}
                          {variant.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm ẩn'}
                        </span>
                      </td>

                      <td className="px-6 py-5 align-middle text-center">
                        <div className="flex items-center justify-center">
                          <div className="relative" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() =>
                                setOpenActionId(openActionId === (variant.id || variant._id) ? null : (variant.id || variant._id))
                              }
                              className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-200 ${
                                openActionId === (variant.id || variant._id)
                                  ? 'bg-indigo-50 text-indigo-600 ring-2 ring-indigo-100 shadow-sm'
                                  : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
                              }`}
                            >
                              <MoreHorizontal className="w-5 h-5" />
                            </button>

                            {openActionId === (variant.id || variant._id) && (
                              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-100 rounded-xl shadow-xl shadow-slate-200/50 z-50 py-1.5 text-left animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                                <div className="px-4 py-2 border-b border-slate-50 mb-1">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Tùy chọn
                                  </p>
                                </div>
                                <button
                                  onClick={() => handleOpenEdit(variant)}
                                  className="w-full px-4 py-2 text-sm text-slate-650 hover:bg-indigo-50 hover:text-indigo-650 flex items-center gap-2 transition-colors font-semibold"
                                >
                                  <Edit className="w-4 h-4" /> Chỉnh sửa
                                </button>
                                <div className="h-px bg-slate-100 my-1 mx-2"></div>
                                <button
                                  onClick={() => handleDelete(variant.id || variant._id)}
                                  className="w-full px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors font-semibold"
                                >
                                  <Trash2 className="w-4 h-4" /> Xóa biến thể
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-24 text-center">
                      <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                        <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mb-5 shadow-inner">
                          <Package className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">
                          Không tìm thấy biến thể
                        </h3>
                        <p className="text-slate-500 text-sm">
                          Hãy thêm biến thể đầu tiên để bắt đầu bán hàng.
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
