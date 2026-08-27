import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
    MapPin, 
    Clock, 
    Phone, 
    ArrowLeft, 
    Loader, 
    Truck, 
    Package, 
    CheckCircle2, 
    Store, 
    Scale, 
    Box, 
    Printer, 
    ShieldCheck, 
    HelpCircle,
    ChevronRight,
    ShoppingBag
} from 'lucide-react';
import { ordersApi } from '../../lib/api';
import { statusLabels, statusColors, orderStatuses } from '../../data/orders';
import 'leaflet/dist/leaflet.css';
import './OrderTracking.css';

// Haldwani Store Location
const STORE_LOCATION = { lat: 29.2183, lng: 79.5130 };

const STAGES = [
    { key: 'new', label: 'Order Received', desc: 'Store has verified your order', icon: Clock },
    { key: 'packing', label: 'Packing Line', desc: 'Fresh groceries being packed & weighed', icon: Package },
    { key: 'packed', label: 'Ready for Dispatch', desc: 'Quality checked & sealed', icon: ShieldCheck },
    { key: 'dispatched', label: 'Out for Delivery', desc: 'Rider is on the way in Haldwani', icon: Truck },
    { key: 'delivered', label: 'Delivered', desc: 'Handed over to customer', icon: CheckCircle2 },
];

export default function OrderTracking() {
    const { orderId } = useParams();
    const [order, setOrder] = useState(null);
    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingLocation, setLoadingLocation] = useState(false);
    const [error, setError] = useState('');
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerRef = useRef(null);
    const token = localStorage.getItem('auth_token');

    // Fetch order details
    useEffect(() => {
        const fetchOrderData = async () => {
            setLoading(true);
            try {
                const res = await ordersApi.getById(orderId);
                if (res?.order) {
                    setOrder(res.order);
                } else {
                    // Fallback search in my orders
                    const myRes = await ordersApi.getMyOrders();
                    const matched = myRes?.orders?.find(o => o.id === orderId || o.orderNumber === orderId || o.dbId === orderId);
                    if (matched) setOrder(matched);
                }
            } catch (err) {
                console.error('Failed to load order', err);
            } finally {
                setLoading(false);
            }
        };
        fetchOrderData();
    }, [orderId]);

    // Fetch delivery GPS location if dispatched
    useEffect(() => {
        if (!order || order.status !== 'dispatched') return;
        let interval;

        const fetchLocation = async () => {
            try {
                const res = await fetch(`/api/delivery/location/${orderId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (data?.location) {
                    setLocation(data.location);
                }
            } catch { /* GPS fallback */ }
        };

        fetchLocation();
        interval = setInterval(fetchLocation, 5000);
        return () => clearInterval(interval);
    }, [orderId, order?.status, token]);

    // Initialize Map if location is available
    useEffect(() => {
        if (!location || !mapRef.current) return;

        const initMap = async () => {
            const L = (await import('leaflet')).default;

            delete L.Icon.Default.prototype._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            });

            const deliveryIcon = L.divIcon({
                html: '<div style="background:#059669;color:white;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(5,150,105,0.4);border:3px solid white;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg></div>',
                iconSize: [36, 36],
                iconAnchor: [18, 18],
                className: '',
            });

            const storeIcon = L.divIcon({
                html: '<div style="background:#0f172a;color:white;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(15,23,42,0.4);border:3px solid white;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/></svg></div>',
                iconSize: [36, 36],
                iconAnchor: [18, 18],
                className: '',
            });

            if (!mapInstanceRef.current) {
                mapInstanceRef.current = L.map(mapRef.current).setView([location.lat || STORE_LOCATION.lat, location.lng || STORE_LOCATION.lng], 14);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; OpenStreetMap contributors',
                }).addTo(mapInstanceRef.current);

                L.marker([STORE_LOCATION.lat, STORE_LOCATION.lng], { icon: storeIcon })
                    .addTo(mapInstanceRef.current)
                    .bindPopup('Pandey Grocery Store (Kaladhungi Rd, Haldwani)');

                if (location.lat) {
                    markerRef.current = L.marker([location.lat, location.lng], { icon: deliveryIcon })
                        .addTo(mapInstanceRef.current)
                        .bindPopup(`${location.deliveryPersonName || 'Express Rider'} (Delivery Partner)`);
                }
            } else if (markerRef.current && location.lat) {
                markerRef.current.setLatLng([location.lat, location.lng]);
                mapInstanceRef.current.panTo([location.lat, location.lng]);
            }
        };

        initMap();
    }, [location]);

    // Cleanup map instance on unmount
    useEffect(() => {
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    const currentStatusIndex = STAGES.findIndex(s => s.key === order?.status);
    const activeStage = currentStatusIndex >= 0 ? currentStatusIndex : 0;

    return (
        <div className="order-tracking-page animate-fade-in">
            <div className="container">
                {/* Back navigation */}
                <div className="tracking-top-nav">
                    <Link to="/account" className="back-link">
                        <ArrowLeft size={16} /> Back to My Orders
                    </Link>
                    <span className="live-status-pill">
                        <span className="live-status-dot" /> Live Order Stream
                    </span>
                </div>

                {loading ? (
                    <div className="tracking-loading-card card">
                        <Loader size={36} className="spin" color="var(--primary)" />
                        <h3>Loading Live Order Status...</h3>
                        <p>Connecting to store dispatch system in Haldwani</p>
                    </div>
                ) : !order ? (
                    <div className="tracking-not-found card">
                        <ShoppingBag size={48} color="#94a3b8" />
                        <h2>Order #{orderId} not found</h2>
                        <p>Please check the order number or view your active orders from the account dashboard.</p>
                        <Link to="/account" className="btn btn-primary btn-sm mt-3">
                            Go to My Orders
                        </Link>
                    </div>
                ) : (
                    <div className="tracking-main-grid">
                        {/* ── Left Column: Live Status Pipeline & Tracking Map ── */}
                        <div className="tracking-left-col">
                            
                            {/* Order Header Card */}
                            <div className="tracking-header-card card">
                                <div className="th-top-row">
                                    <div>
                                        <span className="th-order-tag">Order Details</span>
                                        <h1 className="th-order-id">#{order.orderNumber || order.id}</h1>
                                        <span className="th-date-time">{order.date} • Placed via {order.payment?.toUpperCase()}</span>
                                    </div>
                                    <div className="th-eta-box">
                                        <Clock size={16} color="#059669" />
                                        <div className="th-eta-text">
                                            <span>Estimated Arrival</span>
                                            <strong>15–25 Mins (Express)</strong>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Visual 5-Stage Status Timeline */}
                            <div className="tracking-pipeline-card card">
                                <h3 className="section-title">Fulfillment Progress</h3>
                                
                                <div className="tracking-stepper-timeline">
                                    {STAGES.map((stg, idx) => {
                                        const isDone = idx <= activeStage;
                                        const isCurrent = idx === activeStage;
                                        const Icon = stg.icon;

                                        return (
                                            <div key={stg.key} className={`timeline-step ${isDone ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                                                <div className="step-marker-col">
                                                    <div className="step-circle">
                                                        <Icon size={16} />
                                                    </div>
                                                    {idx < STAGES.length - 1 && <div className="step-line" />}
                                                </div>
                                                <div className="step-text-col">
                                                    <div className="step-head-row">
                                                        <h4>{stg.label}</h4>
                                                        {isCurrent && <span className="step-live-tag">In Progress</span>}
                                                    </div>
                                                    <p>{stg.desc}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Live Delivery Agent & GPS Map (If Out for Delivery) */}
                            {order.status === 'dispatched' && (
                                <div className="tracking-rider-map-card card">
                                    <div className="rider-info-header">
                                        <div className="rider-avatar">
                                            <Truck size={20} color="#ffffff" />
                                        </div>
                                        <div className="rider-text">
                                            <strong>{location?.deliveryPersonName || 'Ramesh Kumar'} (Delivery Partner)</strong>
                                            <span>Pandey Express Fleet • On the way</span>
                                        </div>
                                        <a href="tel:+917906966085" className="btn btn-primary btn-sm rider-call-btn">
                                            <Phone size={14} /> Call Rider
                                        </a>
                                    </div>

                                    {/* Map Container */}
                                    <div className="tracking-map-wrapper">
                                        <div ref={mapRef} className="osm-map-view" />
                                    </div>
                                    <span className="map-caption">
                                        <MapPin size={12} /> Live GPS tracking via OpenStreetMap (Haldwani Area)
                                    </span>
                                </div>
                            )}

                            {/* Store Helpline Assistance Box */}
                            <div className="store-helpline-box card">
                                <div className="helpline-icon"><HelpCircle size={22} color="var(--primary)" /></div>
                                <div className="helpline-text">
                                    <strong>Need Help or Packing Changes?</strong>
                                    <span>Call Pandey Grocery Store counter directly at <strong>+91 79069 66085</strong></span>
                                </div>
                                <a href="tel:+917906966085" className="btn btn-secondary btn-sm">
                                    <Phone size={13} /> Call Store
                                </a>
                            </div>
                        </div>

                        {/* ── Right Column: Itemized Receipt & Weight Breakdown ── */}
                        <div className="tracking-right-col">
                            <div className="order-receipt-card card">
                                <div className="receipt-head">
                                    <h3>Itemized Receipt</h3>
                                    <span className="receipt-items-count">{order.items?.length || 0} items</span>
                                </div>

                                {/* Items List with Fixed & Loose Weight Badges */}
                                <div className="receipt-items-stream">
                                    {order.items?.map((item, idx) => {
                                        const isWeight = item.name?.includes('(') || item.name?.toLowerCase().includes('g') || item.name?.toLowerCase().includes('kg');
                                        return (
                                            <div key={idx} className="receipt-item-row">
                                                <div className="receipt-item-main">
                                                    <span className={`receipt-type-pill ${isWeight ? 'weight' : 'fixed'}`}>
                                                        {isWeight ? <><Scale size={10} /> By Weight</> : <><Box size={10} /> Pack</>}
                                                    </span>
                                                    <span className="receipt-item-title">{item.name}</span>
                                                    <span className="receipt-item-qty">Qty: {item.qty || item.quantity}</span>
                                                </div>
                                                <strong className="receipt-item-total">
                                                    ₹{(item.price * (item.qty || item.quantity)).toFixed(2)}
                                                </strong>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Price Calculation Summary */}
                                <div className="receipt-totals-box">
                                    <div className="receipt-calc-line">
                                        <span>Subtotal</span>
                                        <span>₹{order.subtotal || order.total}</span>
                                    </div>
                                    {order.discount > 0 && (
                                        <div className="receipt-calc-line discount">
                                            <span>Coupon Discount</span>
                                            <span>-₹{order.discount}</span>
                                        </div>
                                    )}
                                    <div className="receipt-calc-line">
                                        <span>Delivery Fee (Haldwani)</span>
                                        <span>{order.deliveryFee > 0 ? `₹${order.deliveryFee}` : 'FREE'}</span>
                                    </div>
                                    <div className="receipt-calc-line grand-total">
                                        <strong>Total Paid / Payable</strong>
                                        <strong>₹{order.total}</strong>
                                    </div>
                                </div>

                                {/* Delivery Address Destination */}
                                <div className="receipt-dest-section">
                                    <h4>Delivery Address</h4>
                                    {order.address ? (
                                        <p className="dest-address-text"><MapPin size={14} color="#059669" /> {order.address}</p>
                                    ) : (
                                        <p className="dest-address-text"><Store size={14} color="#2563eb" /> Store Counter Pickup (Kaladhungi Rd, Haldwani)</p>
                                    )}
                                </div>

                                {/* Receipt Actions */}
                                <div className="receipt-actions-footer">
                                    <button className="btn btn-secondary btn-sm w-full" onClick={() => window.print()}>
                                        <Printer size={14} /> Print Order Receipt
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
