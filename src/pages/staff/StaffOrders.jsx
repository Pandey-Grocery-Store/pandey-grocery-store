import { useState, useEffect, useCallback } from 'react';
import { statusLabels, statusColors, orderStatuses } from '../../data/orders';
import { ordersApi } from '../../lib/api';
import { Clock, Package, Truck, CheckCircle2, ChevronDown, ChevronUp, Loader } from 'lucide-react';
import './StaffOrders.css';

export default function StaffOrders() {
    const [orderList, setOrderList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [expandedId, setExpandedId] = useState(null);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        const data = await ordersApi.getAll();
        setOrderList(data?.orders || []);
        setLoading(false);
    }, []);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    const filteredOrders = filter === 'all' ? orderList : orderList.filter((o) => o.status === filter);

    const updateStatus = async (order, newStatus) => {
        try {
            await ordersApi.updateStatus(order.dbId || order.id, newStatus);
        } catch { /* fallback */ }
        setOrderList((prev) =>
            prev.map((o) => (o.id === order.id ? { ...o, status: newStatus } : o))
        );
    };

    const getNextStatus = (current) => {
        const idx = orderStatuses.indexOf(current);
        return idx < orderStatuses.length - 1 ? orderStatuses[idx + 1] : null;
    };

    const statusIcons = { new: Clock, packing: Package, packed: Package, dispatched: Truck, delivered: CheckCircle2 };

    return (
        <div className="staff-orders">
            <div className="dashboard-page-header">
                <h1 className="dashboard-page-title">Order Management</h1>
                <p className="dashboard-page-subtitle">Manage incoming orders, packing, and dispatch</p>
            </div>

            {/* Status Filter Tabs */}
            <div className="order-status-tabs">
                <button className={`status-tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
                    All ({orderList.length})
                </button>
                {orderStatuses.map((status) => {
                    const count = orderList.filter((o) => o.status === status).length;
                    return (
                        <button
                            key={status}
                            className={`status-tab ${filter === status ? 'active' : ''}`}
                            onClick={() => setFilter(status)}
                            style={{ '--tab-color': statusColors[status] }}
                        >
                            <span className="status-dot" style={{ background: statusColors[status] }} />
                            {statusLabels[status]} ({count})
                        </button>
                    );
                })}
            </div>

            {/* Orders Table */}
            {loading ? (
                <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                    <Loader size={24} className="spin" /> Loading orders...
                </div>
            ) : (
                <div className="orders-table-wrapper card">
                    <table className="orders-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Customer</th>
                                <th>Items</th>
                                <th>Total</th>
                                <th>Payment</th>
                                <th>Type</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map((order) => {
                                const StatusIcon = statusIcons[order.status] || Package;
                                const next = getNextStatus(order.status);
                                const isExpanded = expandedId === order.id;

                                return (
                                    <>
                                        <tr key={order.id} className={`order-row ${isExpanded ? 'expanded' : ''}`}>
                                            <td className="order-id-cell"><strong>{order.id}</strong><br /><span className="order-date-cell">{order.date}</span></td>
                                            <td><strong>{order.customer}</strong><br /><span className="order-phone">{order.phone}</span></td>
                                            <td>{order.items.length} items</td>
                                            <td className="order-total-cell">₹{order.total}</td>
                                            <td><span className="badge badge-info">{order.payment}</span></td>
                                            <td><span className={`badge ${order.deliveryType === 'pickup' ? 'badge-warning' : 'badge-primary'}`}>{order.deliveryType === 'pickup' ? '🏪 Pickup' : '🏠 Delivery'}</span></td>
                                            <td>
                                                <span className="status-chip" style={{ background: `${statusColors[order.status]}18`, color: statusColors[order.status] }}>
                                                    <StatusIcon size={14} /> {statusLabels[order.status]}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="order-actions">
                                                    {next && (
                                                        <button className="btn btn-sm btn-primary" onClick={() => updateStatus(order, next)}>
                                                            → {statusLabels[next]}
                                                        </button>
                                                    )}
                                                    <button className="btn btn-sm btn-ghost" onClick={() => setExpandedId(isExpanded ? null : order.id)}>
                                                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        {isExpanded && (
                                            <tr key={`${order.id}-details`} className="order-details-row">
                                                <td colSpan={8}>
                                                    <div className="order-details">
                                                        <div className="detail-section">
                                                            <h4>Items</h4>
                                                            {order.items.map((item, i) => (
                                                                <div key={i} className="detail-item">
                                                                    <span>{item.name}</span>
                                                                    <span>× {item.qty}</span>
                                                                    <span>₹{item.price * item.qty}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        {order.address && (
                                                            <div className="detail-section">
                                                                <h4>Delivery Address</h4>
                                                                <p>{order.address}</p>
                                                            </div>
                                                        )}
                                                        <div className="detail-section">
                                                            <h4>Time Slot</h4>
                                                            <p>{order.timeSlot}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
