import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Printer, Heart, ShoppingBag, User } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import './MobileBottomNav.css';

export default function MobileBottomNav() {
    const location = useLocation();
    const { itemCount } = useCart();
    const { isLoggedIn } = useAuth();

    const navItems = [
        { path: '/', label: 'Home', icon: Home },
        { path: '/search', label: 'Explore', icon: Search },
        { 
            path: '/category/printing-binding', 
            label: 'Print Hub', 
            icon: Printer,
            highlight: true 
        },
        { path: '/wishlist', label: 'Wishlist', icon: Heart },
        { 
            path: '/cart', 
            label: 'Cart', 
            icon: ShoppingBag, 
            badge: itemCount 
        },
        { path: '/account', label: isLoggedIn ? 'Account' : 'Login', icon: User },
    ];

    return (
        <nav className="mobile-bottom-nav">
            <div className="mobile-bottom-nav-inner">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path || 
                        (item.path !== '/' && location.pathname.startsWith(item.path));
                    
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`mobile-bottom-nav-item ${isActive ? 'active' : ''} ${item.highlight ? 'highlight-item' : ''}`}
                        >
                            <div className="nav-icon-wrapper">
                                <Icon size={20} className="nav-svg-icon" />
                                {item.badge > 0 && (
                                    <span className="mobile-nav-badge">{item.badge}</span>
                                )}
                            </div>
                            <span className="mobile-nav-label">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
