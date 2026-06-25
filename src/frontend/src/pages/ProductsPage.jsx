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
import { useCartStore } from '../feature/product/store/useCartStore'; // Hãy kiểm tra lại đường dẫn import này nếu báo lỗi
import { toast } from 'sonner';
import Breadcrumb from '../feature/product/components/Breadcrumb';

// HÀM XỬ LÝ LINK ẢNH CHO TRANG KHÁCH HÀNG (Chuẩn hóa URL)
const getDisplayImageUrl = (imgObj) => {
  const fallbackImg = 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=800';
  if (!imgObj) return fallbackImg;

  const url = typeof imgObj === 'string' ? imgObj : imgObj.imageUrl;
  if (!url) return fallbackImg;

  if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) return url;

  const apiURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  return `${apiURL}${url}`;
};

export default function ProductsPage() {
  const { addToCart } = useCartStore();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [searchParams] = useSearchParams();
  const initCategory = searchParams.get('category') || '';
  const initGender = searchParams.get('gender') || '';
  const initSearch = searchParams.get('search') || '';

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const limit = 9;

  const [search, setSearch] = useState(initSearch);
  const [category, setCategory] = useState(initCategory);
  const [gender, setGender] = useState(initGender);
  const [frameType, setFrameType] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const [showMobileFilters, setShowMobileFilters] = useState(false);

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
      const params = { page, limit, status: 'ACTIVE' };

      if (filterQuery.search) params.search = filterQuery.search;
      if (filterQuery.category) params.category = filterQuery.category;
      if (filterQuery.gender) params.gender = filterQuery.gender;
      if (filterQuery.frameType) params.frameType = filterQuery.frameType;
      if (filterQuery.minPrice) params.minPrice = filterQuery.minPrice;
      if (filterQuery.maxPrice) params.maxPrice = filterQuery.maxPrice;

      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/products`, { params });

      if (response.data && response.data.result) {
        setProducts(response.data.result.items || []);
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

  useEffect(() => {
    const freshCategory = searchParams.get('category') || '';
    const freshGender = searchParams.get('gender') || '';
    const freshSearch = searchParams.get('search') || '';

    setCategory(freshCategory);
    setGender(freshGender);
    setSearch(freshSearch);
    setPage(1);
    setFilterQuery({ search: freshSearch, category: freshCategory, gender: freshGender, frameType: '', minPrice: '', maxPrice: '' });
  }, [searchParams]);

  useEffect(() => {
    fetchProducts();
  }, [page, filterQuery]);

  const handleApplyQuickFilters = (newFilters) => {
    setPage(1);
    setFilterQuery(prev => ({ ...prev, ...newFilters }));
  };

  const handleApplyAllFilters = (e) => {
    if (e) e.preventDefault();
    setPage(1);
    setFilterQuery({ search, category, gender, frameType, minPrice, maxPrice });
    setShowMobileFilters(false);
  };

  const handleClearFilters = () => {
    setSearch(''); setCategory(''); setGender(''); setFrameType(''); setMinPrice(''); setMaxPrice(''); setPage(1);
    setFilterQuery({ search: '', category: '', gender: '', frameType: '', minPrice: '', maxPrice: '' });
    setShowMobileFilters(false);
  };

  const getSortedProducts = () => {
    let sortedList = [...products];
    if (sortBy === 'price-asc') sortedList.sort((a, b) => (a.price) - (b.price));
    else if (sortBy === 'price-desc') sortedList.sort((a, b) => (b.price) - (a.price));
    return sortedList;
  };

  // Cập nhật hàm Add to Cart để nhận đúng hình ảnh đã được phân giải
  const handleQuickAddToCart = (product, resolvedImage, e) => {
    e.preventDefault();
    e.stopPropagation();

    const variantId = product._id || product.id;
    const price = product.discountPrice || product.price;

    const cartPayload = {
      productId: variantId,
      name: `${product.name} (Mặc định)`,
      price: price,
      image: resolvedImage,
      quantity: 1,
      lensId: null,
      orderType: 'buy-now',
      prescription: null,
    };

    addToCart(cartPayload);
    toast.success(`Đã thêm ${product.name} vào giỏ hàng!`);
  };

  const breadcrumbItems = [{ label: 'Cửa hàng', link: '/products' }];

  const genders = [
    { id: '', label: 'Tất cả giới tính' },
    { id: 'MALE', label: 'Nam' },
    { id: 'FEMALE', label: 'Nữ' },
    { id: 'UNISEX', label: 'Unisex' }
  ];

  const sortedProducts = getSortedProducts();

  const getGenderBadge = (g) => {
    switch (g) {
      case 'MALE': return { text: 'Nam', className: 'bg-zinc-100 text-zinc-900 border-zinc-200' };
      case 'FEMALE': return { text: 'Nữ', className: 'bg-rose-50 text-rose-700 border-rose-200' };
      default: return { text: 'Unisex', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
  };

  // Luxury UI Classes
  const inputClass = "w-full border border-zinc-200 rounded-2xl px-4 py-3 text-sm font-medium text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 bg-zinc-50 hover:bg-white transition-all";

  return (
    <div className="min-h-screen bg-zinc-50 pb-24 pt-28 font-sans selection:bg-emerald-200 selection:text-emerald-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* HEADER & BREADCRUMB */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-10 border-b border-zinc-200/60 pb-6">
          <div>
            <Breadcrumb items={breadcrumbItems} />
            <h1 className="text-4xl font-black tracking-tight text-zinc-900 mt-4">Bộ Sưu Tập.</h1>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500">
            <span>Hiển thị <span className="font-black text-zinc-900">{totalElements}</span> sản phẩm</span>
            <div className="w-px h-4 bg-zinc-300 hidden sm:block"></div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Sắp xếp:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs font-bold text-zinc-900 border border-zinc-200 rounded-xl px-3 py-2 bg-white cursor-pointer focus:outline-none focus:border-emerald-500 hover:border-zinc-300 transition-colors"
              >
                <option value="newest">Mới nhất</option>
                <option value="price-asc">Giá: Thấp đến Cao</option>
                <option value="price-desc">Giá: Cao đến Thấp</option>
              </select>
            </div>
            {/* Nút lọc Mobile */}
            <button
              className="lg:hidden p-2 rounded-xl border border-zinc-200 bg-white text-zinc-900 shadow-sm"
              onClick={() => setShowMobileFilters(true)}
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* MAIN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">

          {/* SIDEBAR FILTERS (DESKTOP) */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-white border border-zinc-100 rounded-[2rem] p-8 shadow-[0_10px_40px_rgba(0,0,0,0.03)] sticky top-28 flex flex-col h-fit">
              <div className="flex justify-between items-center border-b border-zinc-100 pb-5 mb-6">
                <h3 className="text-lg font-black text-zinc-900">Bộ lọc</h3>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 hover:text-rose-500 transition-colors"
                >
                  Xóa tất cả
                </button>
              </div>

              <form onSubmit={handleApplyAllFilters} className="space-y-8">

                {/* Search */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Tìm kiếm</label>
                  <input
                    type="text"
                    placeholder="Tên sản phẩm..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      if (!e.target.value) handleApplyQuickFilters({ search: '' });
                    }}
                    className={inputClass}
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Giới tính</label>
                  <div className="flex flex-col gap-3">
                    {genders.map((g) => (
                      <label key={g.id} className="flex items-center gap-3 text-sm text-zinc-600 cursor-pointer group font-medium">
                        <input
                          type="radio"
                          name="gender"
                          value={g.id}
                          checked={gender === g.id}
                          onChange={(e) => setGender(e.target.value)}
                          className="w-4 h-4 text-emerald-600 border-zinc-300 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span className="group-hover:text-zinc-900 transition-colors">{g.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Khoảng giá (VND)</label>
                  <div className="flex items-center gap-3 mb-5">
                    <input type="number" placeholder="Từ" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className={inputClass} />
                    <span className="text-zinc-300 font-bold">-</span>
                    <input type="number" placeholder="Đến" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className={inputClass} />
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="w-full bg-zinc-900 hover:bg-emerald-600 text-white py-4 rounded-2xl text-sm font-bold tracking-wide transition-all shadow-xl hover:shadow-emerald-500/20 active:scale-95 mt-4"
                >
                  ÁP DỤNG BỘ LỌC
                </button>
              </form>
            </div>
          </div>

          {/* PRODUCTS LIST GRID */}
          <div className="col-span-1 lg:col-span-3">

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white rounded-[2rem] border border-zinc-100 p-4 space-y-4 animate-pulse shadow-sm">
                    <div className="aspect-[4/3] bg-zinc-100 rounded-2xl"></div>
                    <div className="space-y-3 px-2 pb-2">
                      <div className="h-3 bg-zinc-200 rounded-full w-1/3"></div>
                      <div className="h-5 bg-zinc-200 rounded-full w-3/4"></div>
                      <div className="h-5 bg-zinc-200 rounded-full w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="bg-white border border-rose-100 rounded-[2rem] p-16 text-center space-y-5 shadow-sm">
                <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Info className="w-10 h-10 text-rose-500" />
                </div>
                <h3 className="text-zinc-900 font-black text-xl">Đã có lỗi xảy ra</h3>
                <p className="text-zinc-500 font-medium">Không thể kết nối đến máy chủ để lấy sản phẩm.</p>
                <button onClick={fetchProducts} className="bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl px-8 py-3.5 text-sm font-bold transition-all shadow-lg active:scale-95">
                  Thử lại ngay
                </button>
              </div>
            ) : sortedProducts.length === 0 ? (
              <div className="bg-white rounded-[2rem] border border-zinc-100 p-20 text-center space-y-5 shadow-[0_10px_40px_rgba(0,0,0,0.03)]">
                <div className="w-24 h-24 bg-zinc-50 rounded-[2rem] flex items-center justify-center mx-auto mb-4 border border-zinc-100">
                  <SlidersHorizontal className="w-10 h-10 text-zinc-300" />
                </div>
                <h3 className="text-zinc-900 font-black text-2xl">Không tìm thấy sản phẩm</h3>
                <p className="text-zinc-500 font-medium max-w-sm mx-auto">Chúng tôi không tìm thấy kết quả nào trùng khớp với bộ lọc của bạn. Hãy thử nới lỏng các điều kiện tìm kiếm.</p>
                <button onClick={handleClearFilters} className="mt-4 bg-white border border-zinc-200 hover:border-zinc-900 text-zinc-900 rounded-2xl px-8 py-3.5 text-sm font-bold transition-all shadow-sm active:scale-95">
                  Xóa tất cả bộ lọc
                </button>
              </div>
            ) : (
              /* PRODUCT GRID */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                <AnimatePresence mode="popLayout">
                  {sortedProducts.map((p) => {
                    // LOGIC CHỌN ẢNH THÔNG MINH MỚI
                    const displayImageObj =
                      (p.variants && p.variants.length > 0 && p.variants[0].imageUrl?.length > 0)
                        ? p.variants[0].imageUrl[0]
                        : (p.imageUrl && p.imageUrl.length > 0)
                          ? p.imageUrl[0]
                          : null;

                    const itemImg = getDisplayImageUrl(displayImageObj);
                    const badge = getGenderBadge(p.gender);

                    return (
                      <motion.div
                        key={p._id || p.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.4 }}
                      >
                        <Link
                          to={`/products/${p._id || p.id}`}
                          className="bg-white rounded-[2rem] border border-zinc-100 hover:border-emerald-200 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(16,185,129,0.08)] hover:-translate-y-2 transition-all duration-500 group flex flex-col h-full overflow-hidden relative"
                        >
                          {/* Image Box */}
                          <div className="aspect-[4/3] bg-zinc-50/50 overflow-hidden relative flex items-center justify-center p-6 mix-blend-multiply">
                            {badge && (
                              <span className={`absolute top-4 left-4 z-10 text-[9px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest border ${badge.className}`}>
                                {badge.text}
                              </span>
                            )}
                            <img
                              src={itemImg}
                              alt={p.name}
                              className="object-contain w-full h-full group-hover:scale-110 transition-transform duration-700 ease-out drop-shadow-xl"
                            />
                          </div>

                          {/* Info Box */}
                          <div className="p-6 flex flex-col flex-grow bg-white relative z-10">
                            <p className="text-[10px] text-zinc-400 mb-2 font-black tracking-[0.2em] uppercase">
                              {p.brand}
                            </p>
                            <h4 className="font-black text-zinc-900 text-lg leading-snug line-clamp-2 mb-4 group-hover:text-emerald-600 transition-colors duration-300">
                              {p.name}
                            </h4>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-2 mb-6">
                              {p.shape && <span className="text-[10px] font-bold bg-zinc-100 text-zinc-600 px-2.5 py-1 rounded-lg">{p.shape}</span>}
                              {p.frameType && <span className="text-[10px] font-bold bg-zinc-100 text-zinc-600 px-2.5 py-1 rounded-lg">{p.frameType}</span>}
                            </div>

                            {/* Price & Action */}
                            <div className="mt-auto pt-4 border-t border-zinc-100 flex items-end justify-between">
                              <div className="flex flex-col">
                                {p.discountPrice && p.discountPrice < p.price && (
                                  <span className="text-xs text-zinc-400 line-through font-semibold mb-0.5">
                                    {(p.price).toLocaleString('vi-VN')} ₫
                                  </span>
                                )}
                                <p className="text-zinc-900 font-black text-xl tracking-tight">
                                  {(p.discountPrice || p.price).toLocaleString('vi-VN')} ₫
                                </p>
                              </div>

                              <button
                                onClick={(e) => handleQuickAddToCart(p, itemImg, e)}
                                className="w-10 h-10 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-400 group-hover:bg-zinc-900 group-hover:text-white group-hover:border-zinc-900 transition-all duration-300 active:scale-90"
                                title="Thêm vào giỏ hàng"
                              >
                                <ShoppingCart className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}

            {/* PAGINATION */}
            {!loading && totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-10 mt-10 border-t border-zinc-200/60">
                <button
                  type="button"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-zinc-200 text-zinc-400 hover:text-zinc-900 hover:border-zinc-300 disabled:opacity-30 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
                  <button
                    key={pNum}
                    type="button"
                    onClick={() => setPage(pNum)}
                    className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-bold transition-all ${page === pNum
                        ? 'bg-zinc-900 text-white shadow-lg shadow-zinc-900/20'
                        : 'bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-400'
                      }`}
                  >
                    {pNum}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-zinc-200 text-zinc-400 hover:text-zinc-900 hover:border-zinc-300 disabled:opacity-30 transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}