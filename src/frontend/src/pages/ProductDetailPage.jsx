import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ProductForm from '../feature/product/components/ProductForm';
import ProductGallery from '../feature/product/components/ProductGallery';
import ProductInfo from '../feature/product/components/ProductInfo';
import Breadcrumb from '../feature/product/components/Breadcrumb';
import ProductFeedback from '../feature/product/components/ProductFeedback';
import { Info, ArrowLeft } from 'lucide-react';

export default function ProductDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const safeId = productId || '';

  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  
  // STATE MỚI: Lưu trữ phiên bản (Màu sắc) mà khách hàng đang chọn
  const [selectedVariant, setSelectedVariant] = useState(null);

  useEffect(() => {
    if (!safeId) return;

    const fetchProduct = async () => {
      setIsLoading(true);
      setIsError(false);
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/products/${safeId}`);
        if (response.data) {
          const data = response.data.result || response.data;
          setProduct(data);
        } else {
          setIsError(true);
        }
      } catch (error) {
        console.error('Lỗi khi tải chi tiết sản phẩm:', error);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [safeId]);

  if (isError) {
    return (
      <div className="min-h-screen bg-zinc-50 pt-32 pb-20 flex items-center justify-center px-4 font-sans">
        <div className="bg-white border border-rose-100 rounded-[2rem] p-10 md:p-16 text-center space-y-6 shadow-[0_10px_40px_rgba(0,0,0,0.03)] max-w-lg w-full animate-in zoom-in-95 duration-500">
          <div className="w-24 h-24 bg-rose-50 rounded-[2rem] flex items-center justify-center mx-auto mb-4 border border-rose-100">
            <Info className="w-10 h-10 text-rose-500" />
          </div>
          <h3 className="text-zinc-900 font-black text-2xl tracking-tight">Không tìm thấy sản phẩm</h3>
          <p className="text-zinc-500 font-medium leading-relaxed">
            Sản phẩm này có thể đã ngừng kinh doanh, bị xóa hoặc đường dẫn không chính xác.
          </p>
          <button 
            onClick={() => navigate('/products')} 
            className="flex items-center justify-center gap-2 w-full bg-zinc-900 hover:bg-emerald-600 text-white rounded-2xl px-8 py-4 text-sm font-bold transition-all shadow-xl hover:shadow-emerald-500/20 active:scale-95 mt-4"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại Cửa hàng
          </button>
        </div>
      </div>
    );
  }

  const productName = product?.name || (isLoading ? 'Đang tải thông tin...' : `Sản phẩm #${safeId}`);
  const breadcrumbItems = [
    { label: 'Cửa hàng', link: '/products' },
    { label: productName, link: '' },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 pb-24 pt-28 font-sans selection:bg-emerald-200 selection:text-emerald-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 border-b border-zinc-200/60 pb-6">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          
          {/* CỘT TRÁI: Truyền selectedVariant vào Gallery để hiển thị ảnh của màu đang chọn */}
          <div className="lg:col-span-7">
            <div className="sticky top-28">
              <ProductGallery 
                product={product} 
                isLoading={isLoading} 
                selectedVariant={selectedVariant} 
              />
            </div>
          </div>

          {/* CỘT PHẢI: Truyền hàm onVariantChange vào Form để bắt sự kiện khách bấm chọn màu */}
          <div className="lg:col-span-5 space-y-8 flex flex-col">
            <ProductInfo product={product} isLoading={isLoading} />
            
            <div className="bg-white rounded-[2rem] p-6 sm:p-8 border border-zinc-100 shadow-[0_10px_40px_rgba(0,0,0,0.03)] relative z-10">
              <ProductForm 
                product={product} 
                isLoading={isLoading} 
                onVariantChange={setSelectedVariant}
              />
            </div>
          </div>
        </div>

        <div className="mt-24 pt-16 border-t border-zinc-200/60">
          <ProductFeedback productId={safeId} />
        </div>
      </div>
    </div>
  );
}