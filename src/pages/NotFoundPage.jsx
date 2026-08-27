import { Link } from 'react-router-dom';
import { Home, ShoppingBasket } from 'lucide-react';
import './NotFoundPage.css';

export default function NotFoundPage() {
    return (
        <div className="not-found">
            <div className="not-found-content">
                <div className="not-found-illustration">
                    <span className="nf-404">404</span>
                    <div className="nf-icon-wrap" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: '50%', background: 'var(--primary-50)' }}>
                        <ShoppingBasket size={36} color="var(--primary)" />
                    </div>
                </div>
                <h1 className="nf-title">Page Not Found</h1>
                <p className="nf-desc">
                    Oops! The page you're looking for doesn't exist or has been moved.
                    Let's get you back to shopping!
                </p>
                <div className="nf-actions">
                    <Link to="/" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <Home size={16} /> Back to Home
                    </Link>
                    <Link to="/category/groceries" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <ShoppingBasket size={16} /> Browse Groceries
                    </Link>
                </div>
            </div>
        </div>
    );
}
