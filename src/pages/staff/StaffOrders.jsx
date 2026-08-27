import { useState, useEffect, useCallback } from 'react';
import { statusLabels, statusColors, orderStatuses } from '../../data/orders';
import { ordersApi } from '../../lib/api';
import { 
    Clock, 
    Package, 
    Truck, 
    CheckCircle2, 
    ChevronDown, 
    ChevronUp, 
    Loader, 
    Store, 
    Home, 
    ShoppingBag, 
    Phone, 
    MapPin, 
    ArrowRight,
    RefreshCw,
    Search
} from 'lucide-react';
import './StaffOrders.css';

export default function StaffOrders() {
    const [orderList, setOrderList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedId, setExpandedId] = useState(null);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const data = await ordersApi.getAll();
            setOrderList(data?.orders || []);
        } catch (err) {
            console.error('Failed to load orders', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    const filteredOrders = orderList.filter((o) => {
        const matchFilter = filter === 'all' || o.status === filter;
        const matchSearch = searchQuery === '' || 
                            o.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            o.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (o.phone && o.phone.includes(searchQuery));
        return matchFilter && matchSearch;
    });

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

    const statusIcons = { 
        new: Clock, 
        packing: Package, 
        packed: Package, 
        dispatched: Truck, 
        delivered: CheckCircle2 
    };

    return (
        <div className="staff-orders-page animate-fade-in">
            <div className="dashboard-page-header">
                <div>
                    <h1 className="dashboard-page-title">Order Management</h1>
                    <p className="dashboard-page-subtitle">Process store pickups, packing line &amp; customer deliveries</p>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={fetchOrders} title="Refresh orders">
                    <RefreshCw size={15} /> Refresh List
                </button>
            </div>

            {/* Status Filter Tabs & Search Bar */}
            <div className="orders-control-bar card">
                <div className="order-status-tabs-scroll">
                    <button 
                        className={`status-tab-btn ${filter === 'all' ? 'active' : ''}`} 
                        onClick={() => setFilter('all')}
                    >
                        All ({orderList.length})
                    </button>
                    {orderStatuses.map((status) => {
                        const count = orderList.filter((o) => o.status === status).length;
                        return (
                            <button
                                key={status}
                                className={`status-tab-btn ${filter === status ? 'active' : ''}`}
                                onClick={() => setFilter(status)}
                                style={{ '--active-border': statusColors[status] }}
                            >
                                <span className="tab-status-dot" style={{ background: statusColors[status] }} />
                                {statusLabels[status]} ({count})
                            </button>
                        );
                    })}
                </div>

                <div className="orders-search-box">
                    <Search size={16} className="orders-search-icon" />
                    <input
                        type="text"
                        placeholder="Search by ID, customer name, phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Orders Feed / Table */}
            {loading ? (
                <div className="orders-loading-state card">
                    <Loader size={32} className="spin" color="var(--primary)" />
                    <p>Loading live order queue...</p>
                </div>
            ) : filteredOrders.length === 0 ? (
                <div className="orders-empty-state card">
                    <ShoppingBag size={48} color="#cbd5e1" />
                    <h3>No orders found</h3>
                    <p>There are no orders currently matching your selected status filter.</p>
                </div>
            ) : (
                <>
                    {/* Desktop Table View */}
                    <div className="orders-table-wrapper card hidden-mobile-table">
                        <table className="orders-table">
                            <thead>
                                <tr>
                                    <th>Order Info</th>
                                    <th>Customer</th>
                                    <th>Items</th>
                                    <th>Total</th>
                                    <th>Type</th>
                                    <th>Payment</th>
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
                                                <td className="order-id-cell">
                                                    <strong>#{order.id}</strong>
                                                    <span className="order-date-time">{order.date}</span>
                                                </td>
                                                <td>
                                                    <span className="order-customer-name">{order.customer}</span>
                                                    <span className="order-customer-phone">{order.phone}</span>
                                                </td>
                                                <td>
                                                    <span className="item-count-badge">{order.items?.length || 0} items</span>
                                                </td>
                                                <td className="order-total-cell">
                                                    <strong>₹{order.total}</strong>
                                                </td>
                                                <td>
                                                    <span className={`type-badge ${order.deliveryType === 'pickup' ? 'pickup' : 'delivery'}`}>
                                                        {order.deliveryType === 'pickup' ? (
                                                            <><Store size={12} /> Counter Pickup</>
                                                        ) : (
                                                            <><Home size={12} /> Doorstep Delivery</>
                                                        )}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="payment-pill">{order.payment}</span>
                                                </td>
                                                <td>
                                                    <span className="status-chip" style={{ background: `${statusColors[order.status]}18`, color: statusColors[order.status] }}>
                                                        <StatusIcon size={14} /> {statusLabels[order.status]}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="order-actions-cell">
                                                        {next && (
                                                            <button 
                                                                className="btn btn-sm btn-primary next-status-btn" 
                                                                onClick={() => updateStatus(order, next)}
                                                            >
                                                                → {statusLabels[next]}
                                                            </button>
                                                        )}
                                                        <button 
                                                            className="btn-icon btn-ghost btn-sm" 
                                                            onClick={() => setExpandedId(isExpanded ? null : order.id)}
                                                            aria-label="Toggle details"
                                                        >
                                                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr key={`${order.id}-details`} className="order-expanded-details-row">
                                                    <td colSpan={8}>
                                                        <div className="expanded-details-container">
                                                            <div className="expanded-section">
                                                                <h4>Ordered Items ({order.items?.length || 0})</h4>
                                                                <div className="items-list-drawer">
                                                                    {order.items?.map((it, idx) => (
                                                                        <div key={idx} className="drawer-item-row">
                                                                            <span className="it-name">{it.name}</span>
                                                                            <span className="it-qty">Qty: {it.qty || it.quantity}</span>
                                                                            <span className="it-price">₹{(it.price * (it.qty || it.quantity)).toFixed(2)}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            {order.address && (
                                                                <div className="expanded-section">
                                                                    <h4>Delivery / Contact Address</h4>
                                                                    <p className="drawer-address-text"><MapPin size={14} /> {order.address}</p>
                                                                </div>
                                                            )}
                                                            <div className="expanded-section">
                                                                <h4>Timing &amp; Special Notes</h4>
                                                                <p className="drawer-time-text"><Clock size={14} /> {order.timeSlot || 'Standard Delivery'}</p>
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

                    {/* Mobile Order Cards View */}
                    <div className="orders-mobile-cards-feed show-mobile-cards">
                        {filteredOrders.map((order) => {
                            const StatusIcon = statusIcons[order.status] || Package;
                            const next = getNextStatus(order.status);
                            const isExpanded = expandedId === order.id;

                            return (
                                <div key={order.id} className="order-mobile-card card">
                                    <div className="mobile-card-top">
                                        <div>
                                            <span className="m-order-id">#{order.id}</span>
                                            <span className="m-order-date">{order.date}</span>
                                        </div>
                                        <span className="status-chip" style={{ background: `${statusColors[order.status]}18`, color: statusColors[order.status] }}>
                                            <StatusIcon size={13} /> {statusLabels[order.status]}
                                        </span>
                                    </div>

                                    <div className="mobile-card-customer">
                                        <strong>{order.customer}</strong>
                                        <span><Phone size={12} /> {order.phone}</span>
                                    </div>

                                    <div className="mobile-card-meta-row">
                                        <span className="m-items-badge">{order.items?.length || 0} items</span>
                                        <span className="m-total-amount">₹{order.total}</span>
                                        <span className={`type-badge ${order.deliveryType === 'pickup' ? 'pickup' : 'delivery'}`}>
                                            {order.deliveryType === 'pickup' ? 'Store Pickup' : 'Delivery'}
                                        </span>
                                    </div>

                                    {isExpanded && (
                                        <div className="mobile-expanded-content">
                                            <div className="m-items-list">
                                                {order.items?.map((it, idx) => (
                                                    <div key={idx} className="m-item-line">
                                                        <span>{it.name} (×{it.qty || it.quantity})</span>
                                                        <span>₹{(it.price * (it.qty || it.quantity)).toFixed(2)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            {order.address && (
                                                <p className="m-address-line"><MapPin size={13} /> {order.address}</p>
                                            )}
                                        </div>
                                    )}

                                    <div className="mobile-card-actions">
                                        <button 
                                            className="btn btn-ghost btn-sm"
                                            onClick={() => setExpandedId(isExpanded ? null : order.id)}
                                        >
                                            {isExpanded ? 'Hide Details' : 'View Items'}
                                        </button>
                                        {next && (
                                            <button 
                                                className="btn btn-primary btn-sm"
                                                onClick={() => updateStatus(order, next)}
                                            >
                                                Advance to {statusLabels[next]} →
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}
