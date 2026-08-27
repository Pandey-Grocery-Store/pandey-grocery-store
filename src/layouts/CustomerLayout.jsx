import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FloatingButtons from '../components/FloatingButtons';
import MobileBottomNav from '../components/MobileBottomNav';

export default function CustomerLayout() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navbar />
            <main className="customer-main-content" style={{ flex: 1 }}>
                <Outlet />
            </main>
            <Footer />
            <FloatingButtons />
            <MobileBottomNav />
        </div>
    );
}
