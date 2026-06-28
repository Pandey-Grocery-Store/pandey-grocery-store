import { useState, useEffect } from 'react';
import { ArrowUp, MessageCircle } from 'lucide-react';
import './FloatingButtons.css';

export default function FloatingButtons() {
    const [showTop, setShowTop] = useState(false);

    useEffect(() => {
        const handleScroll = () => setShowTop(window.scrollY > 400);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

    return (
        <div className="floating-buttons">
            {/* WhatsApp */}
            <a
                href="https://wa.me/918273287789?text=Hi%20Pandey%20Grocery%20Store!%20I%20need%20help%20with%20my%20order."
                target="_blank"
                rel="noopener noreferrer"
                className="floating-btn whatsapp-btn"
                title="Chat on WhatsApp"
            >
                <MessageCircle size={22} />
            </a>

            {/* Back to Top */}
            {showTop && (
                <button className="floating-btn top-btn" onClick={scrollToTop} title="Back to top">
                    <ArrowUp size={20} />
                </button>
            )}
        </div>
    );
}
