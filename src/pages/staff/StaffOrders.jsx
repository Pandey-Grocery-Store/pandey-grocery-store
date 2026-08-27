import { useState, useEffect, useCallback } from 'react';
import { statusLabels, statusColors, orderStatuses } from '../../data/orders';
import { ordersApi, productsApi } from '../../lib/api';
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
    IndianRupee,
    Calendar,
    AlertCircle,
    UserCheck,
    FileText,
    PlusCircle,
    BadgeAlert,
    Wallet,
    CreditCard
} from 'lucide-react';
import './StaffOrders.css';

export default function StaffOrders() {
    const [orderList, setOrderList] = useState([]);
    const [productList, setProductList] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // View mode: 'orders' | 'khata'
    const [activeView, setActiveView] = useState('orders');

    // Filters
    const [statusFilter, setStatusFilter] = useState('all');
    const [paymentFilter, setPaymentFilter] = useState('all'); // 'all' | 'PAID' | 'PENDING' | 'PARTIAL'
    const [timeframeFilter, setTimeframeFilter] = useState('all'); // 'all' | 'week' | 'month' | 'year'
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedId, setExpandedId] = useState(null);
    const [printOrder, setPrintOrder] = useState(null);
    const [updatingId, setUpdatingId] = useState(null);

    // Partial Payment Settle Modal
    const [settleModalOrder, setSettleModalOrder] = useState(null);
    const [settlePaidAmt, setSettlePaidAmt] = useState('');
    const [settleMode, setSettleMode] = useState('cash'); // 'cash' | 'upi'

    // Manager "+ Create Order / Khata Entry" Modal State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createCustomerName, setCreateCustomerName] = useState('');
    const [createCustomerPhone, setCreateCustomerPhone] = useState('');
    const [createCustomerAddress, setCreateCustomerAddress] = useState('In-store Counter Sale');
    const [createPaymentType, setCreatePaymentType] = useState('PAID_CASH'); // 'PAID_CASH' | 'PAID_UPI' | 'KHATA_DUE' | 'KHATA_PARTIAL'
    const [createPartialPaid, setCreatePartialPaid] = useState('');
    const [createSelectedItems, setCreateSelectedItems] = useState([]);
    const [createSearchProduct, setCreateSearchProduct] = useState('');
    const [createSubmitting, setCreateSubmitting] = useState(false);
    const [createError, setCreateError] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [orderData, prodData] = await Promise.all([
                ordersApi.getAll(),
                productsApi.getAll()
            ]);
            setOrderList(orderData?.orders || []);
            if (prodData?.products) setProductList(prodData.products);
        } catch (err) {
            console.error('Failed to load orders/products', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Filter Logic by Status, Payment (Left vs Done), Timeframe (Week/Month/Year), and Search
    const now = new Date();
    const filteredOrders = orderList.filter((o) => {
        // Status filter
        const matchStatus = statusFilter === 'all' || o.status === statusFilter;

        // Payment status filter (Left / Done / Partial)
        const matchPayment = paymentFilter === 'all' || o.paymentStatus === paymentFilter;

        // Timeframe filter (Week / Month / Year)
        let matchTimeframe = true;
        if (timeframeFilter !== 'all') {
            const orderDate = new Date(o.createdAt || o.date);
            if (timeframeFilter === 'week') {
                const diffTime = Math.abs(now - orderDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                matchTimeframe = diffDays <= 7;
            } else if (timeframeFilter === 'month') {
                matchTimeframe = orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
            } else if (timeframeFilter === 'year') {
                matchTimeframe = orderDate.getFullYear() === now.getFullYear();
            }
        }

        // Search query
        const matchSearch = searchQuery === '' || 
                            o.id?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (o.orderNumber && o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
                            o.customer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (o.phone && o.phone.includes(searchQuery));

        return matchStatus && matchPayment && matchTimeframe && matchSearch;
    });

    // Metric Calculations
    const totalCollectedPaid = filteredOrders.reduce((sum, o) => sum + (Number(o.paidAmount) || (o.paymentStatus === 'PAID' ? Number(o.total) : 0)), 0);
    const totalPaymentLeftDue = filteredOrders.reduce((sum, o) => sum + (Number(o.dueAmount) || (o.paymentStatus === 'PENDING' ? Number(o.total) : 0)), 0);
    const pendingDueOrdersCount = filteredOrders.filter(o => o.paymentStatus === 'PENDING' || o.paymentStatus === 'PARTIAL').length;

    // Advance fulfillment status
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

    // Settle / Mark Payment Done Hand-to-Hand
    const handleQuickSettlePaid = async (order, mode = 'paid_cash') => {
        setUpdatingId(order.id);
        try {
            await ordersApi.updatePayment(order.dbId || order.id, {
                paymentStatus: 'PAID',
                paidAmount: Number(order.total),
                dueAmount: 0,
                paymentMode: mode
            });
        } catch { /* fallback */ }
        setOrderList((prev) =>
            prev.map((o) => (o.id === order.id ? { ...o, paymentStatus: 'PAID', paidAmount: o.total, dueAmount: 0, payment: mode } : o))
        );
        setUpdatingId(null);
    };

    // Record Partial Payment Settlement
    const handleSavePartialPayment = async (e) => {
        e.preventDefault();
        if (!settleModalOrder) return;
        const paidNow = Number(settlePaidAmt) || 0;
        const totalAmt = Number(settleModalOrder.total) || 0;
        const previouslyPaid = Number(settleModalOrder.paidAmount) || 0;
        const newTotalPaid = previouslyPaid + paidNow;
        const newDue = Math.max(0, totalAmt - newTotalPaid);
        const newStatus = newDue === 0 ? 'PAID' : 'PARTIAL';

        setUpdatingId(settleModalOrder.id);
        try {
            await ordersApi.updatePayment(settleModalOrder.dbId || settleModalOrder.id, {
                paymentStatus: newStatus,
                paidAmount: newTotalPaid,
                dueAmount: newDue,
                paymentMode: settleMode === 'cash' ? 'paid_cash' : 'paid_upi'
            });
        } catch { /* fallback */ }

        setOrderList((prev) =>
            prev.map((o) => (o.id === settleModalOrder.id ? {
                ...o,
                paymentStatus: newStatus,
                paidAmount: newTotalPaid,
                dueAmount: newDue,
                payment: settleMode === 'cash' ? 'paid_cash' : 'paid_upi'
            } : o))
        );

        setSettleModalOrder(null);
        setSettlePaidAmt('');
        setUpdatingId(null);
    };

    // Add item to new order in creation modal
    const handleAddItemToCreate = (prod) => {
        const isWeight = prod.unit?.toLowerCase().includes('kg') || prod.description?.includes('[TYPE:weight]');
        const existing = createSelectedItems.find(i => i.id === prod.id);
        if (existing) {
            setCreateSelectedItems(createSelectedItems.map(i => i.id === prod.id ? { ...i, quantity: i.quantity + 1 } : i));
        } else {
            setCreateSelectedItems([...createSelectedItems, {
                id: prod.id,
                name: isWeight ? `${prod.name} (1 kg)` : prod.name,
                price: Number(prod.price),
                quantity: 1,
                image: prod.image
            }]);
        }
    };

    const handleCreateOrderSubmit = async (e) => {
        e.preventDefault();
        setCreateError('');
        if (!createSelectedItems.length) {
            setCreateError('Please select at least 1 product item');
            return;
        }
        if (!createCustomerName.trim()) {
            setCreateError('Customer name is required');
            return;
        }

        const subtotal = createSelectedItems.reduce((s, i) => s + (i.price * i.quantity), 0);
        const total = subtotal;
        let paidAmt = total;
        let dueAmt = 0;

        if (createPaymentType === 'KHATA_DUE') {
            paidAmt = 0;
            dueAmt = total;
        } else if (createPaymentType === 'KHATA_PARTIAL') {
            paidAmt = Number(createPartialPaid) || 0;
            dueAmt = Math.max(0, total - paidAmt);
        }

        setCreateSubmitting(true);
        try {
            const res = await ordersApi.staffCreate({
                customerName: createCustomerName,
                customerPhone: createCustomerPhone,
                customerAddress: createCustomerAddress,
                items: createSelectedItems,
                subtotal,
                discount: 0,
                total,
                paymentType: createPaymentType,
                paidAmount: paidAmt,
                dueAmount: dueAmt,
                deliveryType: 'pickup',
                notes: 'Store Counter Sale'
            });

            if (res?.order) {
                setOrderList(prev => [res.order, ...prev]);
            }
            setShowCreateModal(false);
            setCreateSelectedItems([]);
            setCreateCustomerName('');
            setCreateCustomerPhone('');
            fetchData();
        } catch (err) {
            console.error('Failed to create store order', err);
            setCreateError('Failed to create order. Please try again.');
        } finally {
            setCreateSubmitting(false);
        }
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
            {/* Page Header with Dual Tabs & Create Action */}
            <div className="dashboard-page-header">
                <div className="dash-header-title-block">
                    <h1 className="dashboard-page-title">Store Orders &amp; Kirana Khata Ledger</h1>
                    <p className="dashboard-page-subtitle">Track hand-to-hand payments, end-of-month udhar &amp; customer balances</p>
                </div>
                <div className="dash-header-actions">
                    <button className="btn btn-primary create-order-btn" onClick={() => setShowCreateModal(true)}>
                        <PlusCircle size={16} /> Create Store Order / Khata
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={fetchData} title="Refresh orders">
                        <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
                    </button>
                </div>
            </div>

            {/* View Switcher: Fulfillment Queue vs Kirana Khata Ledger */}
            <div className="orders-view-nav-bar">
                <div className="view-nav-tabs">
                    <button 
                        className={`view-nav-btn ${activeView === 'orders' ? 'active' : ''}`}
                        onClick={() => { setActiveView('orders'); setPaymentFilter('all'); }}
                    >
                        <Package size={15} /> All Orders &amp; Packing Queue ({orderList.length})
                    </button>
                    <button 
                        className={`view-nav-btn khata-tab ${activeView === 'khata' ? 'active' : ''}`}
                        onClick={() => { setActiveView('khata'); setPaymentFilter('PENDING'); }}
                    >
                        <Wallet size={15} /> Kirana Khata (Payment Due / Left) 
                        {pendingDueOrdersCount > 0 && <span className="khata-badge-count">{pendingDueOrdersCount} Due</span>}
                    </button>
                </div>
            </div>

            {/* ─── Metrics Summary Bar ─── */}
            <div className="orders-metrics-row">
                <div className="metric-pill-card">
                    <span className="metric-lbl">Total Billing Records</span>
                    <strong className="metric-val">{filteredOrders.length}</strong>
                </div>
                <div className="metric-pill-card paid-pulse">
                    <span className="metric-lbl">🟢 Payment Collected (Done)</span>
                    <strong className="metric-val text-success">₹{totalCollectedPaid.toLocaleString('en-IN')}</strong>
                </div>
                <div className="metric-pill-card due-pulse">
                    <span className="metric-lbl">🔴 Payment Left (Khata Due / Udhar)</span>
                    <strong className="metric-val text-danger">₹{totalPaymentLeftDue.toLocaleString('en-IN')}</strong>
                </div>
                <div className="metric-pill-card">
                    <span className="metric-lbl">Pending Khata Accounts</span>
                    <strong className="metric-val text-warning">{pendingDueOrdersCount} Accounts</strong>
                </div>
            </div>

            {/* ─── Control Bar (Timeframe Filter + Payment Filter + Search) ─── */}
            <div className="orders-control-bar card">
                
                {/* 1. Timeframe Filters: Week / Month / Year */}
                <div className="timeframe-filters-group">
                    <span className="control-section-label"><Calendar size={13} /> Timeframe:</span>
                    <button 
                        className={`timeframe-chip ${timeframeFilter === 'week' ? 'active' : ''}`}
                        onClick={() => setTimeframeFilter('week')}
                    >
                        This Week
                    </button>
                    <button 
                        className={`timeframe-chip ${timeframeFilter === 'month' ? 'active' : ''}`}
                        onClick={() => setTimeframeFilter('month')}
                    >
                        This Month
                    </button>
                    <button 
                        className={`timeframe-chip ${timeframeFilter === 'year' ? 'active' : ''}`}
                        onClick={() => setTimeframeFilter('year')}
                    >
                        This Year
                    </button>
                    <button 
                        className={`timeframe-chip ${timeframeFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setTimeframeFilter('all')}
                    >
                        All Time
                    </button>
                </div>

                {/* 2. Payment Status Filters: Left vs Done */}
                <div className="payment-status-filters-group">
                    <span className="control-section-label"><CreditCard size={13} /> Payment:</span>
                    <button 
                        className={`pay-filter-chip ${paymentFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setPaymentFilter('all')}
                    >
                        All
                    </button>
                    <button 
                        className={`pay-filter-chip due ${paymentFilter === 'PENDING' ? 'active' : ''}`}
                        onClick={() => setPaymentFilter('PENDING')}
                    >
                        🔴 Payment Left (Due)
                    </button>
                    <button 
                        className={`pay-filter-chip paid ${paymentFilter === 'PAID' ? 'active' : ''}`}
                        onClick={() => setPaymentFilter('PAID')}
                    >
                        🟢 Payment Done (Paid)
                    </button>
                    <button 
                        className={`pay-filter-chip partial ${paymentFilter === 'PARTIAL' ? 'active' : ''}`}
                        onClick={() => setPaymentFilter('PARTIAL')}
                    >
                        🟠 Partial Paid
                    </button>
                </div>

                {/* 3. Search Box */}
                <div className="orders-search-box">
                    <Search size={16} className="orders-search-icon" />
                    <input
                        type="text"
                        placeholder="Search by customer name, phone, or #ORD..."
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

            {/* Orders Feed & Table */}
            {loading ? (
                <div className="orders-loading-state card">
                    <Loader size={32} className="spin" color="var(--primary)" />
                    <p>Loading store orders &amp; khata records...</p>
                </div>
            ) : filteredOrders.length === 0 ? (
                <div className="orders-empty-state card">
                    <ShoppingBag size={48} color="#cbd5e1" />
                    <h3>No matching records found</h3>
                    <p>There are no orders matching your selected timeframe or payment filter.</p>
                </div>
            ) : (
                <>
                    {/* Desktop Table View */}
                    <div className="orders-table-wrapper card hidden-mobile-table">
                        <table className="orders-table">
                            <thead>
                                <tr>
                                    <th>Order Info</th>
                                    <th>Customer &amp; Phone</th>
                                    <th>Items Checklist</th>
                                    <th>Total Bill</th>
                                    <th>Payment Status</th>
                                    <th>Collected / Left</th>
                                    <th>Fulfillment</th>
                                    <th>Khata Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.map((order) => {
                                    const StatusIcon = statusIcons[order.status] || Package;
                                    const next = getNextStatus(order.status);
                                    const isExpanded = expandedId === order.id;
                                    const isPaymentDue = order.paymentStatus === 'PENDING' || order.paymentStatus === 'PARTIAL';

                                    return (
                                        <>
                                            <tr key={order.id} className={`order-row ${isExpanded ? 'expanded' : ''} ${isPaymentDue ? 'khata-due-row' : ''}`}>
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
                                                    <span className={`payment-status-pill ${order.paymentStatus === 'PAID' ? 'paid' : order.paymentStatus === 'PARTIAL' ? 'partial' : 'due'}`}>
                                                        {order.paymentStatus === 'PAID' ? '🟢 Payment Done' : order.paymentStatus === 'PARTIAL' ? '🟠 Partial Paid' : '🔴 Payment Left (Due)'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="paid-due-cell-box">
                                                        <span className="paid-txt">Paid: ₹{order.paidAmount || (order.paymentStatus === 'PAID' ? order.total : 0)}</span>
                                                        {order.dueAmount > 0 && <span className="due-txt">Due: ₹{order.dueAmount}</span>}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="status-chip" style={{ background: `${statusColors[order.status]}18`, color: statusColors[order.status] }}>
                                                        <StatusIcon size={13} /> {statusLabels[order.status]}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="order-actions-cell">
                                                        {/* Quick Settle Payment Button if Payment is Left */}
                                                        {isPaymentDue ? (
                                                            <>
                                                                <button 
                                                                    className="btn btn-xs btn-primary settle-paid-btn" 
                                                                    onClick={() => handleQuickSettlePaid(order, 'paid_cash')}
                                                                    title="Customer paid hand-to-hand full amount"
                                                                    disabled={updatingId === order.id}
                                                                >
                                                                    <Check size={12} /> Mark Paid
                                                                </button>
                                                                <button 
                                                                    className="btn btn-xs btn-secondary" 
                                                                    onClick={() => { setSettleModalOrder(order); setSettlePaidAmt(''); }}
                                                                    title="Record partial payment"
                                                                >
                                                                    Partial
                                                                </button>
                                                            </>
                                                        ) : (
                                                            next && (
                                                                <button 
                                                                    className="btn btn-xs btn-secondary next-status-btn" 
                                                                    onClick={() => updateStatus(order, next)}
                                                                    disabled={updatingId === order.id}
                                                                >
                                                                    → {statusLabels[next]}
                                                                </button>
                                                            )
                                                        )}

                                                        <button 
                                                            className="btn-icon btn-ghost btn-sm" 
                                                            onClick={() => setPrintOrder(order)} 
                                                            title="Print Thermal Bill / Receipt"
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

                                                            {/* Khata Settlement & WhatsApp Reminder */}
                                                            <div className="expanded-section">
                                                                <h4>Khata Settlement &amp; Reminder</h4>
                                                                <div className="khata-info-drawer-card">
                                                                    <div className="khata-drawer-line">
                                                                        <span>Total Bill: <strong>₹{order.total}</strong></span>
                                                                        <span>Paid: <strong className="text-success">₹{order.paidAmount || (order.paymentStatus === 'PAID' ? order.total : 0)}</strong></span>
                                                                        <span>Remaining Due: <strong className="text-danger">₹{order.dueAmount || 0}</strong></span>
                                                                    </div>
                                                                    
                                                                    <div className="khata-drawer-actions">
                                                                        {order.dueAmount > 0 && (
                                                                            <>
                                                                                <button className="btn btn-primary btn-xs" onClick={() => handleQuickSettlePaid(order, 'paid_cash')}>
                                                                                    <Check size={12} /> Settle in Cash (Hand-to-Hand)
                                                                                </button>
                                                                                <button className="btn btn-secondary btn-xs" onClick={() => handleQuickSettlePaid(order, 'paid_upi')}>
                                                                                    <Check size={12} /> Settle via UPI
                                                                                </button>
                                                                            </>
                                                                        )}

                                                                        {order.phone && (
                                                                            <a 
                                                                                href={`https://wa.me/91${order.phone.replace(/[^0-9]/g, '')}?text=Namaste%20${encodeURIComponent(order.customer)},%20greeting%20from%20Pandey%20Grocery%20Store%20Haldwani.%20Your%20khata%20balance%20for%20Order%20%23${order.orderNumber}%20is%20Rs.%20${order.dueAmount || order.total}.%20Kindly%20clear%20at%20your%20convenience.%20Thank%20you!`} 
                                                                                target="_blank" 
                                                                                rel="noreferrer" 
                                                                                className="contact-chip whatsapp"
                                                                            >
                                                                                <MessageSquare size={12} /> Send WhatsApp Khata Reminder
                                                                            </a>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Fulfillment Status Stepper */}
                                                            <div className="expanded-section">
                                                                <h4>Fulfillment Progression</h4>
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

                    {/* Mobile View Khata Cards Feed */}
                    <div className="orders-mobile-cards-feed show-mobile-cards">
                        {filteredOrders.map((order) => {
                            const StatusIcon = statusIcons[order.status] || Package;
                            const isExpanded = expandedId === order.id;
                            const isPaymentDue = order.paymentStatus === 'PENDING' || order.paymentStatus === 'PARTIAL';

                            return (
                                <div key={order.id} className={`order-mobile-card card ${isPaymentDue ? 'khata-due-card' : ''}`}>
                                    <div className="mobile-card-top">
                                        <div>
                                            <span className="m-order-id">#{order.orderNumber || order.id}</span>
                                            <span className="m-order-date">{order.date}</span>
                                        </div>
                                        <span className={`payment-status-pill ${order.paymentStatus === 'PAID' ? 'paid' : order.paymentStatus === 'PARTIAL' ? 'partial' : 'due'}`}>
                                            {order.paymentStatus === 'PAID' ? '🟢 Paid' : order.paymentStatus === 'PARTIAL' ? '🟠 Partial' : '🔴 Payment Left'}
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
                                        <span className="m-total-amount">Total: ₹{order.total}</span>
                                        {order.dueAmount > 0 ? (
                                            <span className="m-due-amount">Due: ₹{order.dueAmount}</span>
                                        ) : (
                                            <span className="m-paid-amount">Paid: ₹{order.total}</span>
                                        )}
                                    </div>

                                    {/* Mobile Item Breakdown */}
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

                                            {order.phone && isPaymentDue && (
                                                <a 
                                                    href={`https://wa.me/91${order.phone.replace(/[^0-9]/g, '')}?text=Namaste%20${encodeURIComponent(order.customer)},%20Pandey%20Grocery%20Store%20balance%20reminder:%20Rs.%20${order.dueAmount || order.total}%20is%20due.%20Thank%20you!`} 
                                                    target="_blank" 
                                                    rel="noreferrer" 
                                                    className="contact-chip whatsapp mt-2"
                                                >
                                                    <MessageSquare size={12} /> Send WhatsApp Reminder
                                                </a>
                                            )}
                                        </div>
                                    )}

                                    {/* Mobile Action Buttons */}
                                    <div className="mobile-card-actions">
                                        {isPaymentDue ? (
                                            <button 
                                                className="btn btn-primary btn-xs"
                                                onClick={() => handleQuickSettlePaid(order, 'paid_cash')}
                                            >
                                                <Check size={12} /> Mark Paid (Cash)
                                            </button>
                                        ) : null}

                                        <button 
                                            className="btn btn-ghost btn-xs"
                                            onClick={() => setExpandedId(isExpanded ? null : order.id)}
                                        >
                                            {isExpanded ? 'Hide' : 'Details'}
                                        </button>
                                        <button 
                                            className="btn-icon btn-ghost btn-xs" 
                                            onClick={() => setPrintOrder(order)} 
                                            title="Print Slip"
                                        >
                                            <Printer size={14} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* ══════════════════════════════════════════════════════════
                ✨ RECORD PARTIAL PAYMENT MODAL
                ══════════════════════════════════════════════════════════ */}
            {settleModalOrder && (
                <div className="modal-overlay animate-fade-in" onClick={() => setSettleModalOrder(null)}>
                    <div className="settle-modal-dialog card" onClick={e => e.stopPropagation()}>
                        <div className="settle-modal-header">
                            <div className="settle-title">
                                <Wallet size={18} color="var(--primary)" />
                                <h3>Record Partial Khata Payment</h3>
                            </div>
                            <button className="btn-icon btn-ghost" onClick={() => setSettleModalOrder(null)}>
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSavePartialPayment} className="settle-modal-form">
                            <div className="settle-summary-box">
                                <div>Order: <strong>#{settleModalOrder.orderNumber || settleModalOrder.id}</strong></div>
                                <div>Customer: <strong>{settleModalOrder.customer}</strong></div>
                                <div>Total Bill: <strong>₹{settleModalOrder.total}</strong></div>
                                <div>Currently Paid: <strong className="text-success">₹{settleModalOrder.paidAmount || 0}</strong></div>
                                <div>Current Balance Due: <strong className="text-danger">₹{settleModalOrder.dueAmount || settleModalOrder.total}</strong></div>
                            </div>

                            <div className="ap-input-group mt-2">
                                <label>Amount Receiving Now (₹) *</label>
                                <input 
                                    type="number" 
                                    className="input" 
                                    placeholder="e.g. 200, 500" 
                                    value={settlePaidAmt} 
                                    onChange={e => setSettlePaidAmt(e.target.value)} 
                                    max={settleModalOrder.dueAmount || settleModalOrder.total}
                                    required 
                                    autoFocus
                                />
                            </div>

                            <div className="ap-input-group mt-2">
                                <label>Payment Method</label>
                                <select className="input" value={settleMode} onChange={e => setSettleMode(e.target.value)}>
                                    <option value="cash">Hand-to-Hand Cash</option>
                                    <option value="upi">UPI / Online Transfer</option>
                                </select>
                            </div>

                            <div className="settle-modal-footer mt-3">
                                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSettleModalOrder(null)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary btn-sm" disabled={!settlePaidAmt || Number(settlePaidAmt) <= 0}>
                                    <Check size={14} /> Update Khata Balance
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════
                ✨ MANAGER CREATE ORDER / KHATA ENTRY ON BEHALF OF CUSTOMER
                ══════════════════════════════════════════════════════════ */}
            {showCreateModal && (
                <div className="modal-overlay animate-fade-in" onClick={() => setShowCreateModal(false)}>
                    <div className="manager-create-order-dialog card" onClick={e => e.stopPropagation()}>
                        <div className="create-order-header">
                            <div className="create-title-box">
                                <PlusCircle size={20} color="var(--primary)" />
                                <div>
                                    <h3>Create Store Order / Khata Entry</h3>
                                    <p>Bill products on behalf of walk-in or monthly credit customers</p>
                                </div>
                            </div>
                            <button className="btn-icon btn-ghost" onClick={() => setShowCreateModal(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        {createError && (
                            <div className="ap-alert-box error animate-fade-in">
                                <AlertCircle size={16} />
                                <span>{createError}</span>
                            </div>
                        )}

                        <form onSubmit={handleCreateOrderSubmit} className="create-order-body">
                            <div className="create-order-grid">
                                
                                {/* Left Side: Customer & Payment Option */}
                                <div className="create-left-pane">
                                    <div className="create-section-card">
                                        <h4>1. Customer Details</h4>
                                        <div className="ap-input-group">
                                            <label>Customer Name *</label>
                                            <input 
                                                type="text" 
                                                className="input" 
                                                placeholder="e.g. Ramesh Sharma (Khata Account)" 
                                                value={createCustomerName} 
                                                onChange={e => setCreateCustomerName(e.target.value)} 
                                                required 
                                            />
                                        </div>

                                        <div className="ap-input-group mt-2">
                                            <label>Phone Number (For WhatsApp / SMS)</label>
                                            <input 
                                                type="tel" 
                                                className="input" 
                                                placeholder="e.g. 9876543210" 
                                                value={createCustomerPhone} 
                                                onChange={e => setCreateCustomerPhone(e.target.value)} 
                                            />
                                        </div>
                                    </div>

                                    <div className="create-section-card mt-2">
                                        <h4>2. Payment Option</h4>
                                        <div className="create-payment-options">
                                            <label className={`pay-opt-box ${createPaymentType === 'PAID_CASH' ? 'active' : ''}`}>
                                                <input 
                                                    type="radio" 
                                                    name="payType" 
                                                    checked={createPaymentType === 'PAID_CASH'} 
                                                    onChange={() => setCreatePaymentType('PAID_CASH')} 
                                                />
                                                <div>
                                                    <strong>🟢 Paid Hand-to-Hand (Cash)</strong>
                                                    <span>Payment collected immediately</span>
                                                </div>
                                            </label>

                                            <label className={`pay-opt-box ${createPaymentType === 'PAID_UPI' ? 'active' : ''}`}>
                                                <input 
                                                    type="radio" 
                                                    name="payType" 
                                                    checked={createPaymentType === 'PAID_UPI'} 
                                                    onChange={() => setCreatePaymentType('PAID_UPI')} 
                                                />
                                                <div>
                                                    <strong>🟢 Paid via UPI / Online</strong>
                                                    <span>QR Code / GPay / PhonePe</span>
                                                </div>
                                            </label>

                                            <label className={`pay-opt-box ${createPaymentType === 'KHATA_DUE' ? 'active' : ''}`}>
                                                <input 
                                                    type="radio" 
                                                    name="payType" 
                                                    checked={createPaymentType === 'KHATA_DUE'} 
                                                    onChange={() => setCreatePaymentType('KHATA_DUE')} 
                                                />
                                                <div>
                                                    <strong>🔴 Payment Left (Monthly Khata / Udhar)</strong>
                                                    <span>Customer will pay at end of month</span>
                                                </div>
                                            </label>

                                            <label className={`pay-opt-box ${createPaymentType === 'KHATA_PARTIAL' ? 'active' : ''}`}>
                                                <input 
                                                    type="radio" 
                                                    name="payType" 
                                                    checked={createPaymentType === 'KHATA_PARTIAL'} 
                                                    onChange={() => setCreatePaymentType('KHATA_PARTIAL')} 
                                                />
                                                <div>
                                                    <strong>🟠 Partial Payment (Advance)</strong>
                                                    <span>Part paid hand-to-hand, rest due</span>
                                                </div>
                                            </label>
                                        </div>

                                        {createPaymentType === 'KHATA_PARTIAL' && (
                                            <div className="ap-input-group mt-2">
                                                <label>Amount Paid Hand-to-Hand Now (₹):</label>
                                                <input 
                                                    type="number" 
                                                    className="input" 
                                                    placeholder="e.g. 200" 
                                                    value={createPartialPaid} 
                                                    onChange={e => setCreatePartialPaid(e.target.value)} 
                                                    required 
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right Side: Product Catalog Selection & Bill Items */}
                                <div className="create-right-pane">
                                    <div className="create-section-card">
                                        <h4>3. Add Products to Bill</h4>
                                        <div className="pos-prod-search">
                                            <Search size={15} />
                                            <input 
                                                type="text" 
                                                placeholder="Search rice, dal, soap, pen..." 
                                                value={createSearchProduct} 
                                                onChange={e => setCreateSearchProduct(e.target.value)} 
                                            />
                                        </div>

                                        <div className="pos-quick-item-grid">
                                            {productList
                                                .filter(p => !createSearchProduct || p.name.toLowerCase().includes(createSearchProduct.toLowerCase()))
                                                .slice(0, 8)
                                                .map(prod => (
                                                    <button 
                                                        type="button" 
                                                        key={prod.id} 
                                                        className="pos-quick-chip"
                                                        onClick={() => handleAddItemToCreate(prod)}
                                                    >
                                                        <span className="p-chip-name">{prod.name}</span>
                                                        <span className="p-chip-pr">₹{prod.price}</span>
                                                    </button>
                                                ))}
                                        </div>

                                        {/* Selected Items Table */}
                                        <h5 className="mt-3">Selected Items ({createSelectedItems.length})</h5>
                                        <div className="create-items-table-box">
                                            {createSelectedItems.length === 0 ? (
                                                <p className="no-items-txt">Click products above to add to this order</p>
                                            ) : (
                                                createSelectedItems.map((item, idx) => (
                                                    <div key={idx} className="create-item-row">
                                                        <span>{item.name}</span>
                                                        <div className="create-item-actions">
                                                            <button type="button" onClick={() => setCreateSelectedItems(createSelectedItems.map((i, ix) => ix === idx ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i))}>-</button>
                                                            <span>{item.quantity}</span>
                                                            <button type="button" onClick={() => setCreateSelectedItems(createSelectedItems.map((i, ix) => ix === idx ? { ...i, quantity: i.quantity + 1 } : i))}>+</button>
                                                            <strong>₹{item.price * item.quantity}</strong>
                                                            <button type="button" className="remove-btn" onClick={() => setCreateSelectedItems(createSelectedItems.filter((_, ix) => ix !== idx))}>×</button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>

                                        {/* Grand Total Summary */}
                                        <div className="create-grand-total-row">
                                            <span>Total Bill:</span>
                                            <strong>₹{createSelectedItems.reduce((s, i) => s + (i.price * i.quantity), 0)}</strong>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="create-modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={createSubmitting || !createSelectedItems.length}>
                                    {createSubmitting ? <><Loader size={15} className="spin" /> Generating Order...</> : <><Check size={15} /> Save &amp; Record in Khata</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
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
                                <h3>Store Invoice &amp; Khata Statement</h3>
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
                                    <span>Payment Mode: {printOrder.payment?.toUpperCase()}</span>
                                </div>
                                <div className="slip-meta-col">
                                    <span>Customer: <strong>{printOrder.customer}</strong></span>
                                    <span>Phone: {printOrder.phone}</span>
                                    <span>Payment Status: <strong>{printOrder.paymentStatus || 'PAID'}</strong></span>
                                </div>
                            </div>

                            <table className="slip-items-table">
                                <thead>
                                    <tr>
                                        <th>Item Description</th>
                                        <th>Qty</th>
                                        <th>Rate</th>
                                        <th>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {printOrder.items?.map((item, idx) => (
                                        <tr key={idx}>
                                            <td>{item.name}</td>
                                            <td>{item.qty || item.quantity}</td>
                                            <td>₹{item.price}</td>
                                            <td>₹{(item.price * (item.qty || item.quantity)).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="slip-totals-summary">
                                <div className="slip-total-line">
                                    <span>Total Bill:</span>
                                    <span>₹{printOrder.total}</span>
                                </div>
                                <div className="slip-total-line">
                                    <span>Amount Paid:</span>
                                    <span>₹{printOrder.paidAmount || (printOrder.paymentStatus === 'PAID' ? printOrder.total : 0)}</span>
                                </div>
                                <div className="slip-total-line grand-total">
                                    <strong>Balance Due:</strong>
                                    <strong>₹{printOrder.dueAmount || 0}</strong>
                                </div>
                            </div>

                            <div className="slip-footer-note">
                                <p>Thank you for shopping with Pandey Grocery Store!</p>
                                <p>Haldwani local store • Khata balance statement</p>
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
