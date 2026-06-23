import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Breadcrumb({ items }) {
  return (
    <nav className="flex items-center text-sm text-gray-500 mb-8 overflow-hidden whitespace-nowrap">
      <Link to="/" className="hover:text-gray-900 flex items-center gap-1">
        <Home className="w-4 h-4" /> Trang chủ
      </Link>

      {items.map((item, index) => (
        <div key={index} className="flex items-center">
          <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />

          {item.link ? (
            <Link to={item.link} className="hover:text-gray-900 font-medium">
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-900 font-semibold truncate max-w-[200px]">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}
