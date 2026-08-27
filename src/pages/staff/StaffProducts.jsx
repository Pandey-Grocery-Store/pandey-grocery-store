import { useState, useEffect, useCallback } from 'react';
import { categories } from '../../data/categories';
import { productsApi, uploadApi } from '../../lib/api';
import { 
    Search, 
    Plus, 
    Edit3, 
    Eye, 
    EyeOff, 
    Save, 
    X, 
    Upload, 
    Loader, 
    Package, 
    Sparkles, 
    Tag, 
    Check, 
    Trash2, 
    RefreshCw,
    IndianRupee,
    ChevronDown
} from 'lucide-react';
import './StaffProducts.css';

export default function StaffProducts() {
    const [productList, setProductList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({});
    const [showAddModal, setShowAddModal] = useState(false);
    const [newProduct, setNewProduct] = useState({ 
        name: '', 
        nameHi: '', 
        brand: '', 
        category: 'groceries', 
        subcategory: 'pulses-dal', 
        price: '', 
        mrp: '', 
        stock: 100, 
        unit: '', 
        description: '', 
        image: '' 
    });

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const data = await productsApi.getAll();
            setProductList(data?.products || []);
        } catch (err) {
            console.error('Failed to load products', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    const activeCategories = [
        { id: 'all', name: 'All Departments' },
        { id: 'groceries', name: 'Groceries & Kitchen' },
        { id: 'stationery', name: 'Stationery & Office' },
        { id: 'household-personal', name: 'Household & Care' },
    ];

    const filtered = productList.filter((p) => {
        const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchCategory = filterCategory === 'all' || p.category === filterCategory;
        return matchSearch && matchCategory;
    });

    const startEdit = (product) => {
        setEditingId(product.id);
        setEditData({ price: product.price, stock: product.stock });
    };

    const saveEdit = async (id) => {
        setSaving(true);
        try {
            await productsApi.update(id, { price: Number(editData.price), stock: Number(editData.stock) });
        } catch { /* fallback */ }
        setProductList((prev) =>
            prev.map((p) => (p.id === id ? { ...p, price: Number(editData.price), stock: Number(editData.stock) } : p))
        );
        setEditingId(null);
        setSaving(false);
    };

    const toggleStock = async (id) => {
        const product = productList.find(p => p.id === id);
        const newStock = product.stock === 0 ? 50 : 0;
        try {
            await productsApi.updateStock(id, newStock);
        } catch { /* fallback */ }
        setProductList((prev) =>
            prev.map((p) => (p.id === id ? { ...p, stock: newStock } : p))
        );
    };

    const addProduct = async (e) => {
        e.preventDefault();
        if (!newProduct.name || !newProduct.brand || !newProduct.price || !newProduct.mrp) return;
        setSaving(true);
        try {
            const data = await productsApi.create(newProduct);
            if (data?.product) {
                setProductList(prev => [data.product, ...prev]);
            }
        } catch {
            setProductList(prev => [{ ...newProduct, id: `local-${Date.now()}`, price: Number(newProduct.price), mrp: Number(newProduct.mrp), rating: 4.5, reviews: 0, isActive: true }, ...prev]);
        }
        setShowAddModal(false);
        setNewProduct({ name: '', nameHi: '', brand: '', category: 'groceries', subcategory: 'pulses-dal', price: '', mrp: '', stock: 100, unit: '', description: '', image: '' });
        setSaving(false);
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const data = await uploadApi.uploadImage(file);
            setNewProduct(prev => ({ ...prev, image: data.url }));
        } catch (err) {
            console.error('Upload failed:', err);
        }
        setUploading(false);
    };

    const deleteProduct = async (id) => {
        if (!confirm('Are you sure you want to deactivate this product?')) return;
        try {
            await productsApi.delete(id);
        } catch { /* fallback */ }
        setProductList(prev => prev.filter(p => p.id !== id));
    };

    return (
        <div className="staff-products-page animate-fade-in">
            <div className="dashboard-page-header">
                <div>
                    <h1 className="dashboard-page-title">Product Catalog</h1>
                    <p className="dashboard-page-subtitle">Manage store prices, stock inventory &amp; product additions</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                    <Plus size={18} /> Add New Product
                </button>
            </div>

            {/* Toolbar */}
            <div className="products-control-toolbar card">
                <div className="toolbar-search-input">
                    <Search size={16} />
                    <input 
                        placeholder="Search by product name, brand..." 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)} 
                    />
                </div>

                <div className="toolbar-filter-group">
                    <select 
                        className="toolbar-category-select" 
                        value={filterCategory} 
                        onChange={(e) => setFilterCategory(e.target.value)}
                    >
                        {activeCategories.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                    <span className="products-counter-badge">{filtered.length} items</span>
                </div>
            </div>

            {/* Products Table (Desktop) & Cards (Mobile) */}
            {loading ? (
                <div className="products-loading-state card">
                    <Loader size={32} className="spin" color="var(--primary)" />
                    <p>Loading store catalog...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="products-empty-state card">
                    <Package size={48} color="#cbd5e1" />
                    <h3>No products found</h3>
                    <p>Try searching for a different name or switch categories.</p>
                </div>
            ) : (
                <>
                    {/* Desktop View Table */}
                    <div className="products-table-wrapper card hidden-mobile-products">
                        <table className="products-data-table">
                            <thead>
                                <tr>
                                    <th>Item Details</th>
                                    <th>Brand</th>
                                    <th>Category</th>
                                    <th>Selling Price</th>
                                    <th>MRP</th>
                                    <th>Stock Level</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((product) => {
                                    const isEditing = editingId === product.id;
                                    const discount = product.mrp > product.price 
                                        ? Math.round(((product.mrp - product.price) / product.mrp) * 100) 
                                        : 0;

                                    return (
                                        <tr key={product.id} className={`p-table-row ${product.stock === 0 ? 'out-of-stock-row' : ''}`}>
                                            <td>
                                                <div className="p-cell-wrap">
                                                    <img src={product.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=150"} alt={product.name} className="p-table-thumb" />
                                                    <div>
                                                        <span className="p-table-name">{product.name}</span>
                                                        {product.nameHi && <span className="p-table-hi">{product.nameHi}</span>}
                                                        <span className="p-table-unit">{product.unit}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="p-table-brand">{product.brand}</span>
                                            </td>
                                            <td>
                                                <span className="p-cat-tag">{product.category}</span>
                                            </td>
                                            <td>
                                                {isEditing ? (
                                                    <input 
                                                        className="inline-price-input" 
                                                        type="number" 
                                                        value={editData.price} 
                                                        onChange={(e) => setEditData({ ...editData, price: e.target.value })} 
                                                        autoFocus
                                                    />
                                                ) : (
                                                    <strong className="p-table-selling">₹{product.price}</strong>
                                                )}
                                            </td>
                                            <td className="p-table-mrp">
                                                <span>₹{product.mrp}</span>
                                                {discount > 0 && <span className="p-table-disc">({discount}% off)</span>}
                                            </td>
                                            <td>
                                                {isEditing ? (
                                                    <input 
                                                        className="inline-stock-input" 
                                                        type="number" 
                                                        value={editData.stock} 
                                                        onChange={(e) => setEditData({ ...editData, stock: e.target.value })} 
                                                    />
                                                ) : (
                                                    <span className={`p-stock-num ${product.stock <= 10 ? 'p-stock-warn' : ''}`}>
                                                        {product.stock} units
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                {product.stock === 0 ? (
                                                    <span className="p-status-pill p-status-danger">Out of Stock</span>
                                                ) : product.stock <= 10 ? (
                                                    <span className="p-status-pill p-status-warning">Low Stock</span>
                                                ) : (
                                                    <span className="p-status-pill p-status-success">In Stock</span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="p-actions-cell">
                                                    {isEditing ? (
                                                        <>
                                                            <button className="btn btn-sm btn-primary" onClick={() => saveEdit(product.id)} disabled={saving}>
                                                                <Save size={14} /> Save
                                                            </button>
                                                            <button className="btn btn-sm btn-ghost" onClick={() => setEditingId(null)}>
                                                                <X size={14} />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button className="btn btn-sm btn-ghost" onClick={() => startEdit(product)} title="Edit price & stock">
                                                                <Edit3 size={14} /> Edit
                                                            </button>
                                                            <button 
                                                                className="btn-icon btn-ghost btn-sm" 
                                                                onClick={() => toggleStock(product.id)} 
                                                                title={product.stock === 0 ? 'Mark In Stock' : 'Mark Out of Stock'}
                                                            >
                                                                {product.stock === 0 ? <Eye size={15} color="#10b981" /> : <EyeOff size={15} color="#94a3b8" />}
                                                            </button>
                                                            <button 
                                                                className="btn-icon btn-ghost btn-sm text-danger" 
                                                                onClick={() => deleteProduct(product.id)} 
                                                                title="Deactivate item"
                                                            >
                                                                <Trash2 size={15} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Product Cards Feed */}
                    <div className="products-mobile-feed show-mobile-products">
                        {filtered.map((product) => (
                            <div key={product.id} className="p-mobile-card card">
                                <div className="p-mobile-card-top">
                                    <img src={product.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=150"} alt={product.name} className="p-mobile-thumb" />
                                    <div className="p-mobile-info">
                                        <h4>{product.name}</h4>
                                        <span className="p-mobile-brand">{product.brand} • {product.unit}</span>
                                        <div className="p-mobile-price-row">
                                            <strong>₹{product.price}</strong>
                                            <span className="p-mobile-mrp">MRP ₹{product.mrp}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-mobile-card-footer">
                                    <span className={`p-status-pill ${product.stock === 0 ? 'p-status-danger' : product.stock <= 10 ? 'p-status-warning' : 'p-status-success'}`}>
                                        {product.stock} in stock
                                    </span>
                                    <div className="p-mobile-actions">
                                        <button className="btn btn-sm btn-secondary" onClick={() => startEdit(product)}>
                                            <Edit3 size={13} /> Edit
                                        </button>
                                        <button className="btn-icon btn-ghost btn-sm" onClick={() => toggleStock(product.id)}>
                                            {product.stock === 0 ? <Eye size={15} color="#10b981" /> : <EyeOff size={15} />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* ─── Add Product Modal ─── */}
            {showAddModal && (
                <div className="modal-overlay animate-fade-in" onClick={() => setShowAddModal(false)}>
                    <div className="modal-card card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-card-header">
                            <div className="modal-title-wrap">
                                <div className="modal-icon-box">
                                    <Package size={18} color="var(--primary)" />
                                </div>
                                <div>
                                    <h3>Add New Store Product</h3>
                                    <p>Fill in product details to add to inventory</p>
                                </div>
                            </div>
                            <button className="btn-icon btn-ghost" onClick={() => setShowAddModal(false)} aria-label="Close">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={addProduct} className="modal-form-body">
                            <div className="modal-form-grid">
                                <div className="m-form-group full-width">
                                    <label>Product Name *</label>
                                    <input 
                                        type="text" 
                                        className="input" 
                                        placeholder="e.g. Fortune Sunlite Sunflower Oil" 
                                        value={newProduct.name} 
                                        onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} 
                                        required 
                                    />
                                </div>

                                <div className="m-form-group">
                                    <label>Hindi Translation</label>
                                    <input 
                                        type="text" 
                                        className="input" 
                                        placeholder="e.g. फार्च्यून सूरजमुखी तेल" 
                                        value={newProduct.nameHi} 
                                        onChange={e => setNewProduct({ ...newProduct, nameHi: e.target.value })} 
                                    />
                                </div>

                                <div className="m-form-group">
                                    <label>Brand Name *</label>
                                    <input 
                                        type="text" 
                                        className="input" 
                                        placeholder="e.g. Fortune / Classmate / Surf Excel" 
                                        value={newProduct.brand} 
                                        onChange={e => setNewProduct({ ...newProduct, brand: e.target.value })} 
                                        required 
                                    />
                                </div>

                                <div className="m-form-group">
                                    <label>Category Department</label>
                                    <select 
                                        className="input" 
                                        value={newProduct.category} 
                                        onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}
                                    >
                                        <option value="groceries">Groceries &amp; Staples</option>
                                        <option value="stationery">Stationery &amp; Office</option>
                                        <option value="household-personal">Household &amp; Care</option>
                                    </select>
                                </div>

                                <div className="m-form-group">
                                    <label>Unit / Weight</label>
                                    <input 
                                        type="text" 
                                        className="input" 
                                        placeholder="e.g. 1 L, 1 kg, 500g, Pack of 6" 
                                        value={newProduct.unit} 
                                        onChange={e => setNewProduct({ ...newProduct, unit: e.target.value })} 
                                        required 
                                    />
                                </div>

                                <div className="m-form-group">
                                    <label>Selling Price (₹) *</label>
                                    <input 
                                        type="number" 
                                        className="input" 
                                        placeholder="150" 
                                        value={newProduct.price} 
                                        onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} 
                                        required 
                                    />
                                </div>

                                <div className="m-form-group">
                                    <label>MRP (₹) *</label>
                                    <input 
                                        type="number" 
                                        className="input" 
                                        placeholder="175" 
                                        value={newProduct.mrp} 
                                        onChange={e => setNewProduct({ ...newProduct, mrp: e.target.value })} 
                                        required 
                                    />
                                </div>

                                <div className="m-form-group">
                                    <label>Initial Stock Units</label>
                                    <input 
                                        type="number" 
                                        className="input" 
                                        placeholder="50" 
                                        value={newProduct.stock} 
                                        onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })} 
                                    />
                                </div>

                                <div className="m-form-group full-width">
                                    <label>Product Image</label>
                                    <div className="image-upload-row">
                                        <label className="btn btn-secondary upload-label-btn">
                                            <Upload size={16} /> {uploading ? 'Uploading...' : 'Choose Image File'}
                                            <input type="file" accept="image/*" onChange={handleImageUpload} hidden disabled={uploading} />
                                        </label>
                                        <input 
                                            type="text" 
                                            className="input" 
                                            placeholder="Or paste image URL" 
                                            value={newProduct.image} 
                                            onChange={e => setNewProduct({ ...newProduct, image: e.target.value })} 
                                        />
                                    </div>
                                    {newProduct.image && (
                                        <div className="uploaded-preview-box">
                                            <img src={newProduct.image} alt="Preview" />
                                        </div>
                                    )}
                                </div>

                                <div className="m-form-group full-width">
                                    <label>Short Description</label>
                                    <textarea 
                                        className="input" 
                                        rows={2} 
                                        placeholder="Product highlights &amp; ingredients..." 
                                        value={newProduct.description} 
                                        onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} 
                                    />
                                </div>
                            </div>

                            <div className="modal-card-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? <><Loader size={16} className="spin" /> Saving Item...</> : <><Plus size={16} /> Save &amp; Add to Catalog</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
