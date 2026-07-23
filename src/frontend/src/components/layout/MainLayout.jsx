import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import MobileBottomNav from './MobileBottomNav';

export default function MainLayout() {
    return (
        <div className="min-h-screen flex flex-col bg-white">
            <Header />
            {/* pb-16 md:pb-0: chừa chỗ cho bottom nav trên mobile, desktop không đổi */}
            <main className="flex-grow pb-16 md:pb-0">
                <Outlet />
            </main>
            <Footer />
            <MobileBottomNav />
        </div>
    );
}