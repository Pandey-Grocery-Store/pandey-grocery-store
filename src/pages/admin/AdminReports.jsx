import { useState, useEffect, useCallback } from 'react';
import { Download, FileText, Calendar, Loader } from 'lucide-react';
import { statusLabels } from '../../data/orders';
import { ordersApi, productsApi, adminApi, dashboardApi } from '../../lib/api';
import './AdminReports.css';

export default function AdminReports() {
    const [reportType, setReportType] = useState('sales');
    const [dateRange, setDateRange] = useState('this-month');
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const [ordData, prodData, userData, statsData] = await Promise.all([
            ordersApi.getAll(),
            productsApi.getAll(),
            adminApi.getUsers().catch(() => null),
            dashboardApi.getStats().catch(() => null),
        ]);
        setOrders(ordData?.orders || []);
        setProducts(prodData?.products || []);
        setUsers(userData?.users || []);
        if (statsData) setStats(statsData.stats);
        setLoading(false);
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const avgOrderValue = orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0;
    const totalItems = orders.reduce((sum, o) => sum + (o.items || []).reduce((s, i) => s + (i.qty || i.quantity || 1), 0), 0);

    const reports = [
        { id: 'sales', label: 'Sales Report', icon: '💰', desc: 'Revenue, orders, and transaction details' },
        { id: 'inventory', label: 'Inventory Report', icon: '📦', desc: 'Stock levels, reorder alerts, and movement' },
        { id: 'customer', label: 'Customer Report', icon: '👥', desc: 'Customer activity and roles' },
        { id: 'product', label: 'Product Report', icon: '🏷️', desc: 'Top sellers, low stock, and pricing' },
    ];

    // Export CSV helper
    const exportCSV = () => {
        let csv = '';
        let filename = '';
        
        if (reportType === 'sales') {
            csv = 'Order ID,Customer,Items,Amount,Payment,Status\n';
            orders.forEach(o => {
                csv += `${o.id},"${o.customer}",${(o.items || []).length},${o.total},${o.payment || 'N/A'},${statusLabels[o.status] || o.status}\n`;
            });
            filename = 'sales_report.csv';
        } else if (reportType === 'inventory') {
            csv = 'Product,Brand,Category,Price,MRP,Stock,Status\n';
            products.forEach(p => {
                const status = p.stock === 0 ? 'Out of Stock' : p.stock <= 10 ? 'Low Stock' : 'In Stock';
                csv += `"${p.name}","${p.brand}","${p.category}",${p.price},${p.mrp || p.price},${p.stock},${status}\n`;
            });
            filename = 'inventory_report.csv';
        } else if (reportType === 'customer') {
            csv = 'Name,Email,Role,Provider\n';
            users.forEach(u => {
                csv += `"${u.name || 'N/A'}","${u.email}",${u.role},${u.provider || 'Local'}\n`;
            });
            filename = 'customer_report.csv';
        } else {
            csv = 'Product,Brand,Price,Stock,Rating,Reviews\n';
            products.forEach(p => {
                csv += `"${p.name}","${p.brand}",${p.price},${p.stock},${p.rating || 0},${p.reviews || 0}\n`;
            });
            filename = 'product_report.csv';
        }

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div className="admin-reports">
                <div className="dashboard-page-header">
                    <h1 className="dashboard-page-title">Reports & Exports</h1>
                </div>
                <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                    <Loader size={24} className="spin" /> Loading report data...
                </div>
            </div>
        );
    }

    const customerCount = users.filter(u => u.role === 'CUSTOMER').length;

    return (
        <div className="admin-reports">
            <div className="dashboard-page-header">
                <h1 className="dashboard-page-title">Reports & Exports</h1>
                <p className="dashboard-page-subtitle">Generate and download real business reports from database</p>
            </div>

            {/* Report Type Selector */}
            <div className="report-selector">
                {reports.map((r) => (
                    <button
                        key={r.id}
                        className={`report-type-btn card ${reportType === r.id ? 'active' : ''}`}
                        onClick={() => setReportType(r.id)}
                    >
                        <span className="report-type-icon">{r.icon}</span>
                        <span className="report-type-label">{r.label}</span>
                        <span className="report-type-desc">{r.desc}</span>
                    </button>
                ))}
            </div>

            {/* Filters */}
            <div className="report-filters card">
                <div className="filter-row">
                    <div className="filter-item">
                        <Calendar size={16} />
                        <select className="input" value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
                            <option value="today">Today</option>
                            <option value="this-week">This Week</option>
                            <option value="this-month">This Month</option>
                            <option value="last-month">Last Month</option>
                            <option value="this-quarter">This Quarter</option>
                            <option value="all-time">All Time</option>
                        </select>
                    </div>
                    <div className="filter-actions">
                        <button className="btn btn-primary" onClick={fetchData}><FileText size={16} /> Refresh Data</button>
                        <button className="btn btn-secondary" onClick={exportCSV}><Download size={16} /> Export CSV</button>
                    </div>
                </div>
            </div>

            {/* Report Preview */}
            <div className="report-preview card">
                <h3 className="report-preview-title">
                    {reports.find(r => r.id === reportType)?.icon} {reports.find(r => r.id === reportType)?.label}
                </h3>

                {reportType === 'sales' && (
                    <>
                        <div className="report-summary-row">
                            <div className="report-metric">
                                <span className="metric-label">Total Revenue</span>
                                <span className="metric-value">₹{totalRevenue.toLocaleString()}</span>
                            </div>
                            <div className="report-metric">
                                <span className="metric-label">Total Orders</span>
                                <span className="metric-value">{orders.length}</span>
                            </div>
                            <div className="report-metric">
                                <span className="metric-label">Avg Order Value</span>
                                <span className="metric-value">₹{avgOrderValue}</span>
                            </div>
                            <div className="report-metric">
                                <span className="metric-label">Items Sold</span>
                                <span className="metric-value">{totalItems}</span>
                            </div>
                        </div>

                        <table className="report-table">
                            <thead>
                                <tr><th>Order ID</th><th>Customer</th><th>Items</th><th>Amount</th><th>Payment</th><th>Status</th></tr>
                            </thead>
                            <tbody>
                                {orders.length === 0 ? (
                                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)' }}>No orders found</td></tr>
                                ) : orders.map((order) => (
                                    <tr key={order.id}>
                                        <td><strong>{order.id}</strong></td>
                                        <td>{order.customer}</td>
                                        <td>{(order.items || []).length}</td>
                                        <td>₹{order.total}</td>
                                        <td>{order.payment || 'N/A'}</td>
                                        <td>{statusLabels[order.status] || order.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </>
                )}

                {reportType === 'inventory' && (
                    <table className="report-table">
                        <thead>
                            <tr><th>Product</th><th>Brand</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                            {products.length === 0 ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)' }}>No products found</td></tr>
                            ) : [...products].sort((a, b) => a.stock - b.stock).map((p) => (
                                <tr key={p.id}>
                                    <td><strong>{p.name}</strong></td>
                                    <td>{p.brand}</td>
                                    <td>{p.category}</td>
                                    <td>₹{p.price}</td>
                                    <td>{p.stock}</td>
                                    <td>
                                        <span className={`badge ${p.stock === 0 ? 'badge-danger' : p.stock <= 10 ? 'badge-warning' : 'badge-success'}`}>
                                            {p.stock === 0 ? 'Out' : p.stock <= 10 ? 'Low' : 'OK'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {reportType === 'customer' && (
                    <>
                        <div className="report-summary-row">
                            <div className="report-metric">
                                <span className="metric-label">Total Users</span>
                                <span className="metric-value">{users.length}</span>
                            </div>
                            <div className="report-metric">
                                <span className="metric-label">Customers</span>
                                <span className="metric-value">{customerCount}</span>
                            </div>
                            <div className="report-metric">
                                <span className="metric-label">Staff/Admins</span>
                                <span className="metric-value">{users.length - customerCount}</span>
                            </div>
                        </div>
                        <div className="customer-segments">
                            {Object.entries(
                                users.reduce((acc, u) => { acc[u.role] = (acc[u.role] || 0) + 1; return acc; }, {})
                            ).map(([role, count]) => (
                                <div key={role} className="segment-item">
                                    <span className="segment-dot" style={{ background: role === 'ADMIN' ? '#dc2626' : role === 'MANAGEMENT' ? '#7c3aed' : role === 'DELIVERY' ? '#2563eb' : '#6b7280' }} />
                                    <span>{role}</span>
                                    <strong>{count}</strong>
                                </div>
                            ))}
                        </div>
                        <table className="report-table">
                            <thead>
                                <tr><th>Name</th><th>Email</th><th>Role</th><th>Provider</th></tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id}>
                                        <td><strong>{u.name || 'N/A'}</strong></td>
                                        <td>{u.email}</td>
                                        <td>{u.role}</td>
                                        <td>{u.provider || 'Local'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </>
                )}

                {reportType === 'product' && (
                    <div className="placeholder-report">
                        <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                            {products.length} total products • {products.filter(p => p.stock === 0).length} out of stock • Avg rating: {products.length > 0 ? (products.reduce((s, p) => s + (p.rating || 0), 0) / products.length).toFixed(1) : '0'}
                        </p>
                        <div className="product-report-grid">
                            <div className="product-report-section">
                                <h4>🔥 Top Rated Products</h4>
                                {[...products].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 5).map((p, i) => (
                                    <div key={p.id} className="product-report-item">
                                        <span className="pr-rank">#{i + 1}</span>
                                        <span>{p.name}</span>
                                        <span className="pr-reviews">⭐ {p.rating || 0} ({p.reviews || 0} reviews)</span>
                                    </div>
                                ))}
                            </div>
                            <div className="product-report-section">
                                <h4>⚠️ Low Stock Alert</h4>
                                {[...products].sort((a, b) => a.stock - b.stock).slice(0, 5).map((p, i) => (
                                    <div key={p.id} className="product-report-item">
                                        <span className={`pr-rank ${p.stock <= 5 ? 'low' : ''}`}>#{i + 1}</span>
                                        <span>{p.name}</span>
                                        <span className="pr-reviews" style={{ color: p.stock === 0 ? '#ef4444' : p.stock <= 10 ? '#f59e0b' : '#16a34a' }}>
                                            {p.stock} in stock
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
