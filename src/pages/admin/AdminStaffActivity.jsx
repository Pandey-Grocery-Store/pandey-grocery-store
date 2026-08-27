import { useState, useEffect, useCallback } from 'react';
import { 
    Users, 
    Clock, 
    CheckCircle2, 
    AlertCircle, 
    Loader, 
    ShieldCheck, 
    Truck, 
    Package, 
    RefreshCw, 
    Activity,
    Calendar,
    ArrowUpRight,
    User
} from 'lucide-react';
import { adminApi, ordersApi, dashboardApi } from '../../lib/api';
import './AdminStaffActivity.css';

const roleLabels = {
    ADMIN: 'Administrator',
    MANAGEMENT: 'Store Manager',
    STAFF: 'Store Staff',
    DELIVERY: 'Delivery Driver',
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

            const allUsers = usersData?.users || [];
            const staff = allUsers.filter(u => u.role !== 'CUSTOMER');
            setStaffMembers(staff);

            const orders = ordersData?.orders || [];
            setRecentOrders(orders.slice(0, 15));

            if (statsData) {
                setStats(statsData.stats);
            }
        } catch (err) {
            console.error('Failed to fetch staff data:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const activityLog = recentOrders.map(order => {
        const date = order.date ? new Date(order.date) : new Date();
        const time = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
        
        let action = '';
        let type = 'info';
        switch (order.status) {
            case 'delivered':
                action = `Order #${order.id} marked as delivered to ${order.customer} — ₹${order.total}`;
                type = 'success';
                break;
            case 'dispatched':
                action = `Order #${order.id} dispatched for doorstep delivery (${order.customer})`;
                type = 'info';
                break;
            case 'packed':
                action = `Order #${order.id} packed & verified in inventory — ₹${order.total}`;
                type = 'success';
                break;
            case 'packing':
                action = `Order #${order.id} placed in packing queue by store staff`;
                type = 'info';
                break;
            case 'new':
                action = `New store order #${order.id} received from ${order.customer} — ₹${order.total}`;
                type = 'warning';
                break;
            default:
                action = `Order #${order.id} status updated to ${order.status}`;
        }
        return { id: order.id, time, date: order.date || 'Today', action, type, user: order.customer, total: order.total };
    });

    if (loading) {
        return (
            <div className="admin-staff-page">
                <div className="dashboard-page-header">
                    <h1 className="dashboard-page-title">Staff Team &amp; Audit Logs</h1>
                </div>
                <div className="staff-loading-card card">
                    <Loader size={36} className="spin" color="var(--primary)" />
                    <p>Loading staff logs &amp; timeline...</p>
                </div>
            </div>
        );
    }

    const totalOrders = stats?.totalOrders || recentOrders.length;
    const activeOrders = stats?.activeOrders || 0;

    return (
        <div className="admin-staff-page animate-fade-in">
            <div className="dashboard-page-header">
                <div>
                    <h1 className="dashboard-page-title">Team Roster &amp; Live Audit Trail</h1>
                    <p className="dashboard-page-subtitle">Real-time team active members and operational logs</p>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={fetchData}>
                    <RefreshCw size={15} /> Refresh Audit
                </button>
            </div>

            {/* KPI Metrics */}
            <div className="staff-kpi-grid">
                <div className="staff-stat-card card">
                    <div className="stat-icon-wrap bg-purple">
                        <Users size={22} />
                    </div>
                    <div className="stat-meta">
                        <span className="stat-num">{staffMembers.length}</span>
                        <span className="stat-label">Team Members</span>
                    </div>
                </div>

                <div className="staff-stat-card card">
                    <div className="stat-icon-wrap bg-emerald">
                        <ShieldCheck size={22} />
                    </div>
                    <div className="stat-meta">
                        <span className="stat-num">{staffMembers.filter(s => s.role === 'ADMIN' || s.role === 'MANAGEMENT').length}</span>
                        <span className="stat-label">Admins &amp; Managers</span>
                    </div>
                </div>

                <div className="staff-stat-card card">
                    <div className="stat-icon-wrap bg-blue">
                        <Clock size={22} />
                    </div>
                    <div className="stat-meta">
                        <span className="stat-num">{totalOrders}</span>
                        <span className="stat-label">Processed Orders</span>
                    </div>
                </div>

                <div className="staff-stat-card card">
                    <div className="stat-icon-wrap bg-amber">
                        <AlertCircle size={22} />
                    </div>
                    <div className="stat-meta">
                        <span className="stat-num">{activeOrders}</span>
                        <span className="stat-label">Active Orders</span>
                    </div>
                </div>
            </div>

            {/* Main Layout: Team Roster + Activity Timeline */}
            <div className="staff-activity-layout">
                {/* Left: Team Members */}
                <div className="team-roster-card card">
                    <div className="roster-header">
                        <Users size={20} color="var(--primary)" />
                        <div>
                            <h3>Active Team Roster</h3>
                            <p>Staff and admin accounts with system access</p>
                        </div>
                    </div>

                    <div className="team-members-list">
                        {staffMembers.length === 0 ? (
                            <div className="roster-empty">No active staff members assigned yet.</div>
                        ) : (
                            staffMembers.map(member => {
                                const RoleIcon = roleIcons[member.role] || Users;
                                return (
                                    <div key={member.id} className="team-member-row">
                                        <div className="member-avatar">
                                            {member.avatar ? (
                                                <img src={member.avatar} alt={member.name} />
                                            ) : (
                                                member.name?.[0]?.toUpperCase() || <User size={16} />
                                            )}
                                        </div>
                                        <div className="member-info">
                                            <strong>{member.name}</strong>
                                            <span>{member.email}</span>
                                        </div>
                                        <span className={`member-role-badge role-${member.role?.toLowerCase()}`}>
                                            <RoleIcon size={12} /> {roleLabels[member.role] || member.role}
                                        </span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Right: Live Audit Log Timeline */}
                <div className="audit-timeline-card card">
                    <div className="timeline-header">
                        <Activity size={20} color="var(--primary)" />
                        <div>
                            <h3>Live Operational Timeline</h3>
                            <p>Chronological transaction and fulfillment events</p>
                        </div>
                    </div>

                    <div className="timeline-items-stream">
                        {activityLog.length === 0 ? (
                            <div className="timeline-empty">No activity events recorded yet.</div>
                        ) : (
                            activityLog.map((ev, idx) => (
                                <div key={idx} className="timeline-stream-item">
                                    <div className={`timeline-dot ${ev.type}`} />
                                    <div className="timeline-content">
                                        <p className="timeline-action-text">{ev.action}</p>
                                        <div className="timeline-meta-row">
                                            <span className="timeline-time"><Clock size={12} /> {ev.time}</span>
                                            <span className="timeline-date">{ev.date}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
