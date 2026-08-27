import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
    ArrowRight, 
    ShieldCheck, 
    Tag, 
    Star, 
    MapPin, 
    Printer, 
    FileText, 
    CreditCard, 
    Camera, 
    Sparkles, 
    MessageCircle, 
    ShoppingBasket, 
    Store, 
    Zap, 
    Flame, 
    Search, 
    BookOpen, 
    CheckCircle2,
    ChevronRight,
    HeartHandshake,
    Truck,
    BadgePercent
} from 'lucide-react';
import ProductCard from '../../components/ProductCard';
import StoreGallery from '../../components/StoreGallery';
import CategoryIcon from '../../components/CategoryIcon';
import { productsApi, categoriesApi } from '../../lib/api';
import './HomePage.css';

export default function HomePage() {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [featured, setFeatured] = useState([]);
    const [deals, setDeals] = useState([]);
    const [activeTab, setActiveTab] = useState('featured');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadHomeData = async () => {
            setLoading(true);
            try {
                const [catRes, prodRes] = await Promise.all([
                    categoriesApi.getAll(),
                    productsApi.getAll({ limit: 12 }),
                ]);
                if (catRes?.categories) setCategories(catRes.categories);
                if (prodRes?.products) {
                    setFeatured(prodRes.products.slice(0, 8));
                    setDeals(prodRes.products.filter(p => p.discount > 0 || (p.mrp && p.price < p.mrp)).slice(0, 8));
                }
            } catch (err) {
                console.error("Failed to load home data", err);
            } finally {
                setLoading(false);
            }
        };
        loadHomeData();
    }, []);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const quickKeywords = [
        { label: 'Basmati Rice', query: 'rice' },
        { label: 'Mustard Oil', query: 'oil' },
        { label: 'Registers & Copies', query: 'register' },
        { label: 'Detergents', query: 'detergent' },
        { label: 'Print ID Card', path: '/category/printing-binding' },
    ];

    const departments = [
        {
            id: 'groceries',
            title: 'Groceries & Kitchen',
            titleHi: 'दैनिक किराना एवं राशन',
            desc: 'Aged basmati rice, farm pulses, cold-pressed oils, pure spices & dairy daily.',
            path: '/category/groceries',
            icon: ShoppingBasket,
            color: '#10b981',
            bg: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
            border: 'rgba(16, 185, 129, 0.25)',
            badge: 'Daily Essentials',
            items: ['Dal & Pulses', 'Rice & Flour', 'Pure Cooking Oils', 'Whole Spices']
        },
        {
            id: 'stationery',
            title: 'Stationery & Office',
            titleHi: 'स्कूल, कॉलेज व स्टेशनरी',
            desc: 'Classmate registers, notebooks, pens, project sheets, files, folders & desk supplies.',
            path: '/category/stationery',
            icon: BookOpen,
            color: '#8b5cf6',
            bg: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
            border: 'rgba(139, 92, 246, 0.25)',
            badge: 'School & Desk',
            items: ['Registers & Copies', 'Ball & Gel Pens', 'Files & Folders', 'Art Supplies']
        },
        {
            id: 'household-personal',
            title: 'Household & Care',
            titleHi: 'सफाई व व्यक्तिगत देखभाल',
            desc: 'Top brand laundry detergents, surface disinfectants, bath soaps & hygiene goods.',
            path: '/category/household-personal',
            icon: Sparkles,
            color: '#0ea5e9',
            bg: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
            border: 'rgba(14, 165, 233, 0.25)',
            badge: 'Home Hygiene',
            items: ['Detergent Powder', 'Floor & Dish Wash', 'Bath Soaps', 'Personal Care']
        },
        {
            id: 'printing-binding',
            title: 'Print & Xerox Hub',
            titleHi: 'दस्तावेज़ व फोटो प्रिंटिंग',
            desc: 'Instant online upload. Auto-formatted ID cards, passport photos & document prints.',
            path: '/category/printing-binding',
            icon: Printer,
            color: '#7c3aed',
            bg: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
            border: 'rgba(124, 58, 237, 0.25)',
            badge: 'Instant In-Store',
            items: ['PDF Documents', 'ID Card Auto-Layout', 'Passport Photos', 'Photo Prints']
        },
    ];

    const storePerks = [
        {
            icon: ShieldCheck,
            title: '100% Genuine Brands',
            desc: 'Authentic groceries, pure kitchen ingredients & standard student stationery.',
            color: '#10b981'
        },
        {
            icon: BadgePercent,
            title: 'Best Local Prices',
            desc: 'Affordable neighborhood grocery rates and transparent daily discount deals.',
            color: '#f59e0b'
        },
        {
            icon: Store,
            title: 'Store Pickup & Delivery',
            desc: 'Collect directly at counter or get doorstep delivery in Haldwani.',
            color: '#0ea5e9'
        },
        {
            icon: HeartHandshake,
            title: 'Friendly Local Service',
            desc: 'Trusted neighborhood shop assistance on WhatsApp and in-person.',
            color: '#ec4899'
        }
    ];

    return (
        <div className="home-page">
            {/* ─── Creative Hero Section ─── */}
            <section className="home-hero">
                <div className="container hero-container">
                    <div className="hero-text-col animate-fade-in">
                        <div className="hero-badge-tag">
                            <Sparkles size={14} color="var(--primary)" />
                            <span>Your Local Haldwani Superstore &amp; Print Hub</span>
                        </div>

                        <h1 className="hero-heading">
                            Quality Groceries, Daily Essentials &amp; <br />
                            <span className="hero-gradient-text">Instant In-Store Print Hub</span>
                        </h1>

                        <p className="hero-description">
                            Welcome to <strong>Pandey Grocery Store</strong>. Pick up fresh cooking staples, student &amp; office stationery, household cleaning supplies, or prepare documents and ID cards for instant counter printing in Haldwani.
                        </p>

                        {/* Search Bar */}
                        <form className="hero-search-bar" onSubmit={handleSearchSubmit}>
                            <Search size={20} className="search-bar-icon" />
                            <input
                                type="text"
                                className="search-bar-input"
                                placeholder="Search for flour, rice, registers, pens, cleaning supplies..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <button type="submit" className="search-bar-button">
                                Search
                            </button>
                        </form>

                        {/* Quick Keywords */}
                        <div className="hero-tags-row">
                            <span className="tags-caption">Quick Links:</span>
                            {quickKeywords.map((item, idx) => (
                                item.path ? (
                                    <Link key={idx} to={item.path} className="hero-tag-link print-highlight">
                                        <Printer size={13} /> {item.label}
                                    </Link>
                                ) : (
                                    <Link key={idx} to={`/search?q=${encodeURIComponent(item.query)}`} className="hero-tag-link">
                                        {item.label}
                                    </Link>
                                )
                            ))}
                        </div>

                        {/* Quick CTA Actions */}
                        <div className="hero-cta-group">
                            <Link to="/category/groceries" className="btn btn-primary btn-lg hero-cta-btn">
                                <ShoppingBasket size={18} /> Shop Groceries <ArrowRight size={18} />
                            </Link>
                            <Link to="/category/printing-binding" className="btn btn-secondary btn-lg hero-cta-btn">
                                <Printer size={18} /> Open Print Hub
                            </Link>
                        </div>
                    </div>

                    {/* Hero Visual Card Matrix */}
                    <div className="hero-visual-col animate-fade-in">
                        <div className="visual-card-wrapper">
                            <div className="visual-card-top">
                                <div className="card-top-title">
                                    <Store size={18} color="var(--primary)" />
                                    <span>Store Departments</span>
                                </div>
                                <span className="local-shop-pill">
                                    <MapPin size={12} /> Haldwani Store
                                </span>
                            </div>

                            <div className="visual-department-list">
                                {departments.map((dept) => {
                                    const DeptIcon = dept.icon;
                                    return (
                                        <Link key={dept.id} to={dept.path} className="dept-quick-box">
                                            <div className="dept-icon-circle" style={{ background: dept.color }}>
                                                <DeptIcon size={20} color="#ffffff" />
                                            </div>
                                            <div className="dept-info-text">
                                                <h4>{dept.title}</h4>
                                                <span className="dept-hi-label">{dept.titleHi}</span>
                                            </div>
                                            <ChevronRight size={16} className="dept-chevron" />
                                        </Link>
                                    );
                                })}
                            </div>

                            <div className="visual-card-bottom">
                                <Link to="/offers" className="visual-deals-strip">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <Flame size={16} color="#ef4444" />
                                        <span>Explore Today's Discount Deals</span>
                                    </div>
                                    <ArrowRight size={14} />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Department Cards Showcase ─── */}
            <section className="section departments-section">
                <div className="container">
                    <div className="section-title-header">
                        <span className="badge-subtitle">
                            <Sparkles size={14} /> Comprehensive Catalog
                        </span>
                        <h2>Explore Store Departments</h2>
                        <p>Browse authentic food staples, quality stationery, and fast in-store print services.</p>
                    </div>

                    <div className="departments-grid">
                        {departments.map((dept) => {
                            const DeptIcon = dept.icon;
                            return (
                                <Link 
                                    key={dept.id} 
                                    to={dept.path} 
                                    className="department-card"
                                    style={{ '--card-accent': dept.color }}
                                >
                                    <div className="dept-card-header">
                                        <div className="dept-card-icon" style={{ color: dept.color, background: dept.bg }}>
                                            <DeptIcon size={26} />
                                        </div>
                                        <span className="dept-card-badge" style={{ color: dept.color, borderColor: dept.border }}>
                                            {dept.badge}
                                        </span>
                                    </div>

                                    <div className="dept-card-content">
                                        <h3>{dept.title}</h3>
                                        <span className="dept-card-hi">{dept.titleHi}</span>
                                        <p>{dept.desc}</p>
                                    </div>

                                    <div className="dept-items-tags">
                                        {dept.items.map((it, idx) => (
                                            <span key={idx} className="dept-item-pill">{it}</span>
                                        ))}
                                    </div>

                                    <div className="dept-card-action" style={{ color: dept.color }}>
                                        <span>Browse Department</span>
                                        <ArrowRight size={16} className="action-arrow" />
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ─── Clean Print Services Hub Feature ─── */}
            <section className="print-hub-feature-section">
                <div className="container">
                    <div className="print-hub-feature-card">
                        <div className="ph-content-left">
                            <span className="ph-badge">
                                <Printer size={15} /> In-Store Print Services
                            </span>
                            <h2>Document, ID Card &amp; Passport Photo Printing</h2>
                            <p>
                                Skip long cyber cafe waiting times. Upload your files or photos directly from your phone, preview standard A4 print layouts instantly, and collect your prints at Pandey Grocery Store!
                            </p>

                            <div className="ph-service-cards-row">
                                <div className="ph-service-box">
                                    <div className="ph-service-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                                        <FileText size={22} />
                                    </div>
                                    <h4>Document Printing</h4>
                                    <span>PDF, Word, Resumes &amp; Forms</span>
                                </div>

                                <div className="ph-service-box">
                                    <div className="ph-service-icon" style={{ background: '#f3e8ff', color: '#7c3aed' }}>
                                        <CreditCard size={22} />
                                    </div>
                                    <h4>ID Card Smart-Fit</h4>
                                    <span>Aadhaar, PAN &amp; Voter ID (Front &amp; Back)</span>
                                </div>

                                <div className="ph-service-box">
                                    <div className="ph-service-icon" style={{ background: '#ffedd5', color: '#ea580c' }}>
                                        <Camera size={22} />
                                    </div>
                                    <h4>Passport Photo Studio</h4>
                                    <span>Standard 35×45mm with Cut Guides</span>
                                </div>
                            </div>

                            <div className="ph-actions">
                                <Link to="/category/printing-binding" className="btn btn-primary btn-lg">
                                    <Printer size={18} /> Open Print Hub <ArrowRight size={18} />
                                </Link>
                            </div>
                        </div>

                        <div className="ph-highlights-right">
                            <div className="ph-checklist-box">
                                <h4 className="ph-check-title">Why Use Our Print Hub?</h4>
                                <div className="ph-check-item">
                                    <CheckCircle2 size={18} color="#10b981" />
                                    <div>
                                        <strong>True-to-Scale ID Cards</strong>
                                        <span>Standard card dimensions (85.6mm × 53.98mm)</span>
                                    </div>
                                </div>
                                <div className="ph-check-item">
                                    <CheckCircle2 size={18} color="#10b981" />
                                    <div>
                                        <strong>Auto Passport Grid</strong>
                                        <span>Arranges 2, 4, 8, 12, 16 or 24 photos with cut guides</span>
                                    </div>
                                </div>
                                <div className="ph-check-item">
                                    <CheckCircle2 size={18} color="#10b981" />
                                    <div>
                                        <strong>Instant Mobile Crop &amp; Preview</strong>
                                        <span>Preview exact A4 sheets on your screen before printing</span>
                                    </div>
                                </div>
                                <div className="ph-check-item">
                                    <CheckCircle2 size={18} color="#10b981" />
                                    <div>
                                        <strong>Clean Print Option</strong>
                                        <span>Option to download or print clean sheets without watermarks</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Why Shop With Us (Store Perks) ─── */}
            <section className="section perks-section">
                <div className="container">
                    <div className="section-title-header">
                        <span className="badge-subtitle">
                            <Sparkles size={14} /> The Pandey Store Promise
                        </span>
                        <h2>Why Haldwani Trusts Us</h2>
                        <p>Delivering authentic products, fair prices, and reliable neighborhood service every single day.</p>
                    </div>

                    <div className="perks-grid">
                        {storePerks.map((perk, i) => {
                            const PerkIcon = perk.icon;
                            return (
                                <div key={i} className="perk-card">
                                    <div className="perk-icon-wrap" style={{ color: perk.color, background: `${perk.color}15` }}>
                                        <PerkIcon size={24} />
                                    </div>
                                    <h3>{perk.title}</h3>
                                    <p>{perk.desc}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ─── Dynamic Products Showcase (Featured / Deals) ─── */}
            {(featured.length > 0 || deals.length > 0) && (
                <section className="section showcase-products-section">
                    <div className="container">
                        <div className="showcase-top-bar">
                            <div>
                                <h2 className="section-heading-sm">Store Products</h2>
                                <p className="section-subtext-sm">Popular groceries and daily essentials in our Haldwani inventory</p>
                            </div>

                            <div className="showcase-tabs-container">
                                <button
                                    className={`showcase-tab ${activeTab === 'featured' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('featured')}
                                >
                                    <Star size={16} /> Featured Essentials ({featured.length})
                                </button>
                                {deals.length > 0 && (
                                    <button
                                        className={`showcase-tab ${activeTab === 'deals' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('deals')}
                                    >
                                        <Flame size={16} color="#ef4444" /> Special Deals ({deals.length})
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-4 product-cards-grid">
                            {(activeTab === 'featured' ? featured : deals).map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ─── Real Store Aisles Showcase ─── */}
            <StoreGallery />

            {/* ─── Store Location & Instant WhatsApp Section ─── */}
            <section className="store-location-section">
                <div className="container">
                    <div className="location-dark-card">
                        <div className="location-info-column">
                            <span className="location-badge-pill">
                                <MapPin size={14} /> Visit Our Store in Haldwani
                            </span>
                            <h2>Pandey Grocery Store</h2>
                            <p className="store-address">
                                Lal Danth Bypass Rd, Radhe Krishna Puram / Adarsh Nagar, Heera Nagar, Haldwani, Uttarakhand 263139
                            </p>

                            <div className="store-cta-buttons">
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
                                    className="btn btn-secondary whatsapp-button"
                                >
                                    <MessageCircle size={18} color="#25D366" /> Chat on WhatsApp
                                </a>
                            </div>
                        </div>

                        <div className="location-trust-column">
                            <div className="location-perk-item">
                                <ShieldCheck size={26} color="#10b981" />
                                <div>
                                    <h4>Quality Tested &amp; Fresh</h4>
                                    <p>Strict quality check on all pulses, flours, oils and packaged goods.</p>
                                </div>
                            </div>
                            <div className="location-perk-item">
                                <Tag size={26} color="#f97316" />
                                <div>
                                    <h4>Fair Neighborhood Prices</h4>
                                    <p>Consistent local value with transparent pricing across all departments.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
