import { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Bell,
  Settings,
  Plus,
  MoreHorizontal,
  Trash2,
  Edit,
  Eye,
  AlertCircle,
  Loader2,
  ImageIcon,
  Package,
  ArrowUpDown,
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import ProductModal from './ProductModal';
import {
  useManagerProducts,
  useCreateManagerProduct,
  useUpdateManagerProduct,
  useDeleteManagerProduct,
} from '../../hooks/useManagerProducts';

const ProductManagePage = () => {
  const navigate = useNavigate();

  // 1. TRẠNG THÁI UI & FILTER (UI STATES)
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const size = 10;

  const [openActionId, setOpenActionId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Đóng menu thả xuống khi click ra ngoài
  useEffect(() => {
    const handleClickGlobal = () => setOpenActionId(null);
    window.addEventListener('click', handleClickGlobal);
    return () => window.removeEventListener('click', handleClickGlobal);
  }, []);

  // Debounce Search Term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // 2. CHUẨN BỊ PARAMS ĐỂ GỌI API
  const queryParams = useMemo(() => {
    const params = {
      page: page - 1,
      size,
    };
    if (debouncedSearch) params.q = debouncedSearch;
    return params;
  }, [debouncedSearch, page, size]);

  // 3. LẤY DỮ LIỆU (FETCHING - useManagerProducts hook)
  const { data, isLoading, isError, refetch } = useManagerProducts(queryParams);

  const products = data?.items || [];
  const totalElements = data?.totalElements || 0;
  const totalPages = data?.totalPages || 1;

  const deleteMutation = useDeleteManagerProduct();
  const createMutation = useCreateManagerProduct();
  const updateMutation = useUpdateManagerProduct();

  // 4. CÁC HÀM XỬ LÝ (HANDLERS)
  const handleClearFilters = () => {
    setSearchTerm('');
    setPage(1);
  };

  const handleDeleteProduct = (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này không?')) {
      deleteMutation.mutate(id, {
        onSuccess: () => {
          setOpenActionId(null);
          refetch();
        },
      });
    }
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
    setOpenActionId(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleSubmit = (form) => {
    if (editingProduct) {
      updateMutation.mutate(
        {
          id: editingProduct._id || editingProduct.id,
          payload: {
            productData: form.productData,
            files: form.files,
          },
        },
        {
          onSuccess: () => {
            handleCloseModal();
            refetch();
          },
        },
      );
    } else {
      createMutation.mutate(
        {
          productData: form.productData,
          files: form.files,
        },
        {
          onSuccess: () => {
            handleCloseModal();
            refetch();
          },
        },
      );
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // --- TRỢ GIÚP GIAO DIỆN (STYLING HELPERS) ---
  const getCategoryBadge = (category) => {
    const cat = category?.toUpperCase() || '';
    if (cat === 'FRAME') return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    if (cat === 'LENS') return 'bg-sky-50 text-sky-700 border-sky-200';
    if (cat === 'CONTACT') return 'bg-rose-50 text-rose-700 border-rose-200';
    return 'bg-amber-50 text-amber-700 border-amber-200';
  };

  const getStatusBadge = (status) => {
    const s = status?.toUpperCase() || '';
    if (s === 'ACTIVE')
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-4 ring-emerald-500/10';
    return 'bg-slate-100 text-slate-500 border-slate-200';
  };

  const categoryMap = {
    FRAME: 'Gọng kính',
    SUNGLASSES: 'Kính râm',
    ACCESSORIES: 'Phụ kiện',
    OTHER: 'Khác',
  };

  return (
    <div className="min-h-screen bg-slate-50/50 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-50/50 via-white to-white p-8 font-sans text-slate-800 animate-in fade-in duration-700">
      {/* --- PHẦN TIÊU ĐỀ (HEADER) --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Quản lý sản phẩm
            </h1>
          </div>
          <p className="text-slate-500 text-sm max-w-lg">
            Quản lý kho hàng hiệu quả. Theo dõi tồn kho, cập nhật chi tiết và sắp xếp danh mục sản phẩm của bạn.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button className="relative p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-slate-350 transition-all active:scale-95 group">
            <Bell className="w-5 h-5 text-slate-500 group-hover:text-indigo-600 transition-colors" />
            <span className="absolute top-3 right-3 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white animate-pulse"></span>
          </button>
          <button className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-slate-350 transition-all active:scale-95 group">
            <Settings className="w-5 h-5 text-slate-500 group-hover:text-slate-800 transition-colors" />
          </button>
        </div>
      </div>

      {/* --- BẢNG SẢN PHẨM --- */}
      <div className="bg-white rounded-2xl border border-slate-205 shadow-xl shadow-slate-200/40 overflow-hidden flex flex-col min-h-[600px]">
        {/* TOOLBAR */}
        <div className="px-8 py-5 border-b border-slate-100 bg-white/50 backdrop-blur-xl flex flex-col lg:flex-row justify-between items-center gap-5 sticky top-0 z-10">
          <div className="relative w-full lg:w-96 group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl leading-5 bg-slate-50/50 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm shadow-sm"
            />
          </div>

          <div className="flex items-center gap-4 w-full lg:w-auto">
            <button
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold shadow-lg hover:bg-slate-800 transition-all active:scale-95"
              onClick={handleOpenAdd}
            >
              <Plus className="w-4 h-4" />
              <span>Thêm mới</span>
            </button>
          </div>
        </div>

        {/* TABLE CONTENT */}
        <div className="flex-1 overflow-x-auto">
          {isError && (
            <div className="flex flex-col items-center justify-center h-80 bg-red-50/30 animate-in fade-in">
              <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
              <p className="text-slate-900 font-semibold text-base">Không thể tải dữ liệu sản phẩm</p>
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-80">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-3" />
              <p className="text-sm font-medium text-slate-500">Đang đồng bộ danh mục...</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-[100px]">
                    Xem trước
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider cursor-pointer group hover:text-indigo-600 transition-colors">
                    <div className="flex items-center gap-1">
                      Thông tin sản phẩm{' '}
                      <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Thông số kỹ thuật
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">
                    Danh mục
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
                {products.length > 0
                  ? products.map((product, index) => (
                      <tr
                        key={product._id || product.id}
                        style={{ animationDelay: `${index * 50}ms` }}
                        className="group hover:bg-slate-50/80 transition-all duration-200 animate-in slide-in-from-bottom-2 fade-in fill-mode-backwards"
                      >
                        <td className="px-6 py-5 align-middle">
                          <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                            {product.imageUrl && product.imageUrl.length > 0 ? (
                              <img
                                src={typeof product.imageUrl[0] === 'string' ? product.imageUrl[0] : product.imageUrl[0].imageUrl}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="w-6 h-6 text-slate-300" />
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-5 align-middle">
                          <div className="flex flex-col gap-2">
                            <span
                              onClick={() => navigate(`/manager/products/${product._id || product.id}/variants`)}
                              className="font-bold text-slate-800 text-[15px] group-hover:text-indigo-650 transition-colors cursor-pointer leading-tight"
                            >
                              {product.name}
                            </span>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md border border-slate-200/60">
                                {product.brand}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-5 align-middle">
                          <div className="flex flex-col gap-1.5 text-sm">
                            {product.gender && (
                              <div className="flex items-center gap-2 text-slate-650">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                <span>
                                  Đối tượng:{' '}
                                  <span className="font-semibold text-slate-900">
                                    {product.gender}
                                  </span>
                                </span>
                              </div>
                            )}
                            {product.frameMaterial && (
                              <div className="flex items-center gap-2 text-slate-650">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                <span>
                                  Chất liệu:{' '}
                                  <span className="font-semibold text-slate-900">
                                    {product.frameMaterial}
                                  </span>
                                </span>
                              </div>
                            )}
                            {!product.gender && !product.frameMaterial && (
                              <span className="text-sm text-slate-300 italic">
                                Không có thông số
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-5 align-middle text-center">
                          <span
                            className={`inline-flex items-center justify-center px-3 py-1 rounded-lg text-xs font-bold tracking-wide uppercase border shadow-sm w-[110px] ${getCategoryBadge(product.category)}`}
                          >
                            {categoryMap[product.category?.toUpperCase()] || 'Khác'}
                          </span>
                        </td>

                        <td className="px-6 py-5 align-middle text-center">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border gap-1.5 ${getStatusBadge(product.status)}`}
                          >
                            {product.status === 'ACTIVE' && (
                              <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
                            )}
                            {product.status === 'ACTIVE' ? 'Đang hoạt động' : 'Tạm dừng'}
                          </span>
                        </td>

                        <td className="px-6 py-5 align-middle text-center">
                          <div className="flex items-center justify-center">
                            <div className="relative" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() =>
                                  setOpenActionId(openActionId === (product._id || product.id) ? null : (product._id || product.id))
                                }
                                className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-200 ${
                                  openActionId === (product._id || product.id)
                                    ? 'bg-indigo-50 text-indigo-600 ring-2 ring-indigo-100 shadow-sm'
                                    : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
                                  }`}
                              >
                                <MoreHorizontal className="w-5 h-5" />
                              </button>

                              {openActionId === (product._id || product.id) && (
                                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-100 rounded-xl shadow-xl shadow-slate-200/50 z-50 py-1.5 text-left animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                                  <div className="px-4 py-2 border-b border-slate-55 mb-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                      Quản lý
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => navigate(`/manager/products/${product._id || product.id}/variants`)}
                                    className="w-full px-4 py-2 text-sm text-slate-650 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-2 transition-colors font-semibold border-b border-slate-50 pb-2"
                                  >
                                    <Eye className="w-4 h-4" /> Xem biến thể
                                  </button>
                                  <button
                                    onClick={() => handleOpenEdit(product)}
                                    className="w-full px-4 py-2 text-sm text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2 transition-colors font-semibold"
                                  >
                                    <Edit className="w-4 h-4" /> Sửa thông tin
                                  </button>
                                  <div className="h-px bg-slate-100 my-1 mx-2"></div>
                                  <button
                                    onClick={() => handleDeleteProduct(product._id || product.id)}
                                    disabled={deleteMutation.isPending}
                                    className="w-full px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors font-semibold disabled:opacity-50"
                                  >
                                    {deleteMutation.isPending ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="w-4 h-4" />
                                    )}
                                    Xóa sản phẩm
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  : !isError && (
                      <tr>
                        <td colSpan={6} className="px-6 py-24 text-center">
                          <div className="flex flex-col items-center justify-center max-w-sm mx-auto animate-in fade-in zoom-in-95 duration-500">
                            <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mb-5 shadow-inner">
                              <Package className="w-10 h-10 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">
                              Không tìm thấy sản phẩm
                            </h3>
                            <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                              Chúng tôi không tìm thấy sản phẩm nào khớp với tìm kiếm của bạn.
                            </p>
                            <button
                              onClick={handleClearFilters}
                              className="px-6 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-405 transition-all shadow-sm"
                            >
                              Xóa tìm kiếm
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
              </tbody>
            </table>
          )}
        </div>

        {/* PHÂN TRANG (PAGINATION) */}
        {!isLoading && !isError && totalElements > 0 && (
          <div className="bg-white px-6 py-5 border-t border-slate-100 flex items-center justify-between gap-4 text-sm sticky bottom-0 z-10">
            <span className="text-slate-500 font-medium">
              Hiển thị <span className="font-bold text-slate-900">{products.length}</span> /{' '}
              <span className="font-bold text-slate-900">{totalElements}</span> sản phẩm (Trang{' '}
              {page}/{totalPages})
            </span>
            <div className="flex gap-2.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-650 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                Trước đó
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-650 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                Tiếp theo
              </button>
            </div>
          </div>
        )}
      </div>

      <ProductModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        product={editingProduct}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default ProductManagePage;
