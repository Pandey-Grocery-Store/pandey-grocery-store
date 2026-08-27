import { useState, useEffect, useCallback } from 'react';
import { productsApi } from '../../lib/api';
import { 
    AlertTriangle, 
    TrendingDown, 
    Package, 
    ShoppingCart, 
    Loader, 
    Plus, 
    CheckCircle2, 
    RefreshCw, 
    IndianRupee, 
    Sparkles,
    ShieldAlert
} from 'lucide-react';
import './StaffInventory.css';

export default function StaffInventory() {
    const [productList, setProductList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const data = await productsApi.getAll();
            setProductList(data?.products || []);
        } catch (err) {
            console.error('Failed to fetch inventory', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    const lowStock = productList.filter((p) => p.stock > 0 && p.stock <= 15).sort((a, b) => a.stock - b.stock);
    const outOfStock = productList.filter((p) => p.stock === 0);
    const healthyStock = productList.filter((p) => p.stock > 15);

    const updateStock = async (id, delta) => {
        setUpdatingId(id);
        const product = productList.find(p => p.id === id);
        const newStock = Math.max(0, (product.stock || 0) + delta);
        try { 
            await productsApi.updateStock(id, newStock); 
        } catch { /* fallback */ }
        setProductList(prev => prev.map(p => p.id === id ? { ...p, stock: newStock } : p));
        setUpdatingId(null);
    };

    const setExactStock = async (id, stock) => {
        setUpdatingId(id);
        try { 
            await productsApi.updateStock(id, stock); 
        } catch { /* fallback */ }
        setProductList(prev => prev.map(p => p.id === id ? { ...p, stock } : p));
        setUpdatingId(null);
    };

    if (loading) {
        return (
            <div className="staff-inventory-page">
                <div className="dashboard-page-header">
                    <h1 className="dashboard-page-title">Inventory &amp; Stock Alerts</h1>
                </div>
                <div className="inventory-loading-card card">
                    <Loader size={32} className="spin" color="var(--primary)" />
                    <p>Auditing store warehouse stock...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="staff-inventory-page animate-fade-in">
            <div className="dashboard-page-header">
                <div>
                    <h1 className="dashboard-page-title">Inventory &amp; Stock Alerts</h1>
                    <p className="dashboard-page-subtitle">Real-time stock audit, low inventory warnings &amp; 1-tap restock</p>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={fetchProducts} title="Refresh inventory">
                    <RefreshCw size={15} /> Refresh Audit
                </button>
            </div>

            {/* 4 Summary Metrics KPI Cards */}
            <div className="inventory-kpi-grid">
                <div className="kpi-card healthy card">
                    <div className="kpi-icon-box">
                        <CheckCircle2 size={24} />
                    </div>
                    <div className="kpi-data">
                        <span className="kpi-num">{healthyStock.length}</span>
                        <span className="kpi-title">Healthy Stock (&gt;15)</span>
                    </div>
                </div>

                <div className="kpi-card warning card">
                    <div className="kpi-icon-box">
                        <TrendingDown size={24} />
                    </div>
                    <div className="kpi-data">
                        <span className="kpi-num">{lowStock.length}</span>
                        <span className="kpi-title">Low Stock (≤15)</span>
                    </div>
                </div>

                <div className="kpi-card danger card">
                    <div className="kpi-icon-box">
                        <AlertTriangle size={24} />
                    </div>
                    <div className="kpi-data">
                        <span className="kpi-num">{outOfStock.length}</span>
                        <span className="kpi-title">Out of Stock (0)</span>
                    </div>
                </div>

                <div className="kpi-card total card">
                    <div className="kpi-icon-box">
                        <Package size={24} />
                    </div>
                    <div className="kpi-data">
                        <span className="kpi-num">{productList.length}</span>
                        <span className="kpi-title">Total Active SKUs</span>
                    </div>
                </div>
            </div>

            {/* Out of Stock Critical Section */}
            {outOfStock.length > 0 && (
                <div className="inventory-section-block">
                    <div className="section-alert-header danger-header">
                        <div className="alert-badge-icon danger-icon">
                            <ShieldAlert size={18} />
                        </div>
                        <div>
                            <h2>Out of Stock Items ({outOfStock.length})</h2>
                            <p>These items are hidden or unavailable for customers to purchase</p>
                        </div>
                    </div>

                    <div className="inventory-items-grid">
                        {outOfStock.map((product) => (
                            <div key={product.id} className="stock-alert-card card out-of-stock-card">
                                <img src={product.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=200"} alt={product.name} className="alert-thumb" />
                                <div className="alert-meta">
                                    <h4>{product.name}</h4>
                                    <span className="alert-unit">{product.brand} • {product.unit}</span>
                                    <span className="out-badge">0 In Stock</span>
                                </div>
                                <div className="alert-actions">
                                    <button 
                                        className="btn btn-primary btn-sm restock-btn" 
                                        disabled={updatingId === product.id}
                                        onClick={() => setExactStock(product.id, 50)}
                                    >
                                        {updatingId === product.id ? <Loader size={14} className="spin" /> : <><Plus size={14} /> Add 50 Units</>}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Low Stock Items Section */}
            <div className="inventory-section-block">
                <div className="section-alert-header warning-header">
                    <div className="alert-badge-icon warning-icon">
                        <TrendingDown size={18} />
                    </div>
                    <div>
                        <h2>Low Stock Items ({lowStock.length})</h2>
                        <p>Stock running low. Restock recommended to prevent out-of-stock shortages.</p>
                    </div>
                </div>

                {lowStock.length === 0 ? (
                    <div className="all-healthy-box card">
                        <CheckCircle2 size={32} color="#10b981" />
                        <p>All products have healthy stock levels above 15 units!</p>
                    </div>
                ) : (
                    <div className="inventory-items-grid">
                        {lowStock.map((product) => (
                            <div key={product.id} className="stock-alert-card card low-stock-card">
                                <img src={product.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=200"} alt={product.name} className="alert-thumb" />
                                <div className="alert-meta">
                                    <h4>{product.name}</h4>
                                    <span className="alert-unit">{product.brand} • {product.unit}</span>
                                    <span className="stock-level-pill warning-pill">
                                        Only {product.stock} left
                                    </span>
                                </div>
                                <div className="alert-actions">
                                    <div className="quick-restock-group">
                                        <button 
                                            className="btn btn-secondary btn-sm"
                                            disabled={updatingId === product.id}
                                            onClick={() => updateStock(product.id, 20)}
                                        >
                                            +20
                                        </button>
                                        <button 
                                            className="btn btn-primary btn-sm"
                                            disabled={updatingId === product.id}
                                            onClick={() => updateStock(product.id, 50)}
                                        >
                                            +50
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Reorder Suggestions Table */}
            {lowStock.length > 0 && (
                <div className="reorder-suggestions-card card">
                    <div className="reorder-header">
                        <div className="reorder-icon-badge">
                            <Sparkles size={20} color="var(--primary)" />
                        </div>
                        <div>
                            <h3>Suggested Restock Batch</h3>
                            <p>Automated batch procurement recommendations based on low stock alerts</p>
                        </div>
                    </div>

                    <div className="reorder-table-wrap">
                        <table className="reorder-table">
                            <thead>
                                <tr>
                                    <th>Item Details</th>
                                    <th>Current Stock</th>
                                    <th>Suggested Batch</th>
                                    <th>Est. Value (₹)</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lowStock.slice(0, 8).map((p) => (
                                    <tr key={p.id}>
                                        <td>
                                            <strong>{p.name}</strong>
                                            <span className="reorder-sub">{p.brand} • {p.unit}</span>
                                        </td>
                                        <td>
                                            <span className="stock-warning-badge">{p.stock} units</span>
                                        </td>
                                        <td>+50 units</td>
                                        <td>
                                            <strong>₹{(p.price * 50).toFixed(2)}</strong>
                                        </td>
                                        <td>
                                            <button 
                                                className="btn btn-sm btn-primary"
                                                disabled={updatingId === p.id}
                                                onClick={() => updateStock(p.id, 50)}
                                            >
                                                {updatingId === p.id ? <Loader size={14} className="spin" /> : 'Restock +50'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
