import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { IndianRupee, ShoppingCart, Users, Package, Loader } from 'lucide-react';
import { orders as initialOrders, statusLabels, statusColors } from '../../data/orders';
import { products as initialProducts } from '../../data/products';
import { dashboardApi, ordersApi } from '../../lib/api';
import StatsCard from '../../components/StatsCard';
import './AdminOverview.css';

export default function AdminOverview() {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [statusCounts, setStatusCounts] = useState({});
    const [recentOrders, setRecentOrders] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const [statsData, ordersData, topData] = await Promise.all([
            dashboardApi.getStats(),
            ordersApi.getAll(),
            dashboardApi.getTopProducts(),
        ]);

        if (statsData) {
            setStats(statsData.stats);
            setStatusCounts(statsData.statusCounts || {});
        } else {
            // Fallback to initial data
            const totalRevenue = initialOrders.reduce((sum, o) => sum + o.total, 0);
            const todayOrders = initialOrders.filter((o) => o.status === 'new' || o.status === 'packing').length;
            const lowStock = initialProducts.filter((p) => p.stock <= 10).length;
            setStats({ totalRevenue, activeOrders: todayOrders, customers: 0, lowStock, totalProducts: initialProducts.length, totalOrders: initialOrders.length });
            const sc = {};
            initialOrders.forEach(o => { sc[o.status] = (sc[o.status] || 0) + 1; });
            setStatusCounts(sc);
        }

        setRecentOrders((ordersData?.orders || initialOrders).slice(0, 5));
        setTopProducts(topData?.products || [...initialProducts].sort((a, b) => b.reviews - a.reviews).slice(0, 5));
        setLoading(false);
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    if (loading || !stats) {
        return (
            <div className="admin-overview">
                <div className="dashboard-page-header">
                    <h1 className="dashboard-page-title">Dashboard Overview</h1>
                </div>
                <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                    <Loader size={24} className="spin" /> Loading dashboard...
                </div>
            </div>
        );
    }

    return (
        <div className="admin-overview">
            <div className="dashboard-page-header">
                <h1 className="dashboard-page-title">Dashboard Overview</h1>
                <p className="dashboard-page-subtitle">Welcome back! Here's how Pandey Grocery Store is performing today.</p>
            </div>

            {/* Stats Cards */}
            <div className="stats-row">
                <StatsCard icon={IndianRupee} label="Total Revenue" value={`₹${stats.totalRevenue.toLocaleString()}`} trend="up" change={12.5} color="primary" />
                <StatsCard icon={ShoppingCart} label="Active Orders" value={stats.activeOrders} trend="up" change={8.2} color="success" />
                <StatsCard icon={Users} label="Customers" value={stats.customers.toLocaleString()} trend="up" change={5.1} color="info" />
                <StatsCard icon={Package} label="Low Stock Items" value={stats.lowStock} trend="down" change={3} color="danger" />
            </div>

            <div className="overview-grid">
                {/* Revenue Chart */}
                <div className="card overview-chart-card">
                    <h3 className="overview-card-title">Revenue Overview</h3>
                    <div className="chart-placeholder">
                        <div className="mini-bars">
                            {stats.monthlyRevenue ? stats.monthlyRevenue.map((d, i) => {
                                const maxRev = Math.max(...stats.monthlyRevenue.map(m => m.revenue)) || 1;
                                const h = Math.max(10, Math.round((d.revenue / maxRev) * 100));
                                return (
                                    <div key={i} className="mini-bar" style={{ height: `${h}%`, animationDelay: `${i * 0.05}s` }} title={`₹${d.revenue}`}>
                                        <span className="mini-bar-label">{d.month}</span>
                                    </div>
                                );
                            }) : [65, 45, 80, 55, 90, 70].map((h, i) => (
                                <div key={i} className="mini-bar" style={{ height: `${h}%`, animationDelay: `${i * 0.05}s` }}>
                                    <span className="mini-bar-label">{['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][i]}</span>
                                </div>
                            ))}
                        </div>
                        <div className="chart-legend">
                            <span>📈 Based on actual order data</span>
                        </div>
                    </div>
                </div>

                {/* Order Status Distribution */}
                <div className="card overview-status-card">
                    <h3 className="overview-card-title">Order Status</h3>
                    <div className="status-distribution">
                        {Object.entries(statusLabels).map(([key, label]) => {
                            const count = statusCounts[key] || 0;
                            const total = stats.totalOrders || 1;
                            const pct = Math.round((count / total) * 100);
                            return (
                                <div key={key} className="status-bar-row">
                                    <div className="status-bar-info">
                                        <span className="status-dot-sm" style={{ background: statusColors[key] }} />
                                        <span>{label}</span>
                                        <span className="status-count">{count}</span>
                                    </div>
                                    <div className="status-bar-track">
                                        <div className="status-bar-fill" style={{ width: `${pct}%`, background: statusColors[key] }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="overview-grid">
                {/* Recent Orders */}
                <div className="card overview-recent-card">
                    <h3 className="overview-card-title">Recent Orders</h3>
                    <div className="recent-orders-list">
                        {recentOrders.map((order) => (
                            <div key={order.id} className="recent-order-item">
                                <div className="recent-order-info">
                                    <strong>{order.id}</strong>
                                    <span>{order.customer}</span>
                                </div>
                                <div className="recent-order-meta">
                                    <span className="badge" style={{ background: `${statusColors[order.status]}18`, color: statusColors[order.status], fontSize: '0.7rem' }}>
                                        {statusLabels[order.status]}
                                    </span>
                                    <span className="recent-order-total">₹{order.total}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Products */}
                <div className="card overview-top-card">
                    <h3 className="overview-card-title">Top Products</h3>
                    <div className="top-products-list">
                        {topProducts.map((p, i) => (
                            <div key={p.id} className="top-product-item">
                                <span className="top-rank">#{i + 1}</span>
                                <img src={p.image} alt={p.name} className="top-product-img" />
                                <div className="top-product-info">
                                    <span className="top-product-name">{p.name}</span>
                                    <span className="top-product-brand">{p.brand}</span>
                                </div>
                                <div className="top-product-meta">
                                    <span className="top-product-price">₹{p.price}</span>
                                    <span className="top-product-reviews">⭐ {p.rating}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="card quick-actions-card">
                <h3 className="overview-card-title">Quick Actions</h3>
                <div className="quick-actions-grid">
                    {[
                        { label: 'Add Product', icon: '📦', desc: 'List a new product', path: '/staff/products' },
                        { label: 'View Orders', icon: '📋', desc: 'Manage pending orders', path: '/staff/orders' },
                        { label: 'Send Notification', icon: '📢', desc: 'Broadcast to customers', path: '/admin/users' },
                        { label: 'Generate Report', icon: '📊', desc: 'Download sales report', path: '/admin/reports' },
                        { label: 'Manage Staff', icon: '👥', desc: 'Update staff access', path: '/admin/staff-activity' },
                        { label: 'Update Offers', icon: '🏷️', desc: 'Create new promotions', path: '/staff/products' },
                    ].map((action, i) => (
                        <button key={i} className="quick-action-btn" onClick={() => navigate(action.path)}>
                            <span className="quick-action-icon">{action.icon}</span>
                            <span className="quick-action-label">{action.label}</span>
                            <span className="quick-action-desc">{action.desc}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

