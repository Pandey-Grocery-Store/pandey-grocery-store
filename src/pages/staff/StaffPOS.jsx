import { useState, useEffect, useRef } from 'react';
import { 
    Search, 
    Plus, 
    Minus, 
    Trash2, 
    ShoppingCart, 
    User, 
    Phone, 
    CheckCircle2, 
    Sparkles, 
    ArrowRight, 
    Receipt, 
    RefreshCw, 
    Store, 
    IndianRupee,
    Tag,
    Layers,
    X,
    UserPlus,
    Check,
    Wallet,
    Scale,
    Box,
    Calculator,
    Mail,
    PenLine,
    AlertCircle,
    Loader,
    ArrowRightLeft,
    Percent,
    Zap
} from 'lucide-react';
import { productsApi, ordersApi, customersApi } from '../../lib/api';
import './StaffPOS.css';

const QUICK_RUPEE_PRESETS = [20, 50, 100, 200, 500, 1000];

const QUICK_WEIGHT_PRESETS = [
    { label: '250 g', weightKg: 0.25 },
    { label: '500 g', weightKg: 0.5 },
    { label: '1 kg', weightKg: 1 },
    { label: '1.5 kg', weightKg: 1.5 },
    { label: '2 kg', weightKg: 2 },
    { label: '5 kg', weightKg: 5 },
    { label: '10 kg', weightKg: 10 },
];

export default function StaffPOS() {
    const [products, setProducts] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [cart, setCart] = useState([]);

    // Customer Selection & Dropdown State
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [custSearchQuery, setCustSearchQuery] = useState('');
    const [showCustDropdown, setShowCustDropdown] = useState(false);
    const [isCustomWalkIn, setIsCustomWalkIn] = useState(false);
    const [customerInfo, setCustomerInfo] = useState({ name: 'Walk-in Customer', phone: '', email: '', address: 'In-store Counter Sale' });
    const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
    const [customerError, setCustomerError] = useState('');

    // Quick Add New Customer Modal State
    const [showNewCustModal, setShowNewCustModal] = useState(false);
    const [newCustForm, setNewCustForm] = useState({ name: '', phone: '', email: '', address: '' });
    const [isCreatingCust, setIsCreatingCust] = useState(false);
    const [newCustError, setNewCustError] = useState('');

    // ── Direct Customer Charge State (staff adds money directly into customer account/bill) ──
    const [directChargeAmount, setDirectChargeAmount] = useState('');
    const [directChargeDesc, setDirectChargeDesc] = useState('');

    // Edit Customer Account State (for adding/updating email so customer can log in)
    const [showEditCustModal, setShowEditCustModal] = useState(false);
    const [editCustName, setEditCustName] = useState('');
    const [editCustPhone, setEditCustPhone] = useState('');
    const [editCustEmail, setEditCustEmail] = useState('');
    const [editCustSubmitting, setEditCustSubmitting] = useState(false);
    const [editCustError, setEditCustError] = useState('');
    const [editCustSuccess, setEditCustSuccess] = useState('');

    // ── Bi-directional Price ↔ Weight Calculator State ──
    const [showWeightCalcModal, setShowWeightCalcModal] = useState(false);
    const [weightCalcProduct, setWeightCalcProduct] = useState(null); // null if custom loose item
    const [calcSellingPrice, setCalcSellingPrice] = useState('33');
    const [calcMrp, setCalcMrp] = useState('14');
    const [calcStock, setCalcStock] = useState('50');
    const [calcMode, setCalcMode] = useState('rs-to-weight'); // 'rs-to-weight' | 'weight-to-rs'
    const [calcRs, setCalcRs] = useState('50');
    const [calcWeightKg, setCalcWeightKg] = useState('1.5');
    const [customItemName, setCustomItemName] = useState('');

    // ── Quick Add Product Modal State ──
    const [showQuickAddProductModal, setShowQuickAddProductModal] = useState(false);
    const [newProductForm, setNewProductForm] = useState({
        name: '',
        category: 'groceries',
        productType: 'weight',
        price: '33',
        mrp: '14',
        stock: '50',
        unit: 'kg',
        image: ''
    });
    const [isSavingProduct, setIsSavingProduct] = useState(false);
    const [quickProductMsg, setQuickProductMsg] = useState({ type: '', text: '' });

    const [paymentMode, setPaymentMode] = useState('paid_cash'); // 'paid_cash' | 'paid_upi' | 'khata_due'
    const [mobileTab, setMobileTab] = useState('catalog'); // 'catalog' | 'bill'
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [completedOrder, setCompletedOrder] = useState(null);
    const [error, setError] = useState(null);

    const custDropdownRef = useRef(null);

    // Live calculations for Bi-directional Price ↔ Weight Calculator
    const pricePerKg = Number(calcSellingPrice) > 0 ? Number(calcSellingPrice) : 33;
    const mrpPerKg = Number(calcMrp) > 0 ? Number(calcMrp) : 0;
    const calculatedDiscount = (mrpPerKg > pricePerKg && mrpPerKg > 0)
        ? Math.round(((mrpPerKg - pricePerKg) / mrpPerKg) * 100)
        : 0;

    const computedWeightFromRs = pricePerKg > 0 
        ? Math.round((Number(calcRs || 0) / pricePerKg) * 1000) 
        : 0;
    const computedRsFromWeight = Math.round(Number(calcWeightKg || 0) * pricePerKg);

    const deliveredWeightGrams = computedWeightFromRs;
    const deliveredWeightKg = (computedWeightFromRs / 1000).toFixed(2);

    const activeWeightLabel = calcMode === 'rs-to-weight'
        ? (computedWeightFromRs >= 1000 ? `${deliveredWeightKg} kg` : `${deliveredWeightGrams} g`)
        : `${calcWeightKg} kg`;

    const activeCalculatedPrice = calcMode === 'rs-to-weight'
        ? (Number(calcRs) || 0)
        : computedRsFromWeight;

    // Default item naming by details
    const defaultCalculatedItemName = customItemName.trim()
        ? customItemName.trim()
        : weightCalcProduct 
            ? `${weightCalcProduct.name} (${activeWeightLabel} @ ₹${pricePerKg}/kg)`
            : `Loose Item (${activeWeightLabel} @ ₹${pricePerKg}/kg)`;

    const fetchCustomers = async () => {
        setIsLoadingCustomers(true);
        setCustomerError('');
        try {
            const custData = await customersApi.getAll();
            if (custData?.customers) {
                setCustomers(custData.customers);
            }
        } catch (err) {
            console.error('Failed to load customers for POS', err);
            const msg = err.message || '';
            if (msg.includes('401') || msg.includes('token') || msg.includes('Authentication') || msg.includes('Access denied')) {
                setCustomerError('Session expired. Please log in again to load customers.');
            } else {
                setCustomerError('Could not load customers from database.');
            }
        } finally {
            setIsLoadingCustomers(false);
        }
    };

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const prodData = await productsApi.getAll();
                if (prodData?.products) setProducts(prodData.products);
            } catch (err) {
                console.error('Failed to load products for POS', err);
            }
            fetchCustomers();
        };
        fetchInitialData();
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (custDropdownRef.current && !custDropdownRef.current.contains(e.target)) {
                setShowCustDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const categories = [
        { id: 'all', label: 'All Items' },
        { id: 'groceries', label: 'Groceries' },
        { id: 'stationery', label: 'Stationery' },
        { id: 'household-personal', label: 'Household & Care' },
    ];

    const filteredProducts = products.filter(p => {
        const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchCategory = selectedCategory === 'all' || p.category === selectedCategory;
        return matchSearch && matchCategory;
    });

    const matchedCustomers = customers.filter(c => {
        if (!custSearchQuery.trim()) return true;
        const q = custSearchQuery.trim().toLowerCase();
        const nameMatch = c.name && c.name.toLowerCase().includes(q);
        const phoneMatch = c.phone && String(c.phone).includes(q);
        const emailMatch = c.email && c.email.toLowerCase().includes(q);
        return nameMatch || phoneMatch || emailMatch;
    });

    const handleSelectCustomer = (customer) => {
        setSelectedCustomer(customer);
        setCustomerInfo({
            name: customer.name,
            phone: customer.phone || '',
            email: customer.email || '',
            address: 'In-store Counter Sale'
        });
        setCustSearchQuery('');
        setShowCustDropdown(false);
        setIsCustomWalkIn(false);
    };

    const handleClearCustomer = () => {
        setSelectedCustomer(null);
        setCustomerInfo({ name: 'Walk-in Customer', phone: '', email: '', address: 'In-store Counter Sale' });
        setCustSearchQuery('');
        setIsCustomWalkIn(false);
    };

    const openEditCustModal = (cust) => {
        if (!cust) return;
        setEditCustName(cust.name || '');
        setEditCustPhone(cust.phone || '');
        setEditCustEmail(cust.email && !cust.email.includes('@pandeygrocery.local') ? cust.email : '');
        setEditCustError('');
        setEditCustSuccess('');
        setShowEditCustModal(true);
    };

    const handleSaveCustDetails = async (e) => {
        e.preventDefault();
        if (!selectedCustomer) return;
        setEditCustSubmitting(true);
        setEditCustError('');
        setEditCustSuccess('');
        try {
            const res = await customersApi.update(selectedCustomer.id, {
                name: editCustName,
                phone: editCustPhone,
                email: editCustEmail
            });
            const updated = res.customer;
            setSelectedCustomer(prev => ({ ...prev, ...updated }));
            setCustomerInfo(prev => ({
                ...prev,
                name: updated.name,
                phone: updated.phone || '',
                email: updated.email || ''
            }));
            setCustomers(prev => prev.map(c => c.id === selectedCustomer.id ? { ...c, ...updated } : c));
            setEditCustSuccess('Customer profile updated! They can now log in using this email.');
            setTimeout(() => {
                setShowEditCustModal(false);
                setEditCustSuccess('');
            }, 1200);
        } catch (err) {
            setEditCustError(err.message || 'Failed to update customer account');
        } finally {
            setEditCustSubmitting(false);
        }
    };

    // Register a new customer profile directly into database from POS
    const handleCreateNewCustomer = async (e) => {
        e.preventDefault();
        if (!newCustForm.name.trim()) {
            setNewCustError('Customer name is required');
            return;
        }
        setIsCreatingCust(true);
        setNewCustError('');
        try {
            const res = await customersApi.create({
                name: newCustForm.name.trim(),
                phone: newCustForm.phone.trim(),
                email: newCustForm.email.trim(),
                address: newCustForm.address.trim() || 'In-store Counter Customer'
            });

            const created = res?.customer || res;
            if (created) {
                setCustomers(prev => [created, ...prev.filter(c => c.id !== created.id)]);
                handleSelectCustomer(created);
                setShowNewCustModal(false);
                setNewCustForm({ name: '', phone: '', email: '', address: '' });
            }
        } catch (err) {
            console.error('Failed to create customer in DB', err);
            setNewCustError(err.message || 'Failed to create customer account');
        } finally {
            setIsCreatingCust(false);
        }
    };

    // Helper: Check if product is sold by weight
    const isWeightTypeProduct = (prod) => {
        return prod.unit?.toLowerCase().includes('kg') || 
               prod.description?.includes('[TYPE:weight]') ||
               ['rice-grains', 'spices-masala', 'fresh-produce'].includes(prod.subcategory);
    };

    // Triggered when product card is clicked in POS
    const handleProductCardClick = (product) => {
        if (product.stock === 0) return;
        if (isWeightTypeProduct(product)) {
            // Open interactive Bi-directional Price ↔ Weight Calculator modal
            setWeightCalcProduct(product);
            setCustomItemName(product.name || '');
            setCalcSellingPrice(String(product.price || 33));
            setCalcMrp(String(product.mrp || product.price || 14));
            setCalcStock(String(product.stock || 50));
            setCalcMode('rs-to-weight');
            setCalcRs('50');
            setCalcWeightKg('1.5');
            setShowWeightCalcModal(true);
        } else {
            // Regular fixed pack product: increment or add
            const existing = cart.find(item => item.id === product.id);
            if (existing) {
                setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
            } else {
                setCart([...cart, { ...product, quantity: 1 }]);
            }
        }
    };

    // Open Loose Produce / Custom Calculator directly from counter toolbar
    const handleOpenLooseCalculator = () => {
        setWeightCalcProduct(null);
        setCustomItemName('Loose Item');
        setCalcSellingPrice('33');
        setCalcMrp('14');
        setCalcStock('50');
        setCalcMode('rs-to-weight');
        setCalcRs('50');
        setCalcWeightKg('1.5');
        setShowWeightCalcModal(true);
    };

    // Add Calculated Loose / Weighed Item to Bill with details and default naming
    const handleAddCalculatedItemToCart = () => {
        if (activeCalculatedPrice <= 0) return;

        const finalItemName = defaultCalculatedItemName;
        const itemId = weightCalcProduct
            ? `${weightCalcProduct.id}-${activeWeightLabel.replace(/[^a-zA-Z0-9]/g, '')}`
            : `custom-calc-${Date.now()}`;

        const existing = cart.find(item => item.id === itemId);
        if (existing) {
            setCart(cart.map(item => item.id === itemId ? { ...item, quantity: item.quantity + 1 } : item));
        } else {
            setCart(prev => [...prev, {
                id: itemId,
                baseId: weightCalcProduct ? weightCalcProduct.id : undefined,
                name: finalItemName,
                price: activeCalculatedPrice,
                quantity: 1,
                image: weightCalcProduct?.image || null
            }]);
        }

        setShowWeightCalcModal(false);
        setWeightCalcProduct(null);
        setCustomItemName('');
    };

    // ── Direct Customer Money Entry: Add directly to Customer Account / Bill ──
    const handleAddDirectCharge = (e) => {
        if (e) e.preventDefault();
        const amt = parseFloat(directChargeAmount);
        if (!amt || amt <= 0) return;

        const customerTarget = selectedCustomer ? selectedCustomer.name : 'Counter Sale';
        const finalName = directChargeDesc.trim() 
            ? directChargeDesc.trim() 
            : `Direct Charge (${customerTarget}) — ₹${amt}`;

        const newItem = {
            id: `custom-charge-${Date.now()}`,
            name: finalName,
            price: amt,
            quantity: 1,
            image: null
        };

        setCart(prev => [...prev, newItem]);
        setDirectChargeAmount('');
        setDirectChargeDesc('');
    };

    // Quick Add Product to Inventory
    const handleCreateQuickProduct = async (e) => {
        e.preventDefault();
        setIsSavingProduct(true);
        setQuickProductMsg({ type: '', text: '' });
        try {
            const payload = {
                name: newProductForm.name.trim(),
                category: newProductForm.category,
                price: parseFloat(newProductForm.price),
                mrp: parseFloat(newProductForm.mrp || newProductForm.price),
                stock: parseInt(newProductForm.stock) || 0,
                unit: newProductForm.productType === 'weight' ? 'kg' : (newProductForm.unit || 'pack'),
                description: `[TYPE:${newProductForm.productType}] Counter added product`,
                image: newProductForm.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300'
            };

            const res = await productsApi.create(payload);
            const created = res.product || res;
            setProducts(prev => [created, ...prev]);
            setQuickProductMsg({ type: 'success', text: `Product "${created.name}" created and added to POS catalog!` });
            setTimeout(() => {
                setShowQuickAddProductModal(false);
                setQuickProductMsg({ type: '', text: '' });
                setNewProductForm({
                    name: '',
                    category: 'groceries',
                    productType: 'weight',
                    price: '33',
                    mrp: '14',
                    stock: '50',
                    unit: 'kg',
                    image: ''
                });
            }, 1000);
        } catch (err) {
            setQuickProductMsg({ type: 'error', text: err.message || 'Failed to create product' });
        } finally {
            setIsSavingProduct(false);
        }
    };

    const updateQuantity = (id, delta) => {
        setCart(cart.map(item => {
            if (item.id === id) {
                const newQty = item.quantity + delta;
                return newQty > 0 ? { ...item, quantity: newQty } : item;
            }
            return item;
        }));
    };

    const removeItem = (id) => setCart(cart.filter(item => item.id !== id));
    const clearCart = () => setCart([]);

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal;

    const handleCheckout = async (e) => {
        e.preventDefault();
        if (cart.length === 0) return;
        setIsSubmitting(true);
        setError(null);
        try {
            const finalCustName = selectedCustomer 
                ? selectedCustomer.name 
                : isCustomWalkIn 
                    ? (customerInfo.name?.trim() || 'Walk-in Customer')
                    : (custSearchQuery.trim() || customerInfo.name?.trim() || 'Walk-in Customer');

            const finalCustPhone = selectedCustomer ? selectedCustomer.phone : customerInfo.phone?.trim() || '';
            const finalCustEmail = selectedCustomer ? selectedCustomer.email : customerInfo.email?.trim() || '';

            const orderData = {
                customerId: selectedCustomer?.id,
                customerName: finalCustName,
                customerPhone: finalCustPhone,
                customerEmail: finalCustEmail,
                customerAddress: customerInfo.address || 'In-store Counter Sale',
                items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity, image: i.image })),
                subtotal,
                discount: 0,
                total,
                paymentType: paymentMode === 'paid_cash' ? 'PAID_CASH' : paymentMode === 'paid_upi' ? 'PAID_UPI' : 'KHATA_DUE',
                paidAmount: paymentMode === 'khata_due' ? 0 : total,
                dueAmount: paymentMode === 'khata_due' ? total : 0,
                deliveryType: 'pickup',
                notes: 'POS Counter Sale'
            };
            const res = await ordersApi.staffCreate(orderData);
            setCompletedOrder({ 
                ...orderData, 
                id: res?.order?.orderNumber || res?.order?.id || `POS-${Date.now().toString().slice(-6)}`,
                customerName: res?.order?.customer || finalCustName,
                paymentMode: paymentMode 
            });
            setOrderSuccess(true);
            setCart([]);
            handleClearCustomer();

            // Refresh customers list so the newly created customer profile appears in autocomplete search
            fetchCustomers();
        } catch (err) {
            console.error('POS Checkout error', err);
            setError(err.message || 'Failed to create order. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (orderSuccess && completedOrder) {
        return (
            <div className="pos-success-wrapper animate-fade-in">
                <div className="pos-receipt-card card">
                    <div className="receipt-success-badge">
                        <CheckCircle2 size={48} color="#10b981" />
                    </div>
                    <h2>Sale Completed!</h2>
                    <span className="receipt-order-id">Order #{completedOrder.id}</span>
                    <p className="receipt-sub">Customer: <strong>{completedOrder.customerName}</strong> • Inventory stock updated</p>

                    <div className="receipt-items-summary">
                        <div className="receipt-row-header">
                            <span>Item</span>
                            <span>Qty</span>
                            <span>Amount</span>
                        </div>
                        {completedOrder.items.map((it, idx) => (
                            <div key={idx} className="receipt-item-line">
                                <span className="it-name">{it.name}</span>
                                <span className="it-qty">×{it.quantity}</span>
                                <span className="it-price">₹{(it.price * it.quantity).toFixed(2)}</span>
                            </div>
                        ))}
                        <div className="receipt-total-line">
                            <strong>Payment ({completedOrder.paymentMode === 'khata_due' ? '🔴 KHATA DUE' : completedOrder.paymentMode.toUpperCase()})</strong>
                            <strong>₹{completedOrder.total.toFixed(2)}</strong>
                        </div>
                    </div>

                    <div className="receipt-actions">
                        <button className="btn btn-primary btn-lg" onClick={() => { setOrderSuccess(false); setCompletedOrder(null); }}>
                            <Plus size={18} /> New Counter Sale
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="staff-pos-layout animate-fade-in">
            {/* Mobile Navigation Tabs (visible on mobile < 960px) */}
            <div className="pos-mobile-nav-tabs">
                <button 
                    type="button" 
                    className={`pos-mobile-tab-btn ${mobileTab === 'catalog' ? 'active' : ''}`}
                    onClick={() => setMobileTab('catalog')}
                >
                    <Store size={16} />
                    <span>Catalog</span>
                    <span className="pos-tab-pill">{filteredProducts.length}</span>
                </button>
                <button 
                    type="button" 
                    className={`pos-mobile-tab-btn ${mobileTab === 'bill' ? 'active' : ''}`}
                    onClick={() => setMobileTab('bill')}
                >
                    <Receipt size={16} />
                    <span>Current Bill</span>
                    {cart.length > 0 && (
                        <span className="pos-tab-cart-badge">{cart.reduce((s, i) => s + i.quantity, 0)}</span>
                    )}
                </button>
            </div>

            {/* ─── Left Section: Product Catalog ─── */}
            <div className={`pos-catalog-pane card ${mobileTab !== 'catalog' ? 'pos-mobile-hidden' : ''}`}>
                <div className="pos-pane-header">
                    <div className="pos-title-area">
                        <div className="pos-title-with-badge">
                            <h2 className="pos-main-title">
                                <Store size={22} color="var(--primary)" /> Store POS Counter
                            </h2>
                            <span className="pos-status-live-badge">🟢 Live Counter</span>
                        </div>
                        <p className="pos-subtitle">Tap products to add units or custom weight to current bill</p>
                    </div>

                    <div className="pos-counter-actions">
                        <button 
                            type="button" 
                            className="pos-action-btn calc-btn"
                            onClick={handleOpenLooseCalculator}
                            title="Calculate price <-> weight for loose items"
                        >
                            <Calculator size={15} />
                            <span>Bi-directional Calculator</span>
                        </button>
                        <button 
                            type="button" 
                            className="pos-action-btn add-btn"
                            onClick={() => setShowQuickAddProductModal(true)}
                            title="Quickly add new product to store"
                        >
                            <Plus size={15} />
                            <span>Add Product</span>
                        </button>
                    </div>

                    <div className="pos-search-wrapper">
                        <Search size={16} className="pos-search-icon" />
                        <input 
                            type="text" 
                            placeholder="Search by product name or brand..." 
                            className="pos-search-input"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button type="button" className="pos-search-clear" onClick={() => setSearchQuery('')}>
                                <X size={13} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Category Pills */}
                <div className="pos-category-pills">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            type="button"
                            className={`pos-cat-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                            onClick={() => setSelectedCategory(cat.id)}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* Products Grid */}
                <div className="pos-items-grid">
                    {filteredProducts.length === 0 ? (
                        <div className="pos-empty-state">
                            <Store size={40} color="#cbd5e1" />
                            <p>No products found matching "{searchQuery}"</p>
                            <button type="button" className="btn btn-outline btn-sm mt-2" onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}>
                                Show All Products
                            </button>
                        </div>
                    ) : (
                        filteredProducts.map(product => {
                            const isOutOfStock = product.stock === 0;
                            const isWeight = isWeightTypeProduct(product);
                            const inCartCount = cart.filter(c => c.id === product.id || c.baseId === product.id).reduce((s, i) => s + i.quantity, 0);
                            const hasDiscount = product.mrp && Number(product.mrp) > Number(product.price);
                            const discountPct = hasDiscount 
                                ? Math.round(((Number(product.mrp) - Number(product.price)) / Number(product.mrp)) * 100) 
                                : 0;

                            return (
                                <div 
                                    key={product.id} 
                                    className={`pos-item-card ${isOutOfStock ? 'disabled-stock' : ''} ${inCartCount > 0 ? 'in-cart' : ''}`}
                                    onClick={() => !isOutOfStock && handleProductCardClick(product)}
                                    title={isOutOfStock ? 'Out of stock' : `Click to add ${product.name}`}
                                >
                                    <div className="pos-item-thumb-wrap">
                                        <img 
                                            src={product.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=200"} 
                                            alt={product.name} 
                                            className="pos-item-img"
                                            loading="lazy"
                                        />
                                        
                                        {/* Product Type Tag (Weight vs Pack) */}
                                        <span className={`pos-card-type-pill ${isWeight ? 'weight' : 'pack'}`}>
                                            {isWeight ? <><Scale size={10} /> By Weight</> : <><Box size={10} /> Pack</>}
                                        </span>

                                        {hasDiscount && discountPct > 0 && (
                                            <span className="pos-card-disc-pill">{discountPct}% OFF</span>
                                        )}

                                        {inCartCount > 0 && (
                                            <span className="cart-qty-badge">{inCartCount} in bill</span>
                                        )}

                                        <div className="pos-card-tap-overlay">
                                            {isWeight ? <><Scale size={13} /> Weigh Item</> : <><Plus size={13} /> Add to Bill</>}
                                        </div>
                                    </div>
                                    <div className="pos-item-meta">
                                        <h4 className="pos-product-name">{product.name}</h4>
                                        <div className="pos-price-row">
                                            <div className="pos-price-stack">
                                                <span className="pos-item-price">₹{product.price}{isWeight ? '/kg' : ''}</span>
                                                {hasDiscount && (
                                                    <span className="pos-item-mrp">₹{product.mrp}</span>
                                                )}
                                            </div>
                                            <span className={`pos-stock-tag ${product.stock <= 5 && product.stock > 0 ? 'low-stock' : product.stock === 0 ? 'out-stock' : 'good-stock'}`}>
                                                {product.stock > 0 ? `${product.stock} left` : 'Out of stock'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* ─── Right Section: Current Order Cart ─── */}
            <div className={`pos-checkout-pane card ${mobileTab !== 'bill' ? 'pos-mobile-hidden' : ''}`}>
                <div className="pos-cart-header">
                    <div className="cart-title-row">
                        <ShoppingCart size={20} color="var(--primary)" />
                        <h3>Current Bill</h3>
                        <span className="cart-count-pill">{cart.reduce((s, i) => s + i.quantity, 0)} items</span>
                    </div>
                    {cart.length > 0 && (
                        <button className="clear-cart-btn" onClick={clearCart} title="Clear cart">
                            <RefreshCw size={14} /> Clear
                        </button>
                    )}
                </div>

                {/* ══════════════════════════════════════════════════════════
                    ✨ CUSTOMER SEARCH / AUTOCOMPLETE DROPDOWN
                    ══════════════════════════════════════════════════════════ */}
                <div className="pos-customer-section" ref={custDropdownRef}>
                    <div className="pos-cust-header-row">
                        <div className="pos-cust-header-left">
                            <span className="pos-sec-label">Customer Account:</span>
                            <button 
                                type="button" 
                                className="pos-cust-refresh-btn"
                                onClick={fetchCustomers}
                                title="Reload customers from database"
                                disabled={isLoadingCustomers}
                            >
                                <RefreshCw size={12} className={isLoadingCustomers ? 'spin' : ''} />
                            </button>
                        </div>
                        <div className="pos-cust-header-actions">
                            <button 
                                type="button" 
                                className="pos-new-cust-btn"
                                onClick={() => {
                                    setShowNewCustModal(true);
                                    setNewCustForm(p => ({ ...p, name: custSearchQuery.trim() || '' }));
                                }}
                            >
                                <UserPlus size={12} /> + New Customer
                            </button>
                            <button 
                                type="button" 
                                className="pos-walkin-toggle-btn"
                                onClick={() => {
                                    if (isCustomWalkIn) handleClearCustomer();
                                    else {
                                        setIsCustomWalkIn(true);
                                        setSelectedCustomer(null);
                                    }
                                }}
                            >
                                {isCustomWalkIn ? '🔍 Search Customer' : '+ Custom Walk-in'}
                            </button>
                        </div>
                    </div>

                    {/* State A: Customer Selected */}
                    {selectedCustomer ? (
                        <div className="pos-selected-cust-card animate-fade-in">
                            <div className="pos-cust-avatar">{selectedCustomer.name.charAt(0).toUpperCase()}</div>
                            <div className="pos-cust-details">
                                <div className="pos-cust-name-line">
                                    <strong>{selectedCustomer.name}</strong>
                                    {selectedCustomer.dueBalance > 0 ? (
                                        <span className="pos-due-alert-pill">⚠️ Due: ₹{selectedCustomer.dueBalance}</span>
                                    ) : (
                                        <span className="pos-clear-pill">🟢 Khata Clear</span>
                                    )}
                                </div>
                                <span className="pos-cust-sub">
                                    {selectedCustomer.phone ? `📱 ${selectedCustomer.phone}` : 'No phone'} 
                                    {selectedCustomer.email ? ` • ✉️ ${selectedCustomer.email}` : ''}
                                </span>
                            </div>
                            <div className="pos-cust-card-actions">
                                <button 
                                    type="button" 
                                    className="btn-icon btn-ghost btn-xs" 
                                    onClick={() => openEditCustModal(selectedCustomer)}
                                    title="Edit customer / Add email for login"
                                >
                                    <PenLine size={13} color="#2563eb" />
                                </button>
                                <button 
                                    type="button" 
                                    className="btn-icon btn-ghost btn-xs" 
                                    onClick={handleClearCustomer}
                                    title="Remove customer"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </div>
                    ) : isCustomWalkIn ? (
                        /* State B: Custom Walk-in Text Inputs with Name, Phone & Email */
                        <div className="pos-customer-box animate-fade-in">
                            <div className="pos-input-field full-span">
                                <User size={15} />
                                <input
                                    type="text"
                                    placeholder="Customer Full Name *"
                                    value={customerInfo.name}
                                    onChange={e => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                                    autoFocus
                                    required
                                />
                            </div>
                            <div className="pos-input-field">
                                <Phone size={15} />
                                <input
                                    type="tel"
                                    placeholder="Phone (Optional)"
                                    value={customerInfo.phone}
                                    onChange={e => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                                />
                            </div>
                            <div className="pos-input-field">
                                <Mail size={15} />
                                <input
                                    type="email"
                                    placeholder="Email (Optional)"
                                    value={customerInfo.email}
                                    onChange={e => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                                />
                            </div>
                        </div>
                    ) : (
                        /* State C: Live Customer Autocomplete Search Dropdown */
                        <div className="pos-cust-search-container">
                            <div className="pos-cust-search-bar" onClick={() => setShowCustDropdown(true)}>
                                <Search size={15} color="#94a3b8" />
                                <input 
                                    type="text"
                                    placeholder="Search customer by name, phone or email..."
                                    value={custSearchQuery}
                                    onChange={e => { setCustSearchQuery(e.target.value); setShowCustDropdown(true); }}
                                    onFocus={() => setShowCustDropdown(true)}
                                />
                                {custSearchQuery && (
                                    <button type="button" className="clear-search-x" onClick={() => setCustSearchQuery('')}>
                                        <X size={13} />
                                    </button>
                                )}
                            </div>

                            {/* Dropdown Results */}
                            {showCustDropdown && (
                                <div className="pos-cust-dropdown-menu animate-fade-in">
                                    {/* Quick Walk-in Option */}
                                    <div 
                                        className="pos-dropdown-row walk-in-row"
                                        onClick={() => {
                                            handleClearCustomer();
                                            setShowCustDropdown(false);
                                        }}
                                    >
                                        <div className="row-left">
                                            <span className="walk-icon">🏪</span>
                                            <div>
                                                <strong>General Walk-in Customer</strong>
                                                <span>Counter direct cash sale (No account)</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Loading State */}
                                    {isLoadingCustomers && (
                                        <div className="pos-cust-dropdown-notice">
                                            <Loader size={14} className="spin" color="#16a34a" />
                                            <span>Loading customers from database...</span>
                                        </div>
                                    )}

                                    {/* Session Expired / Error State */}
                                    {customerError && (
                                        <div className="pos-cust-dropdown-error">
                                            <span>⚠️ {customerError}</span>
                                            <div className="pos-cust-error-actions">
                                                <button type="button" className="btn btn-xs btn-outline" onClick={fetchCustomers}>
                                                    <RefreshCw size={11} /> Retry
                                                </button>
                                                <a href="/login" className="btn btn-xs btn-primary">
                                                    Log In
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    {/* Results List */}
                                    {!isLoadingCustomers && !customerError && (
                                        <>
                                            {!custSearchQuery.trim() && customers.length > 0 && (
                                                <div className="pos-cust-dropdown-header-tag">
                                                    <span>Database Customers ({customers.length})</span>
                                                </div>
                                            )}

                                            {matchedCustomers.length > 0 ? (
                                                matchedCustomers.slice(0, 6).map(cust => (
                                                    <div 
                                                        key={cust.id} 
                                                        className="pos-dropdown-row"
                                                        onClick={() => handleSelectCustomer(cust)}
                                                    >
                                                        <div className="row-left">
                                                            <div className="dropdown-avatar">{cust.name ? cust.name.charAt(0).toUpperCase() : 'C'}</div>
                                                            <div>
                                                                <strong>{cust.name}</strong>
                                                                <span>{cust.phone ? `📱 ${cust.phone}` : ''} {cust.email ? `• ✉️ ${cust.email}` : ''}</span>
                                                            </div>
                                                        </div>
                                                        <div className="row-right">
                                                            {cust.dueBalance > 0 ? (
                                                                <span className="pos-drop-due">Due: ₹{cust.dueBalance}</span>
                                                            ) : (
                                                                <span className="pos-drop-clear">Clear</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : custSearchQuery.trim() ? (
                                                <div className="pos-no-match-box">
                                                    <span>No registered customer found for "{custSearchQuery}"</span>
                                                    <div className="pos-no-match-btns">
                                                        <button 
                                                            type="button" 
                                                            className="btn btn-xs btn-outline"
                                                            onClick={() => {
                                                                setIsCustomWalkIn(true);
                                                                setCustomerInfo({ name: custSearchQuery, phone: '', email: '', address: 'In-store Counter Sale' });
                                                                setShowCustDropdown(false);
                                                            }}
                                                        >
                                                            + Use "{custSearchQuery}" as Walk-in
                                                        </button>
                                                        <button 
                                                            type="button" 
                                                            className="btn btn-xs btn-primary"
                                                            onClick={() => {
                                                                setShowNewCustModal(true);
                                                                setNewCustForm(p => ({ ...p, name: custSearchQuery }));
                                                                setShowCustDropdown(false);
                                                            }}
                                                        >
                                                            <UserPlus size={11} /> Save to Database
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="pos-no-match-box">
                                                    <span>No customer accounts in database yet.</span>
                                                    <button 
                                                        type="button" 
                                                        className="btn btn-xs btn-primary mt-1"
                                                        onClick={() => {
                                                            setShowNewCustModal(true);
                                                            setShowCustDropdown(false);
                                                        }}
                                                    >
                                                        <UserPlus size={11} /> + Register New Customer
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ══════════════════════════════════════════════════════════
                    ⚡ DIRECT CUSTOMER CHARGE / MONEY IN CUSTOMER ACCOUNT
                    ══════════════════════════════════════════════════════════ */}
                <div className="pos-direct-charge-card animate-fade-in">
                    <div className="pos-direct-charge-header">
                        <div className="pos-direct-title">
                            <Zap size={16} color="#d97706" />
                            <strong>Direct Money in Customer Account</strong>
                        </div>
                        <span className="pos-direct-subtitle">Staff adds amount customer owes or pays directly</span>
                    </div>

                    <div className="pos-direct-inputs-grid">
                        <div className="pos-direct-input-wrap">
                            <label>Amount Customer Pays (₹):</label>
                            <div className="pos-input-with-symbol">
                                <span>₹</span>
                                <input 
                                    type="number" 
                                    className="input pos-direct-amt-input"
                                    placeholder="50"
                                    value={directChargeAmount}
                                    onChange={e => setDirectChargeAmount(e.target.value)}
                                    min="1"
                                />
                            </div>
                        </div>

                        <div className="pos-direct-input-wrap">
                            <label>Note / Item Details (Optional):</label>
                            <input 
                                type="text" 
                                className="input"
                                placeholder={`Counter Bill (${selectedCustomer ? selectedCustomer.name : 'Walk-in'})`}
                                value={directChargeDesc}
                                onChange={e => setDirectChargeDesc(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Quick ₹ Shortcuts */}
                    <div className="pos-direct-quick-row">
                        <span className="pos-quick-label">Quick ₹:</span>
                        <div className="pos-quick-pills">
                            {QUICK_RUPEE_PRESETS.map(r => (
                                <button 
                                    key={r} 
                                    type="button" 
                                    className={`pos-quick-pill ${directChargeAmount === String(r) ? 'active' : ''}`}
                                    onClick={() => setDirectChargeAmount(String(r))}
                                >
                                    ₹{r}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button 
                        type="button" 
                        className="btn pos-add-direct-btn"
                        disabled={!directChargeAmount || Number(directChargeAmount) <= 0}
                        onClick={handleAddDirectCharge}
                    >
                        <Plus size={15} /> Add ₹{directChargeAmount || 0} Directly to {selectedCustomer ? `${selectedCustomer.name}'s Bill` : 'Current Bill'}
                    </button>
                </div>

                {/* Cart Items List */}
                <div className="pos-cart-list">
                    {cart.length === 0 ? (
                        <div className="pos-empty-cart-state">
                            <ShoppingCart size={36} color="#cbd5e1" />
                            <p>Cart is empty</p>
                            <span>Tap items on the left to add to bill</span>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.id} className="pos-cart-row">
                                <div className="cart-row-info">
                                    <strong>{item.name}</strong>
                                    <span className="cart-row-unit">₹{item.price} each</span>
                                </div>
                                <div className="cart-row-actions">
                                    <div className="stepper-box">
                                        <button onClick={() => updateQuantity(item.id, -1)} aria-label="Decrease">
                                            <Minus size={13} />
                                        </button>
                                        <span className="stepper-val">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.id, 1)} aria-label="Increase">
                                            <Plus size={13} />
                                        </button>
                                    </div>
                                    <span className="cart-row-total">₹{(item.price * item.quantity).toFixed(2)}</span>
                                    <button className="cart-remove-btn" onClick={() => removeItem(item.id)} aria-label="Remove">
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Payment Method Switcher */}
                <div className="pos-payment-methods">
                    <span className="pay-label">Payment Mode:</span>
                    <div className="pay-options">
                        <button
                            type="button"
                            className={`pay-btn ${paymentMode === 'paid_cash' || paymentMode === 'cash' ? 'active' : ''}`}
                            onClick={() => setPaymentMode('paid_cash')}
                        >
                            💵 Hand-to-Hand Cash
                        </button>
                        <button
                            type="button"
                            className={`pay-btn ${paymentMode === 'paid_upi' || paymentMode === 'upi' ? 'active' : ''}`}
                            onClick={() => setPaymentMode('paid_upi')}
                        >
                            📱 UPI / QR
                        </button>
                        <button
                            type="button"
                            className={`pay-btn due-btn ${paymentMode === 'khata_due' ? 'active' : ''}`}
                            onClick={() => setPaymentMode('khata_due')}
                        >
                            🔴 Payment Left (Khata)
                        </button>
                    </div>
                </div>

                {/* Checkout Summary */}
                <div className="pos-summary-footer">
                    <div className="summary-grand-total">
                        <span>Grand Total</span>
                        <span className="total-amount">₹{total.toFixed(2)}</span>
                    </div>

                    {error && <div className="pos-error-pill">{error}</div>}

                    <button
                        className="btn btn-primary btn-lg pos-checkout-submit"
                        disabled={cart.length === 0 || isSubmitting}
                        onClick={handleCheckout}
                    >
                        {isSubmitting ? 'Processing Sale...' : `Complete Sale • ₹${total.toFixed(2)}`}
                    </button>
                </div>
            </div>

            {/* Floating Mobile Bottom Checkout Bar (visible < 960px when in catalog and cart has items) */}
            {cart.length > 0 && mobileTab === 'catalog' && (
                <div className="pos-mobile-bottom-bar animate-fade-in" onClick={() => setMobileTab('bill')}>
                    <div className="pos-bottom-cart-info">
                        <div className="pos-bottom-cart-icon">
                            <ShoppingCart size={18} />
                            <span className="pos-bottom-cart-qty">{cart.reduce((s, i) => s + i.quantity, 0)}</span>
                        </div>
                        <div className="pos-bottom-cart-txt">
                            <span className="pos-bottom-cart-lbl">Current Bill</span>
                            <strong className="pos-bottom-cart-total">₹{total.toFixed(2)}</strong>
                        </div>
                    </div>
                    <button type="button" className="pos-bottom-view-btn">
                        <span>View Bill &amp; Pay</span>
                        <ArrowRight size={15} />
                    </button>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════
                ⚖️ BI-DIRECTIONAL PRICE ↔ WEIGHT CALCULATOR & PRICING & STOCK MODAL
                ══════════════════════════════════════════════════════════ */}
            {showWeightCalcModal && (
                <div className="modal-overlay animate-fade-in" onClick={() => setShowWeightCalcModal(false)}>
                    <div className="pos-weight-dialog card" onClick={e => e.stopPropagation()}>
                        <div className="pos-weight-header">
                            <div className="pos-wt-title-row">
                                <Scale size={22} color="#2563eb" />
                                <div>
                                    <h3>{weightCalcProduct ? weightCalcProduct.name : 'Counter Scale / Loose Produce'}</h3>
                                    <p>Pricing &amp; Stock • Live Bi-directional Weight ↔ ₹ Calculator</p>
                                </div>
                            </div>
                            <button className="btn-icon btn-ghost" onClick={() => setShowWeightCalcModal(false)}>
                                <X size={18} />
                            </button>
                        </div>

                        <div className="pos-weight-body">
                            {/* 1. Item Name / Description Field */}
                            <div className="pos-pricing-field">
                                <label>Item Name / Description:</label>
                                <input 
                                    type="text"
                                    className="input"
                                    placeholder="e.g. Loose Rice, Fresh Potato, Sugar"
                                    value={customItemName}
                                    onChange={e => setCustomItemName(e.target.value)}
                                />
                            </div>

                            {/* 2. Pricing & Stock Section */}
                            <div>
                                <span className="pos-calc-section-label">Pricing &amp; Stock</span>
                                <div className="pos-calc-pricing-grid mt-1">
                                    <div className="pos-pricing-field">
                                        <label>Selling Price (₹ / kg) *</label>
                                        <div className="pos-pricing-input-symbol">
                                            <span>₹</span>
                                            <input 
                                                type="number"
                                                className="input"
                                                value={calcSellingPrice}
                                                onChange={e => setCalcSellingPrice(e.target.value)}
                                                placeholder="33"
                                                min="1"
                                            />
                                        </div>
                                    </div>

                                    <div className="pos-pricing-field">
                                        <label>MRP (₹ / kg) *</label>
                                        <div className="pos-pricing-input-symbol">
                                            <span>₹</span>
                                            <input 
                                                type="number"
                                                className="input"
                                                value={calcMrp}
                                                onChange={e => setCalcMrp(e.target.value)}
                                                placeholder="14"
                                                min="1"
                                            />
                                        </div>
                                    </div>

                                    <div className="pos-pricing-field">
                                        <label>Total Stock (kg)</label>
                                        <input 
                                            type="number"
                                            className="input"
                                            value={calcStock}
                                            onChange={e => setCalcStock(e.target.value)}
                                            placeholder="50"
                                            min="0"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Discount notice if MRP > Selling Price */}
                            {calculatedDiscount > 0 && (
                                <div className="pos-discount-badge-notice">
                                    <Percent size={14} />
                                    <span>Discount: <strong>{calculatedDiscount}% OFF</strong> (Customer saves ₹{(mrpPerKg - pricePerKg).toFixed(0)} per kg)</span>
                                </div>
                            )}

                            {/* 3. Live Bi-directional Price <-> Weight Live Calculator Widget */}
                            <div className="ap-weight-calc-widget">
                                <div className="calc-widget-header">
                                    <div className="calc-title">
                                        <Calculator size={16} color="var(--primary)" />
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
                                                        autoFocus
                                                    />
                                                </div>
                                            </div>
                                            <div className="calc-arrow">
                                                <ArrowRightLeft size={18} />
                                            </div>
                                            <div className="calc-result-box">
                                                <span className="res-label">Delivered Weight:</span>
                                                <strong className="res-val">{computedWeightFromRs} g</strong>
                                                <span className="res-sub">({deliveredWeightKg} kg)</span>
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
                                                    autoFocus
                                                />
                                            </div>
                                            <div className="calc-arrow">
                                                <ArrowRightLeft size={18} />
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

                            {/* 4. Default Naming / Details Preview */}
                            <div className="pos-calc-default-name-box">
                                <div className="label-row">
                                    <span>Item Added to Bill</span>
                                    <span>Price: ₹{activeCalculatedPrice}</span>
                                </div>
                                <div className="preview-text">
                                    "{defaultCalculatedItemName}"
                                </div>
                            </div>
                        </div>

                        <div className="pos-weight-footer">
                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowWeightCalcModal(false)}>
                                Cancel
                            </button>
                            <button 
                                type="button" 
                                className="btn pos-btn-add-calc" 
                                onClick={handleAddCalculatedItemToCart}
                                disabled={activeCalculatedPrice <= 0}
                            >
                                <Check size={16} /> Add to Current Bill (₹{activeCalculatedPrice})
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════
                📦 QUICK ADD PRODUCT TO INVENTORY MODAL
                ══════════════════════════════════════════════════════════ */}
            {showQuickAddProductModal && (
                <div className="modal-overlay animate-fade-in" onClick={() => setShowQuickAddProductModal(false)}>
                    <div className="pos-new-prod-dialog card" onClick={e => e.stopPropagation()}>
                        <div className="new-cust-modal-header">
                            <div className="new-cust-title">
                                <Plus size={20} color="#16a34a" />
                                <div>
                                    <h3>Quick Add Product</h3>
                                    <p>Register a new product into store catalog &amp; counter</p>
                                </div>
                            </div>
                            <button className="btn-icon btn-ghost" onClick={() => setShowQuickAddProductModal(false)}>
                                <X size={18} />
                            </button>
                        </div>

                        {quickProductMsg.text && (
                            <div className={`ap-alert-box ${quickProductMsg.type} animate-fade-in mx-3 mt-3`}>
                                {quickProductMsg.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                                <span>{quickProductMsg.text}</span>
                            </div>
                        )}

                        <form onSubmit={handleCreateQuickProduct} className="pos-new-prod-body">
                            <div className="ap-input-group">
                                <label>Product Name *</label>
                                <input 
                                    type="text" 
                                    className="input" 
                                    placeholder="e.g. Aashirvaad Shudh Chakki Atta" 
                                    value={newProductForm.name}
                                    onChange={e => setNewProductForm({ ...newProductForm, name: e.target.value })}
                                    required 
                                    autoFocus
                                />
                            </div>

                            <div className="pos-direct-inputs-grid">
                                <div className="ap-input-group">
                                    <label>Category</label>
                                    <select 
                                        className="input" 
                                        value={newProductForm.category}
                                        onChange={e => setNewProductForm({ ...newProductForm, category: e.target.value })}
                                    >
                                        <option value="groceries">Groceries</option>
                                        <option value="stationery">Stationery</option>
                                        <option value="household-personal">Household &amp; Care</option>
                                    </select>
                                </div>

                                <div className="ap-input-group">
                                    <label>Product Selling Mode</label>
                                    <div className="pos-type-toggle-row">
                                        <button 
                                            type="button" 
                                            className={`pos-type-toggle-btn ${newProductForm.productType === 'weight' ? 'active' : ''}`}
                                            onClick={() => setNewProductForm({ ...newProductForm, productType: 'weight', unit: 'kg' })}
                                        >
                                            <Scale size={13} /> Weight (kg)
                                        </button>
                                        <button 
                                            type="button" 
                                            className={`pos-type-toggle-btn ${newProductForm.productType === 'unit' ? 'active' : ''}`}
                                            onClick={() => setNewProductForm({ ...newProductForm, productType: 'unit', unit: 'pack' })}
                                        >
                                            <Box size={13} /> Pack / Unit
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="pos-calc-pricing-grid">
                                <div className="pos-pricing-field">
                                    <label>Selling Price (₹) *</label>
                                    <div className="pos-pricing-input-symbol">
                                        <span>₹</span>
                                        <input 
                                            type="number" 
                                            className="input" 
                                            value={newProductForm.price}
                                            onChange={e => setNewProductForm({ ...newProductForm, price: e.target.value })}
                                            placeholder="33"
                                            required 
                                            min="1"
                                        />
                                    </div>
                                </div>

                                <div className="pos-pricing-field">
                                    <label>MRP (₹) *</label>
                                    <div className="pos-pricing-input-symbol">
                                        <span>₹</span>
                                        <input 
                                            type="number" 
                                            className="input" 
                                            value={newProductForm.mrp}
                                            onChange={e => setNewProductForm({ ...newProductForm, mrp: e.target.value })}
                                            placeholder="14"
                                            required 
                                            min="1"
                                        />
                                    </div>
                                </div>

                                <div className="pos-pricing-field">
                                    <label>Stock ({newProductForm.productType === 'weight' ? 'kg' : 'units'})</label>
                                    <input 
                                        type="number" 
                                        className="input" 
                                        value={newProductForm.stock}
                                        onChange={e => setNewProductForm({ ...newProductForm, stock: e.target.value })}
                                        placeholder="50"
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div className="new-cust-modal-footer mt-2">
                                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowQuickAddProductModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary btn-sm" disabled={isSavingProduct || !newProductForm.name}>
                                    {isSavingProduct ? <><Loader size={14} className="spin" /> Saving...</> : <><Check size={14} /> Save Product</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════
                ✏️ EDIT CUSTOMER PROFILE / ADD EMAIL FOR LOGIN MODAL
                ══════════════════════════════════════════════════════════ */}
            {showEditCustModal && selectedCustomer && (
                <div className="modal-overlay animate-fade-in" onClick={() => setShowEditCustModal(false)}>
                    <div className="pos-edit-cust-dialog card" onClick={e => e.stopPropagation()}>
                        <div className="new-cust-modal-header">
                            <div className="new-cust-title">
                                <PenLine size={20} color="#2563eb" />
                                <div>
                                    <h3>Update Customer Profile</h3>
                                    <p>Link customer's real email so they can log in to view past orders &amp; Khata</p>
                                </div>
                            </div>
                            <button className="btn-icon btn-ghost" onClick={() => setShowEditCustModal(false)}>
                                <X size={18} />
                            </button>
                        </div>

                        {editCustError && (
                            <div className="ap-alert-box error animate-fade-in">
                                <AlertCircle size={15} />
                                <span>{editCustError}</span>
                            </div>
                        )}
                        {editCustSuccess && (
                            <div className="ap-alert-box success animate-fade-in">
                                <CheckCircle2 size={15} />
                                <span>{editCustSuccess}</span>
                            </div>
                        )}

                        <form onSubmit={handleSaveCustDetails} className="new-cust-modal-form">
                            <div className="ap-input-group">
                                <label>Customer Name *</label>
                                <div className="input-with-icon">
                                    <User size={15} />
                                    <input 
                                        type="text" 
                                        className="input" 
                                        value={editCustName} 
                                        onChange={e => setEditCustName(e.target.value)} 
                                        required 
                                    />
                                </div>
                            </div>

                            <div className="ap-input-group mt-2">
                                <label>Mobile Number (Optional)</label>
                                <div className="input-with-icon">
                                    <Phone size={15} />
                                    <input 
                                        type="tel" 
                                        className="input" 
                                        value={editCustPhone} 
                                        onChange={e => setEditCustPhone(e.target.value)} 
                                        placeholder="e.g. 98765 43210"
                                    />
                                </div>
                            </div>

                            <div className="ap-input-group mt-2">
                                <label>Customer Login Email *</label>
                                <div className="input-with-icon">
                                    <Mail size={15} />
                                    <input 
                                        type="email" 
                                        className="input" 
                                        value={editCustEmail} 
                                        onChange={e => setEditCustEmail(e.target.value)} 
                                        placeholder="e.g. customer@gmail.com"
                                        autoFocus
                                    />
                                </div>
                                <span className="input-hint-txt">
                                    💡 Once entered, customer can use this email to log in with 1-click Email OTP or register to access their store history.
                                </span>
                            </div>

                            <div className="new-cust-modal-footer mt-3">
                                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowEditCustModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary btn-sm" disabled={editCustSubmitting}>
                                    {editCustSubmitting ? <><Loader size={14} className="spin" /> Saving...</> : <><Check size={14} /> Save Customer Details</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════
                ✨ QUICK REGISTER NEW CUSTOMER MODAL
                ══════════════════════════════════════════════════════════ */}
            {showNewCustModal && (
                <div className="modal-overlay animate-fade-in" onClick={() => setShowNewCustModal(false)}>
                    <div className="pos-new-prod-dialog card" onClick={e => e.stopPropagation()}>
                        <div className="new-cust-modal-header">
                            <div className="new-cust-title">
                                <UserPlus size={20} color="#16a34a" />
                                <div>
                                    <h3>Register New Customer</h3>
                                    <p>Save customer profile to database for POS billing &amp; Khata ledger</p>
                                </div>
                            </div>
                            <button className="btn-icon btn-ghost" onClick={() => setShowNewCustModal(false)}>
                                <X size={18} />
                            </button>
                        </div>

                        {newCustError && (
                            <div className="ap-alert-box error animate-fade-in mx-3 mt-3">
                                <AlertCircle size={15} />
                                <span>{newCustError}</span>
                            </div>
                        )}

                        <form onSubmit={handleCreateNewCustomer} className="pos-new-prod-body">
                            <div className="ap-input-group">
                                <label>Customer Full Name *</label>
                                <input 
                                    type="text" 
                                    className="input" 
                                    placeholder="e.g. Ramesh Kumar" 
                                    value={newCustForm.name}
                                    onChange={e => setNewCustForm({ ...newCustForm, name: e.target.value })}
                                    required 
                                    autoFocus
                                />
                            </div>

                            <div className="pos-direct-inputs-grid">
                                <div className="ap-input-group">
                                    <label>Mobile Number (Optional)</label>
                                    <input 
                                        type="tel" 
                                        className="input" 
                                        placeholder="e.g. 9876543210" 
                                        value={newCustForm.phone}
                                        onChange={e => setNewCustForm({ ...newCustForm, phone: e.target.value })}
                                    />
                                </div>

                                <div className="ap-input-group">
                                    <label>Email Address (Optional)</label>
                                    <input 
                                        type="email" 
                                        className="input" 
                                        placeholder="e.g. customer@gmail.com" 
                                        value={newCustForm.email}
                                        onChange={e => setNewCustForm({ ...newCustForm, email: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="ap-input-group">
                                <label>Address / Khata Notes (Optional)</label>
                                <input 
                                    type="text" 
                                    className="input" 
                                    placeholder="e.g. Near Shiv Mandir, Haldwani" 
                                    value={newCustForm.address}
                                    onChange={e => setNewCustForm({ ...newCustForm, address: e.target.value })}
                                />
                            </div>

                            <div className="new-cust-modal-footer mt-2">
                                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowNewCustModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary btn-sm" disabled={isCreatingCust || !newCustForm.name.trim()}>
                                    {isCreatingCust ? <><Loader size={14} className="spin" /> Saving...</> : <><Check size={14} /> Register Customer</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
