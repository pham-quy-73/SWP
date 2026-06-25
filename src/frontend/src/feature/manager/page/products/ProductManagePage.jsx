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

  // 1. TRẠNG THÁI UI & FILTER
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

  // Debounce Search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const queryParams = useMemo(() => {
    const params = {
      page: page - 1,
      size,
    };
    if (debouncedSearch) params.q = debouncedSearch;
    return params;
  }, [debouncedSearch, page, size]);

  const { data, isLoading, isError, refetch } = useManagerProducts(queryParams);

  const products = data?.items || [];
  const totalElements = data?.totalElements || 0;
  const totalPages = data?.totalPages || 1;

  const deleteMutation = useDeleteManagerProduct();
  const createMutation = useCreateManagerProduct();
  const updateMutation = useUpdateManagerProduct();

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

  const getCategoryBadge = (category) => {
    const cat = category?.toUpperCase() || '';
    if (cat === 'FRAME') return 'bg-zinc-100 text-zinc-900 border-zinc-200';
    if (cat === 'LENS') return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    if (cat === 'CONTACT') return 'bg-rose-50 text-rose-800 border-rose-200';
    return 'bg-zinc-50 text-zinc-500 border-zinc-200';
  };

  const getStatusBadge = (status) => {
    const s = status?.toUpperCase() || '';
    if (s === 'ACTIVE') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    return 'bg-zinc-100 text-zinc-500 border-zinc-200';
  };

  const categoryMap = {
    FRAME: 'Gọng kính',
    SUNGLASSES: 'Kính râm',
    ACCESSORIES: 'Phụ kiện',
    OTHER: 'Khác',
  };

  // HÀM XỬ LÝ ĐƯỜNG DẪN ẢNH
  const getDisplayImageUrl = (imgObj) => {
    if (!imgObj) return null;
    const url = typeof imgObj === 'string' ? imgObj : imgObj.imageUrl;
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const apiURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${apiURL}${url}`;
  };

  return (
    <div className="min-h-screen bg-zinc-50 p-6 md:p-10 font-sans text-zinc-800 animate-in fade-in duration-700">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6 max-w-7xl mx-auto">
        <div>
          <span className="inline-block py-1 px-3 mb-3 text-[10px] font-bold tracking-[0.3em] text-emerald-600 bg-emerald-50 rounded-full border border-emerald-100 uppercase">
            Quản lý kho
          </span>
          <h1 className="text-4xl font-black tracking-tight text-zinc-900 mb-2">
            Danh Mục Sản Phẩm.
          </h1>
          <p className="text-zinc-500 text-sm max-w-lg leading-relaxed">
            Kiểm soát bộ sưu tập kính mắt của bạn. Thêm mới, phân loại và theo dõi tình trạng hiển thị trên cửa hàng.
          </p>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="max-w-7xl mx-auto bg-white rounded-[2rem] border border-zinc-100 shadow-[0_10px_40px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col min-h-[600px]">
        {/* TOOLBAR */}
        <div className="px-8 py-6 border-b border-zinc-100 bg-white flex flex-col lg:flex-row justify-between items-center gap-5 sticky top-0 z-10">
          <div className="relative w-full lg:w-[400px] group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-zinc-400 group-focus-within:text-emerald-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm mã hoặc tên sản phẩm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-11 pr-4 py-3.5 border border-zinc-200 rounded-2xl bg-zinc-50/50 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-sm font-medium shadow-sm"
            />
          </div>

          <button
            className="w-full lg:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-zinc-900 text-white rounded-2xl text-sm font-bold tracking-wide hover:bg-emerald-600 transition-all shadow-xl hover:shadow-emerald-500/20 active:scale-95"
            onClick={handleOpenAdd}
          >
            <Plus className="w-5 h-5" />
            <span>Thêm Sản Phẩm</span>
          </button>
        </div>

        {/* TABLE CONTENT */}
        <div className="flex-1 overflow-x-auto custom-scrollbar">
          {isError && (
            <div className="flex flex-col items-center justify-center h-[400px] animate-in fade-in">
              <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-rose-500" />
              </div>
              <p className="text-zinc-900 font-bold">Không thể tải dữ liệu sản phẩm</p>
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-[400px]">
              <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-4" />
              <p className="text-xs font-bold tracking-widest text-zinc-400 uppercase">Đang đồng bộ dữ liệu</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/50">
                  <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] w-[120px]">
                    Hình ảnh
                  </th>
                  <th className="px-6 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] cursor-pointer group hover:text-emerald-600 transition-colors">
                    <div className="flex items-center gap-1.5">
                      Sản phẩm <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                    </div>
                  </th>
                  <th className="px-6 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
                    Thông số kỹ thuật
                  </th>
                  <th className="px-6 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] text-center">
                    Danh mục
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
                {products.length > 0
                  ? products.map((product, index) => (
                    <tr
                      key={product._id || product.id}
                      style={{ animationDelay: `${index * 30}ms` }}
                      className="group hover:bg-zinc-50/80 transition-all duration-300 animate-in slide-in-from-bottom-2 fade-in fill-mode-backwards"
                    >
                      <td className="px-8 py-6 align-middle">
                        <div className="w-16 h-16 rounded-2xl bg-zinc-100 border border-zinc-200/60 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                          {product.imageUrl && product.imageUrl.length > 0 ? (
                            <img
                              src={getDisplayImageUrl(product.imageUrl[0])}
                              alt={product.name}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'block';
                              }}
                            />
                          ) : null}
                          <ImageIcon
                            className={`w-6 h-6 text-zinc-300 ${product.imageUrl?.length > 0 ? 'hidden' : ''}`}
                          />
                        </div>
                      </td>

                      <td className="px-6 py-6 align-middle">
                        <div className="flex flex-col gap-2">
                          <span
                            onClick={() => navigate(`/manager/products/${product._id || product.id}/variants`)}
                            className="font-black text-zinc-900 text-base hover:text-emerald-600 transition-colors cursor-pointer tracking-tight"
                          >
                            {product.name}
                          </span>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-bold tracking-widest text-zinc-500 bg-white px-2 py-1 rounded-md border border-zinc-200 uppercase">
                              {product.brand}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-6 align-middle">
                        <div className="flex flex-col gap-1.5 text-xs text-zinc-500">
                          {product.gender && (
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-zinc-300"></span>
                              <span>
                                Đối tượng: <span className="font-bold text-zinc-900">{product.gender}</span>
                              </span>
                            </div>
                          )}
                          {product.frameMaterial && (
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-zinc-300"></span>
                              <span>
                                Chất liệu: <span className="font-bold text-zinc-900">{product.frameMaterial}</span>
                              </span>
                            </div>
                          )}
                          {!product.gender && !product.frameMaterial && (
                            <span className="text-zinc-300 italic">Không có thông số</span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-6 align-middle text-center">
                        <span
                          className={`inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase border ${getCategoryBadge(product.category)}`}
                        >
                          {categoryMap[product.category?.toUpperCase()] || 'Khác'}
                        </span>
                      </td>

                      <td className="px-6 py-6 align-middle text-center">
                        <span
                          className={`inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase border gap-1.5 ${getStatusBadge(product.status)}`}
                        >
                          {product.status === 'ACTIVE' && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          )}
                          {product.status === 'ACTIVE' ? 'Hiển thị' : 'Đã ẩn'}
                        </span>
                      </td>

                      <td className="px-6 py-6 align-middle text-center">
                        <div className="flex items-center justify-center relative" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() =>
                              setOpenActionId(openActionId === (product._id || product.id) ? null : (product._id || product.id))
                            }
                            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 ${openActionId === (product._id || product.id)
                              ? 'bg-zinc-900 text-white shadow-lg'
                              : 'text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100'
                              }`}
                          >
                            <MoreHorizontal className="w-5 h-5" />
                          </button>

                          {openActionId === (product._id || product.id) && (
                            <div
                              className={`absolute right-0 w-52 bg-white border border-zinc-100 rounded-2xl shadow-xl shadow-zinc-200/50 z-50 py-2 text-left animate-in fade-in zoom-in-95 duration-200 ${
                                // TỰ ĐỘNG DROP-UP CHO 2 SẢN PHẨM CUỐI CÙNG
                                index >= products.length - 2 && index > 1
                                  ? 'bottom-full mb-2 origin-bottom-right'
                                  : 'top-full mt-2 origin-top-right'
                                }`}
                            >
                              <div className="px-5 py-2 border-b border-zinc-50 mb-1">
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                  Thao tác
                                </p>
                              </div>
                              <button
                                onClick={() => navigate(`/manager/products/${product._id || product.id}/variants`)}
                                className="w-full px-5 py-2.5 text-sm text-zinc-600 hover:bg-zinc-50 hover:text-emerald-600 flex items-center gap-3 transition-colors font-semibold"
                              >
                                <Eye className="w-4 h-4" /> Biến thể (Màu sắc)
                              </button>
                              <button
                                onClick={() => handleOpenEdit(product)}
                                className="w-full px-5 py-2.5 text-sm text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 flex items-center gap-3 transition-colors font-semibold"
                              >
                                <Edit className="w-4 h-4" /> Chỉnh sửa
                              </button>
                              <div className="h-px bg-zinc-100 my-1 mx-3"></div>
                              <button
                                onClick={() => handleDeleteProduct(product._id || product.id)}
                                disabled={deleteMutation.isPending}
                                className="w-full px-5 py-2.5 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-3 transition-colors font-semibold disabled:opacity-50"
                              >
                                {deleteMutation.isPending ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                                Xóa vĩnh viễn
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                  : !isError && (
                    <tr>
                      <td colSpan={6} className="px-6 py-32 text-center">
                        <div className="flex flex-col items-center justify-center max-w-sm mx-auto animate-in fade-in zoom-in-95 duration-500">
                          <div className="w-24 h-24 bg-zinc-50 border border-zinc-100 rounded-[2rem] flex items-center justify-center mb-6">
                            <Package className="w-10 h-10 text-zinc-300" />
                          </div>
                          <h3 className="text-xl font-black text-zinc-900 mb-2">
                            Không tìm thấy sản phẩm
                          </h3>
                          <p className="text-zinc-500 text-sm mb-8 leading-relaxed">
                            Danh mục hiện đang trống hoặc không có sản phẩm nào khớp với từ khóa tìm kiếm của bạn.
                          </p>
                          <button
                            onClick={handleClearFilters}
                            className="px-8 py-3 bg-white border border-zinc-200 rounded-2xl text-sm font-bold text-zinc-700 hover:bg-zinc-50 transition-all shadow-sm active:scale-95"
                          >
                            Xóa bộ lọc tìm kiếm
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>
          )}
        </div>

        {/* PAGINATION */}
        {!isLoading && !isError && totalElements > 0 && (
          <div className="bg-white px-8 py-6 border-t border-zinc-100 flex items-center justify-between gap-4 sticky bottom-0 z-10">
            <span className="text-zinc-500 text-sm font-medium">
              Hiển thị <span className="font-bold text-zinc-900">{products.length}</span> /{' '}
              <span className="font-bold text-zinc-900">{totalElements}</span> sản phẩm (Trang{' '}
              {page}/{totalPages})
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-5 py-2.5 border border-zinc-200 rounded-xl hover:bg-zinc-50 text-zinc-700 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                Trước
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-5 py-2.5 border border-zinc-200 rounded-xl hover:bg-zinc-50 text-zinc-700 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                Sau
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