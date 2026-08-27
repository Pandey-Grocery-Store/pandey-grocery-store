import { useState, useEffect } from 'react';
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
    Layers
} from 'lucide-react';
import { productsApi, ordersApi } from '../../lib/api';
import './StaffPOS.css';

export default function StaffPOS() {
    const [products, setProducts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [cart, setCart] = useState([]);
    const [customerInfo, setCustomerInfo] = useState({ name: 'Walk-in Customer', phone: '', address: 'In-store Counter Sale' });
    const [paymentMode, setPaymentMode] = useState('cash'); // 'cash' | 'upi'
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [completedOrder, setCompletedOrder] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const data = await productsApi.getAll();
                if (data?.products) setProducts(data.products);
            } catch (err) {
                console.error('Failed to load products for POS', err);
            }
        };
        fetchProducts();
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

    const addToCart = (product) => {
        if (product.stock === 0) return;
        const existing = cart.find(item => item.id === product.id);
        if (existing) {
            setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
        } else {
            setCart([...cart, { ...product, quantity: 1 }]);
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
            const orderData = {
                items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity, image: i.image })),
                subtotal,
                discount: 0,
                deliveryFee: 0,
                total,
                deliveryType: 'pickup',
                paymentMode: paymentMode,
                timeSlot: 'Immediate In-Store',
                customer: customerInfo.name || 'Walk-in Customer',
                phone: customerInfo.phone || 'Counter Cash/UPI',
                address: customerInfo.address || 'In-store Purchase'
            };
            const res = await ordersApi.create(orderData);
            setCompletedOrder({ ...orderData, id: res?.order?.id || `POS-${Date.now().toString().slice(-6)}` });
            setOrderSuccess(true);
            setCart([]);
            setCustomerInfo({ name: 'Walk-in Customer', phone: '', address: 'In-store Purchase' });
        } catch (err) {
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
                    <p className="receipt-sub">Stock inventory has been updated automatically.</p>

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
                            <strong>Total Received ({completedOrder.paymentMode.toUpperCase()})</strong>
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
            {/* ─── Left Section: Product Selector ─── */}
            <div className="pos-catalog-pane card">
                <div className="pos-pane-header">
                    <div>
                        <h2 className="pos-main-title">
                            <Store size={22} color="var(--primary)" /> Point of Sale (POS)
                        </h2>
                        <p className="pos-subtitle">Fast counter billing &amp; instant stock checkout</p>
                    </div>
                    <div className="pos-search-wrapper">
                        <Search size={18} className="pos-search-icon" />
                        <input
                            type="text"
                            placeholder="Search by name or brand..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pos-search-input"
                        />
                    </div>
                </div>

                {/* Category Pills */}
                <div className="pos-category-pills">
                    {categories.map(c => (
                        <button
                            key={c.id}
                            className={`pos-cat-pill ${selectedCategory === c.id ? 'active' : ''}`}
                            onClick={() => setSelectedCategory(c.id)}
                        >
                            {c.label}
                        </button>
                    ))}
                </div>

                {/* Products Grid */}
                <div className="pos-items-grid">
                    {filteredProducts.length === 0 ? (
                        <div className="pos-no-items">
                            <Layers size={36} color="#94a3b8" />
                            <p>No products found matching your search.</p>
                        </div>
                    ) : (
                        filteredProducts.map(product => {
                            const isOutOfStock = product.stock === 0;
                            const inCartItem = cart.find(c => c.id === product.id);
                            return (
                                <div 
                                    key={product.id} 
                                    className={`pos-item-card ${isOutOfStock ? 'disabled-stock' : ''} ${inCartItem ? 'in-cart' : ''}`}
                                    onClick={() => !isOutOfStock && addToCart(product)}
                                >
                                    <div className="pos-item-thumb-wrap">
                                        <img 
                                            src={product.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=200"} 
                                            alt={product.name} 
                                            className="pos-item-img"
                                        />
                                        {inCartItem && (
                                            <span className="cart-qty-badge">{inCartItem.quantity}</span>
                                        )}
                                    </div>
                                    <div className="pos-item-meta">
                                        <h4>{product.name}</h4>
                                        <div className="pos-price-row">
                                            <span className="pos-item-price">₹{product.price}</span>
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

                {/* Customer Details Pill Box */}
                <div className="pos-customer-box">
                    <div className="pos-input-field">
                        <User size={15} />
                        <input
                            type="text"
                            placeholder="Customer Name"
                            value={customerInfo.name}
                            onChange={e => setCustomerInfo({ ...customerInfo, name: e.target.value })}
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
                            className={`pay-btn ${paymentMode === 'cash' ? 'active' : ''}`}
                            onClick={() => setPaymentMode('cash')}
                        >
                            💵 Cash
                        </button>
                        <button
                            type="button"
                            className={`pay-btn ${paymentMode === 'upi' ? 'active' : ''}`}
                            onClick={() => setPaymentMode('upi')}
                        >
                            📱 UPI / QR
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
        </div>
    );
}
