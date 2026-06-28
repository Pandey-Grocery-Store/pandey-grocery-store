import { useState, useEffect, useCallback } from 'react';
import { categories } from '../../data/categories';
import { productsApi, uploadApi } from '../../lib/api';
import { Search, Plus, Edit3, Eye, EyeOff, Save, X, Upload, Loader } from 'lucide-react';
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
    const [newProduct, setNewProduct] = useState({ name: '', nameHi: '', brand: '', category: 'groceries', subcategory: 'rice-flour', price: '', mrp: '', stock: 100, unit: '', description: '', image: '' });

    // Fetch products from API (fallback to mock)
    const fetchProducts = useCallback(async () => {
        setLoading(true);
        const data = await productsApi.getAll();
        setProductList(data?.products || []);
        setLoading(false);
    }, []);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    const filtered = productList.filter((p) => {
        const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.brand.toLowerCase().includes(searchQuery.toLowerCase());
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
        } catch { /* fallback to local */ }
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

    const addProduct = async () => {
        if (!newProduct.name || !newProduct.brand || !newProduct.price || !newProduct.mrp) return;
        setSaving(true);
        try {
            const data = await productsApi.create(newProduct);
            if (data?.product) {
                setProductList(prev => [data.product, ...prev]);
            }
        } catch {
            // Local fallback
            setProductList(prev => [{ ...newProduct, id: `local-${Date.now()}`, price: Number(newProduct.price), mrp: Number(newProduct.mrp), rating: 4.0, reviews: 0, isActive: true }, ...prev]);
        }
        setShowAddModal(false);
        setNewProduct({ name: '', nameHi: '', brand: '', category: 'groceries', subcategory: 'rice-flour', price: '', mrp: '', stock: 100, unit: '', description: '', image: '' });
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
        if (!confirm('Deactivate this product?')) return;
        try {
            await productsApi.delete(id);
        } catch { /* fallback */ }
        setProductList(prev => prev.filter(p => p.id !== id));
    };

    return (
        <div className="staff-products">
            <div className="dashboard-page-header">
                <div>
                    <h1 className="dashboard-page-title">Product Management</h1>
                    <p className="dashboard-page-subtitle">Add, edit, and manage inventory for all products</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                    <Plus size={18} /> Add Product
                </button>
            </div>

            {/* Filters */}
            <div className="products-toolbar card">
                <div className="input-icon-wrapper" style={{ flex: 1, maxWidth: 360 }}>
                    <Search size={18} />
                    <input className="input" placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <select className="input" style={{ width: 'auto' }} value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                    <option value="all">All Categories</option>
                    {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
                <span className="toolbar-result-count">{filtered.length} products</span>
            </div>

            {/* Products Table */}
            {loading ? (
                <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                    <Loader size={24} className="spin" /> Loading products...
                </div>
            ) : (
                <div className="products-table-wrapper card">
                    <table className="products-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Brand</th>
                                <th>Category</th>
                                <th>Price (₹)</th>
                                <th>MRP (₹)</th>
                                <th>Stock</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((product) => {
                                const isEditing = editingId === product.id;
                                return (
                                    <tr key={product.id} className={`product-row ${product.stock === 0 ? 'out-of-stock' : ''}`}>
                                        <td>
                                            <div className="product-cell">
                                                <img src={product.image} alt={product.name} className="product-thumb" />
                                                <div>
                                                    <span className="product-cell-name">{product.name}</span>
                                                    <span className="product-cell-unit">{product.unit}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{product.brand}</td>
                                        <td><span className="badge badge-primary">{product.subcategory}</span></td>
                                        <td>
                                            {isEditing ? (
                                                <input className="input inline-edit" type="number" value={editData.price} onChange={(e) => setEditData({ ...editData, price: e.target.value })} />
                                            ) : (
                                                <strong>₹{product.price}</strong>
                                            )}
                                        </td>
                                        <td className="mrp-cell">₹{product.mrp}</td>
                                        <td>
                                            {isEditing ? (
                                                <input className="input inline-edit" type="number" value={editData.stock} onChange={(e) => setEditData({ ...editData, stock: e.target.value })} />
                                            ) : (
                                                <span className={product.stock <= 10 ? 'low-stock-text' : ''}>{product.stock}</span>
                                            )}
                                        </td>
                                        <td>
                                            {product.stock === 0 ? (
                                                <span className="badge badge-danger">Out of Stock</span>
                                            ) : product.stock <= 10 ? (
                                                <span className="badge badge-warning">Low Stock</span>
                                            ) : (
                                                <span className="badge badge-success">In Stock</span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="product-actions">
                                                {isEditing ? (
                                                    <>
                                                        <button className="btn btn-sm btn-primary" onClick={() => saveEdit(product.id)} disabled={saving}><Save size={14} /> Save</button>
                                                        <button className="btn btn-sm btn-ghost" onClick={() => setEditingId(null)}><X size={14} /></button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button className="btn btn-sm btn-ghost" onClick={() => startEdit(product)}><Edit3 size={14} /> Edit</button>
                                                        <button className="btn btn-sm btn-ghost" onClick={() => toggleStock(product.id)} title={product.stock === 0 ? 'Mark In Stock' : 'Mark Out of Stock'}>
                                                            {product.stock === 0 ? <Eye size={14} /> : <EyeOff size={14} />}
                                                        </button>
                                                        <button className="btn btn-sm btn-ghost" onClick={() => deleteProduct(product.id)} title="Delete" style={{ color: 'var(--danger)' }}>
                                                            <X size={14} />
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
            )}

            {/* Add Product Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Add New Product</h2>
                            <button onClick={() => setShowAddModal(false)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                                <div className="form-group full-width"><label>Product Name *</label><input className="input" placeholder="e.g. Basmati Rice Premium" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} /></div>
                                <div className="form-group"><label>Hindi Name</label><input className="input" placeholder="e.g. बासमती चावल" value={newProduct.nameHi} onChange={e => setNewProduct({ ...newProduct, nameHi: e.target.value })} /></div>
                                <div className="form-group"><label>Brand *</label><input className="input" placeholder="e.g. India Gate" value={newProduct.brand} onChange={e => setNewProduct({ ...newProduct, brand: e.target.value })} /></div>
                                <div className="form-group"><label>Category</label>
                                    <select className="input" value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}>
                                        <option value="groceries">Groceries</option><option value="utensils">Kitchen Utensils</option>
                                    </select>
                                </div>
                                <div className="form-group"><label>Subcategory</label>
                                    <select className="input" value={newProduct.subcategory} onChange={e => setNewProduct({ ...newProduct, subcategory: e.target.value })}>
                                        {categories.find(c => c.id === newProduct.category)?.subcategories.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group"><label>Price (₹) *</label><input className="input" type="number" placeholder="185" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} /></div>
                                <div className="form-group"><label>MRP (₹) *</label><input className="input" type="number" placeholder="220" value={newProduct.mrp} onChange={e => setNewProduct({ ...newProduct, mrp: e.target.value })} /></div>
                                <div className="form-group"><label>Stock</label><input className="input" type="number" placeholder="100" value={newProduct.stock} onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })} /></div>
                                <div className="form-group"><label>Unit</label><input className="input" placeholder="1 kg" value={newProduct.unit} onChange={e => setNewProduct({ ...newProduct, unit: e.target.value })} /></div>
                                <div className="form-group full-width">
                                    <label>Product Image</label>
                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                        <label className="btn btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
                                            <Upload size={16} /> {uploading ? 'Uploading...' : 'Choose Image'}
                                            <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} disabled={uploading} />
                                        </label>
                                        <input className="input" placeholder="Or paste image URL" value={newProduct.image} onChange={e => setNewProduct({ ...newProduct, image: e.target.value })} style={{ flex: 1 }} />
                                    </div>
                                    {newProduct.image && <img src={newProduct.image} alt="Preview" style={{ marginTop: '0.5rem', height: 80, borderRadius: 8, objectFit: 'cover' }} />}
                                </div>
                                <div className="form-group full-width"><label>Description</label><textarea className="input" rows={3} placeholder="Product description..." value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} /></div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={addProduct} disabled={saving}>
                                {saving ? <><Loader size={14} className="spin" /> Saving...</> : 'Add Product'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
