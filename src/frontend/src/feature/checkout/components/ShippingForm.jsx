import { useState } from 'react';
import { useCheckoutStore } from '../store/useCheckoutStore';
import { MapPin, Phone, Truck, LocateFixed, Loader2, Map as MapIcon, User } from 'lucide-react';
import { toast } from 'sonner';

const Input = ({ className, ...props }) => (
  <input
    className={`file:text-foreground placeholder:text-gray-400 border border-gray-200 h-9 w-full min-w-0 rounded-xl bg-transparent px-3 py-1 text-base transition-all outline-none disabled:pointer-events-none disabled:opacity-50 md:text-sm focus:border-[#4A8795] focus:ring-[#4A8795]/20 focus:ring-1 ${className || ''}`}
    {...props}
  />
);

export const ShippingForm = () => {
  const { shippingData, updateShippingData } = useCheckoutStore();
  const [isLocating, setIsLocating] = useState(false);
  const [coords, setCoords] = useState(null);

  // 1. Hàm tìm tọa độ bằng GPS
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Trình duyệt của bạn không hỗ trợ định vị.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          setCoords({ lat: latitude, lng: longitude });

          // Dịch tọa độ -> Chữ
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
          );
          if (!response.ok) throw new Error('Lỗi mạng khi gọi API');

          const data = await response.json();
          if (data && data.display_name) {
            updateShippingData({ address: data.display_name });
            toast.success('Đã cắm cờ vị trí của bạn trên bản đồ!');
          } else {
            toast.error('Không tìm thấy tên đường cho vị trí này.');
          }
        } catch (error) {
          console.error(error);
          toast.error('Có lỗi xảy ra khi phân tích địa chỉ.');
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setIsLocating(false);
        toast.error('Không thể lấy vị trí hiện tại.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  // 2. Hàm tìm tọa độ khi người dùng GÕ TAY địa chỉ
  const handleAddressBlur = async () => {
    if (!shippingData.address || shippingData.address.trim() === '') {
      setCoords(null);
      return;
    }

    try {
      // Dịch Chữ -> Tọa độ
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(shippingData.address)}&limit=1`,
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setCoords({ lat: parseFloat(lat), lng: parseFloat(lon) });
      } else {
        setCoords(null);
      }
    } catch (error) {
      console.error('Lỗi khi tìm vị trí từ địa chỉ gõ tay:', error);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* HEADER */}
      <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
        <div className="p-2.5 bg-[#4A8795]/10 rounded-xl">
          <Truck className="w-5 h-5 text-[#4A8795]" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Thông tin giao hàng</h2>
          <p className="text-xs text-gray-500 mt-0.5 font-medium">
            Vui lòng điền chính xác để chúng tôi giao hàng nhanh nhất
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {/* TRƯỜNG NHẬP TÊN NGƯỜI NHẬN */}
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-sm font-semibold text-gray-700 ml-1">
            Họ và tên người nhận <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <User className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              id="name"
              type="text"
              placeholder="Nguyễn Văn A"
              className="pl-10 h-12 bg-gray-50/50 border-gray-200 focus:border-[#4A8795] focus:bg-white transition-all text-sm font-medium"
              value={shippingData.name || ''}
              onChange={(e) => updateShippingData({ name: e.target.value })}
            />
          </div>
        </div>

        {/* TRƯỜNG NHẬP ĐỊA CHỈ */}
        <div className="space-y-2">
          <label htmlFor="address" className="text-sm font-semibold text-gray-700 ml-1">
            Địa chỉ nhận hàng <span className="text-red-500">*</span>
          </label>
          <div className="relative flex items-center">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <MapPin className="h-4 w-4 text-gray-400" />
            </div>

            <Input
              id="address"
              placeholder="Nhập địa chỉ hoặc bấm nút bên phải 👉"
              className="pl-10 pr-12 h-12 bg-gray-50/50 border-gray-200 focus:border-[#4A8795] focus:bg-white transition-all text-sm"
              value={shippingData.address || ''}
              onChange={(e) => updateShippingData({ address: e.target.value })}
              onBlur={handleAddressBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddressBlur();
              }}
            />

            <div className="absolute inset-y-0 right-1 flex items-center">
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={isLocating}
                className="p-2 text-[#4A8795] hover:bg-[#4A8795]/10 rounded-lg transition-colors disabled:opacity-50 group"
              >
                {isLocating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <LocateFixed className="w-5 h-5 group-hover:scale-110" />
                )}
              </button>
            </div>
          </div>

          {/* BẢN ĐỒ IFRAME */}
          {coords && (
            <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-top-2 duration-500">
              <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center gap-2">
                <MapIcon className="w-4 h-4 text-[#4A8795]" />
                <span className="text-xs font-semibold text-gray-600">
                  Vị trí giao hàng dự kiến
                </span>
              </div>
              <iframe
                title="Map"
                width="100%"
                height="200"
                frameBorder="0"
                scrolling="no"
                marginHeight={0}
                marginWidth={0}
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${coords.lng - 0.005},${coords.lat - 0.005},${coords.lng + 0.005},${coords.lat + 0.005}&layer=mapnik&marker=${coords.lat},${coords.lng}`}
                className="w-full grayscale-[20%] hover:grayscale-0 transition-all duration-500"
              ></iframe>
            </div>
          )}
        </div>

        {/* TRƯỜNG NHẬP SỐ ĐIỆN THOẠI */}
        <div className="space-y-1.5">
          <label htmlFor="phone" className="text-sm font-semibold text-gray-700 ml-1">
            Số điện thoại liên hệ <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Phone className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              id="phone"
              type="tel"
              placeholder="0912 345 678"
              className="pl-10 h-12 bg-gray-50/50 border-gray-200 focus:border-[#4A8795] focus:bg-white transition-all text-sm font-medium"
              value={shippingData.phone || ''}
              onChange={(e) => updateShippingData({ phone: e.target.value })}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
