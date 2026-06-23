import { Link } from 'react-router-dom';
// ĐÃ SỬA: Thay thế các icon thương hiệu bằng các icon liên lạc chuẩn
import { Globe, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-zinc-100 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
        <div className="col-span-1 md:col-span-1">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-6 h-6 bg-zinc-900 rounded flex items-center justify-center"><span className="text-white font-bold text-[10px]">O</span></div>
            <span className="font-black tracking-tighter text-zinc-900">OPTICSTORE</span>
          </div>
          <p className="text-zinc-500 text-sm leading-relaxed mb-6">
            Định nghĩa lại phong cách qua góc nhìn thời thượng. Chúng tôi kết hợp kỹ thuật chế tác thủ công với công nghệ hiện đại.
          </p>
          <div className="flex gap-4">
            {/* ĐÃ SỬA: Sử dụng mảng icon mới */}
            {[Globe, Mail, Phone, MapPin].map((Icon, i) => (
              <a key={i} href="#" className="w-8 h-8 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-400 hover:bg-zinc-900 hover:text-white transition-all">
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-bold text-zinc-900 mb-6 uppercase tracking-widest text-xs">Mua sắm</h4>
          <ul className="space-y-4 text-sm text-zinc-500">
            <li><Link to="/products" className="hover:text-emerald-600 transition-colors">Tất cả kính</Link></li>
            <li><Link to="/products" className="hover:text-emerald-600 transition-colors">Sản phẩm mới</Link></li>
            <li><Link to="/products" className="hover:text-emerald-600 transition-colors">Kính chống ánh sáng xanh</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-zinc-900 mb-6 uppercase tracking-widest text-xs">Hỗ trợ</h4>
          <ul className="space-y-4 text-sm text-zinc-500">
            <li><a href="#" className="hover:text-emerald-600 transition-colors">Theo dõi đơn hàng</a></li>
            <li><a href="#" className="hover:text-emerald-600 transition-colors">Đổi / Trả hàng</a></li>
            <li><a href="#" className="hover:text-emerald-600 transition-colors">Trung tâm trợ giúp</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-zinc-900 mb-6 uppercase tracking-widest text-xs">Pháp lý</h4>
          <ul className="space-y-4 text-sm text-zinc-500">
            <li><a href="#" className="hover:text-emerald-600 transition-colors">Chính sách bảo mật</a></li>
            <li><a href="#" className="hover:text-emerald-600 transition-colors">Điều khoản sử dụng</a></li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-zinc-100 text-center">
        <p className="text-zinc-400 text-[10px] uppercase tracking-[0.2em]">© 2026 OPTICSTORE. DESIGNED FOR PREMIUM VISION.</p>
      </div>
    </footer>
  );
}