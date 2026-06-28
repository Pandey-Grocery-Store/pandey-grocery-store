import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { User, Package, MapPin, Heart, Award, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { orders } from '../../data/orders';
import { statusLabels, statusColors } from '../../data/orders';
import { products } from '../../data/products';
import './AccountPage.css';

const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'wishlist', label: 'Wishlist', icon: Heart },
    { id: 'rewards', label: 'Pandey Rewards', icon: Award },
];

export default function AccountPage() {
    const { user, isLoggedIn } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');

    if (!isLoggedIn) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="account-page">
            <div className="container">
                <div className="account-layout">
                    {/* Sidebar Tabs */}
                    <div className="account-sidebar card">
                        <div className="account-user-info">
                            <div className="account-avatar">{user.name?.charAt(0)}</div>
                            <div>
                                <h3>{user.name}</h3>
                                <p>{user.phone}</p>
                            </div>
                        </div>
                        <nav className="account-tabs">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    className={`account-tab ${activeTab === tab.id ? 'active' : ''}`}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    <tab.icon size={18} />
                                    <span>{tab.label}</span>
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Content */}
                    <div className="account-content">
                        {activeTab === 'profile' && (
                            <div className="card" style={{ padding: 'var(--space-6)' }}>
                                <h2 className="account-section-title">My Profile</h2>
                                <div className="profile-grid">
                                    <div className="form-group"><label>Name</label><input className="input" value={user.name} readOnly /></div>
                                    <div className="form-group"><label>Phone</label><input className="input" value={user.phone} readOnly /></div>
                                    <div className="form-group"><label>Email</label><input className="input" value={user.email} readOnly /></div>
                                    <div className="form-group"><label>Role</label><input className="input" value={user.role} readOnly style={{ textTransform: 'capitalize' }} /></div>
                                </div>
                                <button className="btn btn-primary" style={{ marginTop: 'var(--space-5)' }}>Update Profile</button>
                            </div>
                        )}

                        {activeTab === 'orders' && (
                            <div>
                                <h2 className="account-section-title">My Orders</h2>
                                <div className="orders-list">
                                    {orders.slice(0, 6).map((order) => (
                                        <div key={order.id} className="order-card card">
                                            <div className="order-header">
                                                <div>
                                                    <span className="order-id">{order.id}</span>
                                                    <span className="order-date">{order.date}</span>
                                                </div>
                                                <span className="badge" style={{ background: `${statusColors[order.status]}20`, color: statusColors[order.status] }}>
                                                    {statusLabels[order.status]}
                                                </span>
                                            </div>
                                            <div className="order-items-preview">
                                                {order.items.map((item, i) => (
                                                    <span key={i}>{item.name} × {item.qty}</span>
                                                ))}
                                            </div>
                                            <div className="order-footer">
                                                <span className="order-total">₹{order.total}</span>
                                                <span className="order-payment">{order.payment}</span>
                                                <button className="btn btn-sm btn-secondary">Reorder</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'addresses' && (
                            <div>
                                <h2 className="account-section-title">Saved Addresses</h2>
                                <div className="addresses-grid">
                                    {user.addresses?.map((addr) => (
                                        <div key={addr.id} className="address-card card">
                                            <span className="address-label badge badge-primary">{addr.label}</span>
                                            <p className="address-text">{addr.address}</p>
                                            <p className="address-city">{addr.city} - {addr.pin}</p>
                                            <div className="address-actions">
                                                <button className="btn btn-sm btn-ghost">Edit</button>
                                                <button className="btn btn-sm btn-ghost" style={{ color: 'var(--danger)' }}>Delete</button>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="address-card card add-address">
                                        <MapPin size={24} />
                                        <span>Add New Address</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'wishlist' && (
                            <div>
                                <h2 className="account-section-title">My Wishlist</h2>
                                <div className="wishlist-grid grid grid-3">
                                    {products.slice(0, 6).map((product) => (
                                        <div key={product.id} className="wishlist-item card">
                                            <img src={product.image} alt={product.name} className="wishlist-img" />
                                            <div className="wishlist-info">
                                                <span className="wishlist-name">{product.name}</span>
                                                <span className="wishlist-price">₹{product.price}</span>
                                            </div>
                                            <button className="btn btn-sm btn-primary" style={{ width: '100%' }}>Add to Cart</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'rewards' && (
                            <div>
                                <h2 className="account-section-title">Pandey Rewards</h2>
                                <div className="rewards-hero card">
                                    <div className="rewards-points">
                                        <Award size={40} color="var(--primary)" />
                                        <div>
                                            <span className="points-value">{user.points || 450}</span>
                                            <span className="points-label">Points Available</span>
                                        </div>
                                    </div>
                                    <p className="points-worth">Worth ₹{Math.floor((user.points || 450) / 10)} in discounts</p>
                                    <button className="btn btn-primary">Redeem Points</button>
                                </div>

                                <h3 className="rewards-sub-title">How to Earn</h3>
                                <div className="rewards-earn-grid">
                                    {[
                                        { action: 'Every ₹100 spent', points: '10 pts' },
                                        { action: 'First order', points: '50 pts' },
                                        { action: 'Refer a friend', points: '100 pts' },
                                        { action: 'Write a review', points: '5 pts' },
                                        { action: 'Birthday month', points: '2× pts' },
                                    ].map((item, i) => (
                                        <div key={i} className="earn-item card">
                                            <span className="earn-action">{item.action}</span>
                                            <span className="earn-points badge badge-primary">{item.points}</span>
                                        </div>
                                    ))}
                                </div>

                                <h3 className="rewards-sub-title">Your Referral Code</h3>
                                <div className="referral-card card">
                                    <code className="referral-code">PANDEY-RAVI45</code>
                                    <p>Share this code and earn 100 points for each successful referral!</p>
                                    <button className="btn btn-secondary btn-sm">Copy Code</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
