import { useState, useEffect } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingCart, User, Phone, CheckCircle2 } from 'lucide-react';
import { productsApi, ordersApi } from '../../lib/api';
import './StaffPOS.css';

export default function StaffPOS() {
    const [products, setProducts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [cart, setCart] = useState([]);
    const [customerInfo, setCustomerInfo] = useState({ name: 'Walk-in Customer', phone: '', address: 'In-store Purchase' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProducts = async () => {
            const data = await productsApi.getAll();
            if (data?.products) setProducts(data.products);
        };
        fetchProducts();
    }, []);

    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.category?.toLowerCase().includes(searchQuery.toLowerCase()));

    const addToCart = (product) => {
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
                paymentMode: 'cod',
                timeSlot: 'Immediate',
                customer: customerInfo.name,
                phone: customerInfo.phone,
                address: customerInfo.address
            };
            await ordersApi.create(orderData);
            setOrderSuccess(true);
            setCart([]);
            setCustomerInfo({ name: 'Walk-in Customer', phone: '', address: 'In-store Purchase' });
        } catch (err) {
            setError('Failed to create order. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (orderSuccess) {
        return (
            <div className="pos-success-container card">
                <CheckCircle2 size={64} className="success-icon text-success" />
                <h2>Order Created Successfully!</h2>
                <p>The inventory stock has been deducted.</p>
                <button className="btn btn-primary mt-4" onClick={() => setOrderSuccess(false)}>New Order</button>
            </div>
        );
    }

    return (
        <div className="staff-pos-container">
            {/* Left: Products */}
            <div className="pos-products-section card">
                <div className="pos-header">
                    <h2>Point of Sale</h2>
                    <div className="pos-search">
                        <Search size={18} className="search-icon" />
                        <input type="text" placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                </div>
                <div className="pos-product-grid">
                    {filteredProducts.map(product => (
                        <div key={product.id} className={`pos-product-card ${product.stock === 0 ? 'out-of-stock' : ''}`} onClick={() => product.stock > 0 && addToCart(product)}>
                            <img src={product.image || 'https://via.placeholder.com/100'} alt={product.name} />
                            <div className="pos-product-info">
                                <h4>{product.name}</h4>
                                <span>₹{product.price}</span>
                                <small className={product.stock <= 5 ? 'text-danger' : 'text-success'}>
                                    {product.stock > 0 ? `Stock: ${product.stock}` : 'Out of Stock'}
                                </small>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right: Cart */}
            <div className="pos-cart-section card">
                <h3 className="pos-cart-title"><ShoppingCart size={20} /> Current Order</h3>
                
                <div className="pos-customer-form">
                    <div className="form-group">
                        <label><User size={14}/> Customer Name</label>
                        <input type="text" className="input input-sm" value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} />
                    </div>
                    <div className="form-group">
                        <label><Phone size={14}/> Phone (Optional)</label>
                        <input type="text" className="input input-sm" value={customerInfo.phone} onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})} />
                    </div>
                </div>

                <div className="pos-cart-items">
                    {cart.length === 0 ? (
                        <div className="pos-empty-cart">Cart is empty</div>
                    ) : (
                        cart.map(item => (
                            <div key={item.id} className="pos-cart-item">
                                <div className="pos-cart-item-info">
                                    <span className="pos-cart-item-name">{item.name}</span>
                                    <span className="pos-cart-item-price">₹{item.price}</span>
                                </div>
                                <div className="pos-cart-item-actions">
                                    <button onClick={() => updateQuantity(item.id, -1)}><Minus size={14}/></button>
                                    <span className="qty">{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.id, 1)}><Plus size={14}/></button>
                                    <button className="remove-btn" onClick={() => removeItem(item.id)}><Trash2 size={16}/></button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="pos-cart-summary">
                    <div className="summary-row total">
                        <span>Total</span>
                        <span>₹{total.toFixed(2)}</span>
                    </div>
                    {error && <div className="error-message">{error}</div>}
                    <button 
                        className="btn btn-primary btn-block pos-checkout-btn" 
                        disabled={cart.length === 0 || isSubmitting}
                        onClick={handleCheckout}
                    >
                        {isSubmitting ? 'Processing...' : 'Complete Order'}
                    </button>
                </div>
            </div>
        </div>
    );
}
