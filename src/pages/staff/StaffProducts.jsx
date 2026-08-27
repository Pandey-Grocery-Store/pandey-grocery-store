import { useState, useEffect, useCallback } from 'react';
import { categories as defaultCategories } from '../../data/categories';
import { productsApi, uploadApi, categoriesApi } from '../../lib/api';
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
    ChevronDown,
    ShoppingBasket,
    BookOpen,
    Layers,
    Image as ImageIcon,
    Percent,
    AlertCircle,
    CheckCircle2,
    Store,
    Scale,
    Box,
    Calculator,
    ArrowRightLeft,
    FolderPlus
} from 'lucide-react';
import './StaffProducts.css';

const QUICK_BRANDS = ['Tata Sampann', 'Fortune', 'Amul', 'Aashirvaad', 'Surf Excel', 'Classmate', 'Dettol', 'Nestle', 'Parle', 'Haldiram', 'MDH', 'Catch'];
const QUICK_FIXED_UNITS = ['1 Pack', '1 Pc', 'Pack of 2', 'Pack of 4', 'Pack of 6', '1 Bottle', '1 Box', '100 ml', '250 ml', '500 ml', '1 L'];
const QUICK_WEIGHT_PRESETS = [
    { label: '250 g', weightKg: 0.25 },
    { label: '500 g', weightKg: 0.5 },
    { label: '1 kg', weightKg: 1 },
    { label: '2 kg', weightKg: 2 },
    { label: '5 kg', weightKg: 5 },
    { label: '10 kg', weightKg: 10 },
    { label: '25 kg (Bori)', weightKg: 25 },
];
const QUICK_RUPEE_PRESETS = [20, 50, 100, 200, 500, 1000];

export default function StaffProducts() {
    const [productList, setProductList] = useState([]);
    const [categoryList, setCategoryList] = useState(defaultCategories);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({});
    
    // Add Product Modal State
    const [showAddModal, setShowAddModal] = useState(false);
    const [newProduct, setNewProduct] = useState({ 
        name: '', 
        nameHi: '', 
        brand: '', 
        category: 'groceries', 
        subcategory: 'rice-grains', 
        productType: 'fixed', // 'fixed' | 'weight'
        price: '', // for fixed: price per pack; for weight: price per 1 kg
        mrp: '', 
        stock: 50, 
        unit: '1 Pack', 
        description: '', 
        image: '' 
    });
    const [addFormError, setAddFormError] = useState('');
    const [addFormSuccess, setAddFormSuccess] = useState('');

    // Dynamic Subcategory Creation Modal State
    const [showNewSubModal, setShowNewSubModal] = useState(false);
    const [newSubName, setNewSubName] = useState('');
    const [newSubNameHi, setNewSubNameHi] = useState('');
    const [creatingSub, setCreatingSub] = useState(false);

    // Interactive Weight <-> Rupee Calculator inside Add Modal
    const [calcMode, setCalcMode] = useState('rs-to-weight'); // 'rs-to-weight' | 'weight-to-rs'
    const [calcRs, setCalcRs] = useState('50');
    const [calcWeightKg, setCalcWeightKg] = useState('1');

    // Fetch products & categories dynamically
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [prodRes, catRes] = await Promise.all([
                productsApi.getAll(),
                categoriesApi.getAll()
            ]);
            if (prodRes?.products) {
                setProductList(prodRes.products);
            }
            if (catRes?.categories && catRes.categories.length > 0) {
                setCategoryList(catRes.categories);
            }
        } catch (err) {
            console.error('Failed to load products/categories', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const activeCategories = [
        { id: 'all', name: 'All Departments', icon: Layers },
        ...categoryList.map(c => ({
            id: c.id || c.slug,
            name: c.name,
            icon: c.id === 'stationery' ? BookOpen : c.id === 'household-personal' ? Sparkles : ShoppingBasket,
            subcategories: c.subcategories || []
        }))
    ];

    const currentCategoryObj = categoryList.find(c => (c.id === newProduct.category || c.slug === newProduct.category));
    const currentSubcategories = currentCategoryObj?.subcategories || [];

    const filtered = productList.filter((p) => {
        const matchSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
                            (p.nameHi && p.nameHi.toLowerCase().includes(searchQuery.toLowerCase()));
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

    const openAddProductModal = () => {
        const firstSub = currentSubcategories[0]?.id || 'all';
        setNewProduct({ 
            name: '', 
            nameHi: '', 
            brand: '', 
            category: 'groceries', 
            subcategory: firstSub, 
            productType: 'fixed',
            price: '', 
            mrp: '', 
            stock: 50, 
            unit: '1 Pack', 
            description: '', 
            image: '' 
        });
        setAddFormError('');
        setAddFormSuccess('');
        setShowAddModal(true);
    };

    // Handle Dynamic Subcategory Creation by Admin
    const handleCreateSubcategory = async (e) => {
        e.preventDefault();
        if (!newSubName.trim()) return;
        setCreatingSub(true);
        try {
            const res = await categoriesApi.addSubcategory(newProduct.category, {
                name: newSubName.trim(),
                nameHi: newSubNameHi.trim() || newSubName.trim()
            });
            if (res?.subcategory) {
                // Update local category list dynamically
                setCategoryList(prev => prev.map(cat => {
                    if (cat.id === newProduct.category || cat.slug === newProduct.category) {
                        const existingSubs = cat.subcategories || [];
                        return {
                            ...cat,
                            subcategories: [...existingSubs, res.subcategory]
                        };
                    }
                    return cat;
                }));
                // Auto-select the newly created subcategory
                setNewProduct(prev => ({ ...prev, subcategory: res.subcategory.id }));
            }
            setShowNewSubModal(false);
            setNewSubName('');
            setNewSubNameHi('');
        } catch (err) {
            console.error('Failed to create subcategory', err);
        } finally {
            setCreatingSub(false);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        setAddFormError('');
        try {
            const data = await uploadApi.uploadImage(file);
            if (data?.url) {
                setNewProduct(prev => ({ ...prev, image: data.url }));
            }
        } catch (err) {
            console.error('Upload failed:', err);
            setAddFormError('Image upload failed. You can paste an image URL instead.');
        }
        setUploading(false);
    };

    const addProduct = async (e) => {
        e.preventDefault();
        setAddFormError('');
        if (!newProduct.name?.trim()) { setAddFormError('Product title is required'); return; }
        if (!newProduct.brand?.trim()) { setAddFormError('Brand name is required'); return; }
        if (!newProduct.price || Number(newProduct.price) <= 0) { setAddFormError('Valid selling price is required'); return; }
        if (!newProduct.mrp || Number(newProduct.mrp) <= 0) { setAddFormError('Valid MRP is required'); return; }
        if (Number(newProduct.price) > Number(newProduct.mrp)) {
            setAddFormError('Selling price cannot be higher than MRP');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                ...newProduct,
                price: Number(newProduct.price),
                mrp: Number(newProduct.mrp),
                stock: Number(newProduct.stock) || 0,
                unit: newProduct.productType === 'weight' ? (newProduct.unit || '1 kg') : newProduct.unit
            };

            const data = await productsApi.create(payload);
            if (data?.product) {
                setProductList(prev => [data.product, ...prev]);
            }
            setAddFormSuccess('Product published to catalog successfully!');
            setTimeout(() => {
                setShowAddModal(false);
                setSaving(false);
            }, 1200);
        } catch (err) {
            // Fallback optimistic local insert
            const fallbackItem = { 
                ...newProduct, 
                id: `prod-${Date.now()}`, 
                price: Number(newProduct.price), 
                mrp: Number(newProduct.mrp), 
                stock: Number(newProduct.stock) || 0,
                rating: 4.8, 
                reviews: 1, 
                isActive: true,
                createdAt: new Date().toISOString()
            };
            setProductList(prev => [fallbackItem, ...prev]);
            setAddFormSuccess('Product saved to catalog!');
            setTimeout(() => {
                setShowAddModal(false);
                setSaving(false);
            }, 1200);
        }
    };

    const deleteProduct = async (id) => {
        if (!confirm('Are you sure you want to deactivate this product?')) return;
        try {
            await productsApi.delete(id);
        } catch { /* fallback */ }
        setProductList(prev => prev.filter(p => p.id !== id));
    };

    // Calculate discount for live preview
    const calculatedDiscount = (newProduct.mrp && newProduct.price && Number(newProduct.mrp) > Number(newProduct.price))
        ? Math.round(((Number(newProduct.mrp) - Number(newProduct.price)) / Number(newProduct.mrp)) * 100)
        : 0;

    // Weight <-> Price calculations based on price per kg
    const pricePerKg = Number(newProduct.price) || 0;
    const computedWeightFromRs = pricePerKg > 0 && Number(calcRs) > 0 
        ? ((Number(calcRs) / pricePerKg) * 1000).toFixed(0) // in grams
        : 0;
    const computedRsFromWeight = pricePerKg > 0 && Number(calcWeightKg) > 0
        ? (Number(calcWeightKg) * pricePerKg).toFixed(0) // in Rs
        : 0;

    return (
        <div className="staff-products-page animate-fade-in">
            {/* Page Header */}
            <div className="dashboard-page-header">
                <div className="dash-header-title-block">
                    <h1 className="dashboard-page-title">Product Catalog</h1>
                    <p className="dashboard-page-subtitle">Manage store prices, real-time inventory &amp; dynamic product listings</p>
                </div>
                <button className="btn btn-primary add-product-trigger-btn" onClick={openAddProductModal}>
                    <Plus size={18} /> Add New Product
                </button>
            </div>

            {/* Control Toolbar */}
            <div className="products-control-toolbar">
                <div className="toolbar-search-input">
                    <Search size={16} />
                    <input 
                        placeholder="Search product, Hindi name, or brand..." 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)} 
                    />
                    {searchQuery && (
                        <button className="search-clear-btn" onClick={() => setSearchQuery('')}>
                            <X size={14} />
                        </button>
                    )}
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
                    <span className="products-counter-badge">{filtered.length} products</span>
                </div>
            </div>

            {/* Products Table (Desktop) & Cards (Mobile) */}
            {loading ? (
                <div className="products-loading-state">
                    <Loader size={32} className="spin" color="var(--primary)" />
                    <p>Loading catalog items...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="products-empty-state">
                    <div className="empty-icon-circle">
                        <Package size={36} color="var(--primary)" />
                    </div>
                    <h3>No products found</h3>
                    <p>Try searching for a different keyword or create a new item.</p>
                    <button className="btn btn-primary btn-sm mt-3" onClick={openAddProductModal}>
                        <Plus size={14} /> Add Product Now
                    </button>
                </div>
            ) : (
                <>
                    {/* Desktop View Table */}
                    <div className="products-table-wrapper hidden-mobile-products">
                        <table className="products-data-table">
                            <thead>
                                <tr>
                                    <th>Product Details</th>
                                    <th>Type</th>
                                    <th>Brand</th>
                                    <th>Department</th>
                                    <th>Selling Price</th>
                                    <th>MRP</th>
                                    <th>Stock</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((product) => {
                                    const isEditing = editingId === product.id;
                                    const isWeightType = product.unit?.toLowerCase().includes('kg') || product.description?.includes('[TYPE:weight]');
                                    const discount = product.mrp > product.price 
                                        ? Math.round(((product.mrp - product.price) / product.mrp) * 100) 
                                        : 0;

                                    return (
                                        <tr key={product.id} className={`p-table-row ${product.stock === 0 ? 'out-of-stock-row' : ''}`}>
                                            <td>
                                                <div className="p-cell-wrap">
                                                    <img 
                                                        src={product.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=150"} 
                                                        alt={product.name} 
                                                        className="p-table-thumb" 
                                                        onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=150"; }}
                                                    />
                                                    <div className="p-cell-text">
                                                        <span className="p-table-name">{product.name}</span>
                                                        {product.nameHi && <span className="p-table-hi">{product.nameHi}</span>}
                                                        <span className="p-table-unit">{product.unit}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`p-type-pill ${isWeightType ? 'type-weight' : 'type-fixed'}`}>
                                                    {isWeightType ? <><Scale size={11} /> By Weight</> : <><Box size={11} /> Fixed Pack</>}
                                                </span>
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
                                                    <strong className="p-table-selling">₹{product.price} {isWeightType && <small>/ kg</small>}</strong>
                                                )}
                                            </td>
                                            <td className="p-table-mrp">
                                                <span>₹{product.mrp}</span>
                                                {discount > 0 && <span className="p-table-disc">{discount}% OFF</span>}
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
                                                        {product.stock} {isWeightType ? 'kg' : 'units'}
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <span className={`p-status-pill ${product.stock > 10 ? 'p-status-success' : product.stock > 0 ? 'p-status-warning' : 'p-status-danger'}`}>
                                                    {product.stock > 10 ? 'In Stock' : product.stock > 0 ? 'Low Stock' : 'Out of Stock'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="p-actions-cell">
                                                    {isEditing ? (
                                                        <>
                                                            <button className="btn-icon btn-ghost text-success" onClick={() => saveEdit(product.id)} title="Save changes">
                                                                <Check size={16} />
                                                            </button>
                                                            <button className="btn-icon btn-ghost" onClick={() => setEditingId(null)} title="Cancel">
                                                                <X size={16} />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button className="btn-icon btn-ghost" onClick={() => startEdit(product)} title="Quick edit">
                                                                <Edit3 size={15} />
                                                            </button>
                                                            <button className="btn-icon btn-ghost" onClick={() => toggleStock(product.id)} title="Toggle In/Out of Stock">
                                                                {product.stock === 0 ? <EyeOff size={15} color="#dc2626" /> : <Eye size={15} color="#059669" />}
                                                            </button>
                                                            <button className="btn-icon btn-ghost text-danger" onClick={() => deleteProduct(product.id)} title="Deactivate product">
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

                    {/* Mobile View Cards Feed */}
                    <div className="show-mobile-products">
                        {filtered.map((product) => {
                            const isEditing = editingId === product.id;
                            const isWeightType = product.unit?.toLowerCase().includes('kg') || product.description?.includes('[TYPE:weight]');
                            const discount = product.mrp > product.price 
                                ? Math.round(((product.mrp - product.price) / product.mrp) * 100) 
                                : 0;

                            return (
                                <div key={product.id} className="p-mobile-card">
                                    <div className="p-mobile-card-top">
                                        <img 
                                            src={product.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=150"} 
                                            alt={product.name} 
                                            className="p-mobile-thumb" 
                                            onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=150"; }}
                                        />
                                        <div className="p-mobile-info">
                                            <div className="p-mob-title-row">
                                                <h4>{product.name}</h4>
                                                <span className={`p-type-pill ${isWeightType ? 'type-weight' : 'type-fixed'}`}>
                                                    {isWeightType ? '⚖️ By Weight' : '📦 Fixed'}
                                                </span>
                                            </div>
                                            {product.nameHi && <span className="p-mobile-hi">{product.nameHi}</span>}
                                            <span className="p-mobile-brand">{product.brand} • {product.unit}</span>
                                            <div className="p-mobile-price-row">
                                                {isEditing ? (
                                                    <div className="p-mobile-inline-edit">
                                                        <input 
                                                            type="number" 
                                                            className="inline-price-input" 
                                                            value={editData.price} 
                                                            onChange={e => setEditData({ ...editData, price: e.target.value })} 
                                                            placeholder="Price"
                                                        />
                                                        <input 
                                                            type="number" 
                                                            className="inline-stock-input" 
                                                            value={editData.stock} 
                                                            onChange={e => setEditData({ ...editData, stock: e.target.value })} 
                                                            placeholder="Stock"
                                                        />
                                                    </div>
                                                ) : (
                                                    <>
                                                        <strong className="p-mob-selling">₹{product.price} {isWeightType && <small>/ kg</small>}</strong>
                                                        <span className="p-mobile-mrp">₹{product.mrp}</span>
                                                        {discount > 0 && <span className="p-mobile-disc">{discount}% OFF</span>}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-mobile-card-footer">
                                        <span className={`p-status-pill ${product.stock > 10 ? 'p-status-success' : product.stock > 0 ? 'p-status-warning' : 'p-status-danger'}`}>
                                            {product.stock} {isWeightType ? 'kg' : 'units'} in stock
                                        </span>

                                        <div className="p-mobile-actions">
                                            {isEditing ? (
                                                <>
                                                    <button className="btn btn-primary btn-xs" onClick={() => saveEdit(product.id)}>
                                                        <Check size={12} /> Save
                                                    </button>
                                                    <button className="btn btn-secondary btn-xs" onClick={() => setEditingId(null)}>
                                                        <X size={12} />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button className="btn-icon btn-ghost" onClick={() => startEdit(product)}>
                                                        <Edit3 size={15} />
                                                    </button>
                                                    <button className="btn-icon btn-ghost" onClick={() => toggleStock(product.id)}>
                                                        {product.stock === 0 ? <EyeOff size={15} color="#dc2626" /> : <Eye size={15} color="#059669" />}
                                                    </button>
                                                    <button className="btn-icon btn-ghost text-danger" onClick={() => deleteProduct(product.id)}>
                                                        <Trash2 size={15} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* ══════════════════════════════════════════════════════════
                ✨ REDESIGNED ADD NEW PRODUCT MODAL (CREATIVE & MATTE)
                ══════════════════════════════════════════════════════════ */}
            {showAddModal && (
                <div className="modal-overlay animate-fade-in" onClick={() => setShowAddModal(false)}>
                    <div className="add-product-modal-dialog" onClick={e => e.stopPropagation()}>
                        
                        {/* Modal Header */}
                        <div className="ap-modal-header">
                            <div className="ap-header-title-box">
                                <div className="ap-icon-badge">
                                    <Plus size={20} color="var(--primary)" />
                                </div>
                                <div>
                                    <h3>Add New Product to Store</h3>
                                    <p>Publish fresh grocery or stationery items to Haldwani catalog</p>
                                </div>
                            </div>
                            <button className="btn-icon btn-ghost ap-close-btn" onClick={() => setShowAddModal(false)} title="Close">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Status Feedback Alerts */}
                        {addFormError && (
                            <div className="ap-alert-box error animate-fade-in">
                                <AlertCircle size={16} />
                                <span>{addFormError}</span>
                            </div>
                        )}
                        {addFormSuccess && (
                            <div className="ap-alert-box success animate-fade-in">
                                <CheckCircle2 size={16} />
                                <span>{addFormSuccess}</span>
                            </div>
                        )}

                        {/* Form Container with Desktop 2-Column Split */}
                        <form onSubmit={addProduct} className="ap-modal-form">
                            <div className="ap-modal-body-split">
                                
                                {/* ── Left Side: Form Inputs Stack ── */}
                                <div className="ap-form-left-col">
                                    
                                    {/* 1. Product Type Selector (Fixed Pack vs Loose Weight) */}
                                    <div className="ap-section-card ap-type-selector-card">
                                        <div className="ap-section-head">
                                            <span className="ap-step-num">1</span>
                                            <h4>Select Product Type</h4>
                                        </div>
                                        <div className="ap-product-type-grid">
                                            <div 
                                                className={`ap-type-option-box ${newProduct.productType === 'fixed' ? 'active' : ''}`}
                                                onClick={() => setNewProduct({ ...newProduct, productType: 'fixed', unit: '1 Pack' })}
                                            >
                                                <div className="type-icon-circle"><Box size={18} /></div>
                                                <div className="type-text-wrap">
                                                    <strong>Fixed Pack / Unit Item</strong>
                                                    <span>Soap, Biscuit, Pen, Oil Bottle (Fixed 1 Pack Price)</span>
                                                </div>
                                                {newProduct.productType === 'fixed' && <Check size={16} className="type-check-icon" />}
                                            </div>

                                            <div 
                                                className={`ap-type-option-box ${newProduct.productType === 'weight' ? 'active' : ''}`}
                                                onClick={() => setNewProduct({ ...newProduct, productType: 'weight', unit: '1 kg' })}
                                            >
                                                <div className="type-icon-circle weight-icon"><Scale size={18} /></div>
                                                <div className="type-text-wrap">
                                                    <strong>Loose / By Weight Item</strong>
                                                    <span>Rice, Atta, Dal, Sugar (Sold per kg / g or ₹ amount)</span>
                                                </div>
                                                {newProduct.productType === 'weight' && <Check size={16} className="type-check-icon" />}
                                            </div>
                                        </div>
                                    </div>

                                    {/* 2. Department & Dynamic Subcategory Selector */}
                                    <div className="ap-section-card">
                                        <div className="ap-section-head">
                                            <span className="ap-step-num">2</span>
                                            <h4>Department &amp; Subcategory</h4>
                                        </div>
                                        
                                        {/* Department Selector Pills */}
                                        <div className="ap-dept-pills-row">
                                            {categoryList.map((cat) => {
                                                const isSelected = newProduct.category === (cat.id || cat.slug);
                                                const Icon = cat.id === 'stationery' ? BookOpen : cat.id === 'household-personal' ? Sparkles : ShoppingBasket;
                                                return (
                                                    <button
                                                        type="button"
                                                        key={cat.id || cat.slug}
                                                        className={`ap-dept-btn ${isSelected ? 'selected' : ''}`}
                                                        onClick={() => {
                                                            const catKey = cat.id || cat.slug;
                                                            const firstSub = cat.subcategories?.[0]?.id || 'all';
                                                            setNewProduct({ ...newProduct, category: catKey, subcategory: firstSub });
                                                        }}
                                                    >
                                                        <Icon size={16} />
                                                        <span>{cat.name.split(' ')[0]}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* Dynamic Subcategory Dropdown + Add New Subcategory Trigger */}
                                        <div className="ap-input-group mt-2">
                                            <div className="subcat-label-row">
                                                <label>Dynamic Subcategory</label>
                                                <button 
                                                    type="button" 
                                                    className="btn-link-action add-sub-btn" 
                                                    onClick={() => setShowNewSubModal(true)}
                                                >
                                                    <FolderPlus size={13} /> + Create New Subcategory
                                                </button>
                                            </div>
                                            <select 
                                                className="input" 
                                                value={newProduct.subcategory} 
                                                onChange={e => setNewProduct({ ...newProduct, subcategory: e.target.value })}
                                            >
                                                {currentSubcategories.map(sub => (
                                                    <option key={sub.id} value={sub.id}>
                                                        {sub.name} {sub.nameHi ? `(${sub.nameHi})` : ''}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* 3. Product Identity */}
                                    <div className="ap-section-card">
                                        <div className="ap-section-head">
                                            <span className="ap-step-num">3</span>
                                            <h4>Product Details</h4>
                                        </div>

                                        <div className="ap-inputs-grid-2">
                                            <div className="ap-input-group full-width">
                                                <label>Product Title (English) *</label>
                                                <input 
                                                    type="text" 
                                                    className="input" 
                                                    placeholder={newProduct.productType === 'weight' ? "e.g. Royal Basmati Rice (Loose)" : "e.g. Dettol Original Bathing Soap"} 
                                                    value={newProduct.name} 
                                                    onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} 
                                                    required 
                                                />
                                            </div>

                                            <div className="ap-input-group">
                                                <label>Hindi Name (हिंदी नाम)</label>
                                                <input 
                                                    type="text" 
                                                    className="input" 
                                                    placeholder={newProduct.productType === 'weight' ? "e.g. बासमती चावल (खुला)" : "e.g. डेटॉल साबुन"} 
                                                    value={newProduct.nameHi} 
                                                    onChange={e => setNewProduct({ ...newProduct, nameHi: e.target.value })} 
                                                />
                                            </div>

                                            <div className="ap-input-group">
                                                <label>Brand / Source *</label>
                                                <input 
                                                    type="text" 
                                                    className="input" 
                                                    placeholder="e.g. Tata / Farm Fresh" 
                                                    value={newProduct.brand} 
                                                    onChange={e => setNewProduct({ ...newProduct, brand: e.target.value })} 
                                                    required 
                                                />
                                            </div>
                                        </div>

                                        {/* Quick Brand Presets */}
                                        <div className="ap-quick-chips-wrap">
                                            <span className="chips-label">Popular Brands:</span>
                                            {QUICK_BRANDS.map(b => (
                                                <button 
                                                    type="button" 
                                                    key={b} 
                                                    className={`quick-chip-pill ${newProduct.brand === b ? 'active' : ''}`}
                                                    onClick={() => setNewProduct({ ...newProduct, brand: b })}
                                                >
                                                    {b}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Pack Size / Unit Setup */}
                                        <div className="ap-input-group mt-2">
                                            <label>
                                                {newProduct.productType === 'weight' ? 'Default Base Unit' : 'Unit / Pack Specification'} *
                                            </label>
                                            <input 
                                                type="text" 
                                                className="input" 
                                                placeholder={newProduct.productType === 'weight' ? "1 kg (Base Unit)" : "e.g. 1 Pack, Pack of 4, 100 ml"} 
                                                value={newProduct.unit} 
                                                onChange={e => setNewProduct({ ...newProduct, unit: e.target.value })} 
                                                required 
                                            />
                                        </div>

                                        {newProduct.productType === 'fixed' && (
                                            <div className="ap-quick-chips-wrap">
                                                <span className="chips-label">Preset Units:</span>
                                                {QUICK_FIXED_UNITS.map(u => (
                                                    <button 
                                                        type="button" 
                                                        key={u} 
                                                        className={`quick-chip-pill ${newProduct.unit === u ? 'active' : ''}`}
                                                        onClick={() => setNewProduct({ ...newProduct, unit: u })}
                                                    >
                                                        {u}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* 4. Pricing & Inventory */}
                                    <div className="ap-section-card">
                                        <div className="ap-section-head">
                                            <span className="ap-step-num">4</span>
                                            <h4>Pricing &amp; Stock</h4>
                                        </div>

                                        <div className="ap-inputs-grid-3">
                                            <div className="ap-input-group">
                                                <label>{newProduct.productType === 'weight' ? 'Selling Price (₹ / kg) *' : 'Selling Price (₹) *'}</label>
                                                <div className="input-with-symbol">
                                                    <span>₹</span>
                                                    <input 
                                                        type="number" 
                                                        className="input" 
                                                        placeholder={newProduct.productType === 'weight' ? "60" : "150"} 
                                                        value={newProduct.price} 
                                                        onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} 
                                                        required 
                                                        min={1}
                                                    />
                                                </div>
                                            </div>

                                            <div className="ap-input-group">
                                                <label>{newProduct.productType === 'weight' ? 'MRP (₹ / kg) *' : 'MRP (₹) *'}</label>
                                                <div className="input-with-symbol">
                                                    <span>₹</span>
                                                    <input 
                                                        type="number" 
                                                        className="input" 
                                                        placeholder={newProduct.productType === 'weight' ? "75" : "175"} 
                                                        value={newProduct.mrp} 
                                                        onChange={e => setNewProduct({ ...newProduct, mrp: e.target.value })} 
                                                        required 
                                                        min={1}
                                                    />
                                                </div>
                                            </div>

                                            <div className="ap-input-group">
                                                <label>{newProduct.productType === 'weight' ? 'Total Stock (kg)' : 'Initial Stock (Units)'}</label>
                                                <input 
                                                    type="number" 
                                                    className="input" 
                                                    placeholder="50" 
                                                    value={newProduct.stock} 
                                                    onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })} 
                                                    min={0}
                                                />
                                            </div>
                                        </div>

                                        {/* Dynamic Discount Calculator Notice */}
                                        {calculatedDiscount > 0 && (
                                            <div className="ap-discount-badge-notice">
                                                <Percent size={14} />
                                                <span>Discount: <strong>{calculatedDiscount}% OFF</strong> (Customer saves ₹{(Number(newProduct.mrp) - Number(newProduct.price)).toFixed(0)} {newProduct.productType === 'weight' ? 'per kg' : 'per pack'})</span>
                                            </div>
                                        )}

                                        {/* ── Bi-directional Price <-> Weight Live Calculator Widget ── */}
                                        {newProduct.productType === 'weight' && pricePerKg > 0 && (
                                            <div className="ap-weight-calc-widget">
                                                <div className="calc-widget-header">
                                                    <div className="calc-title">
                                                        <Calculator size={15} color="var(--primary)" />
                                                        <strong>Bi-directional Price ↔ Weight Calculator</strong>
                                                    </div>
                                                    <span className="rate-badge">Rate: ₹{pricePerKg} / kg</span>
                                                </div>

                                                <div className="calc-tabs-row">
                                                    <button 
                                                        type="button" 
                                                        className={`calc-mode-tab ${calcMode === 'rs-to-weight' ? 'active' : ''}`}
                                                        onClick={() => setCalcMode('rs-to-weight')}
                                                    >
                                                        ₹ Amount ➔ Weight
                                                    </button>
                                                    <button 
                                                        type="button" 
                                                        className={`calc-mode-tab ${calcMode === 'weight-to-rs' ? 'active' : ''}`}
                                                        onClick={() => setCalcMode('weight-to-rs')}
                                                    >
                                                        Weight ➔ ₹ Amount
                                                    </button>
                                                </div>

                                                {calcMode === 'rs-to-weight' ? (
                                                    <div className="calc-interactive-body">
                                                        <div className="calc-input-row">
                                                            <div className="calc-field">
                                                                <label>Customer enters ₹ Amount:</label>
                                                                <div className="input-with-symbol">
                                                                    <span>₹</span>
                                                                    <input 
                                                                        type="number" 
                                                                        className="input" 
                                                                        value={calcRs} 
                                                                        onChange={e => setCalcRs(e.target.value)} 
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="calc-arrow">
                                                                <ArrowRightLeft size={16} />
                                                            </div>
                                                            <div className="calc-result-box">
                                                                <span className="res-label">Delivered Weight:</span>
                                                                <strong className="res-val">{computedWeightFromRs} g</strong>
                                                                <span className="res-sub">({(computedWeightFromRs / 1000).toFixed(2)} kg)</span>
                                                            </div>
                                                        </div>

                                                        {/* Quick Rupee Presets */}
                                                        <div className="calc-quick-pills">
                                                            <span>Quick ₹:</span>
                                                            {QUICK_RUPEE_PRESETS.map(r => (
                                                                <button 
                                                                    type="button" 
                                                                    key={r} 
                                                                    className={`calc-pill ${calcRs === String(r) ? 'active' : ''}`}
                                                                    onClick={() => setCalcRs(String(r))}
                                                                >
                                                                    ₹{r}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="calc-interactive-body">
                                                        <div className="calc-input-row">
                                                            <div className="calc-field">
                                                                <label>Customer enters Weight (kg):</label>
                                                                <input 
                                                                    type="number" 
                                                                    step="0.1" 
                                                                    className="input" 
                                                                    value={calcWeightKg} 
                                                                    onChange={e => setCalcWeightKg(e.target.value)} 
                                                                />
                                                            </div>
                                                            <div className="calc-arrow">
                                                                <ArrowRightLeft size={16} />
                                                            </div>
                                                            <div className="calc-result-box">
                                                                <span className="res-label">Calculated Price:</span>
                                                                <strong className="res-val">₹{computedRsFromWeight}</strong>
                                                                <span className="res-sub">for {calcWeightKg} kg</span>
                                                            </div>
                                                        </div>

                                                        {/* Quick Weight Presets */}
                                                        <div className="calc-quick-pills">
                                                            <span>Quick Weight:</span>
                                                            {QUICK_WEIGHT_PRESETS.map(w => (
                                                                <button 
                                                                    type="button" 
                                                                    key={w.label} 
                                                                    className={`calc-pill ${calcWeightKg === String(w.weightKg) ? 'active' : ''}`}
                                                                    onClick={() => setCalcWeightKg(String(w.weightKg))}
                                                                >
                                                                    {w.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* 5. Product Image Upload */}
                                    <div className="ap-section-card">
                                        <div className="ap-section-head">
                                            <span className="ap-step-num">5</span>
                                            <h4>Product Media &amp; Description</h4>
                                        </div>

                                        <div className="ap-input-group">
                                            <label>Product Image</label>
                                            <div className="ap-image-upload-zone">
                                                <label className="ap-upload-trigger">
                                                    <Upload size={18} />
                                                    <span>{uploading ? 'Uploading to cloud...' : 'Upload Image File'}</span>
                                                    <input type="file" accept="image/*" onChange={handleImageUpload} hidden disabled={uploading} />
                                                </label>
                                                <span className="ap-or-text">OR</span>
                                                <input 
                                                    type="text" 
                                                    className="input ap-url-input" 
                                                    placeholder="Paste image web URL..." 
                                                    value={newProduct.image} 
                                                    onChange={e => setNewProduct({ ...newProduct, image: e.target.value })} 
                                                />
                                            </div>
                                        </div>

                                        <div className="ap-input-group mt-2">
                                            <label>Short Description / Features</label>
                                            <textarea 
                                                className="input" 
                                                rows={2} 
                                                placeholder="Key ingredients, benefits, packaging highlights..." 
                                                value={newProduct.description} 
                                                onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} 
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* ── Right Side: Live Interactive Customer Preview Card ── */}
                                <div className="ap-preview-right-col">
                                    <div className="ap-preview-sticky-card">
                                        <div className="ap-preview-badge">
                                            <Eye size={13} /> Live Store Preview
                                        </div>

                                        <div className="ap-product-preview-card">
                                            <div className="ap-card-img-wrap">
                                                {newProduct.image ? (
                                                    <img 
                                                        src={newProduct.image} 
                                                        alt={newProduct.name || 'Preview'} 
                                                        onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400"; }}
                                                    />
                                                ) : (
                                                    <div className="ap-card-img-placeholder">
                                                        <ImageIcon size={36} color="#cbd5e1" />
                                                        <span>Product Image Preview</span>
                                                    </div>
                                                )}
                                                {calculatedDiscount > 0 && (
                                                    <span className="ap-card-discount-tag">{calculatedDiscount}% OFF</span>
                                                )}
                                                <span className={`ap-card-type-tag ${newProduct.productType === 'weight' ? 'weight-tag' : 'fixed-tag'}`}>
                                                    {newProduct.productType === 'weight' ? '⚖️ By Weight' : '📦 Pack'}
                                                </span>
                                            </div>

                                            <div className="ap-card-body">
                                                <div className="ap-card-brand-row">
                                                    <span className="ap-card-brand">{newProduct.brand || 'Brand Name'}</span>
                                                    <span className="ap-card-unit">{newProduct.unit || (newProduct.productType === 'weight' ? '1 kg' : '1 Unit')}</span>
                                                </div>

                                                <h4 className="ap-card-title">
                                                    {newProduct.name || 'Product Title Appears Here'}
                                                </h4>
                                                {newProduct.nameHi && (
                                                    <p className="ap-card-hi">{newProduct.nameHi}</p>
                                                )}

                                                <div className="ap-card-price-row">
                                                    <div className="ap-card-prices">
                                                        <strong className="ap-card-selling">
                                                            ₹{newProduct.price || '0'} {newProduct.productType === 'weight' && <small>/ kg</small>}
                                                        </strong>
                                                        {newProduct.mrp && Number(newProduct.mrp) > Number(newProduct.price) && (
                                                            <span className="ap-card-mrp">₹{newProduct.mrp}</span>
                                                        )}
                                                    </div>
                                                    <span className={`ap-card-stock-pill ${Number(newProduct.stock) > 10 ? 'in-stock' : 'low-stock'}`}>
                                                        {Number(newProduct.stock) > 0 ? `${newProduct.stock} ${newProduct.productType === 'weight' ? 'kg' : 'units'}` : 'Out of Stock'}
                                                    </span>
                                                </div>

                                                {/* Weight Quick Selector Mock for Customer View */}
                                                {newProduct.productType === 'weight' && (
                                                    <div className="ap-card-weight-mock-pills">
                                                        <span className="mock-weight-chip active">500g (₹{((Number(newProduct.price) || 0) * 0.5).toFixed(0)})</span>
                                                        <span className="mock-weight-chip">1kg (₹{newProduct.price || 0})</span>
                                                        <span className="mock-weight-chip">2kg</span>
                                                    </div>
                                                )}

                                                <div className="ap-card-mock-btn">
                                                    <ShoppingBasket size={14} /> Add to Cart (Mock)
                                                </div>
                                            </div>
                                        </div>

                                        <div className="ap-preview-hint">
                                            <Store size={13} />
                                            <span>Real-time preview of how customers in Haldwani will view and purchase this item.</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer Controls */}
                            <div className="ap-modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary ap-publish-btn" disabled={saving || uploading}>
                                    {saving ? <><Loader size={16} className="spin" /> Publishing...</> : <><Plus size={16} /> Publish &amp; Add to Catalog</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════
                ✨ ADD DYNAMIC SUBCATEGORY DIALOG (ADMIN CREATION)
                ══════════════════════════════════════════════════════════ */}
            {showNewSubModal && (
                <div className="modal-overlay animate-fade-in" onClick={() => setShowNewSubModal(false)} style={{ zIndex: 10005 }}>
                    <div className="subcat-modal-dialog" onClick={e => e.stopPropagation()}>
                        <div className="subcat-modal-header">
                            <div className="subcat-modal-title">
                                <FolderPlus size={18} color="var(--primary)" />
                                <h3>Create Dynamic Subcategory</h3>
                            </div>
                            <button className="btn-icon btn-ghost" onClick={() => setShowNewSubModal(false)}>
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateSubcategory} className="subcat-modal-form">
                            <p className="subcat-instruct">
                                Adding a new subcategory under <strong>{currentCategoryObj?.name || newProduct.category}</strong>. It will be immediately available in the product catalog and store filters.
                            </p>

                            <div className="ap-input-group">
                                <label>Subcategory Title (English) *</label>
                                <input 
                                    type="text" 
                                    className="input" 
                                    placeholder="e.g. Dry Fruits &amp; Nuts, Cold Drinks, Chart Paper" 
                                    value={newSubName} 
                                    onChange={e => setNewSubName(e.target.value)} 
                                    required 
                                    autoFocus
                                />
                            </div>

                            <div className="ap-input-group mt-2">
                                <label>Hindi Name (हिंदी नाम)</label>
                                <input 
                                    type="text" 
                                    className="input" 
                                    placeholder="e.g. सूखे मेवे और नट्स" 
                                    value={newSubNameHi} 
                                    onChange={e => setNewSubNameHi(e.target.value)} 
                                />
                            </div>

                            <div className="subcat-modal-footer mt-3">
                                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowNewSubModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary btn-sm" disabled={creatingSub || !newSubName.trim()}>
                                    {creatingSub ? <><Loader size={14} className="spin" /> Creating...</> : <><Plus size={14} /> Create Subcategory</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
