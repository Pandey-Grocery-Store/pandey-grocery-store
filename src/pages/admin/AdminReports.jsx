import { useState, useEffect, useCallback } from 'react';
import { 
    Download, 
    FileText, 
    Calendar, 
    Loader, 
    IndianRupee, 
    Package, 
    Users, 
    Tag, 
    Flame, 
    Star, 
    AlertTriangle,
    CheckCircle2,
    RefreshCw,
    TrendingUp,
    BarChart3
} from 'lucide-react';
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
        try {
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
        } catch (err) {
            console.error('Failed to fetch reports data', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const totalRevenue = stats?.totalRevenue || orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const avgOrderValue = orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0;
    const totalItems = orders.reduce((sum, o) => sum + (o.items || []).reduce((s, i) => s + (i.qty || i.quantity || 1), 0), 0);

    const reports = [
        { id: 'sales', label: 'Sales & Transactions', icon: IndianRupee, color: '#10b981', desc: 'Revenue, orders & billing audit' },
        { id: 'inventory', label: 'Inventory Stock Audit', icon: Package, color: '#0284c7', desc: 'SKU levels, movement & shortages' },
        { id: 'customer', label: 'Customer Directory', icon: Users, color: '#8b5cf6', desc: 'Customer roles & order frequency' },
        { id: 'product', label: 'Product Performance', icon: Tag, color: '#f59e0b', desc: 'Catalog pricing & MRP margins' },
    ];

    const exportCSV = () => {
        let csv = '';
        let filename = '';
        
        if (reportType === 'sales') {
            csv = 'Order ID,Customer,Items,Amount (INR),Payment Mode,Status,Date\n';
            orders.forEach(o => {
                csv += `${o.id},"${o.customer}",${(o.items || []).length},${o.total},${o.payment || 'N/A'},${statusLabels[o.status] || o.status},"${o.date || ''}"\n`;
            });
            filename = `pandey_grocery_sales_report_${dateRange}.csv`;
        } else if (reportType === 'inventory') {
            csv = 'Product Name,Brand,Category,Price,Stock,Status\n';
            products.forEach(p => {
                const status = p.stock === 0 ? 'Out of Stock' : p.stock <= 5 ? 'Low Stock' : 'In Stock';
                csv += `"${p.name}","${p.brand || ''}",${p.category},${p.price},${p.stock},${status}\n`;
            });
            filename = `pandey_grocery_inventory_report.csv`;
        } else if (reportType === 'customer') {
            csv = 'Name,Email,Phone,Role,Orders Count\n';
            users.forEach(u => {
                const userOrders = orders.filter(o => o.userId === u.id).length;
                csv += `"${u.name}","${u.email}","${u.phone || 'N/A'}",${u.role},${userOrders}\n`;
            });
            filename = `pandey_grocery_customers_report.csv`;
        } else if (reportType === 'product') {
            csv = 'Product Name,Brand,Category,Price,MRP,Discount,Rating,Reviews\n';
            products.forEach(p => {
                const disc = p.mrp && p.price < p.mrp ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
                csv += `"${p.name}","${p.brand || 'N/A'}",${p.category},${p.price},${p.mrp || p.price},${disc}%,${p.rating || 0},${p.reviews || 0}\n`;
            });
            filename = `pandey_grocery_product_performance.csv`;
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
            <div className="admin-reports-page">
                <div className="dashboard-page-header">
                    <h1 className="dashboard-page-title">Executive Reports &amp; Exports</h1>
                </div>
                <div className="reports-loading-card card">
                    <Loader size={36} className="spin" color="var(--primary)" />
                    <p>Generating business audit reports...</p>
                </div>
            </div>
        );
    }

    const currentReport = reports.find(r => r.id === reportType) || reports[0];
    const CurrentIcon = currentReport.icon;
    const customerCount = users.filter(u => u.role === 'CUSTOMER').length;

    return (
        <div className="admin-reports-page animate-fade-in">
            <div className="dashboard-page-header">
                <div>
                    <h1 className="dashboard-page-title">Executive Reports &amp; Exports</h1>
                    <p className="dashboard-page-subtitle">Export real-time transactional &amp; inventory audits to CSV</p>
                </div>
                <button className="btn btn-primary" onClick={exportCSV}>
                    <Download size={16} /> Export to CSV
                </button>
            </div>

            {/* Report Type Selector Cards */}
            <div className="report-type-cards-grid">
                {reports.map((r) => {
                    const Icon = r.icon;
                    return (
                        <div
                            key={r.id}
                            className={`report-tab-card card ${reportType === r.id ? 'active' : ''}`}
                            onClick={() => setReportType(r.id)}
                        >
                            <div className="tab-card-icon" style={{ color: r.color }}>
                                <Icon size={22} />
                            </div>
                            <div className="tab-card-meta">
                                <strong>{r.label}</strong>
                                <p>{r.desc}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Date Filters & Summary Toolbar */}
            <div className="report-toolbar card">
                <div className="filter-group">
                    <Calendar size={16} className="cal-icon" />
                    <select className="date-select" value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
                        <option value="today">Today's Transactions</option>
                        <option value="this-week">This Week</option>
                        <option value="this-month">This Month (Current Billing)</option>
                        <option value="last-month">Last Month</option>
                        <option value="all-time">All-Time Historical</option>
                    </select>
                </div>

                <div className="report-kpi-summary-strip">
                    <div className="strip-item">
                        <span className="strip-label">Revenue</span>
                        <strong className="strip-val">₹{totalRevenue.toLocaleString()}</strong>
                    </div>
                    <div className="strip-item">
                        <span className="strip-label">Orders</span>
                        <strong className="strip-val">{orders.length}</strong>
                    </div>
                    <div className="strip-item">
                        <span className="strip-label">Avg. Value</span>
                        <strong className="strip-val">₹{avgOrderValue}</strong>
                    </div>
                    <div className="strip-item">
                        <span className="strip-label">Items</span>
                        <strong className="strip-val">{totalItems}</strong>
                    </div>
                </div>
            </div>

            {/* Data Table Preview */}
            <div className="report-table-card card">
                <div className="report-table-header">
                    <div className="table-title-group">
                        <CurrentIcon size={20} color={currentReport.color} />
                        <div>
                            <h3>{currentReport.label} Preview</h3>
                            <p>Displaying live entries from store database</p>
                        </div>
                    </div>
                    <button className="btn btn-secondary btn-sm" onClick={exportCSV}>
                        <Download size={14} /> Download CSV
                    </button>
                </div>

                <div className="report-table-wrap">
                    {reportType === 'sales' && (
                        <table className="report-data-table">
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Customer</th>
                                    <th>Items</th>
                                    <th>Amount</th>
                                    <th>Payment</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.slice(0, 10).map((o) => (
                                    <tr key={o.id}>
                                        <td><strong>#{o.id}</strong></td>
                                        <td>{o.customer}</td>
                                        <td>{(o.items || []).length} items</td>
                                        <td><strong className="rev-num">₹{o.total}</strong></td>
                                        <td><span className="pill-badge">{o.payment || 'N/A'}</span></td>
                                        <td>
                                            <span className="pill-badge-status">{statusLabels[o.status] || o.status}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {reportType === 'inventory' && (
                        <table className="report-data-table">
                            <thead>
                                <tr>
                                    <th>Product Name</th>
                                    <th>Category</th>
                                    <th>Selling Price</th>
                                    <th>Stock Level</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.slice(0, 10).map((p) => (
                                    <tr key={p.id}>
                                        <td><strong>{p.name}</strong></td>
                                        <td><span className="pill-badge">{p.category}</span></td>
                                        <td>₹{p.price}</td>
                                        <td>{p.stock} units</td>
                                        <td>
                                            <span className={`pill-badge-status ${p.stock === 0 ? 'out' : p.stock <= 5 ? 'warn' : 'good'}`}>
                                                {p.stock === 0 ? 'Out of stock' : p.stock <= 5 ? 'Low stock' : 'In stock'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {reportType === 'customer' && (
                        <table className="report-data-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Phone</th>
                                    <th>Role</th>
                                    <th>Orders Placed</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.slice(0, 10).map((u) => {
                                    const userOrders = orders.filter(o => o.userId === u.id).length;
                                    return (
                                        <tr key={u.id}>
                                            <td><strong>{u.name}</strong></td>
                                            <td>{u.email}</td>
                                            <td>{u.phone || '—'}</td>
                                            <td><span className="pill-badge">{u.role}</span></td>
                                            <td><strong>{userOrders} orders</strong></td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}

                    {reportType === 'product' && (
                        <table className="report-data-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Brand</th>
                                    <th>Selling Price</th>
                                    <th>MRP</th>
                                    <th>Rating</th>
                                    <th>Reviews</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.slice(0, 10).map((p) => (
                                    <tr key={p.id}>
                                        <td><strong>{p.name}</strong></td>
                                        <td>{p.brand}</td>
                                        <td><strong className="rev-num">₹{p.price}</strong></td>
                                        <td>₹{p.mrp || p.price}</td>
                                        <td>⭐ {p.rating || 4.0}</td>
                                        <td>{p.reviews || 0} reviews</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
