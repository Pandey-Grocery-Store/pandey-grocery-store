import { Link } from 'react-router-dom';
import { Minus, Plus, X, ShoppingCart, Tag, ArrowRight, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '../../context/CartContext';
import './CartPage.css';

export default function CartPage() {
    const { items, updateQty, removeItem, subtotal, discount, deliveryFee, total, coupon, applyCoupon, removeCoupon, itemCount } = useCart();
    const [couponInput, setCouponInput] = useState('');
    const [couponMsg, setCouponMsg] = useState(null);

    const handleApply = () => {
        const result = applyCoupon(couponInput);
        setCouponMsg(result);
        if (result.success) setCouponInput('');
    };

    if (items.length === 0) {
        return (
            <div className="container section empty-cart">
                <div className="empty-cart-content">
                    <div className="empty-cart-icon-wrap" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 90, height: 90, borderRadius: '50%', background: 'var(--primary-50)', margin: '0 auto 1.5rem' }}>
                        <ShoppingBag size={48} color="var(--primary)" />
                    </div>
                    <h2>Your cart is empty</h2>
                    <p>Looks like you haven't added anything yet. Browse our products and add items to your cart!</p>
                    <Link to="/" className="btn btn-primary btn-lg">Start Shopping</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="cart-page">
            <div className="container">
                <h1 className="page-title">Shopping Cart <span className="item-count">({itemCount} items)</span></h1>

                <div className="cart-layout">
                    <div className="cart-items-section">
                        {items.map((item) => (
                            <div key={item.id} className="cart-item card">
                                <img src={item.image} alt={item.name} className="cart-item-img" />
                                <div className="cart-item-info">
                                    <div className="cart-item-top">
                                        <div>
                                            <span className="cart-item-brand">{item.brand}</span>
                                            <h3 className="cart-item-name">{item.name}</h3>
                                            <span className="cart-item-unit">{item.unit}</span>
                                        </div>
                                        <button className="cart-remove-btn" onClick={() => removeItem(item.id)} title="Remove">
                                            <X size={18} />
                                        </button>
                                    </div>
                                    <div className="cart-item-bottom">
                                        <div className="qty-control">
                                            <button onClick={() => updateQty(item.id, item.qty - 1)}><Minus size={14} /></button>
                                            <span>{item.qty}</span>
                                            <button onClick={() => updateQty(item.id, item.qty + 1)}><Plus size={14} /></button>
                                        </div>
                                        <div className="cart-item-prices">
                                            <span className="cart-item-total">₹{item.price * item.qty}</span>
                                            {item.mrp > item.price && <span className="cart-item-mrp">₹{item.mrp * item.qty}</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="cart-summary card">
                        <h3 className="summary-title">Order Summary</h3>

                        <div className="coupon-section">
                            <div className="coupon-input-row">
                                <Tag size={16} className="coupon-icon" />
                                <input
                                    className="input"
                                    placeholder="Enter coupon code"
                                    value={couponInput}
                                    onChange={(e) => setCouponInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleApply()}
                                />
                                <button className="btn btn-sm btn-primary" onClick={handleApply}>Apply</button>
                            </div>
                            {couponMsg && (
                                <p className={`coupon-msg ${couponMsg.success ? 'success' : 'error'}`}>
                                    {couponMsg.message}
                                </p>
                            )}
                            {coupon && (
                                <div className="applied-coupon">
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                        <CheckCircle2 size={16} color="#16a34a" /> {coupon.code}: {coupon.label}
                                    </span>
                                    <button onClick={removeCoupon} className="coupon-remove">Remove</button>
                                </div>
                            )}
                            <p className="coupon-hint">Try: WELCOME100, SAVE10, FREEDELIVERY</p>
                        </div>

                        <div className="summary-rows">
                            <div className="summary-row">
                                <span>Subtotal</span>
                                <span>₹{subtotal}</span>
                            </div>
                            {discount > 0 && (
                                <div className="summary-row discount">
                                    <span>Discount</span>
                                    <span>-₹{discount}</span>
                                </div>
                            )}
                            <div className="summary-row">
                                <span>Delivery</span>
                                <span>{deliveryFee === 0 ? <span className="free-delivery">FREE</span> : `₹${deliveryFee}`}</span>
                            </div>
                            <div className="summary-row total">
                                <span>Total</span>
                                <span>₹{total}</span>
                            </div>
                        </div>

                        {subtotal < 500 && (
                            <p className="free-delivery-hint">Add ₹{500 - subtotal} more for free delivery!</p>
                        )}

                        <Link to="/checkout" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                            Proceed to Checkout <ArrowRight size={18} />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
