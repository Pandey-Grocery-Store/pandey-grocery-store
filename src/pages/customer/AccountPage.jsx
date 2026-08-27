import { useState, useEffect, useCallback } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { 
    User, 
    Package, 
    MapPin, 
    LogIn, 
    Loader, 
    ShoppingBag, 
    Shield, 
    Phone, 
    Mail, 
    Clock, 
    CheckCircle2, 
    Truck, 
    ExternalLink, 
    Plus, 
    Edit2, 
    Trash2, 
    Save, 
    X, 
    KeyRound, 
    Sparkles, 
    ChevronRight, 
    LogOut,
    ArrowRight,
    Home,
    Briefcase,
    ShieldCheck,
    Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ordersApi, userApi } from '../../lib/api';
import { statusLabels, statusColors } from '../../data/orders';
import './AccountPage.css';

const tabs = [
    { id: 'profile', label: 'Profile', fullLabel: 'Personal Profile', icon: User },
    { id: 'orders', label: 'Orders', fullLabel: 'My Orders', icon: Package },
    { id: 'addresses', label: 'Addresses', fullLabel: 'Saved Addresses', icon: MapPin },
    { id: 'security', label: 'Security', fullLabel: 'Security & Login', icon: KeyRound },
];

export default function AccountPage() {
    const { user, isLoggedIn, logout, updateUser } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('profile');
    
    // Orders State
    const [myOrders, setMyOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [orderFilter, setOrderFilter] = useState('all');

    // Profile Edit State
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [profileForm, setProfileForm] = useState({
        name: '',
        phone: '',
        address: ''
    });
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileMessage, setProfileMessage] = useState(null);

    // Addresses State
    const [addresses, setAddresses] = useState([]);
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [editingAddressId, setEditingAddressId] = useState(null);
    const [addressForm, setAddressForm] = useState({
        label: 'Home',
        recipientName: '',
        phone: '',
        address: '',
        city: 'Haldwani',
        pin: '263139',
        isDefault: false
    });

    // Initialize user state
    useEffect(() => {
        if (user) {
            setProfileForm({
                name: user.name || '',
                phone: user.phone || '',
                address: user.address || ''
            });

            if (user.addresses && user.addresses.length > 0) {
                setAddresses(user.addresses);
            } else if (user.address) {
                setAddresses([{
                    id: 'addr-default',
                    label: 'Home',
                    recipientName: user.name || 'Customer',
                    phone: user.phone || '',
                    address: user.address,
                    city: 'Haldwani',
                    pin: '263139',
                    isDefault: true
                }]);
            }
        }
    }, [user]);

    // Fetch orders when tab is selected
    const fetchMyOrders = useCallback(async () => {
        if (activeTab !== 'orders') return;
        setLoadingOrders(true);
        try {
            const data = await ordersApi.getMyOrders();
            setMyOrders(data?.orders || []);
        } catch {
            setMyOrders([]);
        } finally {
            setLoadingOrders(false);
        }
    }, [activeTab]);

    useEffect(() => { fetchMyOrders(); }, [fetchMyOrders]);

    if (!isLoggedIn || !user) {
        return <Navigate to="/login" replace />;
    }

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setProfileSaving(true);
        setProfileMessage(null);
        try {
            if (updateUser) {
                await updateUser({
                    name: profileForm.name,
                    phone: profileForm.phone,
                    address: profileForm.address
                });
            }
            setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
            setIsEditingProfile(false);
        } catch (err) {
            setProfileMessage({ type: 'error', text: err.message || 'Failed to update profile' });
        } finally {
            setProfileSaving(false);
        }
    };

    const handleSaveAddress = (e) => {
        e.preventDefault();
        if (!addressForm.address) return;

        if (editingAddressId) {
            setAddresses(prev => prev.map(a => a.id === editingAddressId ? { ...addressForm, id: editingAddressId } : a));
        } else {
            const newAddr = {
                ...addressForm,
                id: `addr-${Date.now()}`
            };
            setAddresses(prev => [newAddr, ...prev]);
        }
        setShowAddressModal(false);
        setEditingAddressId(null);
        setAddressForm({
            label: 'Home',
            recipientName: user.name || '',
            phone: user.phone || '',
            address: '',
            city: 'Haldwani',
            pin: '263139',
            isDefault: false
        });
    };

    const deleteAddress = (id) => {
        setAddresses(prev => prev.filter(a => a.id !== id));
    };

    const editAddress = (addr) => {
        setEditingAddressId(addr.id);
        setAddressForm(addr);
        setShowAddressModal(true);
    };

    const filteredOrders = myOrders.filter(o => {
        if (orderFilter === 'all') return true;
        if (orderFilter === 'active') return ['new', 'packing', 'dispatched'].includes(o.status);
        if (orderFilter === 'delivered') return o.status === 'delivered';
        return true;
    });

    return (
        <div className="account-page-root">
            <div className="account-container-wrap">
                {/* ─── Hero Account Card ─── */}
                <div className="account-hero-card">
                    <div className="hero-user-details">
                        <div className="hero-avatar-circle">
                            {user.avatar ? (
                                <img src={user.avatar} alt={user.name} />
                            ) : (
                                <span>{user.name?.charAt(0) || user.email?.charAt(0) || 'U'}</span>
                            )}
                        </div>
                        <div className="hero-meta">
                            <div className="hero-name-row">
                                <h2>{user.name || 'Pandey Store Customer'}</h2>
                                <span className={`account-role-badge role-${user.role?.toLowerCase()}`}>
                                    <ShieldCheck size={12} /> {user.role || 'CUSTOMER'}
                                </span>
                            </div>
                            <div className="hero-contact-row">
                                <span className="hero-email-text"><Mail size={12} /> {user.email}</span>
                                {user.phone && <span><Phone size={12} /> {user.phone}</span>}
                            </div>
                        </div>
                    </div>

                    <div className="hero-quick-stats">
                        <div className="hero-stat-item" onClick={() => setActiveTab('orders')}>
                            <span className="stat-num">{myOrders.length || 0}</span>
                            <span className="stat-txt">Orders</span>
                        </div>
                        <div className="hero-stat-item" onClick={() => setActiveTab('addresses')}>
                            <span className="stat-num">{addresses.length}</span>
                            <span className="stat-txt">Addresses</span>
                        </div>
                    </div>
                </div>

                {/* ─── Segmented Navigation Tabs Bar ─── */}
                <div className="account-nav-bar-container">
                    <div className="account-segmented-nav">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    className={`account-seg-tab ${isActive ? 'active' : ''}`}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    <Icon size={16} />
                                    <span className="seg-label-short">{tab.label}</span>
                                    <span className="seg-label-full">{tab.fullLabel}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ─── Main Content Panels ─── */}
                <div className="account-panel-container">
                    {/* ── TAB 1: Profile ── */}
                    {activeTab === 'profile' && (
                        <div className="account-card-panel">
                            <div className="panel-header-row">
                                <div>
                                    <h2 className="panel-heading">Personal Profile</h2>
                                    <p className="panel-subheading">Manage your name, phone, and store preferences</p>
                                </div>
                                {!isEditingProfile && (
                                    <button className="btn btn-secondary btn-sm edit-profile-btn" onClick={() => setIsEditingProfile(true)}>
                                        <Edit2 size={14} /> Edit Profile
                                    </button>
                                )}
                            </div>

                            {profileMessage && (
                                <div className={`profile-status-alert ${profileMessage.type}`}>
                                    {profileMessage.text}
                                </div>
                            )}

                            {isEditingProfile ? (
                                <form onSubmit={handleProfileSubmit} className="profile-edit-form">
                                    <div className="profile-fields-grid">
                                        <div className="form-group">
                                            <label>Full Name</label>
                                            <input 
                                                type="text" 
                                                className="input" 
                                                value={profileForm.name} 
                                                onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} 
                                                required 
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Email Address</label>
                                            <input 
                                                type="email" 
                                                className="input disabled-input" 
                                                value={user.email} 
                                                disabled 
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Phone Number</label>
                                            <input 
                                                type="tel" 
                                                className="input" 
                                                placeholder="+91 98765 43210"
                                                value={profileForm.phone} 
                                                onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} 
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>City &amp; Location</label>
                                            <input 
                                                type="text" 
                                                className="input disabled-input" 
                                                value="Haldwani, Uttarakhand (263139)" 
                                                disabled 
                                            />
                                        </div>
                                    </div>

                                    <div className="profile-action-buttons">
                                        <button type="button" className="btn btn-secondary" onClick={() => setIsEditingProfile(false)}>
                                            Cancel
                                        </button>
                                        <button type="submit" className="btn btn-primary" disabled={profileSaving}>
                                            {profileSaving ? <><Loader size={15} className="spin" /> Saving...</> : <><Save size={15} /> Save Changes</>}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="profile-view-wrapper">
                                    <div className="profile-cards-grid">
                                        <div className="profile-datum-card">
                                            <span className="datum-label">Full Name</span>
                                            <span className="datum-value">{user.name || 'Not specified'}</span>
                                        </div>
                                        <div className="profile-datum-card">
                                            <span className="datum-label">Email Address</span>
                                            <span className="datum-value email-val">{user.email}</span>
                                        </div>
                                        <div className="profile-datum-card">
                                            <span className="datum-label">Phone Contact</span>
                                            <span className="datum-value">{user.phone || 'No phone added'}</span>
                                        </div>
                                        <div className="profile-datum-card">
                                            <span className="datum-label">Account Role</span>
                                            <span className="datum-value role-val">{user.role || 'Customer'}</span>
                                        </div>
                                    </div>

                                    <div className="store-perks-banner">
                                        <div className="perk-icon-wrap">
                                            <Sparkles size={18} color="#10b981" />
                                        </div>
                                        <div>
                                            <h4>Pandey Store Preferred Customer</h4>
                                            <p>15–30 min fast grocery doorstep delivery across Haldwani &amp; instant Xerox/Print Hub support.</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── TAB 2: Orders ── */}
                    {activeTab === 'orders' && (
                        <div className="account-card-panel">
                            <div className="panel-header-row">
                                <div>
                                    <h2 className="panel-heading">My Orders &amp; Tracking</h2>
                                    <p className="panel-subheading">View order status, receipts, and live delivery updates</p>
                                </div>
                                <Link to="/" className="btn btn-primary btn-sm">
                                    <ShoppingBag size={14} /> Shop Now
                                </Link>
                            </div>

                            {/* Filters */}
                            <div className="orders-filter-chips">
                                <button 
                                    className={`order-chip ${orderFilter === 'all' ? 'active' : ''}`}
                                    onClick={() => setOrderFilter('all')}
                                >
                                    All ({myOrders.length})
                                </button>
                                <button 
                                    className={`order-chip ${orderFilter === 'active' ? 'active' : ''}`}
                                    onClick={() => setOrderFilter('active')}
                                >
                                    Active Orders
                                </button>
                                <button 
                                    className={`order-chip ${orderFilter === 'delivered' ? 'active' : ''}`}
                                    onClick={() => setOrderFilter('delivered')}
                                >
                                    Delivered
                                </button>
                            </div>

                            {loadingOrders ? (
                                <div className="panel-loading-state">
                                    <Loader size={28} className="spin" color="var(--primary)" />
                                    <p>Loading your store orders...</p>
                                </div>
                            ) : filteredOrders.length === 0 ? (
                                <div className="panel-empty-state">
                                    <ShoppingBag size={44} color="#cbd5e1" />
                                    <h3>No orders yet</h3>
                                    <p>Your grocery and print orders will appear here once placed.</p>
                                    <Link to="/" className="btn btn-primary mt-3">Start Shopping</Link>
                                </div>
                            ) : (
                                <div className="orders-cards-stream">
                                    {filteredOrders.map((order) => (
                                        <div key={order.id} className="order-summary-card">
                                            <div className="order-summary-top">
                                                <div>
                                                    <span className="order-tag-id">#{order.id}</span>
                                                    <span className="order-timestamp">
                                                        <Clock size={11} /> {order.date ? new Date(order.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Recent'}
                                                    </span>
                                                </div>
                                                <span 
                                                    className="order-status-badge"
                                                    style={{ 
                                                        background: `${statusColors[order.status] || '#10b981'}18`, 
                                                        color: statusColors[order.status] || '#10b981' 
                                                    }}
                                                >
                                                    {statusLabels[order.status] || order.status}
                                                </span>
                                            </div>

                                            <div className="order-item-tags-wrap">
                                                {(order.items || []).map((item, idx) => (
                                                    <span key={idx} className="order-item-pill">
                                                        {item.name} <strong>×{item.qty || item.quantity}</strong>
                                                    </span>
                                                ))}
                                            </div>

                                            <div className="order-summary-bottom">
                                                <div className="order-amount-box">
                                                    <span>Total:</span>
                                                    <strong>₹{order.total}</strong>
                                                    <span className="order-pay-type">{order.payment || 'COD'}</span>
                                                </div>

                                                <Link 
                                                    to={`/track/${order.id}`} 
                                                    className="btn btn-secondary btn-sm order-track-link"
                                                >
                                                    <Truck size={13} /> Live Track
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── TAB 3: Addresses ── */}
                    {activeTab === 'addresses' && (
                        <div className="account-card-panel">
                            <div className="panel-header-row">
                                <div>
                                    <h2 className="panel-heading">Saved Delivery Locations</h2>
                                    <p className="panel-subheading">Manage home, office, and family delivery addresses</p>
                                </div>
                                <button className="btn btn-primary btn-sm" onClick={() => { setEditingAddressId(null); setShowAddressModal(true); }}>
                                    <Plus size={14} /> Add Address
                                </button>
                            </div>

                            <div className="addresses-grid-container">
                                {addresses.map((addr) => (
                                    <div key={addr.id} className={`address-card-tile ${addr.isDefault ? 'default-tile' : ''}`}>
                                        <div className="address-tile-top">
                                            <span className="address-tag-pill">
                                                {addr.label === 'Home' ? <Home size={12} /> : <Briefcase size={12} />} {addr.label}
                                            </span>
                                            {addr.isDefault && <span className="default-indicator-pill">Default</span>}
                                        </div>

                                        <div className="address-tile-body">
                                            <strong>{addr.recipientName || user.name}</strong>
                                            <p>{addr.address}</p>
                                            <span className="city-pin">{addr.city || 'Haldwani'} - {addr.pin || '263139'}</span>
                                            {addr.phone && <span className="phone-line">Ph: {addr.phone}</span>}
                                        </div>

                                        <div className="address-tile-actions">
                                            <button className="btn-link-action" onClick={() => editAddress(addr)}>
                                                <Edit2 size={12} /> Edit
                                            </button>
                                            <button className="btn-link-action delete-act" onClick={() => deleteAddress(addr.id)}>
                                                <Trash2 size={12} /> Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                <div className="add-address-card-button" onClick={() => { setEditingAddressId(null); setShowAddressModal(true); }}>
                                    <div className="add-addr-icon">
                                        <Plus size={20} />
                                    </div>
                                    <strong>Add New Address</strong>
                                    <span>Home, Office, or Relative in Haldwani</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── TAB 4: Security ── */}
                    {activeTab === 'security' && (
                        <div className="account-card-panel">
                            <div className="panel-header-row">
                                <div>
                                    <h2 className="panel-heading">Security &amp; Connected Accounts</h2>
                                    <p className="panel-subheading">Password, Google Authentication &amp; Sessions</p>
                                </div>
                            </div>

                            <div className="security-cards-stack">
                                <div className="security-feature-card">
                                    <div className="sec-feature-icon">
                                        <KeyRound size={18} color="var(--primary)" />
                                    </div>
                                    <div className="sec-feature-text">
                                        <h4>Account Password</h4>
                                        <p>Secure login password for your store account.</p>
                                    </div>
                                    <button className="btn btn-secondary btn-sm" onClick={() => alert('Password reset verification link sent to ' + user.email)}>
                                        Reset Password
                                    </button>
                                </div>

                                <div className="security-feature-card">
                                    <div className="sec-feature-icon emerald-bg">
                                        <CheckCircle2 size={18} color="#059669" />
                                    </div>
                                    <div className="sec-feature-text">
                                        <h4>Google One-Tap Auth</h4>
                                        <p>Signed in with {user.email}</p>
                                    </div>
                                    <span className="auth-connected-badge"><Check size={12} /> Active</span>
                                </div>

                                <div className="security-feature-card signout-feature-card">
                                    <div className="sec-feature-icon danger-bg">
                                        <LogOut size={18} color="#dc2626" />
                                    </div>
                                    <div className="sec-feature-text">
                                        <h4>Sign Out Session</h4>
                                        <p>Log out of Pandey Grocery Store on this browser.</p>
                                    </div>
                                    <button className="btn btn-outline btn-sm text-danger" onClick={logout}>
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ─── Add / Edit Address Modal ─── */}
            {showAddressModal && (
                <div className="modal-overlay animate-fade-in" onClick={() => setShowAddressModal(false)}>
                    <div className="address-modal-card" onClick={e => e.stopPropagation()}>
                        <div className="modal-card-header">
                            <div className="modal-title-wrap">
                                <MapPin size={18} color="var(--primary)" />
                                <h3>{editingAddressId ? 'Edit Delivery Address' : 'Add Delivery Address'}</h3>
                            </div>
                            <button className="btn-icon btn-ghost" onClick={() => setShowAddressModal(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveAddress} className="modal-form-body">
                            <div className="modal-form-grid">
                                <div className="m-form-group">
                                    <label>Location Label</label>
                                    <select 
                                        className="input" 
                                        value={addressForm.label} 
                                        onChange={e => setAddressForm({ ...addressForm, label: e.target.value })}
                                    >
                                        <option value="Home">Home</option>
                                        <option value="Work / Office">Work / Office</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div className="m-form-group">
                                    <label>Recipient Full Name</label>
                                    <input 
                                        type="text" 
                                        className="input" 
                                        placeholder="e.g. Anju Pandey" 
                                        value={addressForm.recipientName} 
                                        onChange={e => setAddressForm({ ...addressForm, recipientName: e.target.value })} 
                                        required 
                                    />
                                </div>

                                <div className="m-form-group full-width">
                                    <label>Street / Flat / House Address</label>
                                    <textarea 
                                        className="input" 
                                        rows={2} 
                                        placeholder="e.g. Flat 204, Near Durga Mandir, Kusumkhera" 
                                        value={addressForm.address} 
                                        onChange={e => setAddressForm({ ...addressForm, address: e.target.value })} 
                                        required 
                                    />
                                </div>

                                <div className="m-form-group">
                                    <label>City</label>
                                    <input 
                                        type="text" 
                                        className="input" 
                                        value={addressForm.city} 
                                        onChange={e => setAddressForm({ ...addressForm, city: e.target.value })} 
                                    />
                                </div>

                                <div className="m-form-group">
                                    <label>Pincode</label>
                                    <input 
                                        type="text" 
                                        className="input" 
                                        value={addressForm.pin} 
                                        onChange={e => setAddressForm({ ...addressForm, pin: e.target.value })} 
                                    />
                                </div>

                                <div className="m-form-group full-width">
                                    <label>Contact Phone</label>
                                    <input 
                                        type="tel" 
                                        className="input" 
                                        placeholder="+91 98765 43210" 
                                        value={addressForm.phone} 
                                        onChange={e => setAddressForm({ ...addressForm, phone: e.target.value })} 
                                    />
                                </div>
                            </div>

                            <div className="modal-card-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowAddressModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    <Save size={15} /> Save Address
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
