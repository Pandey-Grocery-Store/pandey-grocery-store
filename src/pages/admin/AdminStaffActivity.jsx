import { useState, useEffect, useCallback } from 'react';
import { Users, Clock, CheckCircle2, AlertCircle, Loader, ShieldCheck, Truck, Package } from 'lucide-react';
import { adminApi, ordersApi, dashboardApi } from '../../lib/api';
import './AdminStaffActivity.css';

const roleLabels = {
    ADMIN: 'Admin',
    MANAGEMENT: 'Store Manager',
    STAFF: 'Staff Member',
    DELIVERY: 'Delivery',
    CUSTOMER: 'Customer',
};

const roleIcons = {
    ADMIN: ShieldCheck,
    MANAGEMENT: Package,
    STAFF: Package,
    DELIVERY: Truck,
    CUSTOMER: Users,
};

export default function AdminStaffActivity() {
    const [staffMembers, setStaffMembers] = useState([]);
    const [recentOrders, setRecentOrders] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [usersData, ordersData, statsData] = await Promise.all([
                adminApi.getUsers(),
                ordersApi.getAll(),
                dashboardApi.getStats(),
            ]);

            // Filter non-customer users as "staff"
            const allUsers = usersData?.users || [];
            const staff = allUsers.filter(u => u.role !== 'CUSTOMER');
            setStaffMembers(staff);

            // Use real orders as activity log
            const orders = ordersData?.orders || [];
            setRecentOrders(orders.slice(0, 12));

            if (statsData) {
                setStats(statsData.stats);
            }
        } catch (err) {
            console.error('Failed to fetch staff data:', err);
        }
        setLoading(false);
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Build activity log from real orders
    const activityLog = recentOrders.map(order => {
        const date = order.date ? new Date(order.date) : new Date();
        const time = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
        
        let action = '';
        let type = 'info';
        switch (order.status) {
            case 'delivered':
                action = `Order ${order.id} delivered to ${order.customer} — ₹${order.total}`;
                type = 'success';
                break;
            case 'dispatched':
                action = `Order ${order.id} dispatched for ${order.customer}`;
                type = 'info';
                break;
            case 'packed':
                action = `Order ${order.id} packed — ₹${order.total}`;
                type = 'success';
                break;
            case 'packing':
                action = `Order ${order.id} being packed for ${order.customer}`;
                type = 'info';
                break;
            case 'new':
                action = `New order ${order.id} from ${order.customer} — ₹${order.total}`;
                type = 'warning';
                break;
            default:
                action = `Order ${order.id} — ${order.status}`;
        }
        return { time, action, type, user: order.customer };
    });

    if (loading) {
        return (
            <div className="admin-staff">
                <div className="dashboard-page-header">
                    <h1 className="dashboard-page-title">Staff Activity</h1>
                </div>
                <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                    <Loader size={24} className="spin" /> Loading staff data...
                </div>
            </div>
        );
    }

    const totalOrders = stats?.totalOrders || recentOrders.length;
    const activeOrders = stats?.activeOrders || 0;

    return (
        <div className="admin-staff">
            <div className="dashboard-page-header">
                <h1 className="dashboard-page-title">Staff Activity</h1>
                <p className="dashboard-page-subtitle">Real-time team overview from database</p>
            </div>

            {/* Staff Summary — Real Data */}
            <div className="staff-summary">
                <div className="staff-stat card">
                    <Users size={20} className="staff-stat-icon" />
                    <div>
                        <span className="staff-stat-val">{staffMembers.length}</span>
                        <span className="staff-stat-label">Team Members</span>
                    </div>
                </div>
                <div className="staff-stat card online">
                    <CheckCircle2 size={20} className="staff-stat-icon" />
                    <div>
                        <span className="staff-stat-val">{staffMembers.filter(s => s.role === 'ADMIN' || s.role === 'MANAGEMENT').length}</span>
                        <span className="staff-stat-label">Admins</span>
                    </div>
                </div>
                <div className="staff-stat card">
                    <Clock size={20} className="staff-stat-icon" />
                    <div>
                        <span className="staff-stat-val">{totalOrders}</span>
                        <span className="staff-stat-label">Total Orders</span>
                    </div>
                </div>
                <div className="staff-stat card">
                    <AlertCircle size={20} className="staff-stat-icon" />
                    <div>
                        <span className="staff-stat-val">{activeOrders}</span>
                        <span className="staff-stat-label">Active Orders</span>
                    </div>
                </div>
            </div>

            <div className="staff-grid">
                {/* Staff Cards — Real Users */}
                <div className="staff-cards-section">
                    <h3 className="staff-section-title">Team Members ({staffMembers.length})</h3>
                    {staffMembers.length === 0 ? (
                        <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                            <p>No staff members yet. Assign roles from User Management.</p>
                        </div>
                    ) : (
                        <div className="staff-cards">
                            {staffMembers.map((member) => {
                                const initials = (member.name || member.email.split('@')[0])
                                    .split(' ')
                                    .map(w => w[0])
                                    .join('')
                                    .toUpperCase()
                                    .slice(0, 2);
                                const RoleIcon = roleIcons[member.role] || Users;
                                return (
                                    <div key={member.id} className="staff-card card">
                                        <div className="staff-card-header">
                                            <div className="staff-avatar-wrap">
                                                <div className="staff-avatar">{initials}</div>
                                                <span className="staff-status-dot online" />
                                            </div>
                                            <div className="staff-card-info">
                                                <strong>{member.name || member.email.split('@')[0]}</strong>
                                                <span className="staff-role">
                                                    <RoleIcon size={12} style={{ marginRight: 4 }} />
                                                    {roleLabels[member.role] || member.role}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="staff-card-metrics">
                                            <div className="staff-metric">
                                                <span className="staff-metric-value">{member.email}</span>
                                                <span className="staff-metric-label">Email</span>
                                            </div>
                                        </div>
                                        <div className="staff-card-metrics">
                                            <div className="staff-metric">
                                                <span className="staff-metric-value" style={{ fontSize: '0.7rem', padding: '2px 8px', background: member.role === 'ADMIN' ? '#fef2f2' : '#f0fdf4', color: member.role === 'ADMIN' ? '#ef4444' : '#16a34a', borderRadius: '6px' }}>
                                                    {member.role}
                                                </span>
                                                <span className="staff-metric-label">Role</span>
                                            </div>
                                            <div className="staff-metric">
                                                <span className="staff-metric-value">{member.provider || 'Local'}</span>
                                                <span className="staff-metric-label">Provider</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Activity Log — Real Orders */}
                <div className="activity-log-section">
                    <h3 className="staff-section-title">Order Activity Log</h3>
                    {activityLog.length === 0 ? (
                        <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                            <p>No order activity yet.</p>
                        </div>
                    ) : (
                        <div className="activity-log card">
                            {activityLog.map((entry, i) => (
                                <div key={i} className={`activity-entry ${entry.type}`}>
                                    <span className="activity-time">{entry.time}</span>
                                    <div className="activity-dot" />
                                    <div className="activity-content">
                                        <strong>{entry.user}</strong>
                                        <span>{entry.action}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
