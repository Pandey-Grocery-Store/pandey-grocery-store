import { useState, useEffect, useCallback } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { User, Package, MapPin, LogIn, Loader, ShoppingBag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ordersApi } from '../../lib/api';
import { statusLabels, statusColors } from '../../data/orders';
import './AccountPage.css';

const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'orders', label: 'My Orders', icon: Package },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
];

export default function AccountPage() {
    const { user, isLoggedIn } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [myOrders, setMyOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(false);

    const fetchMyOrders = useCallback(async () => {
        if (activeTab !== 'orders') return;
        setLoadingOrders(true);
        try {
            const data = await ordersApi.getMyOrders();
            setMyOrders(data?.orders || []);
        } catch {
            setMyOrders([]);
        }
        setLoadingOrders(false);
    }, [activeTab]);

    useEffect(() => { fetchMyOrders(); }, [fetchMyOrders]);

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
                            <div className="account-avatar">{user.name?.charAt(0) || user.email?.charAt(0)}</div>
                            <div>
                                <h3>{user.name || 'User'}</h3>
                                <p>{user.email}</p>
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
                                    <div className="form-group"><label>Name</label><input className="input" value={user.name || ''} readOnly /></div>
                                    <div className="form-group"><label>Email</label><input className="input" value={user.email || ''} readOnly /></div>
                                    <div className="form-group"><label>Phone</label><input className="input" value={user.phone || 'Not set'} readOnly /></div>
                                    <div className="form-group"><label>Role</label><input className="input" value={user.role || 'CUSTOMER'} readOnly style={{ textTransform: 'capitalize' }} /></div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'orders' && (
                            <div>
                                <h2 className="account-section-title">My Orders</h2>
                                {loadingOrders ? (
                                    <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                                        <Loader size={24} className="spin" /> Loading your orders...
                                    </div>
                                ) : myOrders.length === 0 ? (
                                    <div className="card empty-state">
                                        <ShoppingBag size={48} strokeWidth={1} />
                                        <h3>No orders yet</h3>
                                        <p>When you place your first order, it will appear here.</p>
                                        <Link to="/" className="btn btn-primary">Start Shopping</Link>
                                    </div>
                                ) : (
                                    <div className="orders-list">
                                        {myOrders.map((order) => (
                                            <div key={order.id} className="order-card card">
                                                <div className="order-header">
                                                    <div>
                                                        <span className="order-id">{order.id}</span>
                                                        <span className="order-date">{order.date ? new Date(order.date).toLocaleDateString('en-IN') : ''}</span>
                                                    </div>
                                                    <span className="badge" style={{ background: `${statusColors[order.status]}20`, color: statusColors[order.status] }}>
                                                        {statusLabels[order.status] || order.status}
                                                    </span>
                                                </div>
                                                <div className="order-items-preview">
                                                    {(order.items || []).map((item, i) => (
                                                        <span key={i}>{item.name} × {item.qty || item.quantity}</span>
                                                    ))}
                                                </div>
                                                <div className="order-footer">
                                                    <span className="order-total">₹{order.total}</span>
                                                    <span className="order-payment">{order.payment || ''}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'addresses' && (
                            <div>
                                <h2 className="account-section-title">Saved Addresses</h2>
                                <div className="addresses-grid">
                                    {user.addresses?.length > 0 ? user.addresses.map((addr) => (
                                        <div key={addr.id} className="address-card card">
                                            <span className="address-label badge badge-primary">{addr.label}</span>
                                            <p className="address-text">{addr.address}</p>
                                            <p className="address-city">{addr.city} - {addr.pin}</p>
                                            <div className="address-actions">
                                                <button className="btn btn-sm btn-ghost">Edit</button>
                                                <button className="btn btn-sm btn-ghost" style={{ color: 'var(--danger)' }}>Delete</button>
                                            </div>
                                        </div>
                                    )) : null}
                                    <div className="address-card card add-address">
                                        <MapPin size={24} />
                                        <span>Add New Address</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
