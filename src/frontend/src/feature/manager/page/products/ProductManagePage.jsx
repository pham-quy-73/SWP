import { useState, useEffect, useMemo } from 'react';
import {
  Search, Plus, MoreHorizontal, Trash2, Edit, Eye,
  AlertCircle, Loader2, ImageIcon, Package, Filter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProductModal from './ProductModal';
import {
  useManagerProducts, useCreateManagerProduct, useUpdateManagerProduct, useDeleteManagerProduct,
} from '../../hooks/useManagerProducts';

const ProductManagePage = () => {
  const navigate = useNavigate();

  // 1. TRẠNG THÁI UI & FILTER
  const [activeTab, setActiveTab] = useState('GLASSES'); // 'GLASSES' (Kính/Gọng) hoặc 'LENS' (Tròng kính)
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const size = 20; // Tải 50 sản phẩm để tránh bị khuất ở trang sau

  const [openActionId, setOpenActionId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [modalType, setModalType] = useState('FRAME');

  // Đóng menu thao tác khi click ra ngoài
  useEffect(() => {
    const handleClickGlobal = () => setOpenActionId(null);
    window.addEventListener('click', handleClickGlobal);
    return () => window.removeEventListener('click', handleClickGlobal);
  }, []);

  // Delay tìm kiếm 500ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Reset trang khi đổi Tab hoặc đổi Trạng thái
  useEffect(() => {
    setPage(1);
  }, [activeTab, filterStatus]);

  // 2. QUERY PARAMETERS ĐỂ GỌI API
  const queryParams = useMemo(() => {
    const params = {
      page: page - 1,
      size,
      isManager: true,
    };
    if (debouncedSearch) params.search = debouncedSearch;
    if (filterStatus) params.status = filterStatus;
    return params;
  }, [debouncedSearch, page, size, filterStatus]);

  const { data, isLoading, isError, refetch } = useManagerProducts(queryParams);

  // 3. BỘ TRÍCH XUẤT DỮ LIỆU SIÊU CẤP (Quét mọi kiểu bọc dữ liệu của Backend)
  const rawProducts = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data.items && Array.isArray(data.items)) return data.items;
    if (data.result && Array.isArray(data.result)) return data.result;
    if (data.result?.items && Array.isArray(data.result.items)) return data.result.items;
    if (data.products && Array.isArray(data.products)) return data.products;
    if (data.data && Array.isArray(data.data)) return data.data;
    if (data.data?.items && Array.isArray(data.data.items)) return data.data.items;
    return [];
  }, [data]);

  // 4. LỌC THEO TAB Ở FRONTEND
  const products = useMemo(() => {
    return rawProducts.filter(p => {
      const cat = String(p.category || '').trim().toUpperCase();
      if (activeTab === 'LENS') {
        return cat === 'LENS';
      }
      return cat !== 'LENS';
    });
  }, [rawProducts, activeTab]);

  // 5. CÁC HÀM XỬ LÝ (MUTATIONS)
  const deleteMutation = useDeleteManagerProduct();
  const createMutation = useCreateManagerProduct();
  const updateMutation = useUpdateManagerProduct();

  // Kiểm tra trạng thái loading tổng thể của các API thay đổi dữ liệu
  const isMutating = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterStatus('');
    setPage(1);
  };

  const handleDeleteProduct = (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này không?')) {
      deleteMutation.mutate(id, { onSuccess: () => { setOpenActionId(null); refetch(); } });
    }
  };

  const handleOpenAddGlasses = () => {
    setEditingProduct(null);
    setModalType('FRAME');
    setIsModalOpen(true);
  };

  const handleOpenAddLens = () => {
    setEditingProduct(null);
    setModalType('LENS');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setModalType(product.category === 'LENS' ? 'LENS' : 'FRAME');
    setIsModalOpen(true);
    setOpenActionId(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleSubmit = (form) => {
    const finalProductData = { ...form.productData };
    if (modalType === 'LENS') finalProductData.category = 'LENS';

    if (editingProduct) {
      updateMutation.mutate(
        { id: editingProduct._id || editingProduct.id, payload: { productData: finalProductData, files: form.files } },
        { onSuccess: () => { handleCloseModal(); refetch(); } }
      );
    } else {
      createMutation.mutate(
        { productData: finalProductData, files: form.files },
        { onSuccess: () => { handleCloseModal(); refetch(); } }
      );
    }
  };

  // 6. CÁC HÀM TRỢ GIÚP UI
  const getCategoryBadge = (category) => {
    const cat = category?.toUpperCase() || '';
    if (cat === 'FRAME') return 'bg-zinc-100 text-zinc-900 border-zinc-200';
    if (cat === 'LENS') return 'bg-sky-50 text-sky-800 border-sky-200';
    return 'bg-zinc-50 text-zinc-500 border-zinc-200';
  };

  const getStatusBadge = (status) => {
    const s = status?.toUpperCase() || '';
    if (s === 'ACTIVE') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    return 'bg-zinc-100 text-zinc-500 border-zinc-200';
  };

  const categoryMap = { FRAME: 'Gọng kính', SUNGLASSES: 'Kính râm', LENS: 'Tròng kính' };

  const getDisplayImageUrl = (imgObj) => {
    if (!imgObj) return null;
    const url = typeof imgObj === 'string' ? imgObj : imgObj.imageUrl;
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${url}`;
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
            Phân loại rõ ràng Gọng kính và Tròng kính. Giúp bạn kiểm soát hàng hóa và biến thể một cách khoa học nhất.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto bg-white rounded-[2rem] border border-zinc-100 shadow-[0_10px_40px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col min-h-[600px]">

        {/* TABS ĐIỀU HƯỚNG */}
        <div className="flex items-center gap-6 px-8 border-b border-zinc-100 bg-zinc-50/30 overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setActiveTab('GLASSES')}
            className={`py-5 text-sm font-bold tracking-wide uppercase transition-all whitespace-nowrap border-b-2 ${activeTab === 'GLASSES' ? 'border-emerald-500 text-zinc-900' : 'border-transparent text-zinc-400 hover:text-zinc-600'}`}
          >
            Kính & Gọng (Frames)
          </button>
          <button
            onClick={() => setActiveTab('LENS')}
            className={`py-5 text-sm font-bold tracking-wide uppercase transition-all whitespace-nowrap border-b-2 ${activeTab === 'LENS' ? 'border-sky-500 text-zinc-900' : 'border-transparent text-zinc-400 hover:text-zinc-600'}`}
          >
            Tròng kính (Lenses)
          </button>
        </div>

        {/* TOOLBAR */}
        <div className="px-8 py-6 border-b border-zinc-100 bg-white flex flex-col lg:flex-row justify-between items-center gap-5 sticky top-0 z-10">
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <div className="relative w-full sm:w-[350px] group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-zinc-400 group-focus-within:text-emerald-500 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Tìm kiếm mã hoặc tên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-11 pr-4 py-3 border border-zinc-200 rounded-xl bg-zinc-50/50 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-medium"
              />
            </div>

            <div className="relative min-w-[160px]">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="block w-full pl-4 pr-10 py-3 border border-zinc-200 rounded-xl bg-zinc-50/50 text-zinc-600 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-medium appearance-none"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="ACTIVE">Đang hiển thị</option>
                <option value="INACTIVE">Đang ẩn</option>
              </select>
              <Filter className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            </div>
          </div>

          <div className="flex gap-3 w-full lg:w-auto">
            {activeTab === 'GLASSES' ? (
              <button
                onClick={handleOpenAddGlasses}
                className="w-full lg:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-xl text-sm font-bold tracking-wide hover:bg-emerald-600 transition-all shadow-lg active:scale-95"
              >
                <Plus className="w-5 h-5" /> Thêm Kính / Gọng
              </button>
            ) : (
              <button
                onClick={handleOpenAddLens}
                className="w-full lg:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-sky-600 text-white rounded-xl text-sm font-bold tracking-wide hover:bg-sky-500 transition-all shadow-lg active:scale-95"
              >
                <Plus className="w-5 h-5" /> Thêm Tròng Kính
              </button>
            )}
          </div>
        </div>

        {/* BẢNG SẢN PHẨM */}
        <div className="flex-1 overflow-x-auto custom-scrollbar">
          {isError && (
            <div className="flex flex-col items-center justify-center h-[400px]">
              <AlertCircle className="w-8 h-8 text-rose-500 mb-4" />
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
                  {activeTab !== 'LENS' && <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] w-[120px]">Hình ảnh</th>}
                  <th className="px-6 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Sản phẩm</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Giá bán</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] text-center">Danh mục</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] text-center">Trạng thái</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 bg-white">
                {products.length > 0
                  ? products.map((product, index) => (
                    <tr key={product._id || product.id} className="group hover:bg-zinc-50/80 transition-all duration-300">

                      {activeTab !== 'LENS' && (
                        <td className="px-8 py-6 align-middle">
                          <div className="w-16 h-16 rounded-2xl bg-zinc-100 border border-zinc-200/60 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                            {product.imageUrl && product.imageUrl.length > 0 ? (
                              <img src={getDisplayImageUrl(product.imageUrl[0])} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            ) : <ImageIcon className="w-6 h-6 text-zinc-300" />}
                          </div>
                        </td>
                      )}

                      <td className="px-6 py-6 align-middle">
                        <div className="flex flex-col gap-2">
                          <span
                            onClick={() => activeTab === 'GLASSES' && navigate(`/manager/products/${product._id || product.id}/variants`)}
                            className={`font-black text-zinc-900 text-base tracking-tight ${activeTab === 'GLASSES' ? 'hover:text-emerald-600 cursor-pointer' : ''}`}
                          >
                            {product.name}
                          </span>
                          <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                            Thương hiệu: {product.brand}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-6 align-middle">
                        <span className="font-bold text-zinc-900 text-sm">{(product.price || 0).toLocaleString('vi-VN')} ₫</span>
                      </td>

                      <td className="px-6 py-6 align-middle text-center">
                        <span className={`inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase border ${getCategoryBadge(product.category)}`}>
                          {categoryMap[product.category?.toUpperCase()] || 'Khác'}
                        </span>
                      </td>

                      <td className="px-6 py-6 align-middle text-center">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase border gap-1.5 ${getStatusBadge(product.status)}`}>
                          {product.status === 'ACTIVE' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>}
                          {product.status === 'ACTIVE' ? 'Hiển thị' : 'Đã ẩn'}
                        </span>
                      </td>

                      <td className="px-6 py-6 align-middle text-center">
                        <div className="flex items-center justify-center relative" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setOpenActionId(openActionId === (product._id || product.id) ? null : (product._id || product.id))}
                            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 ${openActionId === (product._id || product.id) ? 'bg-zinc-900 text-white shadow-lg' : 'text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100'}`}
                          >
                            <MoreHorizontal className="w-5 h-5" />
                          </button>

                          {openActionId === (product._id || product.id) && (
                            <div className={`absolute right-0 w-52 bg-white border border-zinc-100 rounded-2xl shadow-xl z-50 py-2 text-left animate-in fade-in zoom-in-95 duration-200 ${index >= products.length - 2 && index > 1 ? 'bottom-full mb-2 origin-bottom-right' : 'top-full mt-2 origin-top-right'}`}>
                              <div className="px-5 py-2 border-b border-zinc-50 mb-1">
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Thao tác</p>
                              </div>
                              {product.category !== 'LENS' && (
                                <button
                                  onClick={() => navigate(`/manager/products/${product._id || product.id}/variants`)}
                                  className="w-full px-5 py-2.5 text-sm text-zinc-600 hover:bg-zinc-50 hover:text-emerald-600 flex items-center gap-3 font-semibold"
                                >
                                  <Eye className="w-4 h-4" /> Quản lý Biến thể
                                </button>
                              )}
                              <button
                                onClick={() => handleOpenEdit(product)}
                                className="w-full px-5 py-2.5 text-sm text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 flex items-center gap-3 font-semibold"
                              >
                                <Edit className="w-4 h-4" /> Chỉnh sửa
                              </button>
                              <div className="h-px bg-zinc-100 my-1 mx-3"></div>
                              <button
                                onClick={() => handleDeleteProduct(product._id || product.id)}
                                className="w-full px-5 py-2.5 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-3 font-semibold"
                              >
                                <Trash2 className="w-4 h-4" /> Xóa vĩnh viễn
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                  : !isError && (
                    <tr>
                      <td colSpan={activeTab === 'LENS' ? 5 : 6} className="px-6 py-32 text-center">
                        <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                          <div className="w-24 h-24 bg-zinc-50 border border-zinc-100 rounded-[2rem] flex items-center justify-center mb-6">
                            <Package className="w-10 h-10 text-zinc-300" />
                          </div>
                          <h3 className="text-xl font-black text-zinc-900 mb-2">Không có dữ liệu</h3>
                          <p className="text-zinc-500 text-sm mb-8">Chưa có sản phẩm nào trong danh mục này hoặc không khớp với bộ lọc.</p>
                          <button onClick={handleClearFilters} className="px-8 py-3 bg-white border border-zinc-200 rounded-xl text-sm font-bold text-zinc-700 hover:bg-zinc-50 shadow-sm">Xóa bộ lọc</button>
                        </div>
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <ProductModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        product={editingProduct}
        isSubmitting={isMutating}
        initialType={modalType}
      />
    </div>
  );
};

export default ProductManagePage;