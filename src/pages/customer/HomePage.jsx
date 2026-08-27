import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Tag, Star, MapPin, Printer, FileText, CreditCard, Camera, Sparkles, MessageCircle, Clock, ShoppingBasket, Store, Zap, Flame } from 'lucide-react';
import ProductCard from '../../components/ProductCard';
import StoreGallery from '../../components/StoreGallery';
import CategoryIcon from '../../components/CategoryIcon';
import { productsApi, categoriesApi } from '../../lib/api';
import './HomePage.css';

export default function HomePage() {
    const [categories, setCategories] = useState([]);
    const [featured, setFeatured] = useState([]);
    const [bestSellers, setBestSellers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadHomeData = async () => {
            setLoading(true);
            try {
                const [catRes, prodRes] = await Promise.all([
                    categoriesApi.getAll(),
                    productsApi.getAll(),
                ]);
                if (catRes?.categories) setCategories(catRes.categories);
                if (prodRes?.products) {
                    setFeatured(prodRes.products.slice(0, 8));
                    setBestSellers(prodRes.products.filter(p => (p.reviews || 0) > 10).slice(0, 4));
                }
            } catch (err) {
                console.error("Failed to load home data", err);
            } finally {
                setLoading(false);
            }
        };
        loadHomeData();
    }, []);

    return (
        <div className="home-page">
            {/* ── Dynamic Hero Section ── */}
            <section className="hero-section">
                <div className="container hero-container">
                    <div className="hero-text-content animate-fade-in">
                        <h1 className="hero-title">
                            Fresh Groceries &amp; <br />
                            <span className="hero-highlight">Instant Print Hub</span>
                        </h1>

                        <p className="hero-desc">
                            Welcome to <strong>Pandey Grocery Store</strong> — your trusted destination for premium Indian groceries, kitchen essentials, and high-speed in-store document &amp; ID card printing in Haldwani.
                        </p>

                        <div className="hero-actions">
                            <Link to="/category/groceries" className="btn btn-primary btn-lg hero-btn">
                                <ShoppingBasket size={18} /> Shop Groceries <ArrowRight size={18} />
                            </Link>
                            <Link to="/category/printing-binding" className="btn btn-accent btn-lg hero-btn">
                                <Printer size={18} /> Print &amp; ID Cards
                            </Link>
                        </div>

                        <div className="hero-features-strip">
                            <div className="hero-feature-item">
                                <span className="feat-icon"><Store size={20} color="#16a34a" /></span>
                                <div>
                                    <strong>In-Store Shopping</strong>
                                    <span>Pick &amp; pay at store</span>
                                </div>
                            </div>
                            <div className="hero-feature-item">
                                <span className="feat-icon"><Printer size={20} color="#7c3aed" /></span>
                                <div>
                                    <strong>Epson Print Station</strong>
                                    <span>High-res A4 &amp; ID card</span>
                                </div>
                            </div>
                            <div className="hero-feature-item">
                                <span className="feat-icon"><Zap size={20} color="#f59e0b" /></span>
                                <div>
                                    <strong>Instant UPI / Cash</strong>
                                    <span>Pay at counter</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="hero-visual animate-fade-in">
                        <div className="hero-visual-card">
                            <div className="hero-card-header">
                                <div className="store-pill">
                                    <Sparkles size={14} color="#16a34a" />
                                    <span>Pandey Store Highlights</span>
                                </div>
                            </div>

                            <div className="hero-showcase-grid">
                                <Link to="/category/groceries" className="showcase-item groceries-card">
                                    <div className="showcase-img-wrap">
                                        <img src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=400" alt="Groceries" />
                                    </div>
                                    <div className="showcase-info">
                                        <h4>Daily Groceries</h4>
                                        <span>Grains, Pulses, Oils &amp; Spices</span>
                                    </div>
                                </Link>

                                <Link to="/category/printing-binding" className="showcase-item print-card">
                                    <div className="showcase-icon-badge">
                                        <Printer size={24} color="#7c3aed" />
                                    </div>
                                    <div className="showcase-info">
                                        <h4>Print Hub</h4>
                                        <span>Documents, ID Cards &amp; Photos</span>
                                    </div>
                                </Link>

                                <Link to="/category/stationery" className="showcase-item stationery-card">
                                    <div className="showcase-img-wrap">
                                        <img src="https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400" alt="Stationery" />
                                    </div>
                                    <div className="showcase-info">
                                        <h4>Stationery &amp; Office</h4>
                                        <span>Notebooks, Registers &amp; Pens</span>
                                    </div>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Spotlight Print Services Banner ── */}
            <section className="print-spotlight-section">
                <div className="container">
                    <div className="print-spotlight-card">
                        <div className="spotlight-left">
                            <span className="spotlight-tag">
                                <Printer size={14} /> In-Store Print Station (Epson L3250)
                            </span>
                            <h2>Need Documents, ID Cards, or Passport Photos Printed?</h2>
                            <p>Upload your files directly from your phone or PC. Our smart system formats ID cards and passport photos onto A4 paper ready for instant printing when you visit!</p>
                            
                            <div className="spotlight-services-pills">
                                <div className="spotlight-pill">
                                    <FileText size={16} /> <span>PDF &amp; Docs</span>
                                </div>
                                <div className="spotlight-pill">
                                    <CreditCard size={16} /> <span>ID Card (Front &amp; Back)</span>
                                </div>
                                <div className="spotlight-pill">
                                    <Camera size={16} /> <span>Passport Size (2 to 24 Photos)</span>
                                </div>
                            </div>

                            <Link to="/category/printing-binding" className="btn btn-primary btn-lg spotlight-btn">
                                Open Print Hub <ArrowRight size={18} />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Shop by Category Section ── */}
            <section className="section categories-section">
                <div className="container">
                    <div className="section-header-row">
                        <div>
                            <h2 className="section-title">Explore Categories</h2>
                            <p className="section-subtitle">Find everything you need for home, kitchen, and office</p>
                        </div>
                    </div>

                    <div className="category-cards-grid">
                        {categories.map((cat, i) => (
                            <Link
                                key={cat.id || cat.slug}
                                to={`/category/${cat.id || cat.slug}`}
                                className="cat-card animate-fade-in"
                                style={{ animationDelay: `${i * 0.05}s` }}
                            >
                                <div className="cat-card-icon-wrap">
                                    <CategoryIcon slug={cat.id || cat.slug} size={24} />
                                </div>
                                <div className="cat-card-details">
                                    <h3>{cat.name}</h3>
                                    {cat.nameHi && <span className="cat-card-hi">{cat.nameHi}</span>}
                                </div>
                                <span className="cat-card-arrow">→</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Featured Products Section ── */}
            {featured.length > 0 && (
                <section className="section" style={{ background: 'var(--bg-secondary)' }}>
                    <div className="container">
                        <div className="section-header-row">
                            <div>
                                <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Star size={22} color="#f59e0b" /> Featured In Store
                                </h2>
                                <p className="section-subtitle">Top rated products in Haldwani</p>
                            </div>
                            <Link to="/category/groceries" className="btn btn-secondary btn-sm">
                                View All Products <ArrowRight size={16} />
                            </Link>
                        </div>

                        <div className="grid grid-4">
                            {featured.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ── Best Sellers Section ── */}
            {bestSellers.length > 0 && (
                <section className="section">
                    <div className="container">
                        <div className="section-header-row">
                            <div>
                                <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Flame size={22} color="#ef4444" /> Most Popular
                                </h2>
                                <p className="section-subtitle">Customer favourites this week</p>
                            </div>
                            <Link to="/offers" className="btn btn-secondary btn-sm">
                                View Deals <ArrowRight size={16} />
                            </Link>
                        </div>

                        <div className="grid grid-4">
                            {bestSellers.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ── Store Gallery Showcase ── */}
            <StoreGallery />

            {/* ── Location & WhatsApp Contact Section ── */}
            <section className="store-location-section">
                <div className="container">
                    <div className="store-location-card">
                        <div className="store-info-col">
                            <span className="location-pill">
                                <MapPin size={13} /> Visit Our Shop
                            </span>
                            <h2>Pandey Grocery Store</h2>
                            <p className="store-address-text">
                                Lal Danth Bypass Rd, Radhe Krishna Puram / Adarsh Nagar, Heera Nagar, Haldwani, Uttarakhand 263139
                            </p>

                            <div className="store-actions">
                                <a 
                                    href="https://share.google/3InE5GPOrGZNov2nQ" 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="btn btn-primary"
                                >
                                    <MapPin size={18} /> Open in Google Maps
                                </a>
                                <a 
                                    href="https://wa.me/919410516899?text=Hello%20Pandey%20Grocery%20Store%2C%20I%20have%20an%20inquiry" 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="btn btn-secondary whatsapp-connect-btn"
                                >
                                    <MessageCircle size={18} color="#25D366" /> Chat on WhatsApp
                                </a>
                            </div>
                        </div>

                        <div className="store-trust-badges">
                            <div className="trust-card">
                                <Shield size={24} color="#16a34a" />
                                <h4>Authentic &amp; Fresh</h4>
                                <p>Strict quality check on all pulses, oils, flours and dairy.</p>
                            </div>
                            <div className="trust-card">
                                <Tag size={24} color="#f97316" />
                                <h4>Fair Neighborhood Prices</h4>
                                <p>Consistent savings with daily deals on daily staples.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
