import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { IndianRupee, ShoppingCart, Users, Package, Loader, ChevronRight, Edit3, Save, X, Trash2, RefreshCw } from 'lucide-react';
import { statusLabels, statusColors, orderStatuses } from '../../data/orders';
import { dashboardApi, ordersApi, productsApi } from '../../lib/api';
import StatsCard from '../../components/StatsCard';
import './AdminOverview.css';

export default function AdminOverview() {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [statusCounts, setStatusCounts] = useState({});
    const [recentOrders, setRecentOrders] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingProductId, setEditingProductId] = useState(null);
    const [editData, setEditData] = useState({});
    const [saving, setSaving] = useState(false);

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
            setStats({ totalRevenue: 0, activeOrders: 0, customers: 0, lowStock: 0, totalProducts: 0, totalOrders: 0 });
            setStatusCounts({});
        }

        setRecentOrders((ordersData?.orders || []).slice(0, 8));
        setTopProducts(topData?.products || []);
        setLoading(false);
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // ── Order CRUD: Update Status ──
    const updateOrderStatus = async (order, newStatus) => {
        setSaving(true);
        try {
            await ordersApi.updateStatus(order.dbId || order.id, newStatus);
            setRecentOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: newStatus } : o));
            // Refresh stats
            const statsData = await dashboardApi.getStats();
            if (statsData) {
                setStats(statsData.stats);
                setStatusCounts(statsData.statusCounts || {});
            }
        } catch (err) {
            console.error('Failed to update order status:', err);
        }
        setSaving(false);
    };

    const getNextStatus = (current) => {
        const idx = orderStatuses.indexOf(current);
        return idx < orderStatuses.length - 1 ? orderStatuses[idx + 1] : null;
    };

    // ── Product CRUD: Inline Edit ──
    const startEditProduct = (product) => {
        setEditingProductId(product.id);
        setEditData({ price: product.price, stock: product.stock });
    };

    const cancelEditProduct = () => {
        setEditingProductId(null);
        setEditData({});
    };

    const saveEditProduct = async (id) => {
        setSaving(true);
        try {
            await productsApi.update(id, { price: Number(editData.price), stock: Number(editData.stock) });
            setTopProducts(prev => prev.map(p => p.id === id ? { ...p, price: Number(editData.price), stock: Number(editData.stock) } : p));
        } catch (err) {
            console.error('Failed to update product:', err);
        }
        setEditingProductId(null);
        setSaving(false);
    };

    const deleteProduct = async (id) => {
        if (!confirm('Are you sure you want to deactivate this product?')) return;
        setSaving(true);
        try {
            await productsApi.delete(id);
            setTopProducts(prev => prev.filter(p => p.id !== id));
            // Refresh stats
            const statsData = await dashboardApi.getStats();
            if (statsData) setStats(statsData.stats);
        } catch (err) {
            console.error('Failed to delete product:', err);
        }
        setSaving(false);
    };

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
                <div>
                    <h1 className="dashboard-page-title">Dashboard Overview</h1>
                    <p className="dashboard-page-subtitle">Welcome back! Here's how Pandey Grocery Store is performing today.</p>
                </div>
                <button className="btn btn-outline" onClick={fetchData} disabled={saving} style={{ gap: '0.4rem' }}>
                    <RefreshCw size={16} className={saving ? 'spin' : ''} /> Refresh
                </button>
            </div>

            {/* Stats Cards */}
            <div className="stats-row">
                <StatsCard icon={IndianRupee} label="Total Revenue" value={`₹${stats.totalRevenue.toLocaleString()}`} color="primary" />
                <StatsCard icon={ShoppingCart} label="Active Orders" value={stats.activeOrders} color="success" />
                <StatsCard icon={Users} label="Customers" value={stats.customers.toLocaleString()} color="info" />
                <StatsCard icon={Package} label="Low Stock Items" value={stats.lowStock} color="danger" />
            </div>

            <div className="overview-grid">
                {/* Revenue Chart */}
                <div className="card overview-chart-card">
                    <h3 className="overview-card-title">Revenue Overview (Last 6 Months)</h3>
                    <div className="chart-placeholder">
                        <div className="mini-bars">
                            {stats.monthlyRevenue ? stats.monthlyRevenue.map((d, i) => {
                                const maxRev = Math.max(...stats.monthlyRevenue.map(m => m.revenue)) || 1;
                                const h = Math.max(10, Math.round((d.revenue / maxRev) * 100));
                                return (
                                    <div key={i} className="mini-bar" style={{ height: `${h}%`, animationDelay: `${i * 0.05}s` }} title={`₹${d.revenue.toLocaleString()}`}>
                                        <span className="mini-bar-value">₹{d.revenue >= 1000 ? `${(d.revenue / 1000).toFixed(1)}k` : d.revenue}</span>
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
                            <span>📈 Total: ₹{stats.totalRevenue.toLocaleString()} from {stats.totalOrders} orders</span>
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
                {/* Recent Orders with CRUD */}
                <div className="card overview-recent-card">
                    <div className="card-header-row">
                        <h3 className="overview-card-title">Recent Orders</h3>
                        <button className="btn btn-sm btn-outline" onClick={() => navigate('/staff/orders')}>
                            View All <ChevronRight size={14} />
                        </button>
                    </div>
                    <div className="recent-orders-list">
                        {recentOrders.map((order) => {
                            const nextStatus = getNextStatus(order.status);
                            return (
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
                                        {nextStatus && (
                                            <button
                                                className="btn btn-xs btn-success"
                                                onClick={() => updateOrderStatus(order, nextStatus)}
                                                disabled={saving}
                                                title={`Move to ${statusLabels[nextStatus]}`}
                                            >
                                                → {statusLabels[nextStatus]}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Top Products with CRUD */}
                <div className="card overview-top-card">
                    <div className="card-header-row">
                        <h3 className="overview-card-title">Top Products</h3>
                        <button className="btn btn-sm btn-outline" onClick={() => navigate('/staff/products')}>
                            Manage All <ChevronRight size={14} />
                        </button>
                    </div>
                    <div className="top-products-list">
                        {topProducts.map((p, i) => (
                            <div key={p.id} className="top-product-item">
                                <span className="top-rank">#{i + 1}</span>
                                <img src={p.image} alt={p.name} className="top-product-img" />
                                <div className="top-product-info">
                                    <span className="top-product-name">{p.name}</span>
                                    <span className="top-product-brand">{p.brand}</span>
                                </div>
                                {editingProductId === p.id ? (
                                    <div className="top-product-edit">
                                        <div className="edit-field">
                                            <label>₹</label>
                                            <input type="number" value={editData.price} onChange={e => setEditData(d => ({ ...d, price: e.target.value }))} className="edit-input" />
                                        </div>
                                        <div className="edit-field">
                                            <label>Stock</label>
                                            <input type="number" value={editData.stock} onChange={e => setEditData(d => ({ ...d, stock: e.target.value }))} className="edit-input" />
                                        </div>
                                        <button className="btn btn-xs btn-success" onClick={() => saveEditProduct(p.id)} disabled={saving}><Save size={12} /></button>
                                        <button className="btn btn-xs btn-outline" onClick={cancelEditProduct}><X size={12} /></button>
                                    </div>
                                ) : (
                                    <div className="top-product-meta">
                                        <span className="top-product-price">₹{p.price}</span>
                                        <span className="top-product-stock" style={{ color: p.stock <= 10 ? '#ef4444' : '#16a34a' }}>
                                            {p.stock <= 10 ? `⚠️ ${p.stock}` : `✅ ${p.stock}`}
                                        </span>
                                        <div className="product-actions">
                                            <button className="btn btn-xs btn-outline" onClick={() => startEditProduct(p)} title="Edit"><Edit3 size={12} /></button>
                                            <button className="btn btn-xs btn-danger-outline" onClick={() => deleteProduct(p.id)} title="Delete"><Trash2 size={12} /></button>
                                        </div>
                                    </div>
                                )}
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
                        { label: 'Manage Users', icon: '👥', desc: 'User roles & access', path: '/admin/users' },
                        { label: 'Generate Report', icon: '📊', desc: 'Download sales report', path: '/admin/reports' },
                        { label: 'Staff Activity', icon: '📡', desc: 'Monitor staff actions', path: '/admin/staff-activity' },
                        { label: 'Inventory', icon: '🏷️', desc: 'Stock management', path: '/staff/inventory' },
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
