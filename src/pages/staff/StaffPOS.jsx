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
    Calculator
} from 'lucide-react';
import { productsApi, ordersApi, customersApi } from '../../lib/api';
import './StaffPOS.css';

const POS_WEIGHT_PRESETS = [
    { label: '250 g', multiplier: 0.25, grams: 250 },
    { label: '500 g', multiplier: 0.5, grams: 500 },
    { label: '1 kg', multiplier: 1, grams: 1000 },
    { label: '1.5 kg', multiplier: 1.5, grams: 1500 },
    { label: '2 kg', multiplier: 2, grams: 2000 },
    { label: '5 kg', multiplier: 5, grams: 5000 },
    { label: '10 kg', multiplier: 10, grams: 10000 },
    { label: '25 kg', multiplier: 25, grams: 25000 },
];

const POS_RUPEE_SHORTCUTS = [20, 50, 100, 200, 500, 1000];

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
    const [customerInfo, setCustomerInfo] = useState({ name: 'Walk-in Customer', phone: '', address: 'In-store Counter Sale' });

    // Weight Product Selection Modal State
    const [weightModalProduct, setWeightModalProduct] = useState(null);
    const [selectedWeightPreset, setSelectedWeightPreset] = useState(POS_WEIGHT_PRESETS[2]); // 1 kg
    const [weightCalcMode, setWeightCalcMode] = useState('preset'); // 'preset' | 'custom-rs' | 'custom-weight'
    const [customRsVal, setCustomRsVal] = useState('50');
    const [customWeightKgVal, setCustomWeightKgVal] = useState('1.5');

    const [paymentMode, setPaymentMode] = useState('paid_cash'); // 'paid_cash' | 'paid_upi' | 'khata_due'
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [completedOrder, setCompletedOrder] = useState(null);
    const [error, setError] = useState(null);

    const custDropdownRef = useRef(null);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [prodData, custData] = await Promise.all([
                    productsApi.getAll(),
                    customersApi.getAll()
                ]);
                if (prodData?.products) setProducts(prodData.products);
                if (custData?.customers) setCustomers(custData.customers);
            } catch (err) {
                console.error('Failed to load products/customers for POS', err);
            }
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

    const matchedCustomers = customers.filter(c => 
        !custSearchQuery || 
        c.name.toLowerCase().includes(custSearchQuery.toLowerCase()) ||
        (c.phone && c.phone.includes(custSearchQuery)) ||
        (c.email && c.email.toLowerCase().includes(custSearchQuery.toLowerCase()))
    );

    const handleSelectCustomer = (customer) => {
        setSelectedCustomer(customer);
        setCustomerInfo({
            name: customer.name,
            phone: customer.phone || '',
            address: 'In-store Counter Sale'
        });
        setCustSearchQuery('');
        setShowCustDropdown(false);
        setIsCustomWalkIn(false);
    };

    const handleClearCustomer = () => {
        setSelectedCustomer(null);
        setCustomerInfo({ name: 'Walk-in Customer', phone: '', address: 'In-store Counter Sale' });
        setCustSearchQuery('');
        setIsCustomWalkIn(false);
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
            // Open interactive weight/price calculator modal
            setWeightModalProduct(product);
            setSelectedWeightPreset(POS_WEIGHT_PRESETS[2]); // Default 1 kg
            setWeightCalcMode('preset');
            setCustomRsVal('50');
            setCustomWeightKgVal('1.5');
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

    // Add Loose / By-Weight item with chosen weight/₹ to Cart
    const handleAddWeightItemToCart = () => {
        if (!weightModalProduct) return;
        const baseRate = Number(weightModalProduct.price) || 0;
        let finalWeightLabel = '1 kg';
        let calculatedPrice = baseRate;

        if (weightCalcMode === 'preset') {
            finalWeightLabel = selectedWeightPreset.label;
            calculatedPrice = Math.round(baseRate * selectedWeightPreset.multiplier);
        } else if (weightCalcMode === 'custom-rs') {
            const enteredRs = Number(customRsVal) || 0;
            calculatedPrice = enteredRs;
            const grams = baseRate > 0 ? Math.round((enteredRs / baseRate) * 1000) : 0;
            finalWeightLabel = grams >= 1000 ? `${(grams / 1000).toFixed(2)} kg` : `${grams} g`;
        } else if (weightCalcMode === 'custom-weight') {
            const enteredKg = Number(customWeightKgVal) || 0;
            calculatedPrice = Math.round(enteredKg * baseRate);
            finalWeightLabel = `${enteredKg} kg`;
        }

        const customItemId = `${weightModalProduct.id}-${finalWeightLabel.replace(/[^a-zA-Z0-9]/g, '')}`;
        const existing = cart.find(item => item.id === customItemId);

        if (existing) {
            setCart(cart.map(item => item.id === customItemId ? { ...item, quantity: item.quantity + 1 } : item));
        } else {
            setCart([...cart, {
                id: customItemId,
                baseId: weightModalProduct.id,
                name: `${weightModalProduct.name} (${finalWeightLabel})`,
                price: calculatedPrice,
                quantity: 1,
                image: weightModalProduct.image
            }]);
        }

        setWeightModalProduct(null);
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
            const orderData = {
                customerId: selectedCustomer?.id,
                customerName: selectedCustomer ? selectedCustomer.name : customerInfo.name || 'Walk-in Customer',
                customerPhone: selectedCustomer ? selectedCustomer.phone : customerInfo.phone || '',
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
                paymentMode: paymentMode 
            });
            setOrderSuccess(true);
            setCart([]);
            handleClearCustomer();
        } catch (err) {
            console.error('POS Checkout error', err);
            setError('Failed to create order. Please try again.');
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
            {/* ─── Left Section: Product Catalog ─── */}
            <div className="pos-catalog-pane card">
                <div className="pos-pane-header">
                    <div>
                        <h2 className="pos-main-title">
                            <Store size={22} color="var(--primary)" /> Store POS Counter
                        </h2>
                        <p className="pos-subtitle">Tap products to add units or custom weight to current bill</p>
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
                            <p>No products found matching "{searchQuery}"</p>
                        </div>
                    ) : (
                        filteredProducts.map(product => {
                            const isOutOfStock = product.stock === 0;
                            const isWeight = isWeightTypeProduct(product);
                            const inCartCount = cart.filter(c => c.id === product.id || c.baseId === product.id).reduce((s, i) => s + i.quantity, 0);

                            return (
                                <div 
                                    key={product.id} 
                                    className={`pos-item-card ${isOutOfStock ? 'disabled-stock' : ''} ${inCartCount > 0 ? 'in-cart' : ''}`}
                                    onClick={() => !isOutOfStock && handleProductCardClick(product)}
                                >
                                    <div className="pos-item-thumb-wrap">
                                        <img 
                                            src={product.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=200"} 
                                            alt={product.name} 
                                            className="pos-item-img"
                                        />
                                        
                                        {/* Product Type Tag (Weight vs Pack) */}
                                        <span className={`pos-card-type-pill ${isWeight ? 'weight' : 'pack'}`}>
                                            {isWeight ? <><Scale size={10} /> By Weight</> : <><Box size={10} /> Pack</>}
                                        </span>

                                        {inCartCount > 0 && (
                                            <span className="cart-qty-badge">{inCartCount}</span>
                                        )}
                                    </div>
                                    <div className="pos-item-meta">
                                        <h4>{product.name}</h4>
                                        <div className="pos-price-row">
                                            <span className="pos-item-price">₹{product.price}{isWeight ? '/kg' : ''}</span>
                                            <span className={`pos-stock-tag ${product.stock <= 5 ? 'low-stock' : 'good-stock'}`}>
                                                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
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
            <div className="pos-checkout-pane card">
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
                        <span className="pos-sec-label">Customer Account:</span>
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
                                <span className="pos-cust-sub">{selectedCustomer.phone ? `📱 ${selectedCustomer.phone}` : 'No mobile number'} • {selectedCustomer.orderCount || 0} orders</span>
                            </div>
                            <button 
                                type="button" 
                                className="btn-icon btn-ghost btn-xs" 
                                onClick={handleClearCustomer}
                                title="Remove customer"
                            >
                                <X size={15} />
                            </button>
                        </div>
                    ) : isCustomWalkIn ? (
                        /* State B: Custom Walk-in Text Inputs */
                        <div className="pos-customer-box animate-fade-in">
                            <div className="pos-input-field">
                                <User size={15} />
                                <input
                                    type="text"
                                    placeholder="Enter Customer Name"
                                    value={customerInfo.name}
                                    onChange={e => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                                    autoFocus
                                />
                            </div>
                            <div className="pos-input-field">
                                <Phone size={15} />
                                <input
                                    type="text"
                                    placeholder="Phone (Optional)"
                                    value={customerInfo.phone}
                                    onChange={e => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
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
                                    placeholder="Search customer name or phone..."
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
                                                <span>Counter direct cash sale</span>
                                            </div>
                                        </div>
                                    </div>

                                    {matchedCustomers.length === 0 ? (
                                        <div className="pos-no-match-box">
                                            <span>No registered customer found for "{custSearchQuery}"</span>
                                            <button 
                                                type="button" 
                                                className="btn btn-xs btn-primary mt-1"
                                                onClick={() => {
                                                    setIsCustomWalkIn(true);
                                                    setCustomerInfo({ name: custSearchQuery, phone: '', address: 'In-store Counter Sale' });
                                                    setShowCustDropdown(false);
                                                }}
                                            >
                                                + Use "{custSearchQuery}" as Walk-in
                                            </button>
                                        </div>
                                    ) : (
                                        matchedCustomers.slice(0, 5).map(cust => (
                                            <div 
                                                key={cust.id} 
                                                className="pos-dropdown-row"
                                                onClick={() => handleSelectCustomer(cust)}
                                            >
                                                <div className="row-left">
                                                    <div className="dropdown-avatar">{cust.name.charAt(0).toUpperCase()}</div>
                                                    <div>
                                                        <strong>{cust.name}</strong>
                                                        <span>{cust.phone ? `📱 ${cust.phone}` : 'No phone linked'}</span>
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
                                    )}
                                </div>
                            )}
                        </div>
                    )}
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

            {/* ══════════════════════════════════════════════════════════
                ⚖️ POS BY-WEIGHT & CUSTOM ₹ SELECTION MODAL
                ══════════════════════════════════════════════════════════ */}
            {weightModalProduct && (
                <div className="modal-overlay animate-fade-in" onClick={() => setWeightModalProduct(null)}>
                    <div className="pos-weight-dialog card" onClick={e => e.stopPropagation()}>
                        <div className="pos-weight-header">
                            <div className="pos-wt-title-row">
                                <Scale size={20} color="#2563eb" />
                                <div>
                                    <h3>{weightModalProduct.name}</h3>
                                    <p>Rate: <strong>₹{weightModalProduct.price} / kg</strong> • Loose Item</p>
                                </div>
                            </div>
                            <button className="btn-icon btn-ghost" onClick={() => setWeightModalProduct(null)}>
                                <X size={18} />
                            </button>
                        </div>

                        <div className="pos-weight-body">
                            {/* Mode Tabs */}
                            <div className="pos-weight-tabs">
                                <button 
                                    type="button" 
                                    className={`pos-wt-tab ${weightCalcMode === 'preset' ? 'active' : ''}`}
                                    onClick={() => setWeightCalcMode('preset')}
                                >
                                    Standard Packs
                                </button>
                                <button 
                                    type="button" 
                                    className={`pos-wt-tab ${weightCalcMode === 'custom-rs' ? 'active' : ''}`}
                                    onClick={() => setWeightCalcMode('custom-rs')}
                                >
                                    Enter ₹ Amount
                                </button>
                                <button 
                                    type="button" 
                                    className={`pos-wt-tab ${weightCalcMode === 'custom-weight' ? 'active' : ''}`}
                                    onClick={() => setWeightCalcMode('custom-weight')}
                                >
                                    Enter Weight (kg)
                                </button>
                            </div>

                            {/* Mode 1: Quick Weight Preset Chips */}
                            {weightCalcMode === 'preset' && (
                                <div className="pos-wt-chips-grid">
                                    {POS_WEIGHT_PRESETS.map((preset) => {
                                        const isSelected = selectedWeightPreset.label === preset.label;
                                        const cost = Math.round(Number(weightModalProduct.price) * preset.multiplier);
                                        return (
                                            <button
                                                type="button"
                                                key={preset.label}
                                                className={`pos-wt-chip ${isSelected ? 'active' : ''}`}
                                                onClick={() => setSelectedWeightPreset(preset)}
                                            >
                                                <span className="wt-chip-label">{preset.label}</span>
                                                <span className="wt-chip-price">₹{cost}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Mode 2: Custom ₹ Input */}
                            {weightCalcMode === 'custom-rs' && (
                                <div className="pos-custom-calc-pane">
                                    <label className="pos-calc-lbl">How much ₹ worth did customer ask for?</label>
                                    <div className="pos-input-with-rs">
                                        <span>₹</span>
                                        <input 
                                            type="number"
                                            className="input pos-rs-input"
                                            value={customRsVal}
                                            onChange={e => setCustomRsVal(e.target.value)}
                                            placeholder="e.g. 50, 100"
                                            autoFocus
                                        />
                                    </div>

                                    <div className="pos-calculated-badge">
                                        <span>Weighed Quantity:</span>
                                        <strong>
                                            {Number(weightModalProduct.price) > 0 
                                                ? `${Math.round((Number(customRsVal) / Number(weightModalProduct.price)) * 1000)} grams`
                                                : '0 g'}
                                        </strong>
                                    </div>

                                    <div className="pos-quick-rs-pills">
                                        <span>Quick ₹:</span>
                                        {POS_RUPEE_SHORTCUTS.map(r => (
                                            <button 
                                                key={r}
                                                type="button" 
                                                className={`quick-rs-btn ${customRsVal === String(r) ? 'active' : ''}`}
                                                onClick={() => setCustomRsVal(String(r))}
                                            >
                                                ₹{r}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Mode 3: Custom Weight in Kilograms */}
                            {weightCalcMode === 'custom-weight' && (
                                <div className="pos-custom-calc-pane">
                                    <label className="pos-calc-lbl">Enter exact weighed quantity in Kilograms (kg):</label>
                                    <input 
                                        type="number"
                                        step="0.1"
                                        className="input"
                                        value={customWeightKgVal}
                                        onChange={e => setCustomWeightKgVal(e.target.value)}
                                        placeholder="e.g. 1.25, 3.5"
                                        autoFocus
                                    />

                                    <div className="pos-calculated-badge">
                                        <span>Calculated Amount:</span>
                                        <strong>₹{Math.round(Number(customWeightKgVal) * Number(weightModalProduct.price))}</strong>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="pos-weight-footer">
                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setWeightModalProduct(null)}>
                                Cancel
                            </button>
                            <button type="button" className="btn btn-primary btn-sm" onClick={handleAddWeightItemToCart}>
                                <Check size={15} /> Add to Current Bill
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
