import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Clock, CreditCard, Smartphone, Wallet, Banknote, CheckCircle2 } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { ordersApi } from '../../lib/api';
import './CheckoutPage.css';

export default function CheckoutPage() {
    const { items, subtotal, discount, deliveryFee, total, clearCart } = useCart();
    const { user, isLoggedIn } = useAuth();
    const navigate = useNavigate();

    const [deliveryType, setDeliveryType] = useState('home');
    const [paymentMethod, setPaymentMethod] = useState('cod');
    const [timeSlot, setTimeSlot] = useState('');
    const [orderPlaced, setOrderPlaced] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const [address, setAddress] = useState({
        name: user?.name || '',
        phone: user?.phone || '',
        line1: user?.addresses?.[0]?.address || '',
        city: user?.addresses?.[0]?.city || 'Haldwani',
        pin: user?.addresses?.[0]?.pin || '',
    });

    const timeSlots = [
        '10:00 AM - 12:00 PM',
        '12:00 PM - 2:00 PM',
        '2:00 PM - 4:00 PM',
        '4:00 PM - 6:00 PM',
        '6:00 PM - 8:00 PM',
    ];

    const handlePlaceOrder = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        try {
            const orderData = {
                items: items.map(i => ({ id: i.productId, name: i.name, price: i.price, quantity: i.quantity, image: i.image })),
                subtotal,
                discount,
                deliveryFee,
                total,
                deliveryType,
                paymentMode: paymentMethod,
                timeSlot,
                customer: address.name,
                phone: address.phone,
                address: `${address.line1}, ${address.city}, ${address.pin}`
            };
            await ordersApi.create(orderData);
            setOrderPlaced(true);
            clearCart();
        } catch (err) {
            setError(err.message || 'Failed to place order. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (orderPlaced) {
        return (
            <div className="container section order-success">
                <div className="order-success-content animate-fade-in">
                    <CheckCircle2 size={64} className="success-icon" />
                    <h1>Order Placed Successfully! 🎉</h1>
                    <p>Your order has been received and is being processed. You will receive a confirmation on WhatsApp shortly.</p>
                    <div className="order-success-details card">
                        <p><strong>Order ID:</strong> ORD-{Math.floor(1000 + Math.random() * 9000)}</p>
                        <p><strong>Delivery:</strong> {deliveryType === 'home' ? 'Home Delivery' : 'Store Pickup'}</p>
                        {timeSlot && <p><strong>Time Slot:</strong> {timeSlot}</p>}
                        <p><strong>Payment:</strong> {paymentMethod.toUpperCase()}</p>
                        <p><strong>Total:</strong> ₹{total}</p>
                    </div>
                    <div className="order-success-actions">
                        <Link to="/" className="btn btn-primary btn-lg">Continue Shopping</Link>
                        <Link to="/account" className="btn btn-secondary btn-lg">View Orders</Link>
                    </div>
                </div>
            </div>
        );
    }

    if (items.length === 0) {
        navigate('/cart');
        return null;
    }

    return (
        <div className="checkout-page">
            <div className="container">
                <h1 className="page-title">Checkout</h1>

                <form className="checkout-layout" onSubmit={handlePlaceOrder}>
                    <div className="checkout-form-section">
                        {/* Delivery Type */}
                        <div className="checkout-card card">
                            <h3 className="checkout-card-title"><MapPin size={20} /> Delivery Method</h3>
                            <div className="delivery-options">
                                <label className={`delivery-option ${deliveryType === 'home' ? 'active' : ''}`}>
                                    <input type="radio" name="delivery" value="home" checked={deliveryType === 'home'} onChange={(e) => setDeliveryType(e.target.value)} />
                                    <div>
                                        <strong>🏠 Home Delivery</strong>
                                        <span>Delivered to your doorstep</span>
                                    </div>
                                </label>
                                <label className={`delivery-option ${deliveryType === 'pickup' ? 'active' : ''}`}>
                                    <input type="radio" name="delivery" value="pickup" checked={deliveryType === 'pickup'} onChange={(e) => setDeliveryType(e.target.value)} />
                                    <div>
                                        <strong>🏪 Store Pickup</strong>
                                        <span>Collect from Pandey Grocery Store</span>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Address */}
                        {deliveryType === 'home' && (
                            <div className="checkout-card card">
                                <h3 className="checkout-card-title"><MapPin size={20} /> Delivery Address</h3>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Full Name</label>
                                        <input className="input" value={address.name} onChange={(e) => setAddress({ ...address, name: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Phone Number</label>
                                        <input className="input" value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} required />
                                    </div>
                                    <div className="form-group full-width">
                                        <label>Address</label>
                                        <input className="input" value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} placeholder="House/Flat No., Colony, Street" required />
                                    </div>
                                    <div className="form-group">
                                        <label>City</label>
                                        <input className="input" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label>PIN Code</label>
                                        <input className="input" value={address.pin} onChange={(e) => setAddress({ ...address, pin: e.target.value })} required />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Time Slot */}
                        <div className="checkout-card card">
                            <h3 className="checkout-card-title"><Clock size={20} /> Delivery Time Slot</h3>
                            <div className="time-slots">
                                {timeSlots.map((slot) => (
                                    <label key={slot} className={`time-slot ${timeSlot === slot ? 'active' : ''}`}>
                                        <input type="radio" name="timeslot" value={slot} checked={timeSlot === slot} onChange={(e) => setTimeSlot(e.target.value)} />
                                        <span>{slot}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Payment */}
                        <div className="checkout-card card">
                            <h3 className="checkout-card-title"><CreditCard size={20} /> Payment Method</h3>
                            <div className="payment-options">
                                {/* COD — Active */}
                                <label className={`payment-option ${paymentMethod === 'cod' ? 'active' : ''}`}>
                                    <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={(e) => setPaymentMethod(e.target.value)} />
                                    <Banknote size={20} />
                                    <div>
                                        <strong>Cash on Delivery</strong>
                                        <span>Pay when delivered</span>
                                    </div>
                                </label>

                                {/* Online — Coming Soon */}
                                {[
                                    { id: 'upi', icon: Smartphone, label: 'UPI (GPay / PhonePe / Paytm)' },
                                    { id: 'card', icon: CreditCard, label: 'Credit / Debit Card' },
                                    { id: 'wallet', icon: Wallet, label: 'Wallet (Paytm / Amazon Pay)' },
                                ].map((pm) => (
                                    <label key={pm.id} className="payment-option disabled" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                                        <input type="radio" name="payment" value={pm.id} disabled />
                                        <pm.icon size={20} />
                                        <div>
                                            <strong>{pm.label}</strong>
                                            <span style={{ color: 'var(--primary)' }}>Coming Soon</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Order Summary Sidebar */}
                    <div className="checkout-summary card">
                        <h3 className="summary-title">Order Summary</h3>
                        <div className="checkout-items">
                            {items.map((item) => (
                                <div key={item.id} className="checkout-item">
                                    <img src={item.image} alt={item.name} />
                                    <div>
                                        <span className="checkout-item-name">{item.name}</span>
                                        <span className="checkout-item-qty">{item.qty} × ₹{item.price}</span>
                                    </div>
                                    <span className="checkout-item-total">₹{item.qty * item.price}</span>
                                </div>
                            ))}
                        </div>

                        <div className="summary-rows">
                            <div className="summary-row"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
                            {discount > 0 && <div className="summary-row discount"><span>Discount</span><span>-₹{discount.toFixed(2)}</span></div>}
                            <div className="summary-row"><span>Delivery Fee</span><span>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee.toFixed(2)}`}</span></div>
                            <div className="summary-row total"><span>Total</span><span>₹{total.toFixed(2)}</span></div>
                        </div>

                        {error && <div className="error-message" style={{color: 'red', marginTop: '10px', marginBottom: '10px'}}>{error}</div>}
                        <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={isSubmitting}>
                            {isSubmitting ? 'Processing...' : `Place Order — ₹${total.toFixed(2)}`}
                        </button>
                        
                        <p className="checkout-secure" style={{marginTop: '1rem'}}>💵 Cash on Delivery — Pay when you receive your order</p>
                    </div>
                </form>
            </div>
        </div>
    );
}
