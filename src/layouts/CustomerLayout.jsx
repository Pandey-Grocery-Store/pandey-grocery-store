import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FloatingButtons from '../components/FloatingButtons';
import MobileBottomNav from '../components/MobileBottomNav';

export default function CustomerLayout() {
    return (
        <div className="customer-layout-wrapper">
            <Navbar />
            <main className="customer-main-content">
                <Outlet />
            </main>
            <Footer />
            <FloatingButtons />
            <MobileBottomNav />
        </div>
    );
}
