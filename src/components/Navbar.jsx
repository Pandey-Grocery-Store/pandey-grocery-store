import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, Search, User, Menu, X, Heart, MapPin, Printer, Sparkles, Phone, LayoutDashboard, Tag, Home, Truck } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { categories } from '../data/categories';
import CategoryIcon from './CategoryIcon';
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
            {/* Top Announcement Strip */}
            <div className="top-strip">
                <div className="container top-strip-inner">
                    <div className="top-strip-left">
                        <span className="live-store-pulse" />
                        <MapPin size={13} className="strip-icon" />
                        <span><strong>In-Store Shopping &amp; Print Hub:</strong> Haldwani, Uttarakhand</span>
                    </div>
                    <div className="top-strip-right">
                        <a href="tel:+919410516899" className="top-link">
                            <Phone size={12} />
                            <span>+91 9410516899</span>
                        </a>
                        {!isLoggedIn ? (
                            <Link to="/login" className="top-link auth-pill">Sign In / Register</Link>
                        ) : (
                            <div className="top-user-pill">
                                <span>Hello, {user.name}</span>
                                <button onClick={logout} className="top-logout-btn">Logout</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Navbar */}
            <header className="navbar">
                <div className="container navbar-inner">
                    {/* Logo */}
                    <Link to="/" className="navbar-logo">
                        <div className="logo-icon-wrap">
                            <img src="/favicon.svg" alt="Pandey Grocery Store" className="logo-icon" width="32" height="32" />
                        </div>
                        <div className="logo-text-group">
                            <span className="logo-text">Pandey Grocery</span>
                            <span className="logo-tagline">Store &amp; Print Hub</span>
                        </div>
                    </Link>

                    {/* Search Bar */}
                    <form className="navbar-search" onSubmit={handleSearch}>
                        <Search size={17} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search groceries, stationery..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-input"
                        />
                        {searchQuery ? (
                            <button type="submit" className="search-submit-btn">
                                Search
                            </button>
                        ) : (
                            <span className="search-shortcut">⌘K</span>
                        )}
                    </form>

                    {/* Nav Actions */}
                    <div className="navbar-actions">
                        {/* Quick Print Hub Badge Link */}
                        <Link to="/category/printing-binding" className="nav-print-badge" title="Document & ID Print Hub">
                            <Printer size={15} />
                            <span className="print-badge-label">Print Hub</span>
                        </Link>

                        {isLoggedIn && ['ADMIN', 'MANAGEMENT'].includes(user.role) && (
                            <Link 
                                to={user.role === 'ADMIN' ? '/admin' : '/staff'} 
                                className="btn btn-sm btn-accent nav-dash-btn"
                                title="Open Dashboard"
                            >
                                <LayoutDashboard size={15} />
                                <span className="dash-btn-label">Dashboard</span>
                            </Link>
                        )}
                        {isLoggedIn && user.role === 'DELIVERY' && (
                            <Link to="/delivery" className="btn btn-sm btn-secondary" title="My Deliveries">
                                <Truck size={15} /> <span className="dash-btn-label">Deliveries</span>
                            </Link>
                        )}

                        <Link to="/wishlist" className="nav-action-btn desktop-only" title="Wishlist">
                            <Heart size={19} />
                        </Link>

                        <Link to="/account" className="nav-action-btn" title="Account">
                            <User size={19} />
                            {isLoggedIn && <span className="nav-dot" />}
                        </Link>

                        <Link to="/cart" className="nav-action-btn cart-btn" title="Shopping Cart">
                            <ShoppingBag size={19} />
                            {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
                        </Link>

                        <button 
                            className="nav-action-btn mobile-menu-btn" 
                            onClick={() => setMobileOpen(!mobileOpen)}
                            aria-label="Toggle Navigation Menu"
                        >
                            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
                        </button>
                    </div>
                </div>

                {/* Categories & Services Horizontal Strip */}
                <div className="category-bar">
                    <div className="container category-bar-inner">
                        <Link 
                            to="/" 
                            className={`category-link ${location.pathname === '/' ? 'active' : ''}`}
                        >
                            <Sparkles size={14} className="cat-icon-svg" />
                            <span>Home</span>
                        </Link>

                        {categories.map((cat) => (
                            <Link
                                key={cat.id}
                                to={`/category/${cat.id}`}
                                className={`category-link ${location.pathname.includes(cat.id) ? 'active' : ''}`}
                            >
                                <CategoryIcon slug={cat.id} size={15} />
                                <span>{cat.name}</span>
                            </Link>
                        ))}

                        <Link 
                            to="/category/printing-binding" 
                            className={`category-link print-special-link ${location.pathname.includes('printing-binding') ? 'active' : ''}`}
                        >
                            <Printer size={15} />
                            <span>Print &amp; ID Cards</span>
                        </Link>

                        <Link 
                            to="/offers" 
                            className={`category-link offers-link ${location.pathname === '/offers' ? 'active' : ''}`}
                        >
                            <Tag size={14} />
                            <span>Today's Offers</span>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Mobile Search Bar below Navbar on small screens */}
            <div className="mobile-search-strip">
                <form className="mobile-search-form" onSubmit={handleSearch}>
                    <Search size={16} className="mobile-search-icon" />
                    <input
                        type="text"
                        placeholder="Search groceries, stationery, print..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="mobile-search-input"
                    />
                    {searchQuery && (
                        <button type="submit" className="mobile-search-btn">Search</button>
                    )}
                </form>
            </div>

            {/* Mobile Drawer Menu */}
            {mobileOpen && (
                <div className="mobile-nav-overlay" onClick={() => setMobileOpen(false)}>
                    <div className="mobile-nav" onClick={(e) => e.stopPropagation()}>
                        <div className="mobile-nav-header">
                            <div className="mobile-nav-brand">
                                <img src="/favicon.svg" alt="" width="28" height="28" />
                                <span className="logo-text">Pandey Grocery</span>
                            </div>
                            <button className="btn-icon btn-ghost" onClick={() => setMobileOpen(false)}>
                                <X size={22} />
                            </button>
                        </div>

                        <div className="mobile-nav-links">
                            <Link to="/" onClick={() => setMobileOpen(false)} className="mobile-nav-link">
                                <Home size={17} /> <span>Home</span>
                            </Link>

                            <div className="mobile-nav-heading">Categories</div>
                            {categories.map((cat) => (
                                <Link 
                                    key={cat.id} 
                                    to={`/category/${cat.id}`} 
                                    onClick={() => setMobileOpen(false)}
                                    className="mobile-nav-link"
                                >
                                    <CategoryIcon slug={cat.id} size={18} /> <span>{cat.name}</span>
                                </Link>
                            ))}

                            <div className="mobile-nav-heading">Services &amp; Deals</div>
                            <Link 
                                to="/category/printing-binding" 
                                onClick={() => setMobileOpen(false)}
                                className="mobile-nav-link print-highlight"
                            >
                                <Printer size={17} /> <span>Document &amp; ID Print Hub</span>
                            </Link>
                            <Link to="/offers" onClick={() => setMobileOpen(false)} className="mobile-nav-link">
                                <Tag size={17} /> <span>Exclusive Offers &amp; Deals</span>
                            </Link>
                            <Link to="/wishlist" onClick={() => setMobileOpen(false)} className="mobile-nav-link">
                                <Heart size={17} /> <span>My Wishlist</span>
                            </Link>
                            <Link to="/cart" onClick={() => setMobileOpen(false)} className="mobile-nav-link">
                                <ShoppingBag size={17} /> <span>My Cart ({itemCount})</span>
                            </Link>
                            <Link to="/account" onClick={() => setMobileOpen(false)} className="mobile-nav-link">
                                <User size={17} /> <span>My Profile &amp; Orders</span>
                            </Link>

                            {isLoggedIn && ['ADMIN', 'MANAGEMENT'].includes(user.role) && (
                                <Link 
                                    to={user.role === 'ADMIN' ? '/admin' : '/staff'} 
                                    onClick={() => setMobileOpen(false)}
                                    className="mobile-nav-link admin-link"
                                >
                                    <LayoutDashboard size={17} /> <span>Staff / Admin Dashboard</span>
                                </Link>
                            )}
                        </div>

                        <div className="mobile-nav-footer">
                            <p className="mobile-store-info"><MapPin size={13} /> Near Temple, Haldwani</p>
                            <p className="mobile-store-phone"><Phone size={13} /> +91 9410516899</p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
