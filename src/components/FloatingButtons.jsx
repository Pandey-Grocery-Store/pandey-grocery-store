import { useState, useEffect } from 'react';
import { ArrowUp, MessageCircle, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './FloatingButtons.css';

export default function FloatingButtons() {
    const { user } = useAuth();
    const [showTop, setShowTop] = useState(false);

    useEffect(() => {
        const handleScroll = () => setShowTop(window.scrollY > 400);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

    return (
        <div className="floating-buttons">
            {/* Conditional Floating Action */}
            {user && ['ADMIN', 'MANAGEMENT'].includes(user.role) ? (
                <Link
                    to="/staff/pos"
                    className="floating-btn whatsapp-btn"
                    style={{ background: 'var(--primary)' }}
                    title="Create POS Order"
                >
                    <PlusCircle size={22} />
                </Link>
            ) : (
                <a
                    href="https://wa.me/919410516899?text=Hi%20Pandey%20Grocery%20Store!%20I%20need%20help%20with%20my%20order."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="floating-btn whatsapp-btn"
                    title="Chat on WhatsApp"
                >
                    <MessageCircle size={22} />
                </a>
            )}

            {/* Back to Top */}
            {showTop && (
                <button className="floating-btn top-btn" onClick={scrollToTop} title="Back to top">
                    <ArrowUp size={20} />
                </button>
            )}
        </div>
    );
}
