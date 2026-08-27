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
    Briefcase
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ordersApi, userApi } from '../../lib/api';
import { statusLabels, statusColors } from '../../data/orders';
import './AccountPage.css';

const tabs = [
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'orders', label: 'Order History', icon: Package },
    { id: 'addresses', label: 'Delivery Addresses', icon: MapPin },
    { id: 'security', label: 'Security & Login', icon: KeyRound },
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

    // Password State
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState(null);

    // Initialize user state
    useEffect(() => {
        if (user) {
            setProfileForm({
                name: user.name || '',
                phone: user.phone || '',
                address: user.address || ''
            });

            // Initialize addresses from user or default
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

    // Save profile handler
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

    // Save address handler
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

    // Filter orders
    const filteredOrders = myOrders.filter(o => {
        if (orderFilter === 'all') return true;
        if (orderFilter === 'active') return ['new', 'packing', 'dispatched'].includes(o.status);
        if (orderFilter === 'delivered') return o.status === 'delivered';
        return true;
    });

    return (
        <div className="account-page-container animate-fade-in">
            <div className="container">
                {/* ─── Hero Account Banner ─── */}
                <div className="account-hero-card card">
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
                                    <Shield size={12} /> {user.role || 'CUSTOMER'}
                                </span>
                            </div>
                            <div className="hero-contact-row">
                                <span><Mail size={13} /> {user.email}</span>
                                {user.phone && <span><Phone size={13} /> {user.phone}</span>}
                                <span><MapPin size={13} /> Haldwani, Uttarakhand</span>
                            </div>
                        </div>
                    </div>

                    <div className="hero-quick-stats">
                        <div className="hero-stat-item" onClick={() => setActiveTab('orders')}>
                            <span className="stat-num">{myOrders.length || 0}</span>
                            <span className="stat-txt">Total Orders</span>
                        </div>
                        <div className="hero-stat-item" onClick={() => setActiveTab('addresses')}>
                            <span className="stat-num">{addresses.length}</span>
                            <span className="stat-txt">Saved Addresses</span>
                        </div>
                    </div>
                </div>

                {/* ─── Main Two-Column Layout ─── */}
                <div className="account-main-layout">
                    {/* Left Sidebar Navigation */}
                    <div className="account-nav-sidebar card">
                        <nav className="account-sidebar-tabs">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        className={`account-nav-btn ${isActive ? 'active' : ''}`}
                                        onClick={() => setActiveTab(tab.id)}
                                    >
                                        <div className="nav-btn-icon-wrap">
                                            <Icon size={18} />
                                        </div>
                                        <span className="nav-btn-label">{tab.label}</span>
                                        <ChevronRight size={16} className="nav-chevron" />
                                    </button>
                                );
                            })}
                            <button className="account-nav-btn logout-nav-btn" onClick={logout}>
                                <div className="nav-btn-icon-wrap">
                                    <LogOut size={18} />
                                </div>
                                <span className="nav-btn-label">Sign Out</span>
                            </button>
                        </nav>
                    </div>

                    {/* Right Content Panels */}
                    <div className="account-content-pane">
                        {/* ── TAB 1: Profile ── */}
                        {activeTab === 'profile' && (
                            <div className="profile-tab-content card">
                                <div className="pane-section-header">
                                    <div>
                                        <h2 className="pane-title">Personal Profile</h2>
                                        <p className="pane-subtitle">Manage your personal information and contact preferences</p>
                                    </div>
                                    {!isEditingProfile && (
                                        <button className="btn btn-secondary btn-sm" onClick={() => setIsEditingProfile(true)}>
                                            <Edit2 size={15} /> Edit Profile
                                        </button>
                                    )}
                                </div>

                                {profileMessage && (
                                    <div className={`profile-alert-box ${profileMessage.type}`}>
                                        {profileMessage.text}
                                    </div>
                                )}

                                {isEditingProfile ? (
                                    <form onSubmit={handleProfileSubmit} className="profile-edit-form">
                                        <div className="profile-form-grid">
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
                                                <label>Email Address (Account ID)</label>
                                                <input 
                                                    type="email" 
                                                    className="input" 
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
                                                <label>Default Store City</label>
                                                <input 
                                                    type="text" 
                                                    className="input" 
                                                    value="Haldwani, Uttarakhand (263139)" 
                                                    disabled 
                                                />
                                            </div>
                                        </div>

                                        <div className="profile-form-actions">
                                            <button type="button" className="btn btn-secondary" onClick={() => setIsEditingProfile(false)}>
                                                Cancel
                                            </button>
                                            <button type="submit" className="btn btn-primary" disabled={profileSaving}>
                                                {profileSaving ? <><Loader size={16} className="spin" /> Saving...</> : <><Save size={16} /> Save Changes</>}
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="profile-details-display">
                                        <div className="profile-info-grid">
                                            <div className="info-item-box">
                                                <span className="info-label">Full Name</span>
                                                <strong className="info-value">{user.name || 'Not specified'}</strong>
                                            </div>
                                            <div className="info-item-box">
                                                <span className="info-label">Email Address</span>
                                                <strong className="info-value">{user.email}</strong>
                                            </div>
                                            <div className="info-item-box">
                                                <span className="info-label">Phone Contact</span>
                                                <strong className="info-value">{user.phone || 'No phone added'}</strong>
                                            </div>
                                            <div className="info-item-box">
                                                <span className="info-label">Account Role</span>
                                                <strong className="info-value text-primary">{user.role || 'Customer'}</strong>
                                            </div>
                                        </div>

                                        <div className="account-perks-box">
                                            <div className="perks-badge-icon">
                                                <Sparkles size={20} color="#10b981" />
                                            </div>
                                            <div>
                                                <h4>Pandey Store Preferred Customer</h4>
                                                <p>Enjoy fast 15–30 min doorstep deliveries across Haldwani &amp; instant print processing.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── TAB 2: Orders ── */}
                        {activeTab === 'orders' && (
                            <div className="orders-tab-content card">
                                <div className="pane-section-header">
                                    <div>
                                        <h2 className="pane-title">Order History &amp; Tracking</h2>
                                        <p className="pane-subtitle">Monitor current shipments, receipts, and order statuses</p>
                                    </div>
                                    <Link to="/" className="btn btn-primary btn-sm">
                                        <ShoppingBag size={15} /> Shop Groceries
                                    </Link>
                                </div>

                                {/* Order Status Filter Pills */}
                                <div className="orders-filter-bar">
                                    <button 
                                        className={`order-filter-pill ${orderFilter === 'all' ? 'active' : ''}`}
                                        onClick={() => setOrderFilter('all')}
                                    >
                                        All Orders ({myOrders.length})
                                    </button>
                                    <button 
                                        className={`order-filter-pill ${orderFilter === 'active' ? 'active' : ''}`}
                                        onClick={() => setOrderFilter('active')}
                                    >
                                        Active &amp; In-Transit
                                    </button>
                                    <button 
                                        className={`order-filter-pill ${orderFilter === 'delivered' ? 'active' : ''}`}
                                        onClick={() => setOrderFilter('delivered')}
                                    >
                                        Delivered
                                    </button>
                                </div>

                                {loadingOrders ? (
                                    <div className="orders-loading-box">
                                        <Loader size={32} className="spin" color="var(--primary)" />
                                        <p>Loading your orders...</p>
                                    </div>
                                ) : filteredOrders.length === 0 ? (
                                    <div className="account-empty-state">
                                        <ShoppingBag size={48} color="#cbd5e1" />
                                        <h3>No orders found</h3>
                                        <p>You haven't placed any orders in this category yet.</p>
                                        <Link to="/" className="btn btn-primary mt-2">Browse Catalog</Link>
                                    </div>
                                ) : (
                                    <div className="orders-feed-list">
                                        {filteredOrders.map((order) => (
                                            <div key={order.id} className="customer-order-card">
                                                <div className="order-card-top">
                                                    <div className="order-main-info">
                                                        <span className="order-id-num">Order #{order.id}</span>
                                                        <span className="order-time-stamp">
                                                            <Clock size={12} /> {order.date ? new Date(order.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'}
                                                        </span>
                                                    </div>
                                                    <span 
                                                        className="order-status-pill"
                                                        style={{ 
                                                            background: `${statusColors[order.status] || '#10b981'}18`, 
                                                            color: statusColors[order.status] || '#10b981' 
                                                        }}
                                                    >
                                                        {statusLabels[order.status] || order.status}
                                                    </span>
                                                </div>

                                                {/* Items summary */}
                                                <div className="order-items-preview-box">
                                                    {(order.items || []).map((item, idx) => (
                                                        <div key={idx} className="order-item-snippet">
                                                            <span className="item-snippet-name">{item.name}</span>
                                                            <span className="item-snippet-qty">×{item.qty || item.quantity}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="order-card-bottom">
                                                    <div className="order-price-info">
                                                        <span className="price-label">Total Amount:</span>
                                                        <strong className="price-val">₹{order.total}</strong>
                                                        <span className="pay-mode-pill">{order.payment || 'COD'}</span>
                                                    </div>

                                                    <div className="order-card-actions">
                                                        <Link 
                                                            to={`/track/${order.id}`} 
                                                            className="btn btn-secondary btn-sm track-btn"
                                                        >
                                                            <Truck size={14} /> Live Track
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── TAB 3: Addresses ── */}
                        {activeTab === 'addresses' && (
                            <div className="addresses-tab-content card">
                                <div className="pane-section-header">
                                    <div>
                                        <h2 className="pane-title">Saved Delivery Addresses</h2>
                                        <p className="pane-subtitle">Manage locations for instant 1-tap checkout</p>
                                    </div>
                                    <button className="btn btn-primary btn-sm" onClick={() => { setEditingAddressId(null); setShowAddressModal(true); }}>
                                        <Plus size={15} /> Add New Address
                                    </button>
                                </div>

                                <div className="addresses-cards-grid">
                                    {addresses.map((addr) => (
                                        <div key={addr.id} className={`address-item-card ${addr.isDefault ? 'default-addr' : ''}`}>
                                            <div className="addr-card-top">
                                                <span className="addr-type-pill">
                                                    {addr.label === 'Home' ? <Home size={12} /> : <Briefcase size={12} />} {addr.label}
                                                </span>
                                                {addr.isDefault && <span className="default-pill">Default</span>}
                                            </div>

                                            <div className="addr-body">
                                                <strong>{addr.recipientName || user.name}</strong>
                                                <p className="addr-line">{addr.address}</p>
                                                <span className="addr-city">{addr.city || 'Haldwani'} - {addr.pin || '263139'}</span>
                                                {addr.phone && <span className="addr-phone">Phone: {addr.phone}</span>}
                                            </div>

                                            <div className="addr-actions">
                                                <button className="btn-link btn-sm" onClick={() => editAddress(addr)}>
                                                    <Edit2 size={13} /> Edit
                                                </button>
                                                <button className="btn-link btn-sm text-danger" onClick={() => deleteAddress(addr.id)}>
                                                    <Trash2 size={13} /> Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="add-new-address-placeholder" onClick={() => { setEditingAddressId(null); setShowAddressModal(true); }}>
                                        <div className="plus-icon-box">
                                            <Plus size={24} />
                                        </div>
                                        <strong>Add New Address</strong>
                                        <span>Add home, office, or family location in Haldwani</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── TAB 4: Security ── */}
                        {activeTab === 'security' && (
                            <div className="security-tab-content card">
                                <div className="pane-section-header">
                                    <div>
                                        <h2 className="pane-title">Security &amp; Connected Logins</h2>
                                        <p className="pane-subtitle">Manage account security and password</p>
                                    </div>
                                </div>

                                <div className="security-sections-list">
                                    <div className="security-item-card">
                                        <div className="sec-icon-circle">
                                            <KeyRound size={20} color="var(--primary)" />
                                        </div>
                                        <div className="sec-item-meta">
                                            <h4>Account Password</h4>
                                            <p>Ensure your account uses a secure password with at least 6 characters.</p>
                                        </div>
                                        <button className="btn btn-secondary btn-sm" onClick={() => alert('Password reset link sent to your registered email')}>
                                            Change Password
                                        </button>
                                    </div>

                                    <div className="security-item-card">
                                        <div className="sec-icon-circle">
                                            <CheckCircle2 size={20} color="#10b981" />
                                        </div>
                                        <div className="sec-item-meta">
                                            <h4>Google Authentication</h4>
                                            <p>Instant 1-tap sign-in is active for your email ({user.email}).</p>
                                        </div>
                                        <span className="active-auth-tag">Connected</span>
                                    </div>

                                    <div className="security-item-card danger-card">
                                        <div className="sec-icon-circle danger-icon">
                                            <LogOut size={20} color="#dc2626" />
                                        </div>
                                        <div className="sec-item-meta">
                                            <h4>Sign Out of Device</h4>
                                            <p>End your active session on this phone or browser.</p>
                                        </div>
                                        <button className="btn btn-outline text-danger btn-sm" onClick={logout}>
                                            Sign Out
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ─── Add / Edit Address Modal ─── */}
            {showAddressModal && (
                <div className="modal-overlay animate-fade-in" onClick={() => setShowAddressModal(false)}>
                    <div className="modal-card card" onClick={e => e.stopPropagation()}>
                        <div className="modal-card-header">
                            <div className="modal-title-wrap">
                                <MapPin size={20} color="var(--primary)" />
                                <h3>{editingAddressId ? 'Edit Address' : 'Add Delivery Address'}</h3>
                            </div>
                            <button className="btn-icon btn-ghost" onClick={() => setShowAddressModal(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveAddress} className="modal-form-body">
                            <div className="modal-form-grid">
                                <div className="m-form-group">
                                    <label>Address Label</label>
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
                                    <label>Recipient Name</label>
                                    <input 
                                        type="text" 
                                        className="input" 
                                        placeholder="Full Name" 
                                        value={addressForm.recipientName} 
                                        onChange={e => setAddressForm({ ...addressForm, recipientName: e.target.value })} 
                                        required 
                                    />
                                </div>

                                <div className="m-form-group full-width">
                                    <label>Full Address (House / Flat / Street / Landmark)</label>
                                    <textarea 
                                        className="input" 
                                        rows={2} 
                                        placeholder="e.g. House #14, Near Durga Mandir, Kusumkhera" 
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
                                    <Save size={16} /> Save Address
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
