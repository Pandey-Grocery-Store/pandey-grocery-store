import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Clock, Phone, ArrowLeft, Loader, Truck } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Haldwani center
const STORE_LOCATION = { lat: 29.2183, lng: 79.5130 };

export default function OrderTracking() {
    const { orderId } = useParams();
    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerRef = useRef(null);
    const token = localStorage.getItem('auth_token');

    // Fetch delivery location every 5 seconds
    useEffect(() => {
        let interval;

        const fetchLocation = async () => {
            try {
                const res = await fetch(`/api/delivery/location/${orderId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (data?.location) {
                    setLocation(data.location);
                    setError('');
                } else {
                    setError('Delivery tracking not available yet');
                }
            } catch {
                setError('Failed to fetch location');
            }
            setLoading(false);
        };

        fetchLocation();
        interval = setInterval(fetchLocation, 5000);
        return () => clearInterval(interval);
    }, [orderId, token]);

    // Initialize and update map
    useEffect(() => {
        if (!location || !mapRef.current) return;

        const initMap = async () => {
            const L = (await import('leaflet')).default;

            // Fix default marker icons for webpack/vite
            delete L.Icon.Default.prototype._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            });

            const deliveryIcon = L.divIcon({
                html: '<div style="background:#e8590c;color:white;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:3px solid white;">🛵</div>',
                iconSize: [36, 36],
                iconAnchor: [18, 18],
                className: '',
            });

            const storeIcon = L.divIcon({
                html: '<div style="background:#16a34a;color:white;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:3px solid white;">🏪</div>',
                iconSize: [36, 36],
                iconAnchor: [18, 18],
                className: '',
            });

            if (!mapInstanceRef.current) {
                mapInstanceRef.current = L.map(mapRef.current).setView([location.lat, location.lng], 15);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; OpenStreetMap contributors',
                }).addTo(mapInstanceRef.current);

                // Store marker
                L.marker([STORE_LOCATION.lat, STORE_LOCATION.lng], { icon: storeIcon })
                    .addTo(mapInstanceRef.current)
                    .bindPopup('🏪 Pandey Grocery Store');

                // Delivery marker
                markerRef.current = L.marker([location.lat, location.lng], { icon: deliveryIcon })
                    .addTo(mapInstanceRef.current)
                    .bindPopup(`🛵 ${location.deliveryPersonName}`);
            } else {
                // Update marker position
                markerRef.current.setLatLng([location.lat, location.lng]);
                mapInstanceRef.current.panTo([location.lat, location.lng]);
            }
        };

        initMap();
    }, [location]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    return (
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '1.5rem' }}>
            <Link to="/account" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: '1rem', fontSize: '0.875rem' }}>
                <ArrowLeft size={16} /> Back to Orders
            </Link>

            <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.3rem' }}>
                <Truck size={22} style={{ verticalAlign: 'middle' }} /> Track Delivery
            </h2>
            <p style={{ color: 'var(--text-secondary)', margin: '0 0 1rem', fontSize: '0.85rem' }}>
                Order: <strong>{orderId}</strong>
            </p>

            {loading ? (
                <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                    <Loader className="spin" size={28} />
                    <p style={{ marginTop: '0.5rem' }}>Loading tracking info...</p>
                </div>
            ) : error ? (
                <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <MapPin size={40} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                    <p>{error}</p>
                    <p style={{ fontSize: '0.8rem' }}>Tracking will appear once your order is dispatched.</p>
                </div>
            ) : (
                <>
                    {/* Delivery person info */}
                    <div className="card" style={{ padding: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
                            🛵
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600 }}>{location.deliveryPersonName}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Clock size={12} /> Updated {new Date(location.updatedAt).toLocaleTimeString()}
                            </div>
                        </div>
                        <div style={{ padding: '0.4rem 0.75rem', borderRadius: 999, background: '#dcfce7', color: '#166534', fontSize: '0.75rem', fontWeight: 600 }}>
                            On the way
                        </div>
                    </div>

                    {/* Map */}
                    <div className="card" style={{ overflow: 'hidden', borderRadius: 12 }}>
                        <div ref={mapRef} style={{ height: 350, width: '100%' }} />
                    </div>

                    <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                        📍 Location updates every 5 seconds · Powered by OpenStreetMap
                    </p>
                </>
            )}
        </div>
    );
}
