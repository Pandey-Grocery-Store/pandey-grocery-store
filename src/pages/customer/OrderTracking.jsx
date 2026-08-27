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
                html: '<div style="background:#e8590c;color:white;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:3px solid white;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg></div>',
                iconSize: [36, 36],
                iconAnchor: [18, 18],
                className: '',
            });

            const storeIcon = L.divIcon({
                html: '<div style="background:#16a34a;color:white;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:3px solid white;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/></svg></div>',
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
                    .bindPopup('Pandey Grocery Store (Haldwani)');

                // Delivery marker
                markerRef.current = L.marker([location.lat, location.lng], { icon: deliveryIcon })
                    .addTo(mapInstanceRef.current)
                    .bindPopup(`${location.deliveryPersonName} (Delivery Partner)`);
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
        <div className="container section" style={{ maxWidth: 700 }}>
            <Link to="/account" className="btn btn-ghost btn-sm" style={{ marginBottom: '1rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <ArrowLeft size={16} /> Back to Orders
            </Link>

            <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Truck size={24} color="var(--primary)" /> Live Order Tracking
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                Order #{orderId}
            </p>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                    <Loader size={32} className="spin" style={{ margin: '0 auto 0.5rem', color: 'var(--primary)' }} />
                    <p style={{ color: 'var(--text-secondary)' }}>Connecting to delivery agent GPS...</p>
                </div>
            ) : error ? (
                <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-secondary)' }}>
                    <MapPin size={40} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                    <p>{error}</p>
                    <p style={{ fontSize: '0.8rem' }}>Tracking will appear once your order is dispatched.</p>
                </div>
            ) : (
                <>
                    {/* Delivery person info */}
                    <div className="card" style={{ padding: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Truck size={22} color="#ea580c" />
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

                    <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                        <MapPin size={12} /> Location updates every 5 seconds · Powered by OpenStreetMap
                    </p>
                </>
            )}
        </div>
    );
}
