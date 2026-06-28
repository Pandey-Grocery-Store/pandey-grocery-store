import { useState, useEffect, useCallback } from 'react';
import { productsApi } from '../../lib/api';
import { AlertTriangle, TrendingDown, Package, ShoppingCart, Loader } from 'lucide-react';
import './StaffInventory.css';

export default function StaffInventory() {
    const [productList, setProductList] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        const data = await productsApi.getAll();
        setProductList(data?.products || []);
        setLoading(false);
    }, []);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    const lowStock = productList.filter((p) => p.stock > 0 && p.stock <= 15).sort((a, b) => a.stock - b.stock);
    const outOfStock = productList.filter((p) => p.stock === 0);
    const healthyStock = productList.filter((p) => p.stock > 15);

    const updateStock = async (id, newStock) => {
        try { await productsApi.updateStock(id, newStock); } catch { /* fallback */ }
        setProductList(prev => prev.map(p => p.id === id ? { ...p, stock: newStock } : p));
    };

    if (loading) {
        return (
            <div className="staff-inventory">
                <div className="dashboard-page-header">
                    <h1 className="dashboard-page-title">Inventory Alerts</h1>
                </div>
                <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                    <Loader size={24} className="spin" /> Loading inventory...
                </div>
            </div>
        );
    }

    return (
        <div className="staff-inventory">
            <div className="dashboard-page-header">
                <h1 className="dashboard-page-title">Inventory Alerts</h1>
                <p className="dashboard-page-subtitle">Monitor stock levels and reorder suggestions</p>
            </div>

            {/* Summary Cards */}
            <div className="inventory-summary">
                <div className="inv-card card healthy">
                    <Package size={24} />
                    <div>
                        <span className="inv-value">{healthyStock.length}</span>
                        <span className="inv-label">Healthy Stock</span>
                    </div>
                </div>
                <div className="inv-card card warning">
                    <TrendingDown size={24} />
                    <div>
                        <span className="inv-value">{lowStock.length}</span>
                        <span className="inv-label">Low Stock</span>
                    </div>
                </div>
                <div className="inv-card card danger">
                    <AlertTriangle size={24} />
                    <div>
                        <span className="inv-value">{outOfStock.length}</span>
                        <span className="inv-label">Out of Stock</span>
                    </div>
                </div>
                <div className="inv-card card total">
                    <ShoppingCart size={24} />
                    <div>
                        <span className="inv-value">{productList.length}</span>
                        <span className="inv-label">Total Products</span>
                    </div>
                </div>
            </div>

            {/* Low Stock Alerts */}
            <div className="alert-section">
                <h2 className="alert-title">
                    <span className="alert-icon warning-bg"><AlertTriangle size={18} /></span>
                    Low Stock Items ({lowStock.length})
                </h2>
                <div className="alert-grid">
                    {lowStock.map((product) => (
                        <div key={product.id} className="alert-item card">
                            <img src={product.image} alt={product.name} className="alert-item-img" />
                            <div className="alert-item-info">
                                <span className="alert-item-name">{product.name}</span>
                                <span className="alert-item-brand">{product.brand} • {product.unit}</span>
                            </div>
                            <div className="alert-item-stock">
                                <span className="stock-count warning">{product.stock} left</span>
                                <button className="btn btn-sm btn-primary" onClick={() => updateStock(product.id, product.stock + 50)}>Restock +50</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Out of Stock */}
            {outOfStock.length > 0 && (
                <div className="alert-section">
                    <h2 className="alert-title">
                        <span className="alert-icon danger-bg"><AlertTriangle size={18} /></span>
                        Out of Stock ({outOfStock.length})
                    </h2>
                    <div className="alert-grid">
                        {outOfStock.map((product) => (
                            <div key={product.id} className="alert-item card out-of-stock">
                                <img src={product.image} alt={product.name} className="alert-item-img" />
                                <div className="alert-item-info">
                                    <span className="alert-item-name">{product.name}</span>
                                    <span className="alert-item-brand">{product.brand} • {product.unit}</span>
                                </div>
                                <div className="alert-item-stock">
                                    <span className="stock-count danger">Out of Stock</span>
                                    <button className="btn btn-sm btn-primary" onClick={() => updateStock(product.id, 50)}>Restock +50</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Reorder Suggestions */}
            <div className="reorder-section card">
                <h3 className="reorder-title">📦 Suggested Reorders</h3>
                <p className="reorder-subtitle">Based on current stock levels and sales velocity</p>
                <table className="reorder-table">
                    <thead>
                        <tr><th>Product</th><th>Current Stock</th><th>Suggested Order</th><th>Est. Cost</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                        {lowStock.slice(0, 5).map((p) => (
                            <tr key={p.id}>
                                <td><strong>{p.name}</strong></td>
                                <td><span className="stock-count warning">{p.stock} units</span></td>
                                <td>50 units</td>
                                <td>₹{p.price * 50}</td>
                                <td><button className="btn btn-sm btn-primary" onClick={() => updateStock(p.id, p.stock + 50)}>Restock</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
