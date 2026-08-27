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
    Check,
    Printer,
    Tag,
    RotateCcw,
    Copy,
    AlertCircle,
    Wallet,
    CreditCard,
    QrCode,
    Receipt,
    FileText,
    IndianRupee,
    MessageSquare
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ordersApi, userApi, authApi } from '../../lib/api';
import { statusLabels, statusColors } from '../../data/orders';
import './AccountPage.css';

const tabs = [
    { id: 'profile', label: 'Profile', fullLabel: 'Personal Profile', icon: User },
    { id: 'khata', label: 'Khata', fullLabel: 'Khata & Passbook', icon: Wallet },
    { id: 'orders', label: 'Orders', fullLabel: 'My Orders', icon: Package },
    { id: 'addresses', label: 'Addresses', fullLabel: 'Saved Locations', icon: MapPin },
    { id: 'security', label: 'Security', fullLabel: 'Security & Login', icon: KeyRound },
];

export default function AccountPage() {
    const { user, isLoggedIn, logout, updateUser } = useAuth();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('profile');
    const [myOrders, setMyOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [orderFilter, setOrderFilter] = useState('all');
    const [khataFilter, setKhataFilter] = useState('all'); // 'all' | 'due' | 'paid'
    const [showUpiModal, setShowUpiModal] = useState(false);
    const [copiedUpi, setCopiedUpi] = useState(false);

    // Profile Edit State
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [profileForm, setProfileForm] = useState({
        name: '',
        phone: '',
        address: ''
    });
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileMessage, setProfileMessage] = useState(null);
    const [copiedEmail, setCopiedEmail] = useState(false);

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

    // Password Security Modal State
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [pwModalMode, setPwModalMode] = useState('change'); // 'change' | 'reset-code'
    const [pwCurrent, setPwCurrent] = useState('');
    const [pwNew, setPwNew] = useState('');
    const [pwConfirm, setPwConfirm] = useState('');
    const [pwResetCode, setPwResetCode] = useState('');
    const [pwLoading, setPwLoading] = useState(false);
    const [pwError, setPwError] = useState('');
    const [pwSuccess, setPwSuccess] = useState('');

    const openPasswordModal = (mode = 'change') => {
        setPwModalMode(mode);
        setPwCurrent('');
        setPwNew('');
        setPwConfirm('');
        setPwResetCode('');
        setPwError('');
        setPwSuccess('');
        setShowPasswordModal(true);
        if (mode === 'reset-code') {
            handleSendResetEmail();
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (pwNew.length < 6) { setPwError('New password must be at least 6 characters'); return; }
        if (pwNew !== pwConfirm) { setPwError('New passwords do not match'); return; }
        setPwError('');
        setPwLoading(true);
        try {
            await userApi.changePassword({ currentPassword: pwCurrent, newPassword: pwNew });
            setPwSuccess('Password updated successfully! A security alert was sent to your email.');
            setTimeout(() => setShowPasswordModal(false), 2200);
        } catch (err) {
            setPwError(err.message || 'Failed to update password. Current password may be incorrect.');
        } finally {
            setPwLoading(false);
        }
    };

    const handleSendResetEmail = async () => {
        if (!user?.email) {
            setPwError('No email address found for this user account.');
            return;
        }
        setPwError('');
        setPwLoading(true);
        try {
            const res = await authApi.forgotPassword(user.email);
            setPwSuccess(res?.message || `6-digit recovery code sent to ${user.email}`);
            setPwModalMode('reset-code');
        } catch (err) {
            setPwError(err.message || 'Failed to send recovery email.');
        } finally {
            setPwLoading(false);
        }
    };

    const handleResetWithCode = async (e) => {
        e.preventDefault();
        if (!pwResetCode || !pwNew) { setPwError('Please fill all fields'); return; }
        if (pwNew.length < 6) { setPwError('New password must be at least 6 characters'); return; }
        if (pwNew !== pwConfirm) { setPwError('New passwords do not match'); return; }
        setPwError('');
        setPwLoading(true);
        try {
            await authApi.resetPassword(user.email, pwResetCode, pwNew);
            setPwSuccess('Password reset successfully! Account secured.');
            setTimeout(() => setShowPasswordModal(false), 2200);
        } catch (err) {
            setPwError(err.message || 'Failed to reset password. Check your recovery code.');
        } finally {
            setPwLoading(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setCopiedEmail(true);
        setTimeout(() => setCopiedEmail(false), 2000);
    };

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

    // Fetch user orders & Khata history on mount
    const fetchMyOrders = useCallback(async () => {
        setLoadingOrders(true);
        try {
            const data = await ordersApi.getMyOrders();
            setMyOrders(data?.orders || []);
        } catch {
            setMyOrders([]);
        } finally {
            setLoadingOrders(false);
        }
    }, []);

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

    const activeOrdersCount = myOrders.filter(o => ['new', 'packing', 'packed', 'dispatched'].includes(o.status)).length;
    
    const totalSpent = myOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const totalPaid = myOrders.reduce((sum, o) => sum + (Number(o.paidAmount) || (o.paymentStatus === 'PAID' ? Number(o.total) : 0)), 0);
    const totalDue = myOrders.reduce((sum, o) => sum + (Number(o.dueAmount) || (o.paymentStatus === 'PENDING' ? Number(o.total) : 0)), 0);
    const dueOrdersCount = myOrders.filter(o => o.dueAmount > 0 || o.paymentStatus === 'PENDING' || o.paymentStatus === 'PARTIAL').length;

    const filteredOrders = myOrders.filter(o => {
        if (orderFilter === 'all') return true;
        if (orderFilter === 'active') return ['new', 'packing', 'packed', 'dispatched'].includes(o.status);
        if (orderFilter === 'delivered') return o.status === 'delivered';
        return true;
    });

    const filteredKhataOrders = myOrders.filter(o => {
        if (khataFilter === 'all') return true;
        if (khataFilter === 'due') return o.dueAmount > 0 || o.paymentStatus === 'PENDING' || o.paymentStatus === 'PARTIAL';
        if (khataFilter === 'paid') return o.paymentStatus === 'PAID';
        return true;
    });

    const copyUpiId = () => {
        navigator.clipboard.writeText('7906966085@upi');
        setCopiedUpi(true);
        setTimeout(() => setCopiedUpi(false), 2000);
    };

    return (
        <div className="account-page-root">
            <div className="account-container-wrap">
                
                {/* ─── 1. Header Profile Banner ─── */}
                <div className="account-hero-card">
                    <div className="hero-user-details">
                        <div className="hero-avatar-circle">
                            {user.avatar ? (
                                <img src={user.avatar} alt={user.name} />
                            ) : (
                                <span>{user.name?.charAt(0) || user.email?.charAt(0) || 'U'}</span>
                            )}
                            <div className="avatar-online-dot" />
                        </div>
                        <div className="hero-meta">
                            <div className="hero-name-row">
                                <h2>{user.name || 'Store Customer'}</h2>
                                <span className={`account-role-badge role-${user.role?.toLowerCase()}`}>
                                    <ShieldCheck size={12} /> {user.role || 'CUSTOMER'}
                                </span>
                            </div>
                            <div className="hero-contact-row">
                                <span className="hero-email-chip" onClick={() => copyToClipboard(user.email)} title="Click to copy email">
                                    <Mail size={12} /> {user.email}
                                    <Copy size={10} className="copy-icon" />
                                </span>
                                {user.phone && <span><Phone size={12} /> {user.phone}</span>}
                                <span className="location-chip"><MapPin size={12} /> Haldwani</span>
                            </div>
                        </div>
                    </div>

                    <div className="hero-quick-stats">
                        <div className="hero-stat-item" onClick={() => setActiveTab('orders')}>
                            <div className="stat-num-row">
                                <span className="stat-num">{myOrders.length}</span>
                                {activeOrdersCount > 0 && <span className="stat-live-pulse">{activeOrdersCount} live</span>}
                            </div>
                            <span className="stat-txt">Orders</span>
                        </div>
                        <div className={`hero-stat-item ${totalDue > 0 ? 'stat-has-due' : 'stat-clear'}`} onClick={() => setActiveTab('khata')}>
                            <div className="stat-num-row">
                                <span className="stat-num">{totalDue > 0 ? `₹${Math.round(totalDue)}` : '₹0'}</span>
                            </div>
                            <span className="stat-txt">{totalDue > 0 ? 'Khata Left' : 'Khata Clear'}</span>
                        </div>
                        <div className="hero-stat-item" onClick={() => setActiveTab('addresses')}>
                            <span className="stat-num">{addresses.length}</span>
                            <span className="stat-txt">Addresses</span>
                        </div>
                        <div className="hero-stat-item" onClick={() => navigate('/print-services')}>
                            <span className="stat-icon-num"><Printer size={16} /></span>
                            <span className="stat-txt">Print Hub</span>
                        </div>
                    </div>
                </div>

                {/* ─── 2. Segmented Navigation Tabs Bar ─── */}
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
                                    {tab.id === 'orders' && activeOrdersCount > 0 && (
                                        <span className="tab-pill-badge">{activeOrdersCount}</span>
                                    )}
                                    {tab.id === 'khata' && totalDue > 0 && (
                                        <span className="tab-pill-badge due-badge">₹{Math.round(totalDue)}</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ─── 3. Main Content Panels ─── */}
                <div className="account-panel-container">
                    
                    {/* ── TAB 1: Profile ── */}
                    {activeTab === 'profile' && (
                        <div className="account-card-panel animate-fade-in">
                            <div className="panel-header-row">
                                <div>
                                    <h2 className="panel-heading">Personal Profile</h2>
                                    <p className="panel-subheading">Manage your name, phone number, and store preferences</p>
                                </div>
                                {!isEditingProfile && (
                                    <button className="btn btn-secondary btn-sm edit-profile-btn" onClick={() => setIsEditingProfile(true)}>
                                        <Edit2 size={14} /> Edit Profile
                                    </button>
                                )}
                            </div>

                            {profileMessage && (
                                <div className={`profile-status-alert ${profileMessage.type} animate-fade-in`}>
                                    <CheckCircle2 size={16} />
                                    <span>{profileMessage.text}</span>
                                </div>
                            )}

                            {copiedEmail && (
                                <div className="profile-status-alert success animate-fade-in">
                                    <Check size={16} />
                                    <span>Email copied to clipboard!</span>
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
                                                placeholder="Enter full name"
                                                required 
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Email Address (Verified)</label>
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
                                            <label>Service Area &amp; Hub</label>
                                            <input 
                                                type="text" 
                                                className="input disabled-input" 
                                                value="Haldwani, Uttarakhand (263139)" 
                                                disabled 
                                            />
                                        </div>
                                    </div>

                                    <div className="profile-action-buttons">
                                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsEditingProfile(false)}>
                                            Cancel
                                        </button>
                                        <button type="submit" className="btn btn-primary btn-sm" disabled={profileSaving}>
                                            {profileSaving ? <><Loader size={14} className="spin" /> Saving...</> : <><Save size={14} /> Save Profile</>}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="profile-view-wrapper">
                                    <div className="profile-details-list">
                                        <div className="profile-detail-row">
                                            <span className="detail-title"><User size={14} /> Full Name</span>
                                            <span className="detail-text">{user.name || 'Not specified'}</span>
                                        </div>
                                        <div className="profile-detail-row">
                                            <span className="detail-title"><Mail size={14} /> Email Address</span>
                                            <span className="detail-text email-text">
                                                {user.email}
                                                <span className="verified-pill"><Check size={10} /> Verified</span>
                                            </span>
                                        </div>
                                        <div className="profile-detail-row">
                                            <span className="detail-title"><Phone size={14} /> Phone Number</span>
                                            <span className="detail-text">{user.phone || 'No phone added'}</span>
                                        </div>
                                        <div className="profile-detail-row">
                                            <span className="detail-title"><Shield size={14} /> Account Role</span>
                                            <span className="detail-text">
                                                <span className="role-tag-pill">{user.role || 'CUSTOMER'}</span>
                                            </span>
                                        </div>
                                        <div className="profile-detail-row">
                                            <span className="detail-title"><MapPin size={14} /> Store Hub</span>
                                            <span className="detail-text">Kusumkhera, Haldwani, Uttarakhand</span>
                                        </div>
                                    </div>

                                    {/* Store Perks & Quick Shortcuts */}
                                    <div className="account-shortcuts-grid">
                                        <div className="shortcut-card" onClick={() => setActiveTab('orders')}>
                                            <div className="shortcut-icon green-icon">
                                                <Truck size={18} />
                                            </div>
                                            <div className="shortcut-text">
                                                <h4>15–30 Min Fast Delivery</h4>
                                                <p>Fresh groceries delivered right to your doorstep.</p>
                                            </div>
                                            <ChevronRight size={16} className="chevron" />
                                        </div>

                                        <div className="shortcut-card" onClick={() => navigate('/print-services')}>
                                            <div className="shortcut-icon purple-icon">
                                                <Printer size={18} />
                                            </div>
                                            <div className="shortcut-text">
                                                <h4>Print &amp; Xerox Hub</h4>
                                                <p>300 DPI high-speed color &amp; B/W printing.</p>
                                            </div>
                                            <ChevronRight size={16} className="chevron" />
                                        </div>

                                        <div className="shortcut-card" onClick={() => navigate('/offers')}>
                                            <div className="shortcut-icon amber-icon">
                                                <Tag size={18} />
                                            </div>
                                            <div className="shortcut-text">
                                                <h4>Special Store Offers</h4>
                                                <p>Save up to 30% on daily essentials &amp; bundles.</p>
                                            </div>
                                            <ChevronRight size={16} className="chevron" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── TAB 2: Khata & Passbook (Transactions Ledger) ── */}
                    {activeTab === 'khata' && (
                        <div className="account-card-panel animate-fade-in">
                            <div className="panel-header-row">
                                <div>
                                    <h2 className="panel-heading">Khata Passbook &amp; Balance</h2>
                                    <p className="panel-subheading">Track your in-store counter &amp; online purchase ledger and clear pending balance</p>
                                </div>
                                <div className="khata-header-action-group">
                                    {totalDue > 0 && (
                                        <button className="btn btn-primary btn-sm pay-upi-pulse-btn" onClick={() => setShowUpiModal(true)}>
                                            <QrCode size={14} /> Pay Due via UPI
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* ── Hero Balance Card ── */}
                            <div className={`khata-balance-hero-card ${totalDue > 0 ? 'has-due' : 'all-clear'}`}>
                                <div className="khata-hero-left">
                                    <span className="khata-hero-tag">
                                        {totalDue > 0 ? '🔴 Pending Amount to be Paid' : '🟢 Khata Status'}
                                    </span>
                                    <h3 className="khata-hero-amount">
                                        ₹{totalDue > 0 ? totalDue.toFixed(2) : '0.00'}
                                    </h3>
                                    <p className="khata-hero-sub">
                                        {totalDue > 0 
                                            ? 'You have a pending store credit balance. You can pay anytime in-store or online via UPI.'
                                            : '✨ Wonderful! All your purchases and store bills are fully settled.'}
                                    </p>
                                </div>

                                <div className="khata-hero-breakdown">
                                    <div className="khata-stat-pill">
                                        <span className="lbl">Total Purchases</span>
                                        <strong className="val">₹{totalSpent.toFixed(2)}</strong>
                                    </div>
                                    <div className="khata-stat-pill">
                                        <span className="lbl">Total Paid (Cash/UPI)</span>
                                        <strong className="val text-success">₹{totalPaid.toFixed(2)}</strong>
                                    </div>
                                </div>
                            </div>

                            {/* ── Passbook Filter Chips ── */}
                            <div className="khata-filter-chips">
                                <button 
                                    className={`order-chip ${khataFilter === 'all' ? 'active' : ''}`}
                                    onClick={() => setKhataFilter('all')}
                                >
                                    All Transactions ({myOrders.length})
                                </button>
                                <button 
                                    className={`order-chip due ${khataFilter === 'due' ? 'active' : ''}`}
                                    onClick={() => setKhataFilter('due')}
                                >
                                    🔴 Due Left ({dueOrdersCount})
                                </button>
                                <button 
                                    className={`order-chip paid ${khataFilter === 'paid' ? 'active' : ''}`}
                                    onClick={() => setKhataFilter('paid')}
                                >
                                    🟢 Settled ({myOrders.filter(o => o.paymentStatus === 'PAID').length})
                                </button>
                            </div>

                            {/* ── Passbook Transactions Feed ── */}
                            {loadingOrders ? (
                                <div className="panel-loading-state">
                                    <Loader size={28} className="spin" color="var(--primary)" />
                                    <p>Loading your Khata passbook ledger...</p>
                                </div>
                            ) : filteredKhataOrders.length === 0 ? (
                                <div className="panel-empty-state">
                                    <div className="empty-icon-bubble">
                                        <Wallet size={36} color="var(--primary)" />
                                    </div>
                                    <h3>No transactions found</h3>
                                    <p>Your store counter bills and payments will appear here automatically.</p>
                                </div>
                            ) : (
                                <div className="khata-transactions-feed">
                                    {filteredKhataOrders.map((order) => {
                                        const isDue = order.dueAmount > 0 || order.paymentStatus === 'PENDING' || order.paymentStatus === 'PARTIAL';
                                        return (
                                            <div key={order.id} className={`khata-entry-card ${isDue ? 'is-due' : 'is-paid'}`}>
                                                <div className="khata-entry-left">
                                                    <div className={`khata-entry-avatar ${isDue ? 'due' : 'paid'}`}>
                                                        {isDue ? <Receipt size={18} /> : <CheckCircle2 size={18} />}
                                                    </div>
                                                    <div className="khata-entry-info">
                                                        <div className="entry-title-row">
                                                            <strong>#{order.orderNumber || order.id}</strong>
                                                            <span className="entry-fulfillment-badge">
                                                                {order.deliveryType === 'home' ? '🚚 Home Delivery' : '🏪 In-Store Purchase'}
                                                            </span>
                                                        </div>
                                                        <div className="entry-items-preview">
                                                            {order.items?.map((it, idx) => (
                                                                <span key={idx} className="entry-item-chip">
                                                                    {it.name} {it.qty > 1 ? `×${it.qty}` : ''}
                                                                </span>
                                                            ))}
                                                        </div>
                                                        <span className="entry-date-txt"><Clock size={11} /> {order.date} • {order.timeSlot}</span>
                                                    </div>
                                                </div>

                                                <div className="khata-entry-right">
                                                    <div className="entry-amounts">
                                                        <span className="entry-bill-total">₹{Number(order.total).toFixed(2)}</span>
                                                        <span className={`entry-payment-badge ${order.paymentStatus === 'PAID' ? 'paid' : order.paymentStatus === 'PARTIAL' ? 'partial' : 'due'}`}>
                                                            {order.paymentStatus === 'PAID' ? '🟢 Paid in Full' : order.paymentStatus === 'PARTIAL' ? `🟠 Due: ₹${order.dueAmount}` : `🔴 Left: ₹${order.dueAmount || order.total}`}
                                                        </span>
                                                    </div>
                                                    <Link to={`/track/${order.id}`} className="btn-link entry-view-link">
                                                        View Bill <ArrowRight size={13} />
                                                    </Link>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── TAB 3: Orders ── */}
                    {activeTab === 'orders' && (
                        <div className="account-card-panel animate-fade-in">
                            <div className="panel-header-row">
                                <div>
                                    <h2 className="panel-heading">My Orders &amp; Tracking</h2>
                                    <p className="panel-subheading">View order status, receipts, and live delivery updates</p>
                                </div>
                                <Link to="/" className="btn btn-primary btn-sm">
                                    <ShoppingBag size={14} /> Shop Now
                                </Link>
                            </div>

                            {/* Filter Chips */}
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
                                    Active ({activeOrdersCount})
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
                                    <p>Loading your orders...</p>
                                </div>
                            ) : filteredOrders.length === 0 ? (
                                <div className="panel-empty-state">
                                    <div className="empty-icon-bubble">
                                        <ShoppingBag size={36} color="var(--primary)" />
                                    </div>
                                    <h3>No orders found</h3>
                                    <p>Your grocery and print orders will appear here once placed.</p>
                                    <Link to="/" className="btn btn-primary btn-sm mt-3">
                                        Start Shopping Groceries
                                    </Link>
                                </div>
                            ) : (
                                <div className="orders-cards-stream">
                                    {filteredOrders.map((order) => {
                                        const isLive = ['new', 'packing', 'packed', 'dispatched'].includes(order.status);
                                        return (
                                            <div key={order.id} className="order-summary-card">
                                                <div className="order-summary-top">
                                                    <div className="order-num-block">
                                                        <span className="order-tag-id">#{order.orderNumber || order.id}</span>
                                                        <span className="order-timestamp">
                                                            <Clock size={12} /> {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'}
                                                        </span>
                                                    </div>
                                                    <span 
                                                        className={`order-status-pill status-${order.status}`}
                                                        style={{ 
                                                            background: `${statusColors[order.status] || '#10b981'}15`, 
                                                            color: statusColors[order.status] || '#10b981',
                                                            borderColor: `${statusColors[order.status] || '#10b981'}40`
                                                        }}
                                                    >
                                                        {isLive && <span className="pulse-dot" style={{ background: statusColors[order.status] || '#10b981' }} />}
                                                        {statusLabels[order.status] || order.status}
                                                    </span>
                                                </div>

                                                <div className="order-item-tags-wrap">
                                                    {(order.items || []).map((item, idx) => (
                                                        <span key={idx} className="order-item-pill">
                                                            {item.name} <strong>×{item.qty || item.quantity || 1}</strong>
                                                        </span>
                                                    ))}
                                                </div>

                                                <div className="order-summary-bottom">
                                                    <div className="order-amount-box">
                                                        <span className="amt-label">Total Amount:</span>
                                                        <strong className="amt-val">₹{(order.total || 0).toFixed(2)}</strong>
                                                        <span className="order-pay-type">{order.paymentMode || order.payment || 'COD'}</span>
                                                    </div>

                                                    <Link 
                                                        to={`/track/${order.orderNumber || order.id}`} 
                                                        className="btn btn-secondary btn-sm order-track-link"
                                                    >
                                                        <Truck size={14} /> Live Track
                                                    </Link>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── TAB 3: Addresses ── */}
                    {activeTab === 'addresses' && (
                        <div className="account-card-panel animate-fade-in">
                            <div className="panel-header-row">
                                <div>
                                    <h2 className="panel-heading">Saved Delivery Locations</h2>
                                    <p className="panel-subheading">Manage home, office, and family delivery addresses in Haldwani</p>
                                </div>
                                <button className="btn btn-primary btn-sm" onClick={() => { setEditingAddressId(null); setShowAddressModal(true); }}>
                                    <Plus size={14} /> Add Location
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
                                            {addr.phone && <span className="phone-line"><Phone size={11} /> {addr.phone}</span>}
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
                        <div className="account-card-panel animate-fade-in">
                            <div className="panel-header-row">
                                <div>
                                    <h2 className="panel-heading">Security &amp; Connected Accounts</h2>
                                    <p className="panel-subheading">Password credentials, Google Authentication, and Active Sessions</p>
                                </div>
                            </div>

                            <div className="security-cards-stack">
                                <div className="security-feature-card">
                                    <div className="sec-feature-icon">
                                        <KeyRound size={18} color="var(--primary)" />
                                    </div>
                                    <div className="sec-feature-text">
                                        <h4>Account Password</h4>
                                        <p>Update your password or reset it via secure email recovery code.</p>
                                    </div>
                                    <div className="sec-btn-row">
                                        <button className="btn btn-secondary btn-sm" onClick={() => openPasswordModal('change')}>
                                            Change Password
                                        </button>
                                        <button className="btn btn-outline btn-sm" onClick={() => { openPasswordModal('reset-code'); handleSendResetEmail(); }}>
                                            Reset via Email
                                        </button>
                                    </div>
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
                                        <p>Safely log out of Pandey Grocery Store on this device.</p>
                                    </div>
                                    <button className="btn btn-outline btn-sm text-danger" onClick={logout}>
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ─── 4. Mobile & Desktop Bottom Quick Log Out ─── */}
                <div className="account-bottom-logout-wrap">
                    <button className="mobile-logout-btn" onClick={logout} title="Sign out of your account">
                        <LogOut size={16} /> Log Out Account ({user.email})
                    </button>
                </div>
            </div>

            {/* ─── Password Change & Email Reset Modal ─── */}
            {showPasswordModal && (
                <div className="modal-overlay animate-fade-in" onClick={() => setShowPasswordModal(false)}>
                    <div className="account-modal-card" onClick={e => e.stopPropagation()}>
                        <div className="modal-card-header">
                            <div className="modal-title-wrap">
                                <KeyRound size={18} color="var(--primary)" />
                                <h3>{pwModalMode === 'change' ? 'Update Password' : 'Reset Password via Email Code'}</h3>
                            </div>
                            <button className="btn-icon btn-ghost" onClick={() => setShowPasswordModal(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        {pwError && (
                            <div className="modal-alert-box error animate-fade-in">
                                <AlertCircle size={15} />
                                <span>{pwError}</span>
                            </div>
                        )}

                        {pwSuccess && (
                            <div className="modal-alert-box success animate-fade-in">
                                <CheckCircle2 size={15} />
                                <span>{pwSuccess}</span>
                            </div>
                        )}

                        {pwModalMode === 'change' ? (
                            <form onSubmit={handleChangePassword} className="modal-form-body">
                                <div className="modal-inputs-stack">
                                    <div className="m-form-group">
                                        <label>Current Password</label>
                                        <input 
                                            type="password" 
                                            className="input" 
                                            placeholder="Enter current password" 
                                            value={pwCurrent} 
                                            onChange={e => setPwCurrent(e.target.value)} 
                                            required 
                                        />
                                    </div>

                                    <div className="m-form-group">
                                        <label>New Password (min 6 chars)</label>
                                        <input 
                                            type="password" 
                                            className="input" 
                                            placeholder="Enter new password" 
                                            value={pwNew} 
                                            onChange={e => setPwNew(e.target.value)} 
                                            required 
                                            minLength={6}
                                        />
                                    </div>

                                    <div className="m-form-group">
                                        <label>Confirm New Password</label>
                                        <input 
                                            type="password" 
                                            className="input" 
                                            placeholder="Confirm new password" 
                                            value={pwConfirm} 
                                            onChange={e => setPwConfirm(e.target.value)} 
                                            required 
                                            minLength={6}
                                        />
                                    </div>
                                </div>

                                <div className="modal-card-footer">
                                    <button 
                                        type="button" 
                                        className="btn btn-ghost btn-sm" 
                                        onClick={handleSendResetEmail}
                                        style={{ fontSize: '0.8rem', color: 'var(--primary)' }}
                                    >
                                        Forgot Password? Use Email Code
                                    </button>
                                    <button type="submit" className="btn btn-primary btn-sm" disabled={pwLoading}>
                                        {pwLoading ? 'Saving...' : 'Update Password'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleResetWithCode} className="modal-form-body">
                                <div className="modal-inputs-stack">
                                    <p className="modal-instruct-txt">
                                        Enter the 6-digit recovery code sent to <strong>{user.email}</strong> and create a new password.
                                    </p>

                                    <div className="m-form-group">
                                        <label>6-Digit Recovery Code</label>
                                        <input 
                                            type="text" 
                                            className="input otp-input-centered" 
                                            placeholder="• • • • • •" 
                                            value={pwResetCode} 
                                            onChange={e => setPwResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                                            maxLength={6}
                                            required 
                                            autoFocus
                                        />
                                    </div>

                                    <div className="m-form-group">
                                        <label>New Password (min 6 chars)</label>
                                        <input 
                                            type="password" 
                                            className="input" 
                                            placeholder="Enter new password" 
                                            value={pwNew} 
                                            onChange={e => setPwNew(e.target.value)} 
                                            required 
                                            minLength={6}
                                        />
                                    </div>

                                    <div className="m-form-group">
                                        <label>Confirm New Password</label>
                                        <input 
                                            type="password" 
                                            className="input" 
                                            placeholder="Confirm new password" 
                                            value={pwConfirm} 
                                            onChange={e => setPwConfirm(e.target.value)} 
                                            required 
                                            minLength={6}
                                        />
                                    </div>
                                </div>

                                <div className="modal-card-footer">
                                    <button 
                                        type="button" 
                                        className="btn btn-ghost btn-sm" 
                                        onClick={handleSendResetEmail}
                                        disabled={pwLoading}
                                        style={{ fontSize: '0.8rem' }}
                                    >
                                        Resend Code
                                    </button>
                                    <button type="submit" className="btn btn-primary btn-sm" disabled={pwLoading || pwResetCode.length !== 6}>
                                        {pwLoading ? 'Resetting...' : 'Reset & Secure Account'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* ─── Add / Edit Address Modal ─── */}
            {showAddressModal && (
                <div className="modal-overlay animate-fade-in" onClick={() => setShowAddressModal(false)}>
                    <div className="account-modal-card" onClick={e => e.stopPropagation()}>
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
                            <div className="modal-inputs-grid">
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
                                    <label>Recipient Name</label>
                                    <input 
                                        type="text" 
                                        className="input" 
                                        placeholder="e.g. Anju Pandey" 
                                        value={addressForm.recipientName} 
                                        onChange={e => setAddressForm({ ...addressForm, recipientName: e.target.value })} 
                                        required 
                                    />
                                </div>

                                <div className="m-form-group full-span">
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

                                <div className="m-form-group full-span">
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
                                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAddressModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary btn-sm">
                                    <Save size={14} /> Save Address
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ─── UPI Khata Payment Modal ─── */}
            {showUpiModal && (
                <div className="modal-overlay animate-fade-in" onClick={() => setShowUpiModal(false)}>
                    <div className="account-modal-card upi-pay-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-card-header">
                            <div className="modal-title-wrap">
                                <QrCode size={20} color="var(--primary)" />
                                <div>
                                    <h3>Pay Store Khata via UPI</h3>
                                    <p>Instant direct settlement to Pandey Grocery Store</p>
                                </div>
                            </div>
                            <button className="btn-icon btn-ghost" onClick={() => setShowUpiModal(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="upi-modal-body">
                            <div className="upi-amount-hero">
                                <span className="upi-amount-lbl">Amount to Pay</span>
                                <h2 className="upi-amount-val">₹{totalDue.toFixed(2)}</h2>
                                <span className="upi-store-name">Pandey Grocery Store • Kusumkhera Haldwani</span>
                            </div>

                            {/* Store UPI ID Box */}
                            <div className="upi-id-box">
                                <div className="upi-id-info">
                                    <span className="lbl">Store Official UPI ID:</span>
                                    <strong className="upi-code">7906966085@upi</strong>
                                </div>
                                <button type="button" className="btn btn-secondary btn-xs" onClick={copyUpiId}>
                                    {copiedUpi ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy UPI</>}
                                </button>
                            </div>

                            {/* Mobile Direct UPI Intent Buttons */}
                            <div className="upi-apps-row">
                                <a 
                                    href={`upi://pay?pa=7906966085@upi&pn=Pandey%20Grocery%20Store&am=${totalDue}&cu=INR&tn=Khata%20Settlement%20${encodeURIComponent(user.name || '')}`}
                                    className="btn btn-primary btn-md w-full upi-direct-pay-btn"
                                >
                                    <IndianRupee size={16} /> Open in GPay / PhonePe / Paytm
                                </a>
                            </div>

                            {/* WhatsApp Confirmation Notification Button */}
                            <div className="upi-whatsapp-confirm">
                                <p>After completing payment, notify store on WhatsApp with screenshot:</p>
                                <a 
                                    href={`https://wa.me/917906966085?text=Namaste%20Pandey%20Store,%20I%20have%20transferred%20Rs.%20${totalDue}%20via%20UPI%20for%20my%20Khata%20account%20(${encodeURIComponent(user.name || '')},%20Email:%20${encodeURIComponent(user.email)}).%20Please%20find%20attached%20payment%20screenshot.`} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="btn btn-secondary btn-sm w-full whatsapp-link-btn"
                                >
                                    <MessageSquare size={14} color="#16a34a" /> Share Screenshot on WhatsApp
                                </a>
                            </div>
                        </div>

                        <div className="modal-card-footer">
                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowUpiModal(false)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
