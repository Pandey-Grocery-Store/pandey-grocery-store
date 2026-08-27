import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import './DashboardLayout.css';

export default function DashboardLayout({ type = 'staff' }) {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className="dashboard-layout">
            <Sidebar type={type} collapsed={collapsed} setCollapsed={setCollapsed} />
            <main className={`dashboard-main ${collapsed ? 'collapsed' : ''}`}>
                <Outlet />
            </main>
        </div>
    );
}
