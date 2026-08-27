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
    Layers
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
        { label: 'Detergent Powder', query: 'detergent' },
        { label: 'Print ID Card', path: '/category/printing-binding' },
    ];

    const storePillars = [
        {
            id: 'groceries',
            title: 'Groceries & Kitchen',
            titleHi: 'दैनिक किराना एवं राशन',
            desc: 'Daily pulses, aged basmati rice, pure mustard oils, whole spices & dairy essentials.',
            path: '/category/groceries',
            theme: 'pillar-groceries',
            icon: ShoppingBasket,
            accent: '#10b981',
            badge: 'Fresh & Pure',
            tags: ['Dal & Pulses', 'Rice & Atta', 'Cooking Oils', 'Spices']
        },
        {
            id: 'stationery',
            title: 'Stationery & Office',
            titleHi: 'स्कूल, कॉलेज व ऑफिस स्टेशनरी',
            desc: 'Classmate registers, notebooks, pens, project charts, files, folders & desk supplies.',
            path: '/category/stationery',
            theme: 'pillar-stationery',
            icon: BookOpen,
            accent: '#8b5cf6',
            badge: 'School & Desk',
            tags: ['Registers', 'Ball & Gel Pens', 'Files & Folders', 'Chart Paper']
        },
        {
            id: 'household-personal',
            title: 'Household & Care',
            titleHi: 'घरेलू सफाई व व्यक्तिगत देखभाल',
            desc: 'Top brand detergents, surface disinfectants, bath soaps, shampoos & hygiene care.',
            path: '/category/household-personal',
            theme: 'pillar-household',
            icon: Sparkles,
            accent: '#0ea5e9',
            badge: 'Home Hygiene',
            tags: ['Detergents', 'Dishwashing', 'Soaps & Shampoos', 'Cleaning']
        },
        {
            id: 'printing-binding',
            title: 'Epson Print & Xerox Hub',
            titleHi: 'दस्तावेज़, आईडी कार्ड व फोटो प्रिंटिंग',
            desc: 'Instant 300 DPI high-speed printing. Smart A4 auto-layout for ID Cards & Passport Photos.',
            path: '/category/printing-binding',
            theme: 'pillar-print',
            icon: Printer,
            accent: '#7c3aed',
            badge: 'Instant In-Store',
            tags: ['PDF / Docx', 'ID Card Auto-Fit', 'Passport 35×45mm', 'WiFi Print']
        },
    ];

    return (
        <div className="home-page">
            {/* ─── Hero Section ─── */}
            <section className="home-hero">
                <div className="container hero-content-grid">
                    <div className="hero-left animate-fade-in">
                        <div className="hero-badge-pill">
                            <Sparkles size={14} color="var(--primary)" />
                            <span>Your Trusted Haldwani Superstore &amp; Print Hub</span>
                        </div>

                        <h1 className="hero-main-title">
                            Daily Essentials, Pure Groceries &amp; <br className="hidden-mobile" />
                            <span className="gradient-highlight">Smart WiFi Print Station</span>
                        </h1>

                        <p className="hero-subtitle-text">
                            Welcome to <strong>Pandey Grocery Store</strong>. Shop premium food staples, complete student &amp; office stationery, household supplies, and get high-resolution A4 document, ID card &amp; passport photo prints under one roof in Haldwani.
                        </p>

                        {/* Interactive Hero Search Bar */}
                        <form className="hero-search-box" onSubmit={handleSearchSubmit}>
                            <Search size={20} className="hero-search-icon" />
                            <input
                                type="text"
                                className="hero-search-input"
                                placeholder="Search for flour, rice, registers, pens, cleaning..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <button type="submit" className="hero-search-submit-btn">
                                Search
                            </button>
                        </form>

                        {/* Quick Tag Pills */}
                        <div className="hero-quick-tags">
                            <span className="tags-label">Popular:</span>
                            {quickKeywords.map((kw, i) => (
                                kw.path ? (
                                    <Link key={i} to={kw.path} className="quick-tag-chip print-tag">
                                        <Printer size={12} /> {kw.label}
                                    </Link>
                                ) : (
                                    <Link key={i} to={`/search?q=${encodeURIComponent(kw.query)}`} className="quick-tag-chip">
                                        {kw.label}
                                    </Link>
                                )
                            ))}
                        </div>

                        {/* Store Guarantees Row */}
                        <div className="hero-trust-row">
                            <div className="trust-item">
                                <span className="trust-icon-box" style={{ color: '#16a34a', background: 'rgba(22, 163, 74, 0.1)' }}>
                                    <Store size={18} />
                                </span>
                                <div>
                                    <strong>In-Store Shopping</strong>
                                    <span>Pick &amp; Pay in Haldwani</span>
                                </div>
                            </div>
                            <div className="trust-item">
                                <span className="trust-icon-box" style={{ color: '#7c3aed', background: 'rgba(124, 58, 237, 0.1)' }}>
                                    <Printer size={18} />
                                </span>
                                <div>
                                    <strong>Epson 300 DPI Station</strong>
                                    <span>Instant ID &amp; Photo Print</span>
                                </div>
                            </div>
                            <div className="trust-item">
                                <span className="trust-icon-box" style={{ color: '#ea580c', background: 'rgba(234, 88, 12, 0.1)' }}>
                                    <ShieldCheck size={18} />
                                </span>
                                <div>
                                    <strong>100% Genuine Items</strong>
                                    <span>Verified Quality Brands</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Hero Right Visual Showcase */}
                    <div className="hero-right animate-fade-in">
                        <div className="hero-glass-card">
                            <div className="glass-card-header">
                                <div className="glass-title">
                                    <Layers size={16} color="var(--primary)" />
                                    <span>Direct Department Access</span>
                                </div>
                                <span className="haldwani-live-tag">
                                    <MapPin size={11} /> Haldwani, UK
                                </span>
                            </div>

                            <div className="glass-showcase-grid">
                                <Link to="/category/groceries" className="showcase-box groceries-box">
                                    <div className="box-icon-wrap" style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}>
                                        <ShoppingBasket size={22} color="#ffffff" />
                                    </div>
                                    <div className="box-info">
                                        <h4>Groceries &amp; Staples</h4>
                                        <span className="box-hi">दैनिक राशन एवं किराना</span>
                                    </div>
                                    <ChevronRight size={18} className="box-arrow" />
                                </Link>

                                <Link to="/category/printing-binding" className="showcase-box print-box">
                                    <div className="box-icon-wrap" style={{ background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)' }}>
                                        <Printer size={22} color="#ffffff" />
                                    </div>
                                    <div className="box-info">
                                        <h4>Epson Print Station</h4>
                                        <span className="box-hi">आईडी कार्ड व फोटो प्रिंट</span>
                                    </div>
                                    <span className="box-badge-hot">WiFi Hub</span>
                                    <ChevronRight size={18} className="box-arrow" />
                                </Link>

                                <Link to="/category/stationery" className="showcase-box stationery-box">
                                    <div className="box-icon-wrap" style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)' }}>
                                        <BookOpen size={22} color="#ffffff" />
                                    </div>
                                    <div className="box-info">
                                        <h4>Stationery &amp; Office</h4>
                                        <span className="box-hi">स्कूल व कॉलेज स्टेशनरी</span>
                                    </div>
                                    <ChevronRight size={18} className="box-arrow" />
                                </Link>

                                <Link to="/category/household-personal" className="showcase-box household-box">
                                    <div className="box-icon-wrap" style={{ background: 'linear-gradient(135deg, #0284c7, #0ea5e9)' }}>
                                        <Sparkles size={22} color="#ffffff" />
                                    </div>
                                    <div className="box-info">
                                        <h4>Household &amp; Care</h4>
                                        <span className="box-hi">सफाई व पर्सनल केयर</span>
                                    </div>
                                    <ChevronRight size={18} className="box-arrow" />
                                </Link>
                            </div>

                            <div className="glass-card-footer">
                                <Link to="/offers" className="hero-offers-link">
                                    <Flame size={16} color="#ef4444" />
                                    <span>Check Today's Discount Deals</span>
                                    <ArrowRight size={14} />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── 4 Department Pillars Section ─── */}
            <section className="section pillars-section">
                <div className="container">
                    <div className="section-head-center">
                        <span className="section-pill-tag">
                            <Sparkles size={14} /> Comprehensive Catalog
                        </span>
                        <h2 className="section-title">Explore Store Departments</h2>
                        <p className="section-subtitle">
                            Browse authentic daily supplies or prepare your documents for high-speed counter printing.
                        </p>
                    </div>

                    <div className="pillars-grid">
                        {storePillars.map((p) => {
                            const IconComponent = p.icon;
                            return (
                                <Link key={p.id} to={p.path} className={`pillar-card ${p.theme}`}>
                                    <div className="pillar-card-top">
                                        <div className="pillar-icon-holder" style={{ color: p.accent }}>
                                            <IconComponent size={28} />
                                        </div>
                                        <span className="pillar-badge" style={{ color: p.accent }}>
                                            {p.badge}
                                        </span>
                                    </div>

                                    <div className="pillar-card-body">
                                        <h3>{p.title}</h3>
                                        <span className="pillar-hi">{p.titleHi}</span>
                                        <p>{p.desc}</p>
                                    </div>

                                    <div className="pillar-tags-list">
                                        {p.tags.map((t, idx) => (
                                            <span key={idx} className="pillar-tag-item">{t}</span>
                                        ))}
                                    </div>

                                    <div className="pillar-card-footer" style={{ color: p.accent }}>
                                        <span>Explore Department</span>
                                        <ArrowRight size={16} className="pillar-arrow" />
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ─── Epson Print Hub Spotlight ─── */}
            <section className="print-spotlight-section">
                <div className="container">
                    <div className="print-spotlight-container">
                        <div className="spotlight-left-col">
                            <span className="spotlight-header-pill">
                                <Printer size={15} /> In-Store WiFi Print Hub
                            </span>
                            <h2>Fast &amp; Accurate Document, ID Card &amp; Passport Photo Printing</h2>
                            <p>
                                No need to wait in long cyber cafe queues. Upload documents or photos directly from your phone, preview standard 300 DPI A4 sheets in real-time, and get crisp prints ready at Pandey Grocery Store!
                            </p>

                            <div className="spotlight-feature-cards">
                                <div className="spotlight-feature-card">
                                    <div className="sfc-icon"><FileText size={20} color="#0284c7" /></div>
                                    <div>
                                        <strong>Document Prints</strong>
                                        <span>PDF, Docx, Resumes &amp; Forms</span>
                                    </div>
                                </div>

                                <div className="spotlight-feature-card">
                                    <div className="sfc-icon"><CreditCard size={20} color="#7c3aed" /></div>
                                    <div>
                                        <strong>ID Card Smart-Fit</strong>
                                        <span>Aadhaar, PAN, Voter Card (Front &amp; Back)</span>
                                    </div>
                                </div>

                                <div className="spotlight-feature-card">
                                    <div className="sfc-icon"><Camera size={20} color="#ea580c" /></div>
                                    <div>
                                        <strong>Passport Studio</strong>
                                        <span>Standard 35×45mm with Cut Guides</span>
                                    </div>
                                </div>
                            </div>

                            <div className="spotlight-actions">
                                <Link to="/category/printing-binding" className="btn btn-primary btn-lg">
                                    <Printer size={18} /> Open Smart Print Hub <ArrowRight size={18} />
                                </Link>
                            </div>
                        </div>

                        <div className="spotlight-right-col">
                            <div className="printer-preview-card">
                                <div className="printer-card-header">
                                    <span className="printer-dot" />
                                    <span className="printer-model">Epson L3250 EcoTank Multi-function</span>
                                </div>
                                <div className="printer-perks-list">
                                    <div className="perk-item">
                                        <CheckCircle2 size={16} color="#10b981" />
                                        <span>300 DPI High Resolution Color &amp; B/W</span>
                                    </div>
                                    <div className="perk-item">
                                        <CheckCircle2 size={16} color="#10b981" />
                                        <span>True-to-Scale ID Card 85.6mm × 53.98mm</span>
                                    </div>
                                    <div className="perk-item">
                                        <CheckCircle2 size={16} color="#10b981" />
                                        <span>Instant Wireless Direct Upload &amp; Crop</span>
                                    </div>
                                    <div className="perk-item">
                                        <CheckCircle2 size={16} color="#10b981" />
                                        <span>Watermark Toggle for Clean Prints</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Product Showcase (Featured / Deals) ─── */}
            {(featured.length > 0 || deals.length > 0) && (
                <section className="section product-showcase-section">
                    <div className="container">
                        <div className="showcase-header-row">
                            <div className="showcase-title-wrap">
                                <h2 className="section-title">Store Products</h2>
                                <p className="section-subtitle">Top essentials and daily discounts available at our store</p>
                            </div>

                            <div className="showcase-tabs">
                                <button
                                    className={`tab-filter-btn ${activeTab === 'featured' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('featured')}
                                >
                                    <Star size={16} /> Featured Essentials ({featured.length})
                                </button>
                                {deals.length > 0 && (
                                    <button
                                        className={`tab-filter-btn ${activeTab === 'deals' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('deals')}
                                    >
                                        <Flame size={16} color="#ef4444" /> Special Deals ({deals.length})
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-4 products-grid-container">
                            {(activeTab === 'featured' ? featured : deals).map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ─── Store Ambience & Gallery Showcase ─── */}
            <StoreGallery />

            {/* ─── Store Location & Direct Contact Card ─── */}
            <section className="store-location-section">
                <div className="container">
                    <div className="store-location-card">
                        <div className="store-info-col">
                            <span className="location-pill">
                                <MapPin size={14} /> Visit Our Store in Haldwani
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
                                <ShieldCheck size={26} color="#16a34a" />
                                <div>
                                    <h4>Authentic &amp; Fresh</h4>
                                    <p>Strict quality check on all pulses, oils, flours and dairy.</p>
                                </div>
                            </div>
                            <div className="trust-card">
                                <Tag size={26} color="#f97316" />
                                <div>
                                    <h4>Fair Neighborhood Prices</h4>
                                    <p>Consistent savings with daily deals on daily staples.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
