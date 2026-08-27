import { useState, useEffect, useCallback } from 'react';
import { categories } from '../../data/categories';
import { productsApi, ordersApi, dashboardApi } from '../../lib/api';
import CategoryIcon from '../../components/CategoryIcon';
import { 
    BarChart3, 
    PieChart, 
    TrendingUp, 
    Award, 
    DollarSign, 
    Loader, 
    Flame, 
    Package, 
    AlertTriangle, 
    TrendingDown, 
    Tag, 
    Sparkles,
    Star,
    Layers
} from 'lucide-react';
import './AdminAnalytics.css';

export default function AdminAnalytics() {
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [prodData, ordData, statsData] = await Promise.all([
                productsApi.getAll(),
                ordersApi.getAll(),
                dashboardApi.getStats(),
            ]);
            setProducts(prodData?.products || []);
            setOrders(ordData?.orders || []);
            if (statsData) setStats(statsData.stats);
        } catch (err) {
            console.error('Failed to load analytics data', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    if (loading) {
        return (
            <div className="admin-analytics-page">
                <div className="dashboard-page-header">
                    <h1 className="dashboard-page-title">Product &amp; Revenue Analytics</h1>
                </div>
                <div className="analytics-loading-card card">
                    <Loader size={36} className="spin" color="var(--primary)" />
                    <p>Computing store performance metrics...</p>
                </div>
            </div>
        );
    }

    const orderItemsByName = {};
    orders.forEach(o => {
        (o.items || []).forEach(item => {
            const name = item.name?.toLowerCase();
            if (name) {
                orderItemsByName[name] = (orderItemsByName[name] || 0) + (item.qty || item.quantity || 1);
            }
        });
    });

    const categoryData = categories.map((cat) => {
        const catProducts = products.filter((p) => p.category === cat.id);
        let revenue = 0;
        catProducts.forEach(p => {
            const sold = orderItemsByName[p.name?.toLowerCase()] || 0;
            revenue += p.price * sold;
        });
        if (revenue === 0) {
            revenue = catProducts.reduce((sum, p) => sum + p.price, 0);
        }
        return { ...cat, products: catProducts.length, revenue };
    });

    const subcategoryData = categories.flatMap((cat) =>
        cat.subcategories.map((sub) => {
            const subProducts = products.filter((p) => p.subcategory === sub.id);
            let revenue = 0;
            subProducts.forEach(p => {
                const sold = orderItemsByName[p.name?.toLowerCase()] || 0;
                revenue += p.price * sold;
            });
            if (revenue === 0) {
                revenue = subProducts.reduce((sum, p) => sum + p.price, 0);
            }
            return { ...sub, category: cat.name, products: subProducts.length, revenue };
        })
    ).sort((a, b) => b.revenue - a.revenue);

    const brandData = [...new Set(products.map((p) => p.brand))].map((brand) => {
        const brandProducts = products.filter((p) => p.brand === brand);
        const avgRating = brandProducts.length > 0 ? (brandProducts.reduce((sum, p) => sum + (p.rating || 0), 0) / brandProducts.length).toFixed(1) : '0.0';
        return { brand, count: brandProducts.length, avgRating, avgPrice: Math.round(brandProducts.reduce((s, p) => s + p.price, 0) / brandProducts.length) };
    }).sort((a, b) => b.count - a.count).slice(0, 8);

    const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= 5);
    const outOfStock = products.filter(p => p.stock === 0);
    const topCategory = [...categoryData].sort((a, b) => b.revenue - a.revenue)[0];
    const avgRating = products.length > 0 ? (products.reduce((s, p) => s + (p.rating || 0), 0) / products.length).toFixed(1) : '0';
    const discountedProducts = products.filter(p => p.mrp && p.price < p.mrp);

    const insights = [
        topCategory && { icon: Flame, color: '#ef4444', text: `${topCategory.name} generated the highest revenue (₹${topCategory.revenue.toLocaleString()}) across ${topCategory.products} items`, type: 'positive' },
        { icon: Package, color: '#0284c7', text: `${products.length} catalog items tracked with average customer satisfaction score of ${avgRating}/5`, type: 'info' },
        outOfStock.length > 0 && { icon: AlertTriangle, color: '#ef4444', text: `${outOfStock.length} items currently out of stock`, type: 'warning' },
        lowStockProducts.length > 0 && { icon: TrendingDown, color: '#f59e0b', text: `${lowStockProducts.length} items require reordering (≤5 units in warehouse)`, type: 'warning' },
        discountedProducts.length > 0 && { icon: Tag, color: '#10b981', text: `${discountedProducts.length} products active on promotional discount pricing`, type: 'positive' },
        { icon: BarChart3, color: '#8b5cf6', text: `${orders.length} total orders fulfilled with ₹${stats?.totalRevenue?.toLocaleString() || 0} total sales`, type: 'info' },
    ].filter(Boolean);

    const maxCatRevenue = Math.max(...categoryData.map(c => c.revenue), 1);

    return (
        <div className="admin-analytics-page animate-fade-in">
            <div className="dashboard-page-header">
                <div>
                    <h1 className="dashboard-page-title">Product &amp; Revenue Analytics</h1>
                    <p className="dashboard-page-subtitle">Real-time performance across {products.length} SKUs and {orders.length} orders</p>
                </div>
            </div>

            {/* Smart Store Insights Matrix */}
            <div className="analytics-insights-section card">
                <div className="insights-header">
                    <Sparkles size={20} color="var(--primary)" />
                    <h3>Automated Business Insights</h3>
                </div>
                <div className="insights-grid">
                    {insights.map((item, idx) => {
                        const Icon = item.icon;
                        return (
                            <div key={idx} className={`insight-card ${item.type}`}>
                                <div className="insight-icon" style={{ color: item.color }}>
                                    <Icon size={18} />
                                </div>
                                <p className="insight-text">{item.text}</p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Main Analytics Grid */}
            <div className="analytics-layout-grid">
                {/* Category Revenue Distribution */}
                <div className="analytics-card card">
                    <div className="analytics-card-header">
                        <PieChart size={20} color="var(--primary)" />
                        <div>
                            <h3>Department Revenue Share</h3>
                            <p>Turnover by main store categories</p>
                        </div>
                    </div>

                    <div className="category-revenue-bars">
                        {categoryData.map((cat, i) => {
                            const percent = Math.min(100, Math.round((cat.revenue / maxCatRevenue) * 100));
                            return (
                                <div key={cat.id} className="cat-bar-row">
                                    <div className="cat-bar-top">
                                        <div className="cat-icon-name">
                                            <CategoryIcon slug={cat.id} size={18} />
                                            <strong>{cat.name}</strong>
                                        </div>
                                        <span className="cat-revenue-val">₹{cat.revenue.toLocaleString()}</span>
                                    </div>
                                    <div className="cat-progress-track">
                                        <div 
                                            className="cat-progress-fill" 
                                            style={{ 
                                                width: `${percent}%`,
                                                background: i === 0 ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #3b82f6, #2563eb)'
                                            }} 
                                        />
                                    </div>
                                    <span className="cat-items-count">{cat.products} active products</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Brand Performance */}
                <div className="analytics-card card">
                    <div className="analytics-card-header">
                        <Award size={20} color="var(--primary)" />
                        <div>
                            <h3>Top Brand Penetration</h3>
                            <p>Highest SKU presence and ratings</p>
                        </div>
                    </div>

                    <div className="brand-performance-list">
                        {brandData.map((b, idx) => (
                            <div key={b.brand} className="brand-rank-item">
                                <span className="brand-rank-num">#{idx + 1}</span>
                                <div className="brand-info">
                                    <strong>{b.brand}</strong>
                                    <span>{b.count} products • Avg. ₹{b.avgPrice}</span>
                                </div>
                                <div className="brand-rating-badge">
                                    <Star size={13} fill="#f59e0b" color="#f59e0b" />
                                    <span>{b.avgRating}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Subcategory Table */}
            <div className="subcategory-table-card card">
                <div className="subcategory-header">
                    <Layers size={20} color="var(--primary)" />
                    <div>
                        <h3>Subcategory Breakdown</h3>
                        <p>Detailed performance per niche aisle</p>
                    </div>
                </div>

                <div className="subcat-table-wrap">
                    <table className="subcat-table">
                        <thead>
                            <tr>
                                <th>Subcategory</th>
                                <th>Parent Department</th>
                                <th>Active Items</th>
                                <th>Est. Revenue</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subcategoryData.slice(0, 10).map((sub) => (
                                <tr key={sub.id}>
                                    <td><strong>{sub.name}</strong></td>
                                    <td><span className="sub-dept-pill">{sub.category}</span></td>
                                    <td>{sub.products} items</td>
                                    <td><strong className="sub-rev-val">₹{sub.revenue.toLocaleString()}</strong></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
