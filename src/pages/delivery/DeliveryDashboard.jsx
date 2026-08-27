import { useState, useEffect, useCallback, useRef } from 'react';
import { MapPin, Navigation, Package, Phone, CheckCircle2, Loader } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function DeliveryDashboard() {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tracking, setTracking] = useState(false);
    const [currentLocation, setCurrentLocation] = useState(null);
    const watchIdRef = useRef(null);
    const token = localStorage.getItem('auth_token');

    const fetchOrders = useCallback(async () => {
        try {
            const res = await fetch('/api/delivery/my-orders', { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (data?.orders) setOrders(data.orders);
        } catch (err) { console.error(err); }
        setLoading(false);
    }, [token]);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    // Send location to server
    const sendLocation = useCallback(async (lat, lng, orderId) => {
        try {
            await fetch('/api/delivery/location', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ lat, lng, orderId }),
            });
        } catch (err) { console.error('Failed to send location:', err); }
    }, [token]);

    // Start/stop GPS tracking
    const toggleTracking = () => {
        if (tracking) {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }
            setTracking(false);
        } else {
            if (!navigator.geolocation) {
                alert('Geolocation is not supported by this browser');
                return;
            }
            watchIdRef.current = navigator.geolocation.watchPosition(
                (pos) => {
                    const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    setCurrentLocation(loc);
                    // Send location for all active orders
                    orders.forEach(o => sendLocation(loc.lat, loc.lng, o.id));
                },
                (err) => { console.error('GPS error:', err); alert('Please enable location access'); },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
            );
            setTracking(true);
        }
    };

    const markDelivered = async (orderId) => {
        try {
            await fetch(`/api/orders/${orderId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ status: 'delivered' }),
            });
            setOrders(prev => prev.filter(o => o.id !== orderId));
        } catch (err) { alert('Failed to mark as delivered'); }
    };

    if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}><Loader className="spin" /> Loading...</div>;

    return (
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '1.5rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Truck size={24} color="var(--primary)" /> Delivery Dashboard
                </h2>
                <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0' }}>Welcome, {user?.name}</p>
            </div>

            {/* GPS Toggle */}
            <div className="card" style={{ padding: '1rem', marginBottom: '1rem', textAlign: 'center' }}>
                <button
                    onClick={toggleTracking}
                    className={`btn ${tracking ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                    <Navigation size={20} className={tracking ? 'spin' : ''} />
                    {tracking ? 'Sharing Location Live...' : 'Start Location Sharing'}
                </button>
                {currentLocation && (
                    <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                        <MapPin size={12} /> {currentLocation.lat.toFixed(5)}, {currentLocation.lng.toFixed(5)}
                    </p>
                )}
            </div>

            {/* Orders */}
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>
                Active Deliveries ({orders.length})
            </h3>

            {orders.length === 0 ? (
                <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <Package size={40} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                    <p>No active deliveries</p>
                </div>
            ) : (
                orders.map(order => (
                    <div key={order.id} className="card" style={{ padding: '1rem', marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                            <div>
                                <strong style={{ fontSize: '1rem' }}>{order.orderNumber}</strong>
                                <span style={{ marginLeft: '0.5rem', padding: '0.2rem 0.5rem', borderRadius: 999, fontSize: '0.7rem', background: '#fef3c7', color: '#92400e' }}>
                                    {order.status}
                                </span>
                            </div>
                            <strong style={{ color: 'var(--primary)' }}>₹{order.total}</strong>
                        </div>

                        <div style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                            <MapPin size={14} style={{ verticalAlign: 'middle' }} /> {order.address || 'No address'}
                        </div>

                        {order.phone && (
                            <a href={`tel:${order.phone}`} style={{ fontSize: '0.85rem', color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, marginBottom: '0.75rem' }}>
                                <Phone size={14} /> {order.phone}
                            </a>
                        )}

                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                            {order.items.map((i, idx) => <span key={idx}>{i.name} ×{i.qty}{idx < order.items.length - 1 ? ', ' : ''}</span>)}
                        </div>

                        <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => markDelivered(order.id)}>
                            <CheckCircle2 size={16} /> Mark Delivered
                        </button>
                    </div>
                ))
            )}
        </div>
    );
}
