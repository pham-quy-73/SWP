import { Outlet } from 'react-router-dom';
import { ProfileSidebar } from '../components/ProfileSidebar';

export function ProfileLayout() {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-20 md:py-28 font-sans bg-gray-50/30">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-8 items-start">
        {/* Sidebar - Left Column */}
        <aside className="md:col-span-1 md:sticky md:top-28">
          <ProfileSidebar />
        </aside>
        {/* Content - Right Column */}
        <div className="md:col-span-3">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
