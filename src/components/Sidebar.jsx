import { NavLink, useLocation } from 'react-router-dom';
import { Package, ClipboardList, AlertTriangle, BarChart3, ShoppingBag, FileText, Users, UserCog, LogOut, ChevronLeft, ChevronRight, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const staffLinks = [
    { to: '/staff', icon: ClipboardList, label: 'Orders', end: true },
    { to: '/staff/products', icon: Package, label: 'Products' },
    { to: '/staff/inventory', icon: AlertTriangle, label: 'Inventory Alerts' },
];

const adminLinks = [
    { to: '/admin', icon: BarChart3, label: 'Overview', end: true },
    { to: '/admin/analytics', icon: ShoppingBag, label: 'Product Analytics' },
    { to: '/admin/reports', icon: FileText, label: 'Reports' },
    { to: '/admin/staff-activity', icon: Users, label: 'Staff Activity' },
    { to: '/admin/users', icon: UserCog, label: 'User Management' },
];

export default function Sidebar({ type = 'staff' }) {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const { user, logout } = useAuth();
    const location = useLocation();
    const links = type === 'admin' ? adminLinks : staffLinks;

    // Close mobile sidebar on route change
    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname]);

    return (
        <>
            {/* Mobile hamburger button */}
            <button className="sidebar-mobile-toggle" onClick={() => setMobileOpen(true)}>
                <Menu size={22} />
            </button>

            {/* Mobile backdrop */}
            {mobileOpen && (
                <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />
            )}

            <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    {!collapsed && (
                        <div className="sidebar-brand">
                            <img src="/favicon.svg" alt="Pandey Grocery Store" className="sidebar-brand-icon" width="32" height="32" />
                            <div>
                                <span className="sidebar-brand-name">Pandey Grocery Store</span>
                                <span className="sidebar-brand-role">{type === 'admin' ? 'Admin' : 'Staff'} Panel</span>
                            </div>
                        </div>
                    )}
                    <button className="sidebar-toggle sidebar-collapse-btn" onClick={() => setCollapsed(!collapsed)}>
                        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                    </button>
                    <button className="sidebar-toggle sidebar-close-btn" onClick={() => setMobileOpen(false)}>
                        <X size={18} />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {links.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            end={link.end}
                            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                            title={link.label}
                        >
                            <link.icon size={20} />
                            {!collapsed && <span>{link.label}</span>}
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    {user && !collapsed && (
                        <div className="sidebar-user">
                            <div className="sidebar-user-avatar">{user.name?.charAt(0)}</div>
                            <div className="sidebar-user-info">
                                <span className="sidebar-user-name">{user.name}</span>
                                <span className="sidebar-user-role">{user.role}</span>
                            </div>
                        </div>
                    )}
                    <button className="sidebar-link logout-link" onClick={logout} title="Back to Store">
                        <LogOut size={20} />
                        {!collapsed && <span>Back to Store</span>}
                    </button>
                </div>
            </aside>
        </>
    );
}

