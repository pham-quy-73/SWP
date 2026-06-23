import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  SlidersHorizontal, 
  ChevronLeft, 
  ChevronRight, 
  ShoppingCart, 
  Eye, 
  X, 
  Info,
  Filter
} from 'lucide-react';
import { useCartStore } from '../feature/product/store/useCartStore';
import { toast } from 'sonner';
import Breadcrumb from '../feature/product/components/Breadcrumb';

export default function ProductsPage() {
  const { addToCart } = useCartStore();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  // URL Params initialization
  const [searchParams] = useSearchParams();
  const initCategory = searchParams.get('category') || '';
  const initGender = searchParams.get('gender') || '';
  const initSearch = searchParams.get('search') || '';

  // Page state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const limit = 9;

  // Filter states
  const [search, setSearch] = useState(initSearch);
  const [category, setCategory] = useState(initCategory);
  const [gender, setGender] = useState(initGender);
  const [frameType, setFrameType] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // client-opt choice: newest, price-asc, price-desc

  // Sidebar show/hide on mobile
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Buffer filter values (applied on clicking "Lọc" button to prevent typing stuttering)
  const [filterQuery, setFilterQuery] = useState({
    search: initSearch,
    category: initCategory,
    gender: initGender,
    frameType: '',
    minPrice: '',
    maxPrice: ''
  });

  const fetchProducts = async () => {
    setLoading(true);
    setError(false);
    try {
      const params = {
        page,
        limit,
        status: 'ACTIVE'
      };

      if (filterQuery.search) params.search = filterQuery.search;
      if (filterQuery.category) params.category = filterQuery.category;
      if (filterQuery.gender) params.gender = filterQuery.gender;
      if (filterQuery.frameType) params.frameType = filterQuery.frameType;
      if (filterQuery.minPrice) params.minPrice = filterQuery.minPrice;
      if (filterQuery.maxPrice) params.maxPrice = filterQuery.maxPrice;

      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/products`, { params });
      
      if (response.data && response.data.result) {
        setProducts(response.data.result.items || []);
        // Note: totalPages from API is result.totalPages
        setTotalPages(response.data.result.totalPages || 1);
        setTotalElements(response.data.result.totalElements || 0);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách sản phẩm:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // Sync state if URL query dynamically changes
  useEffect(() => {
    const freshCategory = searchParams.get('category') || '';
    const freshGender = searchParams.get('gender') || '';
    const freshSearch = searchParams.get('search') || '';

    setCategory(freshCategory);
    setGender(freshGender);
    setSearch(freshSearch);
    
    setPage(1);
    setFilterQuery({
      search: freshSearch,
      category: freshCategory,
      gender: freshGender,
      frameType: '',
      minPrice: '',
      maxPrice: ''
    });
  }, [searchParams]);

  // Trigger loading when filters or page change
  useEffect(() => {
    fetchProducts();
  }, [page, filterQuery]);

  // Handle instant search / category click
  const handleApplyQuickFilters = (newFilters) => {
    setPage(1);
    setFilterQuery(prev => ({ ...prev, ...newFilters }));
  };

  const handleApplyAllFilters = (e) => {
    if (e) e.preventDefault();
    setPage(1);
    setFilterQuery({
      search,
      category,
      gender,
      frameType,
      minPrice,
      maxPrice
    });
    setShowMobileFilters(false);
  };

  const handleClearFilters = () => {
    setSearch('');
    setCategory('');
    setGender('');
    setFrameType('');
    setMinPrice('');
    setMaxPrice('');
    setPage(1);
    setFilterQuery({
      search: '',
      category: '',
      gender: '',
      frameType: '',
      minPrice: '',
      maxPrice: ''
    });
    setShowMobileFilters(false);
  };

  // Client-side sorting because backend page limits may apply, but sorting is comfortable
  const getSortedProducts = () => {
    let sortedList = [...products];
    if (sortBy === 'price-asc') {
      sortedList.sort((a, b) => (a.price) - (b.price));
    } else if (sortBy === 'price-desc') {
      sortedList.sort((a, b) => (b.price) - (a.price));
    }
    // 'newest' corresponds to default API response order (descending createdAt)
    return sortedList;
  };

  const handleQuickAddToCart = (product, e) => {
    e.preventDefault(); // Stop navigation to detail page
    e.stopPropagation();

    // Default variant
    const variantId = product._id || product.id;
    const price = product.discountPrice || product.price;

    let safeProductImage = 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=800';
    if (Array.isArray(product.imageUrl) && product.imageUrl.length > 0) {
      safeProductImage = product.imageUrl[0].imageUrl;
    } else if (typeof product.image === 'string') {
      safeProductImage = product.image;
    } else if (typeof product.imageUrl === 'string') {
      safeProductImage = product.imageUrl;
    }

    const cartPayload = {
      productId: variantId,
      name: `${product.name} (Mặc định)`,
      price: price,
      image: safeProductImage,
      quantity: 1,
      lensId: null, // Default: no lens
      orderType: 'buy-now',
      prescription: null,
    };

    addToCart(cartPayload);
    toast.success(`Đã thêm ${product.name} vào giỏ hàng!`);
  };

  const breadcrumbItems = [
    { label: 'Cửa hàng', link: '/products' }
  ];

  const categories = [
    { id: '', label: 'Tất cả' },
    { id: 'FRAME', label: 'Gọng Kính' },
    { id: 'SUNGLASSES', label: 'Kính Râm' },
    { id: 'ACCESSORIES', label: 'Phụ Kiện' }
  ];

  const genders = [
    { id: '', label: 'Tất cả giới tính' },
    { id: 'MALE', label: 'Nam' },
    { id: 'FEMALE', label: 'Nữ' },
    { id: 'UNISEX', label: 'Unisex' }
  ];

  const frameTypes = [
    { id: '', label: 'Tất cả viền kính' },
    { id: 'Full-Rim', label: 'Nguyên khung (Full-Rim)' },
    { id: 'Semi-Rimless', label: 'Nửa khung (Semi-Rimless)' },
    { id: 'Rimless', label: 'Không khung (Rimless)' },
    { id: 'Other', label: 'Khác (Other)' }
  ];

  const sortedProducts = getSortedProducts();

  const getGenderBadge = (g) => {
    switch (g) {
      case 'MALE':
      case 'Nam':
        return {
          text: 'Nam',
          className: 'bg-blue-100/80 text-blue-700 border-blue-200'
        };
      case 'FEMALE':
      case 'Nữ':
        return {
          text: 'Nữ',
          className: 'bg-rose-100/80 text-rose-700 border-rose-200'
        };
      default:
        return {
          text: 'Unisex',
          className: 'bg-purple-100/80 text-purple-700 border-purple-200'
        };
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFB] pb-24 pt-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top breadcrumb & metadata row */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 border-b border-gray-200/60 pb-4">
          <Breadcrumb items={breadcrumbItems} />
          
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>
              Hiển thị <span className="font-extrabold text-gray-900">{totalElements}</span> sản phẩm
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Sắp xếp:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs font-bold text-gray-700 border border-gray-200 outline-none rounded-md px-3 py-1.5 bg-white cursor-pointer focus:border-teal-500"
              >
                <option value="newest">Mới nhất</option>
                <option value="price-asc">Giá: Thấp đến Cao</option>
                <option value="price-desc">Giá: Cao đến Thấp</option>
              </select>
            </div>
          </div>
        </div>

        {/* MAIN LAYOUT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* SIDEBAR FILTERS (DESKTOP) */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-white border rounded-xl p-5 shadow-sm sticky top-24 flex flex-col h-fit">
              <div className="flex justify-between items-center border-b pb-4 mb-6">
                <h3 className="text-lg font-bold text-gray-900">Bộ lọc</h3>
                <button 
                  type="button"
                  onClick={handleClearFilters}
                  className="text-xs text-gray-400 hover:text-red-500 transition font-bold"
                >
                  Xóa tất cả
                </button>
              </div>

              {/* FORM */}
              <form onSubmit={handleApplyAllFilters} className="space-y-6">
                
                {/* Search input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tìm kiếm</label>
                  <input
                    type="text"
                    placeholder="Tên sản phẩm..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      if (!e.target.value) handleApplyQuickFilters({ search: '' });
                    }}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 placeholder:text-gray-400 text-gray-700"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Giới tính</label>
                  <div className="flex flex-col gap-2">
                    {genders.map((g) => (
                      <label key={g.id} className="flex items-center gap-3 text-sm text-gray-600 cursor-pointer group">
                        <input
                          type="radio"
                          name="gender"
                          value={g.id}
                          checked={gender === g.id}
                          onChange={(e) => setGender(e.target.value)}
                          className="w-4 h-4 text-teal-600 border-gray-300 focus:ring-teal-500 cursor-pointer accent-teal-600"
                        />
                        <span>{g.label === 'Tất cả giới tính' ? 'Tất cả' : g.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Khoảng giá (VND)</label>
                  <div className="flex items-center gap-2 mb-4">
                    <input
                      type="number"
                      placeholder="Từ"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="w-full border rounded-md px-2 py-1.5 text-sm"
                    />
                    <span className="text-gray-400">-</span>
                    <input
                      type="number"
                      placeholder="Đến"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="w-full border rounded-md px-2 py-1.5 text-sm"
                    />
                  </div>
                  <div className="space-y-3">
                    <input
                      type="range"
                      min="0"
                      max="15000000"
                      step="100000"
                      value={minPrice || 0}
                      onChange={(e) => setMinPrice(Number(e.target.value))}
                      className="w-full accent-teal-600"
                    />
                    <input
                      type="range"
                      min="0"
                      max="15000000"
                      step="100000"
                      value={maxPrice || 15000000}
                      onChange={(e) => setMaxPrice(Number(e.target.value))}
                      className="w-full accent-teal-600"
                    />
                  </div>
                </div>

                {/* Submit filter button */}
                <button
                  type="submit"
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2.5 rounded-md font-semibold text-sm transition mt-6"
                >
                  Áp dụng bộ lọc
                </button>
              </form>
            </div>
          </div>

          {/* PRODUCTS LIST GRID */}
          <div className="col-span-1 lg:col-span-3 space-y-12">
            
            {/* LOADING STATE SKELETON */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4 animate-pulse">
                    <div className="aspect-[4/3] bg-zinc-100 rounded-xl"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-zinc-200 rounded w-1/3"></div>
                      <div className="h-4 bg-zinc-200 rounded w-3/4"></div>
                      <div className="h-4 bg-zinc-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-10 text-center space-y-4">
                <Info className="w-12 h-12 text-rose-500 mx-auto" />
                <h3 className="text-rose-900 font-bold text-lg">Đã có lỗi xảy ra</h3>
                <p className="text-rose-600 text-sm">Không thể kết nối đến máy chủ để lấy sản phẩm.</p>
                <button 
                  onClick={fetchProducts}
                  className="bg-rose-600 text-white rounded-full px-6 py-2 text-xs font-bold inline-block"
                >
                  Thử lại
                </button>
              </div>
            ) : sortedProducts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center space-y-4 shadow-sm">
                <SlidersHorizontal className="w-12 h-12 text-gray-300 mx-auto" />
                <h3 className="text-gray-800 font-bold text-lg">Không tìm thấy sản phẩm</h3>
                <p className="text-gray-400 text-sm">Chúng tôi không tìm thấy kết quả nào trùng khớp với bộ lọc của bạn.</p>
                <button
                  onClick={handleClearFilters}
                  className="bg-teal-650 hover:bg-teal-700 text-white rounded-full px-6 py-2.5 text-xs font-bold inline-block transition-colors"
                >
                  Xóa tất cả bộ lọc
                </button>
              </div>
            ) : (
              /* PRODUCT GRID */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                  {sortedProducts.map((p) => {
                    let images = [];
                    if (Array.isArray(p.imageUrl)) {
                      images = p.imageUrl.map((imgObj) => imgObj.imageUrl).filter(Boolean);
                    } else if (typeof p.image === 'string') {
                      images = [p.image];
                    } else if (typeof p.imageUrl === 'string') {
                      images = [p.imageUrl];
                    }
                    const itemImg = images.length > 0 ? images[0] : 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=800';
                    const badge = getGenderBadge(p.gender);

                    return (
                      <motion.div
                        key={p._id || p.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Link 
                          to={`/products/${p._id || p.id}`} 
                          className="bg-white rounded-2xl border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full overflow-hidden relative"
                        >
                          {/* Image container */}
                          <div className="aspect-[4/3] bg-gray-50 overflow-hidden relative flex items-center justify-center p-4">
                            {badge && (
                              <span className={`absolute top-3 left-3 z-10 backdrop-blur-md text-[10px] font-bold px-2.5 py-1.5 rounded-md shadow-sm border uppercase tracking-wider ${badge.className}`}>
                                {badge.text}
                              </span>
                            )}

                            <img
                              src={itemImg}
                              alt={p.name}
                              className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-500 ease-out"
                              onError={(e) => {
                                e.currentTarget.src = 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=800';
                                e.currentTarget.onerror = null;
                              }}
                            />
                          </div>

                          {/* Info */}
                          <div className="p-4 flex flex-col flex-grow">
                            <p className="text-[11px] text-gray-400 mb-1.5 font-bold tracking-widest uppercase">
                              {p.brand}
                            </p>
                            <h4 className="font-semibold text-gray-900 leading-tight line-clamp-2 mb-3 group-hover:text-teal-650 transition-colors duration-250">
                              {p.name}
                            </h4>
                            
                            {/* Tags */}
                            <div className="flex flex-wrap gap-1.5 mb-4">
                              {p.shape && (
                                <span className="text-[11px] font-medium bg-gray-100/80 text-gray-600 px-2 py-1 rounded-md">
                                  {p.shape}
                                </span>
                              )}
                              {p.frameMaterial && (
                                <span className="text-[11px] font-medium bg-gray-100/80 text-gray-600 px-2 py-1 rounded-md">
                                  {p.frameMaterial}
                                </span>
                              )}
                              {p.frameType && (
                                <span className="text-[11px] font-medium bg-gray-100/80 text-gray-600 px-2 py-1 rounded-md">
                                  {p.frameType}
                                </span>
                              )}
                            </div>

                            {/* Price Section */}
                            <div className="mt-auto pt-2 border-t border-gray-50 flex items-center justify-between">
                              <div className="flex flex-col">
                                <p className="text-teal-700 font-bold text-base">
                                  {(p.discountPrice || p.price).toLocaleString('vi-VN')} ₫
                                </p>
                              </div>
                              <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                                </svg>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}

            {/* PAGINATION CONTROLS */}
            {!loading && totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-10 h-10 flex items-center justify-center border border-gray-250 rounded-full bg-white hover:bg-teal-600 hover:text-white hover:border-teal-600 disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-gray-450 disabled:hover:border-gray-250 transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
                  <button
                    key={pNum}
                    type="button"
                    onClick={() => setPage(pNum)}
                    className={`w-10 h-10 flex items-center justify-center rounded-full text-xs font-bold transition-all cursor-pointer ${
                      page === pNum
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'border border-gray-250 bg-white hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {pNum}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-10 h-10 flex items-center justify-center border border-gray-250 rounded-full bg-white hover:bg-teal-600 hover:text-white hover:border-teal-600 disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-gray-450 disabled:hover:border-gray-250 transition-all cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE FILTERS SIDEBAR OVERLAY */}
      <AnimatePresence>
        {showMobileFilters && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileFilters(false)}
              className="fixed inset-0 bg-black z-50 lg:hidden"
            />
            {/* Context sheet */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-80 max-w-[90%] bg-white z-50 p-6 flex flex-col justify-between shadow-2xl overflow-y-auto lg:hidden"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900">Bộ lọc</h3>
                  <button onClick={() => setShowMobileFilters(false)}>
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Form fields */}
                <div className="space-y-5">
                  {/* Search input */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-700">Tìm kiếm</label>
                    <input
                      type="text"
                      placeholder="Tên sản phẩm..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 placeholder:text-gray-450"
                    />
                  </div>

                  {/* Gender selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-700">Giới tính</label>
                    <div className="flex flex-col gap-2">
                      {genders.map((g) => (
                        <label key={g.id} className="flex items-center gap-3 text-sm text-gray-600 cursor-pointer group">
                          <input
                            type="radio"
                            name="gender-mobile"
                            value={g.id}
                            checked={gender === g.id}
                            onChange={(e) => setGender(e.target.value)}
                            className="w-4 h-4 text-teal-655 border-gray-300 focus:ring-teal-500 cursor-pointer accent-teal-600"
                          />
                          <span>{g.label === 'Tất cả giới tính' ? 'Tất cả' : g.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Price inputs */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-700">Khoảng giá (VND)</label>
                    <div className="flex items-center gap-2 mb-4">
                      <input
                        type="number"
                        placeholder="Từ"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        className="w-full border rounded-md px-2 py-1.5 text-sm"
                      />
                      <span className="text-gray-400">-</span>
                      <input
                        type="number"
                        placeholder="Đến"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        className="w-full border rounded-md px-2 py-1.5 text-sm"
                      />
                    </div>
                    <div className="space-y-3">
                      <input
                        type="range"
                        min="0"
                        max="15000000"
                        step="100000"
                        value={minPrice || 0}
                        onChange={(e) => setMinPrice(Number(e.target.value))}
                        className="w-full accent-teal-600"
                      />
                      <input
                        type="range"
                        min="0"
                        max="15000000"
                        step="100000"
                        value={maxPrice || 15000000}
                        onChange={(e) => setMaxPrice(Number(e.target.value))}
                        className="w-full accent-teal-600"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 space-y-2 border-t border-gray-100 mt-6 animate-[fadeIn_0.3s]">
                <button
                  onClick={handleApplyAllFilters}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2.5 rounded-md font-bold text-sm tracking-wider uppercase transition-colors shadow-md"
                >
                  Áp dụng
                </button>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="w-full border border-gray-200 text-gray-500 py-2.5 rounded-md font-bold text-sm tracking-wider uppercase transition-colors bg-white hover:bg-gray-50"
                >
                  Xóa bộ lọc
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
