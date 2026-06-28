import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, Search, User, Menu, X, Heart, MapPin } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { categories } from '../data/categories';
import './Navbar.css';

export default function Navbar() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const { itemCount } = useCart();
    const { user, isLoggedIn, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery('');
            setMobileOpen(false);
        }
    };

    return (
        <>
            {/* Top strip */}
            <div className="top-strip">
                <div className="container top-strip-inner">
                    <div className="top-strip-left">
                        <MapPin size={13} />
                        <span>Delivering to Haldwani, Uttarakhand</span>
                    </div>
                    <div className="top-strip-right">
                        <span>📞 Help: +91 9410516899</span>
                        {!isLoggedIn ? (
                            <Link to="/login" className="top-link">Sign In</Link>
                        ) : (
                            <span className="top-link" onClick={logout} style={{ cursor: 'pointer' }}>
                                Logout ({user.name})
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Navbar */}
            <nav className="navbar">
                <div className="container navbar-inner">
                    <Link to="/" className="navbar-logo">
                        <img src="/favicon.svg" alt="Pandey Grocery Store" className="logo-icon" width="36" height="36" />
                        <div>
                            <span className="logo-text">Pandey Grocery Store</span>
                            <span className="logo-tagline">Indian Groceries & Daily Essentials</span>
                        </div>
                    </Link>

                    <form className="navbar-search" onSubmit={handleSearch}>
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search for groceries, utensils, and more..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-input"
                        />
                        {searchQuery && (
                            <button type="submit" className="search-submit-btn">
                                Search
                            </button>
                        )}
                    </form>

                    <div className="navbar-actions">
                        {isLoggedIn && ['ADMIN', 'MANAGEMENT'].includes(user.role) && (
                            <Link to={user.role === 'ADMIN' ? '/admin' : '/staff'} className="btn btn-sm btn-secondary">
                                Dashboard
                            </Link>
                        )}
                        {isLoggedIn && user.role === 'DELIVERY' && (
                            <Link to="/delivery" className="btn btn-sm btn-secondary">
                                🛵 My Deliveries
                            </Link>
                        )}
                        <Link to="/wishlist" className="nav-action-btn" title="Wishlist">
                            <Heart size={20} />
                        </Link>
                        <Link to="/account" className="nav-action-btn" title="Account">
                            <User size={20} />
                            {isLoggedIn && <span className="nav-dot" />}
                        </Link>
                        <Link to="/cart" className="nav-action-btn cart-btn" title="Cart">
                            <ShoppingCart size={20} />
                            {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
                        </Link>
                        <button className="nav-action-btn mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)}>
                            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
                        </button>
                    </div>
                </div>

                {/* Category Bar */}
                <div className="category-bar">
                    <div className="container category-bar-inner">
                        {categories.map((cat) => (
                            <Link
                                key={cat.id}
                                to={`/category/${cat.id}`}
                                className={`category-link ${location.pathname.includes(cat.id) ? 'active' : ''}`}
                            >
                                <span className="category-link-icon">{cat.icon}</span>
                                {cat.name}
                            </Link>
                        ))}
                        <Link to="/offers" className={`category-link offers-link ${location.pathname === '/offers' ? 'active' : ''}`}>
                            🏷️ Offers
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Mobile menu */}
            {mobileOpen && (
                <div className="mobile-nav-overlay" onClick={() => setMobileOpen(false)}>
                    <div className="mobile-nav" onClick={(e) => e.stopPropagation()}>
                        <div className="mobile-nav-header">
                            <span className="logo-text"><img src="/favicon.svg" alt="" width="28" height="28" style={{ verticalAlign: 'middle', marginRight: '8px' }} />Pandey Grocery Store</span>
                            <button onClick={() => setMobileOpen(false)}><X size={22} /></button>
                        </div>
                        <form className="mobile-search" onSubmit={handleSearch}>
                            <Search size={18} />
                            <input
                                placeholder="Search products..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </form>
                        <div className="mobile-nav-links">
                            <Link to="/" onClick={() => setMobileOpen(false)}>Home</Link>
                            {categories.map((cat) => (
                                <Link key={cat.id} to={`/category/${cat.id}`} onClick={() => setMobileOpen(false)}>
                                    {cat.icon} {cat.name}
                                </Link>
                            ))}
                            <Link to="/offers" onClick={() => setMobileOpen(false)}>🏷️ Offers</Link>
                            <Link to="/wishlist" onClick={() => setMobileOpen(false)}>❤️ Wishlist</Link>
                            <Link to="/cart" onClick={() => setMobileOpen(false)}>🛒 Cart ({itemCount})</Link>
                            <Link to="/account" onClick={() => setMobileOpen(false)}>👤 My Account</Link>
                            {isLoggedIn && ['ADMIN', 'MANAGEMENT'].includes(user.role) && (
                                <Link to={user.role === 'ADMIN' ? '/admin' : '/staff'} onClick={() => setMobileOpen(false)}>
                                    📊 Dashboard
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
