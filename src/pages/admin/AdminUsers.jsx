import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../lib/api';
import { 
    Users, 
    Shield, 
    Truck, 
    UserCheck, 
    Search, 
    Loader, 
    ChevronDown, 
    CheckCircle2, 
    Sparkles, 
    ShieldCheck,
    User
} from 'lucide-react';
import './AdminUsers.css';

const ROLE_CONFIG = {
    ADMIN: { label: 'Administrator', color: '#dc2626', icon: ShieldCheck, bg: '#fef2f2' },
    MANAGEMENT: { label: 'Store Manager', color: '#7c3aed', icon: UserCheck, bg: '#f5f3ff' },
    DELIVERY: { label: 'Delivery Driver', color: '#2563eb', icon: Truck, bg: '#eff6ff' },
    CUSTOMER: { label: 'Store Customer', color: '#059669', icon: Users, bg: '#ecfdf5' },
};

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [changingId, setChangingId] = useState(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const data = await adminApi.getUsers();
            if (data?.users) setUsers(data.users);
        } catch (err) {
            console.error('Failed to fetch users:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const changeRole = async (userId, newRole) => {
        setChangingId(userId);
        try {
            const data = await adminApi.updateUserRole(userId, newRole);
            if (data?.user) {
                setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: data.user.role } : u));
            }
        } catch (err) {
            alert(err.message || 'Failed to update role');
        } finally {
            setChangingId(null);
        }
    };

    const filtered = users.filter(u => {
        if (filterRole !== 'all' && u.role !== filterRole) return false;
        if (search) {
            const q = search.toLowerCase();
            return (u.name && u.name.toLowerCase().includes(q)) || 
                   (u.email && u.email.toLowerCase().includes(q)) || 
                   (u.phone && u.phone.includes(q));
        }
        return true;
    });

    const roleCounts = { all: users.length };
    users.forEach(u => { roleCounts[u.role] = (roleCounts[u.role] || 0) + 1; });

    if (loading) {
        return (
            <div className="admin-users-page">
                <div className="dashboard-page-header">
                    <h1 className="dashboard-page-title">User &amp; Role Management</h1>
                </div>
                <div className="users-loading-card card">
                    <Loader size={36} className="spin" color="var(--primary)" />
                    <p>Loading registered store accounts...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-users-page animate-fade-in">
            <div className="dashboard-page-header">
                <div>
                    <h1 className="dashboard-page-title">User &amp; Access Management</h1>
                    <p className="dashboard-page-subtitle">Configure customer accounts, staff permissions, and delivery drivers</p>
                </div>
            </div>

            {/* Role Summary KPI Cards */}
            <div className="users-roles-grid">
                {Object.entries(ROLE_CONFIG).map(([key, cfg]) => {
                    const Icon = cfg.icon;
                    const isActive = filterRole === key;
                    return (
                        <div 
                            key={key} 
                            className={`user-role-card card ${isActive ? 'active-role' : ''}`} 
                            style={{ borderColor: isActive ? cfg.color : 'transparent' }}
                            onClick={() => setFilterRole(filterRole === key ? 'all' : key)}
                        >
                            <div className="role-icon-circle" style={{ background: cfg.bg, color: cfg.color }}>
                                <Icon size={20} />
                            </div>
                            <span className="role-count-num" style={{ color: cfg.color }}>{roleCounts[key] || 0}</span>
                            <span className="role-name-label">{cfg.label}</span>
                        </div>
                    );
                })}
            </div>

            {/* Controls Bar */}
            <div className="users-controls-bar card">
                <div className="users-search-box">
                    <Search size={16} className="users-search-icon" />
                    <input 
                        type="text" 
                        placeholder="Search by name, email, phone..." 
                        value={search} 
                        onChange={e => setSearch(e.target.value)} 
                    />
                </div>

                <div className="users-filter-group">
                    <select 
                        className="users-role-select" 
                        value={filterRole} 
                        onChange={e => setFilterRole(e.target.value)}
                    >
                        <option value="all">All Roles ({roleCounts.all})</option>
                        {Object.entries(ROLE_CONFIG).map(([key, cfg]) => (
                            <option key={key} value={key}>{cfg.label} ({roleCounts[key] || 0})</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Desktop Data Table */}
            <div className="users-table-card card hidden-mobile-users">
                <table className="users-data-table">
                    <thead>
                        <tr>
                            <th>User Profile</th>
                            <th>Email Address</th>
                            <th>Login Provider</th>
                            <th>Current Role</th>
                            <th style={{ textAlign: 'center' }}>Modify Access</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(user => {
                            const cfg = ROLE_CONFIG[user.role] || ROLE_CONFIG.CUSTOMER;
                            const isSelfAdmin = user.role === 'ADMIN';
                            return (
                                <tr key={user.id}>
                                    <td>
                                        <div className="user-profile-cell">
                                            <div className="user-avatar-circle" style={{ background: cfg.bg, color: cfg.color }}>
                                                {user.avatar ? (
                                                    <img src={user.avatar} alt={user.name} />
                                                ) : (
                                                    user.name?.[0]?.toUpperCase() || <User size={16} />
                                                )}
                                            </div>
                                            <div>
                                                <span className="user-name-text">{user.name}</span>
                                                {user.phone && <span className="user-phone-text">{user.phone}</span>}
                                            </div>
                                        </div>
                                    </td>
                                    <td>{user.email}</td>
                                    <td>
                                        <span className="provider-pill">{user.provider || 'password'}</span>
                                    </td>
                                    <td>
                                        <span className="role-badge-pill" style={{ background: cfg.bg, color: cfg.color }}>
                                            <cfg.icon size={13} /> {cfg.label}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        {isSelfAdmin ? (
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Super Admin</span>
                                        ) : (
                                            <select
                                                className="role-change-select"
                                                value={user.role}
                                                onChange={e => changeRole(user.id, e.target.value)}
                                                disabled={changingId === user.id}
                                            >
                                                <option value="CUSTOMER">Customer</option>
                                                <option value="DELIVERY">Delivery Driver</option>
                                                <option value="MANAGEMENT">Store Manager</option>
                                                <option value="ADMIN">Administrator</option>
                                            </select>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Mobile Users Feed */}
            <div className="users-mobile-feed show-mobile-users">
                {filtered.map(user => {
                    const cfg = ROLE_CONFIG[user.role] || ROLE_CONFIG.CUSTOMER;
                    return (
                        <div key={user.id} className="user-mobile-card card">
                            <div className="user-mobile-top">
                                <div className="user-avatar-circle" style={{ background: cfg.bg, color: cfg.color }}>
                                    {user.avatar ? (
                                        <img src={user.avatar} alt={user.name} />
                                    ) : (
                                        user.name?.[0]?.toUpperCase() || <User size={16} />
                                    )}
                                </div>
                                <div className="user-mobile-info">
                                    <h4>{user.name}</h4>
                                    <span>{user.email}</span>
                                    {user.phone && <span>{user.phone}</span>}
                                </div>
                            </div>
                            <div className="user-mobile-footer">
                                <span className="role-badge-pill" style={{ background: cfg.bg, color: cfg.color }}>
                                    {cfg.label}
                                </span>
                                {user.role !== 'ADMIN' && (
                                    <select
                                        className="role-change-select"
                                        value={user.role}
                                        onChange={e => changeRole(user.id, e.target.value)}
                                        disabled={changingId === user.id}
                                    >
                                        <option value="CUSTOMER">Customer</option>
                                        <option value="DELIVERY">Delivery Driver</option>
                                        <option value="MANAGEMENT">Store Manager</option>
                                        <option value="ADMIN">Admin</option>
                                    </select>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
