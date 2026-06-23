import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import ProductForm from '../feature/product/components/ProductForm';
import ProductGallery from '../feature/product/components/ProductGallery';
import ProductInfo from '../feature/product/components/ProductInfo';
import Breadcrumb from '../feature/product/components/Breadcrumb';
import ProductFeedback from '../feature/product/components/ProductFeedback';

export default function ProductDetailPage() {
  const { productId } = useParams();
  const safeId = productId || '';

  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!safeId) return;

    const fetchProduct = async () => {
      setIsLoading(true);
      setIsError(false);
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/products/${safeId}`);
        // Endpoint trả về trực tiếp object product hoặc { result: product } hoặc response.data
        if (response.data) {
          // Bọc an toàn: đối chiếu format response từ Backend.
          // Thường API trả về: { success: true, count: X, items: [...] } hoặc trực tiếp đối tượng
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

  const productName = product?.name || (isLoading ? 'Đang tải...' : `Sản phẩm #${safeId}`);

  const breadcrumbItems = [
    { label: 'Cửa hàng', link: '/products' },
    { label: productName, link: '' },
  ];

  return (
    <div className="min-h-screen bg-white pb-20 pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 md:mb-8">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Cột Trái */}
          <div className="lg:col-span-7">
            <ProductGallery product={product} isLoading={isLoading} />
          </div>

          {/* Cột Phải */}
          <div className="lg:col-span-5 lg:sticky lg:top-28 space-y-8">
            <ProductInfo product={product} isLoading={isLoading} isError={isError} />
            <ProductForm product={product} isLoading={isLoading} />
          </div>
        </div>

        {/* Product Feedback Section */}
        <div className="mt-16 pt-8 border-t border-gray-200">
          <ProductFeedback productId={safeId} />
        </div>
      </div>
    </div>
  );
}
