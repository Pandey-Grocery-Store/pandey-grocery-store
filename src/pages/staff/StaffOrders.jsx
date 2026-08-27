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
    Search,
    Printer,
    Scale,
    Box,
    X,
    ExternalLink,
    Check,
    MessageSquare,
    IndianRupee
} from 'lucide-react';
import './StaffOrders.css';

const RIDER_OPTIONS = ['Rahul Sharma (Express)', 'Ramesh Kumar (Bike)', 'Deepak Joshi (Van)', 'Store Counter (Self Pickup)'];

export default function StaffOrders() {
    const [orderList, setOrderList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedId, setExpandedId] = useState(null);
    const [printOrder, setPrintOrder] = useState(null);
    const [updatingId, setUpdatingId] = useState(null);

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
                            o.id?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (o.orderNumber && o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
                            o.customer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (o.phone && o.phone.includes(searchQuery));
        return matchFilter && matchSearch;
    });

    const updateStatus = async (order, newStatus) => {
        setUpdatingId(order.id);
        try {
            await ordersApi.updateStatus(order.dbId || order.id, newStatus);
        } catch { /* fallback */ }
        setOrderList((prev) =>
            prev.map((o) => (o.id === order.id ? { ...o, status: newStatus } : o))
        );
        setUpdatingId(null);
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

    // Calculate queue stats
    const totalQueueRevenue = filteredOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const activeOrdersCount = orderList.filter(o => ['new', 'packing', 'packed', 'dispatched'].includes(o.status)).length;

    return (
        <div className="staff-orders-page animate-fade-in">
            {/* Page Header */}
            <div className="dashboard-page-header">
                <div className="dash-header-title-block">
                    <h1 className="dashboard-page-title">Order Processing Queue</h1>
                    <p className="dashboard-page-subtitle">Manage store packing line, rider dispatches &amp; counter pickups</p>
                </div>
                <div className="dash-header-actions">
                    <button className="btn btn-secondary btn-sm" onClick={fetchOrders} title="Refresh orders">
                        <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh Queue
                    </button>
                </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="orders-metrics-row">
                <div className="metric-pill-card">
                    <span className="metric-lbl">Total Orders</span>
                    <strong className="metric-val">{orderList.length}</strong>
                </div>
                <div className="metric-pill-card active-pulse">
                    <span className="metric-lbl">Active Processing</span>
                    <strong className="metric-val text-primary">{activeOrdersCount}</strong>
                </div>
                <div className="metric-pill-card">
                    <span className="metric-lbl">Queue Value</span>
                    <strong className="metric-val text-success">₹{totalQueueRevenue.toLocaleString('en-IN')}</strong>
                </div>
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
                    {searchQuery && (
                        <button className="orders-search-clear" onClick={() => setSearchQuery('')}>
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* Orders Table & Cards */}
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
                                    <th>Customer &amp; Contact</th>
                                    <th>Items Breakdown</th>
                                    <th>Amount</th>
                                    <th>Fulfillment</th>
                                    <th>Payment</th>
                                    <th>Live Status</th>
                                    <th>Action</th>
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
                                                    <div className="o-id-badge">#{order.orderNumber || order.id}</div>
                                                    <span className="order-date-time">{order.date}</span>
                                                </td>
                                                <td>
                                                    <span className="order-customer-name">{order.customer}</span>
                                                    {order.phone && (
                                                        <a href={`tel:${order.phone}`} className="order-customer-phone">
                                                            <Phone size={11} /> {order.phone}
                                                        </a>
                                                    )}
                                                </td>
                                                <td>
                                                    <div className="order-items-preview-stack">
                                                        <span className="item-count-badge">{order.items?.length || 0} items</span>
                                                        <span className="first-item-snippet">
                                                            {order.items?.[0]?.name} {order.items?.length > 1 ? `+${order.items.length - 1} more` : ''}
                                                        </span>
                                                    </div>
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
                                                    <span className="payment-pill">{order.payment?.toUpperCase()}</span>
                                                </td>
                                                <td>
                                                    <span className="status-chip" style={{ background: `${statusColors[order.status]}18`, color: statusColors[order.status] }}>
                                                        <StatusIcon size={13} /> {statusLabels[order.status]}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="order-actions-cell">
                                                        {next && (
                                                            <button 
                                                                className="btn btn-sm btn-primary next-status-btn" 
                                                                onClick={() => updateStatus(order, next)}
                                                                disabled={updatingId === order.id}
                                                            >
                                                                {updatingId === order.id ? <Loader size={12} className="spin" /> : <>→ {statusLabels[next]}</>}
                                                            </button>
                                                        )}
                                                        <button 
                                                            className="btn-icon btn-ghost btn-sm" 
                                                            onClick={() => setPrintOrder(order)} 
                                                            title="Print Packing Slip / Bill"
                                                        >
                                                            <Printer size={15} />
                                                        </button>
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
                                                            {/* Ordered Items with Weight & Fixed Badges */}
                                                            <div className="expanded-section">
                                                                <h4>Itemized Packing Checklist ({order.items?.length || 0} items)</h4>
                                                                <div className="items-list-drawer">
                                                                    {order.items?.map((it, idx) => {
                                                                        const isWeight = it.name?.includes('(') || it.name?.toLowerCase().includes('g') || it.name?.toLowerCase().includes('kg');
                                                                        return (
                                                                            <div key={idx} className="drawer-item-row">
                                                                                <div className="drawer-item-info">
                                                                                    <span className={`drawer-type-tag ${isWeight ? 'weight' : 'fixed'}`}>
                                                                                        {isWeight ? <><Scale size={10} /> By Weight</> : <><Box size={10} /> Pack</>}
                                                                                    </span>
                                                                                    <span className="it-name">{it.name}</span>
                                                                                </div>
                                                                                <span className="it-qty">Qty: {it.qty || it.quantity}</span>
                                                                                <span className="it-price">₹{(it.price * (it.qty || it.quantity)).toFixed(2)}</span>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>

                                                            {/* Customer & Address Details */}
                                                            <div className="expanded-section">
                                                                <h4>Delivery Destination &amp; Contact</h4>
                                                                {order.address ? (
                                                                    <p className="drawer-address-text"><MapPin size={14} color="#059669" /> {order.address}</p>
                                                                ) : (
                                                                    <p className="drawer-address-text"><Store size={14} color="#2563eb" /> Customer Store Counter Pickup (Haldwani)</p>
                                                                )}
                                                                {order.phone && (
                                                                    <div className="drawer-quick-contacts">
                                                                        <a href={`tel:${order.phone}`} className="contact-chip">
                                                                            <Phone size={12} /> Call Customer
                                                                        </a>
                                                                        <a href={`https://wa.me/91${order.phone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(order.customer)},%20your%20Pandey%20Grocery%20Store%20order%20%23${order.orderNumber}%20is%20being%20processed!`} target="_blank" rel="noreferrer" className="contact-chip whatsapp">
                                                                            <MessageSquare size={12} /> WhatsApp
                                                                        </a>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Status Stepper Selector */}
                                                            <div className="expanded-section">
                                                                <h4>Direct Status Override</h4>
                                                                <div className="drawer-status-stepper">
                                                                    {orderStatuses.map((s) => (
                                                                        <button
                                                                            key={s}
                                                                            type="button"
                                                                            className={`drawer-step-btn ${order.status === s ? 'active' : ''}`}
                                                                            onClick={() => updateStatus(order, s)}
                                                                        >
                                                                            {order.status === s && <Check size={12} />}
                                                                            {statusLabels[s]}
                                                                        </button>
                                                                    ))}
                                                                </div>
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
                                            <span className="m-order-id">#{order.orderNumber || order.id}</span>
                                            <span className="m-order-date">{order.date}</span>
                                        </div>
                                        <span className="status-chip" style={{ background: `${statusColors[order.status]}18`, color: statusColors[order.status] }}>
                                            <StatusIcon size={13} /> {statusLabels[order.status]}
                                        </span>
                                    </div>

                                    <div className="mobile-card-customer">
                                        <strong>{order.customer}</strong>
                                        {order.phone && (
                                            <a href={`tel:${order.phone}`} className="m-phone-link">
                                                <Phone size={12} /> {order.phone}
                                            </a>
                                        )}
                                    </div>

                                    <div className="mobile-card-meta-row">
                                        <span className="m-items-badge">{order.items?.length || 0} items</span>
                                        <span className="m-total-amount">₹{order.total}</span>
                                        <span className={`type-badge ${order.deliveryType === 'pickup' ? 'pickup' : 'delivery'}`}>
                                            {order.deliveryType === 'pickup' ? 'Store Pickup' : 'Delivery'}
                                        </span>
                                    </div>

                                    {/* Expanded Item Breakdown for Mobile */}
                                    {isExpanded && (
                                        <div className="mobile-expanded-content">
                                            <div className="m-items-list">
                                                {order.items?.map((it, idx) => {
                                                    const isWeight = it.name?.includes('(') || it.name?.toLowerCase().includes('g') || it.name?.toLowerCase().includes('kg');
                                                    return (
                                                        <div key={idx} className="m-item-line">
                                                            <div className="m-it-left">
                                                                <span className={`drawer-type-tag ${isWeight ? 'weight' : 'fixed'}`}>
                                                                    {isWeight ? '⚖️ Weight' : '📦 Pack'}
                                                                </span>
                                                                <span className="m-it-title">{it.name} (×{it.qty || it.quantity})</span>
                                                            </div>
                                                            <span className="m-it-price">₹{(it.price * (it.qty || it.quantity)).toFixed(2)}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            {order.address && (
                                                <p className="m-address-line"><MapPin size={13} color="#059669" /> {order.address}</p>
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
                                        <button 
                                            className="btn-icon btn-ghost btn-sm" 
                                            onClick={() => setPrintOrder(order)} 
                                            title="Print Slip"
                                        >
                                            <Printer size={15} />
                                        </button>
                                        {next && (
                                            <button 
                                                className="btn btn-primary btn-sm m-advance-btn"
                                                onClick={() => updateStatus(order, next)}
                                                disabled={updatingId === order.id}
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

            {/* ══════════════════════════════════════════════════════════
                🖨️ PRINT PACKING SLIP & STORE INVOICE MODAL
                ══════════════════════════════════════════════════════════ */}
            {printOrder && (
                <div className="modal-overlay animate-fade-in" onClick={() => setPrintOrder(null)}>
                    <div className="print-modal-dialog" onClick={e => e.stopPropagation()}>
                        <div className="print-modal-header no-print">
                            <div className="print-title">
                                <Printer size={18} color="var(--primary)" />
                                <h3>Store Invoice &amp; Packing Slip</h3>
                            </div>
                            <button className="btn-icon btn-ghost" onClick={() => setPrintOrder(null)}>
                                <X size={18} />
                            </button>
                        </div>

                        <div className="print-slip-paper" id="printable-order-slip">
                            <div className="slip-brand-header">
                                <h2>PANDEY GROCERY STORE</h2>
                                <p>Kaladhungi Road, Haldwani, Uttarakhand</p>
                                <p>Helpline: +91 79069 66085 • GSTIN: Verified</p>
                            </div>

                            <div className="slip-order-meta">
                                <div className="slip-meta-col">
                                    <span>Order Number: <strong>#{printOrder.orderNumber || printOrder.id}</strong></span>
                                    <span>Date: {printOrder.date}</span>
                                    <span>Payment: {printOrder.payment?.toUpperCase()}</span>
                                </div>
                                <div className="slip-meta-col">
                                    <span>Customer: <strong>{printOrder.customer}</strong></span>
                                    <span>Phone: {printOrder.phone}</span>
                                    <span>Type: {printOrder.deliveryType === 'pickup' ? 'Counter Pickup' : 'Home Delivery'}</span>
                                </div>
                            </div>

                            {printOrder.address && (
                                <div className="slip-address-box">
                                    <strong>Delivery Address:</strong> {printOrder.address}
                                </div>
                            )}

                            <table className="slip-items-table">
                                <thead>
                                    <tr>
                                        <th>Item Description</th>
                                        <th>Type</th>
                                        <th>Qty</th>
                                        <th>Rate</th>
                                        <th>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {printOrder.items?.map((item, idx) => {
                                        const isWeight = item.name?.includes('(') || item.name?.toLowerCase().includes('g') || item.name?.toLowerCase().includes('kg');
                                        return (
                                            <tr key={idx}>
                                                <td>{item.name}</td>
                                                <td>{isWeight ? 'By Weight' : 'Pack'}</td>
                                                <td>{item.qty || item.quantity}</td>
                                                <td>₹{item.price}</td>
                                                <td>₹{(item.price * (item.qty || item.quantity)).toFixed(2)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            <div className="slip-totals-summary">
                                <div className="slip-total-line">
                                    <span>Subtotal:</span>
                                    <span>₹{printOrder.subtotal || printOrder.total}</span>
                                </div>
                                {printOrder.discount > 0 && (
                                    <div className="slip-total-line discount">
                                        <span>Coupon Discount:</span>
                                        <span>-₹{printOrder.discount}</span>
                                    </div>
                                )}
                                <div className="slip-total-line grand-total">
                                    <strong>Grand Total:</strong>
                                    <strong>₹{printOrder.total}</strong>
                                </div>
                            </div>

                            <div className="slip-footer-note">
                                <p>Thank you for shopping with Pandey Grocery Store!</p>
                                <p>Fresh daily essentials delivered to your doorstep in Haldwani.</p>
                            </div>
                        </div>

                        <div className="print-modal-footer no-print">
                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setPrintOrder(null)}>
                                Close
                            </button>
                            <button type="button" className="btn btn-primary btn-sm" onClick={() => window.print()}>
                                <Printer size={15} /> Print Slip
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
