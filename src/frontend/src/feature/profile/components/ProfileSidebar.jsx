import { NavLink } from 'react-router-dom';
import { User, Package, MapPin } from 'lucide-react';

const sidebarItems = [
  {
    title: 'Thông tin cá nhân',
    href: '/profile',
    icon: User,
    end: true,
  },
  {
    title: 'Đơn hàng của tôi',
    href: '/profile/orders',
    icon: Package,
  },
  {
    title: 'Sổ địa chỉ',
    href: '/profile/addresses',
    icon: MapPin,
  },
];

export function ProfileSidebar() {
  return (
    <nav className="flex flex-col space-y-1 bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
      {sidebarItems.map((item) => (
        <NavLink
          key={item.href}
          to={item.href}
          end={item.end}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all active:scale-[0.98]
             ${isActive
              ? 'bg-[#1e2575]/10 text-[#1e2575] font-bold shadow-xs'
              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
            }`
          }
        >
          <item.icon className="w-5 h-5" />
          {item.title}
        </NavLink>
      ))}
    </nav>
  );
}
