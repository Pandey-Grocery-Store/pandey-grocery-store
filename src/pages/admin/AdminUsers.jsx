import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../lib/api';
import { Users, Shield, Truck, UserCheck, Search, Loader, ChevronDown } from 'lucide-react';

const ROLE_CONFIG = {
    ADMIN: { label: 'Admin', color: '#dc2626', icon: Shield, bg: '#fef2f2' },
    MANAGEMENT: { label: 'Management', color: '#7c3aed', icon: UserCheck, bg: '#f5f3ff' },
    DELIVERY: { label: 'Delivery', color: '#2563eb', icon: Truck, bg: '#eff6ff' },
    CUSTOMER: { label: 'Customer', color: '#6b7280', icon: Users, bg: '#f9fafb' },
};

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [changingId, setChangingId] = useState(null);

    const fetchUsers = useCallback(async () => {
        try {
            const data = await adminApi.getUsers();
            if (data?.users) setUsers(data.users);
        } catch (err) {
            console.error('Failed to fetch users:', err);
        }
        setLoading(false);
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
        }
        setChangingId(null);
    };

    const filtered = users.filter(u => {
        if (filterRole !== 'all' && u.role !== filterRole) return false;
        if (search) {
            const q = search.toLowerCase();
            return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.phone?.includes(q);
        }
        return true;
    });

    const roleCounts = { all: users.length };
    users.forEach(u => { roleCounts[u.role] = (roleCounts[u.role] || 0) + 1; });

    if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}><Loader size={28} className="spin" /> Loading users...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>User Management</h2>
                    <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{users.length} total users</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input className="input" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 34, width: 220 }} />
                    </div>
                    <select className="input" value={filterRole} onChange={e => setFilterRole(e.target.value)} style={{ width: 160 }}>
                        <option value="all">All Roles ({roleCounts.all})</option>
                        {Object.entries(ROLE_CONFIG).map(([key, cfg]) => (
                            <option key={key} value={key}>{cfg.label} ({roleCounts[key] || 0})</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Role summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {Object.entries(ROLE_CONFIG).map(([key, cfg]) => {
                    const Icon = cfg.icon;
                    return (
                        <div key={key} className="card" style={{ padding: '1rem', textAlign: 'center', cursor: 'pointer', border: filterRole === key ? `2px solid ${cfg.color}` : '2px solid transparent' }} onClick={() => setFilterRole(filterRole === key ? 'all' : key)}>
                            <Icon size={22} style={{ color: cfg.color, marginBottom: 4 }} />
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: cfg.color }}>{roleCounts[key] || 0}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{cfg.label}</div>
                        </div>
                    );
                })}
            </div>

            {/* Users table */}
            <div className="card" style={{ overflowX: 'auto' }}>
                <table className="data-table" style={{ width: '100%', minWidth: '800px', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th style={{ textAlign: 'left', padding: '0.75rem 1rem' }}>User</th>
                            <th style={{ textAlign: 'left', padding: '0.75rem 1rem' }}>Email</th>
                            <th style={{ textAlign: 'left', padding: '0.75rem 1rem' }}>Provider</th>
                            <th style={{ textAlign: 'left', padding: '0.75rem 1rem' }}>Current Role</th>
                            <th style={{ textAlign: 'center', padding: '0.75rem 1rem' }}>Change Role</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(user => {
                            const cfg = ROLE_CONFIG[user.role] || ROLE_CONFIG.CUSTOMER;
                            return (
                                <tr key={user.id} style={{ borderTop: '1px solid var(--border)' }}>
                                    <td style={{ padding: '0.75rem 1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', fontWeight: 600, color: cfg.color }}>
                                                {user.avatar ? <img src={user.avatar} alt="" style={{ width: 32, height: 32, borderRadius: '50%' }} /> : user.name?.[0]?.toUpperCase()}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{user.name}</div>
                                                {user.phone && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user.phone}</div>}
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}>{user.email}</td>
                                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', textTransform: 'capitalize' }}>{user.provider || 'local'}</td>
                                    <td style={{ padding: '0.75rem 1rem' }}>
                                        <span style={{ padding: '0.25rem 0.75rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600, background: cfg.bg, color: cfg.color }}>
                                            {cfg.label}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                        {user.role === 'ADMIN' ? (
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>—</span>
                                        ) : (
                                            <div style={{ position: 'relative', display: 'inline-block' }}>
                                                <select
                                                    className="input"
                                                    value={user.role}
                                                    onChange={e => changeRole(user.id, e.target.value)}
                                                    disabled={changingId === user.id}
                                                    style={{ fontSize: '0.8rem', padding: '0.35rem 1.75rem 0.35rem 0.5rem', minWidth: 130 }}
                                                >
                                                    <option value="CUSTOMER">Customer</option>
                                                    <option value="DELIVERY">Delivery</option>
                                                    <option value="MANAGEMENT">Management</option>
                                                </select>
                                                {changingId === user.id && <Loader size={14} className="spin" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }} />}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                        {filtered.length === 0 && (
                            <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No users found</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
