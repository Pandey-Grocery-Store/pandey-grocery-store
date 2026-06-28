import { useState, useEffect, useCallback } from 'react';
import { categories } from '../../data/categories';
import { productsApi, ordersApi, dashboardApi } from '../../lib/api';
import { BarChart3, PieChart, TrendingUp, Award, DollarSign, Loader } from 'lucide-react';
import './AdminAnalytics.css';

export default function AdminAnalytics() {
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const [prodData, ordData, statsData] = await Promise.all([
            productsApi.getAll(),
            ordersApi.getAll(),
            dashboardApi.getStats(),
        ]);
        setProducts(prodData?.products || []);
        setOrders(ordData?.orders || []);
        if (statsData) setStats(statsData.stats);
        setLoading(false);
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    if (loading) {
        return (
            <div className="admin-analytics">
                <div className="dashboard-page-header">
                    <h1 className="dashboard-page-title">Product Analytics</h1>
                </div>
                <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                    <Loader size={24} className="spin" /> Loading analytics...
                </div>
            </div>
        );
    }

    // Real revenue per category: sum of (price × quantity sold) from orders
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
        // Real revenue: from order items matching this category's products
        let revenue = 0;
        catProducts.forEach(p => {
            const sold = orderItemsByName[p.name?.toLowerCase()] || 0;
            revenue += p.price * sold;
        });
        // If no orders yet, show catalog value as fallback
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
    }).sort((a, b) => b.count - a.count).slice(0, 10);

    // Real insights from actual data
    const lowStockProducts = products.filter(p => p.stock <= 5);
    const outOfStock = products.filter(p => p.stock === 0);
    const topCategory = [...categoryData].sort((a, b) => b.revenue - a.revenue)[0];
    const avgRating = products.length > 0 ? (products.reduce((s, p) => s + (p.rating || 0), 0) / products.length).toFixed(1) : '0';
    const discountedProducts = products.filter(p => p.mrp && p.price < p.mrp);

    const insights = [
        topCategory && { icon: '🔥', text: `${topCategory.name} has the highest revenue (₹${topCategory.revenue.toLocaleString()}) with ${topCategory.products} products`, type: 'positive' },
        { icon: '📦', text: `${products.length} total products in database, average rating ${avgRating}⭐`, type: 'info' },
        outOfStock.length > 0 && { icon: '⚠️', text: `${outOfStock.length} product(s) are out of stock`, type: 'warning' },
        lowStockProducts.length > 0 && { icon: '📉', text: `${lowStockProducts.length} product(s) have ≤5 units in stock`, type: 'warning' },
        discountedProducts.length > 0 && { icon: '🏷️', text: `${discountedProducts.length} products are currently discounted below MRP`, type: 'positive' },
        { icon: '📊', text: `${orders.length} total orders worth ₹${stats?.totalRevenue?.toLocaleString() || 0}`, type: 'info' },
    ].filter(Boolean);

    return (
        <div className="admin-analytics">
            <div className="dashboard-page-header">
                <h1 className="dashboard-page-title">Product Analytics</h1>
                <p className="dashboard-page-subtitle">Real data from {products.length} products and {orders.length} orders</p>
            </div>

            {/* Category Performance */}
            <div className="analytics-grid">
                <div className="card analytics-card">
                    <h3 className="analytics-card-title"><PieChart size={18} /> Category Revenue</h3>
                    <div className="category-bars">
                        {categoryData.map((cat, i) => (
                            <div key={cat.id} className="category-bar-item">
                                <div className="cat-bar-header">
                                    <span className="cat-icon">{cat.icon}</span>
                                    <span className="cat-name">{cat.name}</span>
                                    <span className="cat-revenue">₹{cat.revenue.toLocaleString()}</span>
                                </div>
                                <div className="cat-bar-track">
                                    <div className="cat-bar-fill" style={{ width: `${Math.min(100, (cat.revenue / Math.max(...categoryData.map(c => c.revenue), 1)) * 100)}%`, background: i === 0 ? 'var(--primary)' : 'var(--info)' }} />
                                </div>
                                <span className="cat-product-count">{cat.products} products</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card analytics-card">
                    <h3 className="analytics-card-title"><Award size={18} /> Brand Performance</h3>
                    <div className="brand-table">
                        <div className="brand-row brand-header">
                            <span>Brand</span><span>Products</span><span>Avg Rating</span><span>Avg Price</span>
                        </div>
                        {brandData.map((b) => (
                            <div key={b.brand} className="brand-row">
                                <span className="brand-name">{b.brand}</span>
                                <span>{b.count}</span>
                                <span>⭐ {b.avgRating}</span>
                                <span>₹{b.avgPrice}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Subcategory Table */}
            <div className="card analytics-card">
                <h3 className="analytics-card-title"><BarChart3 size={18} /> Subcategory Performance</h3>
                <div className="sub-table-wrapper">
                    <table className="sub-table">
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Subcategory</th>
                                <th>Category</th>
                                <th>Products</th>
                                <th>Revenue</th>
                                <th>Performance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subcategoryData.map((sub, i) => {
                                const maxRev = subcategoryData[0]?.revenue || 1;
                                return (
                                    <tr key={sub.id}>
                                        <td><span className={`rank-badge ${i < 3 ? 'top' : ''}`}>#{i + 1}</span></td>
                                        <td><strong>{sub.name}</strong><br /><span className="sub-hi">{sub.nameHi}</span></td>
                                        <td>{sub.category}</td>
                                        <td>{sub.products}</td>
                                        <td className="rev-cell">₹{sub.revenue.toLocaleString()}</td>
                                        <td>
                                            <div className="perf-bar-track">
                                                <div className="perf-bar-fill" style={{ width: `${(sub.revenue / maxRev) * 100}%` }} />
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Price Distribution + Insights */}
            <div className="analytics-grid">
                <div className="card analytics-card">
                    <h3 className="analytics-card-title"><DollarSign size={18} /> Price Distribution</h3>
                    <div className="price-distribution">
                        {[
                            { range: 'Under ₹100', count: products.filter(p => p.price < 100).length },
                            { range: '₹100 - ₹300', count: products.filter(p => p.price >= 100 && p.price < 300).length },
                            { range: '₹300 - ₹500', count: products.filter(p => p.price >= 300 && p.price < 500).length },
                            { range: '₹500 - ₹1000', count: products.filter(p => p.price >= 500 && p.price < 1000).length },
                            { range: '₹1000+', count: products.filter(p => p.price >= 1000).length },
                        ].map((range) => (
                            <div key={range.range} className="price-range-item">
                                <span className="price-range-label">{range.range}</span>
                                <div className="price-range-bar-track">
                                    <div className="price-range-bar" style={{ width: `${(range.count / (products.length || 1)) * 100}%` }} />
                                </div>
                                <span className="price-range-count">{range.count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card analytics-card">
                    <h3 className="analytics-card-title"><TrendingUp size={18} /> Key Insights</h3>
                    <div className="insights-list">
                        {insights.map((insight, i) => (
                            <div key={i} className={`insight-item ${insight.type}`}>
                                <span className="insight-icon">{insight.icon}</span>
                                <span>{insight.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
