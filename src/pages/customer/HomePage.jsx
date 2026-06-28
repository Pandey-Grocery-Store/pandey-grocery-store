import { Link } from 'react-router-dom';
import { ArrowRight, Truck, Shield, Clock, Tag, Star } from 'lucide-react';
import ProductCard from '../../components/ProductCard';
import { categories } from '../../data/categories';
import { getFeaturedProducts, getBestSellers } from '../../data/products';
import './HomePage.css';

export default function HomePage() {
    const featured = getFeaturedProducts();
    const bestSellers = getBestSellers();

    return (
        <div className="home-page">
            {/* Hero */}
            <section className="hero">
                <div className="container hero-inner">
                    <div className="hero-content animate-fade-in">
                        <span className="hero-badge">🎉 Now Online!</span>
                        <h1 className="hero-title">
                            Indian Groceries,<br />
                            Printing & Daily Needs<br />
                            <span className="hero-highlight">Delivered in Haldwani</span>
                        </h1>
                        <p className="hero-desc">
                            Your trusted Pandey Grocery Store is now online! Shop groceries, stationery, daily essentials & order document printing with express delivery in Haldwani.
                        </p>
                        <div className="hero-actions">
                            <Link to="/category/groceries" className="btn btn-primary btn-lg">
                                Shop Now <ArrowRight size={18} />
                            </Link>
                            <Link to="/offers" className="btn btn-secondary btn-lg">
                                🏷️ Today's Offers
                            </Link>
                        </div>
                        <div className="hero-stats">
                            <div className="hero-stat">
                                <span className="hero-stat-value">500+</span>
                                <span className="hero-stat-label">Products</span>
                            </div>
                            <div className="hero-stat">
                                <span className="hero-stat-value">2hr</span>
                                <span className="hero-stat-label">Delivery</span>
                            </div>
                            <div className="hero-stat">
                                <span className="hero-stat-value">10k+</span>
                                <span className="hero-stat-label">Happy Customers</span>
                            </div>
                        </div>
                    </div>
                    <div className="hero-visual animate-fade-in" style={{ animationDelay: '0.2s' }}>
                        <div className="hero-image-grid">
                            <img src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=400" alt="Groceries" className="hero-img hero-img-1" />
                            <img src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400" alt="Kitchen" className="hero-img hero-img-2" />
                            <img src="https://images.unsplash.com/photo-1585515320310-259814833e62?w=400" alt="Cookware" className="hero-img hero-img-3" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Trust Bar */}
            <section className="trust-bar">
                <div className="container trust-bar-inner">
                    <div className="trust-item">
                        <Truck size={22} />
                        <div>
                            <strong>Free Delivery</strong>
                            <span>On orders above ₹500</span>
                        </div>
                    </div>
                    <div className="trust-item">
                        <Clock size={22} />
                        <div>
                            <strong>2-Hour Express</strong>
                            <span>Same-day delivery</span>
                        </div>
                    </div>
                    <div className="trust-item">
                        <Shield size={22} />
                        <div>
                            <strong>Secure Payment</strong>
                            <span>UPI, Cards & COD</span>
                        </div>
                    </div>
                    <div className="trust-item">
                        <Tag size={22} />
                        <div>
                            <strong>Best Prices</strong>
                            <span>Daily deals & offers</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Categories */}
            <section className="section">
                <div className="container">
                    <h2 className="section-title">Shop by Category</h2>
                    <p className="section-subtitle">Browse our wide selection of groceries and kitchen essentials</p>
                    <div className="category-grid">
                        {categories.map((cat) =>
                            cat.subcategories.map((sub, i) => (
                                <Link
                                    key={sub.id}
                                    to={`/category/${cat.id}?sub=${sub.id}`}
                                    className="category-card card animate-fade-in"
                                    style={{ animationDelay: `${i * 0.05}s` }}
                                >
                                    <div className="category-card-icon">{cat.icon}</div>
                                    <span className="category-card-name">{sub.name}</span>
                                    <span className="category-card-name-hi">{sub.nameHi}</span>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            </section>

            {/* Featured Products */}
            <section className="section" style={{ background: 'var(--bg-tertiary)' }}>
                <div className="container">
                    <div className="section-header-row">
                        <div>
                            <h2 className="section-title">⭐ Featured Products</h2>
                            <p className="section-subtitle">Handpicked top-rated items just for you</p>
                        </div>
                        <Link to="/category/groceries" className="btn btn-secondary">
                            View All <ArrowRight size={16} />
                        </Link>
                    </div>
                    <div className="grid grid-4">
                        {featured.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Promo Banner */}
            <section className="promo-section">
                <div className="container">
                    <div className="promo-grid">
                        <div className="promo-card promo-groceries">
                            <div className="promo-content">
                                <span className="promo-tag">Grocery Sale</span>
                                <h3>Up to 30% Off</h3>
                                <p>On all pulses & staples</p>
                                <Link to="/category/groceries" className="btn btn-primary btn-sm">Shop Now</Link>
                            </div>
                        </div>
                        <div className="promo-card promo-utensils">
                            <div className="promo-content">
                                <span className="promo-tag">Kitchen Upgrade</span>
                                <h3>Premium Cookware</h3>
                                <p>Starting at ₹299</p>
                                <Link to="/category/utensils" className="btn btn-primary btn-sm">Explore</Link>
                            </div>
                        </div>
                        <div className="promo-card promo-new">
                            <div className="promo-content">
                                <span className="promo-tag">New Arrivals</span>
                                <h3>Small Appliances</h3>
                                <p>Mixers, kettles & more</p>
                                <Link to="/category/utensils?sub=appliances" className="btn btn-primary btn-sm">View Range</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Best Sellers */}
            <section className="section">
                <div className="container">
                    <div className="section-header-row">
                        <div>
                            <h2 className="section-title">🔥 Best Sellers</h2>
                            <p className="section-subtitle">Most loved products by our customers</p>
                        </div>
                        <Link to="/category/groceries" className="btn btn-secondary">
                            View All <ArrowRight size={16} />
                        </Link>
                    </div>
                    <div className="grid grid-5">
                        {bestSellers.slice(0, 5).map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </div>
            </section>

            {/* App CTA */}
            <section className="app-cta-section">
                <div className="container app-cta-inner">
                    <div className="app-cta-content">
                        <h2>📱 Download the Pandey Grocery Store App</h2>
                        <p>Get exclusive app-only offers and express delivery. Available on Android & iOS.</p>
                        <div className="app-cta-buttons">
                            <button className="btn btn-primary btn-lg">Google Play</button>
                            <button className="btn btn-secondary btn-lg">App Store</button>
                        </div>
                    </div>
                    <div className="app-cta-features">
                        <div className="app-feature">
                            <Star size={20} color="var(--primary)" /> <span>Exclusive app-only deals</span>
                        </div>
                        <div className="app-feature">
                            <Truck size={20} color="var(--primary)" /> <span>Real-time delivery tracking</span>
                        </div>
                        <div className="app-feature">
                            <Clock size={20} color="var(--primary)" /> <span>Quick reorder in 1 tap</span>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
