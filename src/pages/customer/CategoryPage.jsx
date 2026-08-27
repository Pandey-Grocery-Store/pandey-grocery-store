import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useState, useMemo, useEffect } from 'react';
import { 
    SlidersHorizontal, 
    Grid3X3, 
    List, 
    Loader, 
    PackageOpen, 
    ArrowLeft, 
    Search, 
    Check, 
    Sparkles, 
    ShoppingBag, 
    Store, 
    ShieldCheck, 
    ChevronRight,
    Printer
} from 'lucide-react';
import ProductCard from '../../components/ProductCard';
import PrintServicesPage from './PrintServicesPage';
import CategoryIcon from '../../components/CategoryIcon';
import { productsApi, categoriesApi } from '../../lib/api';
import { categories as localCategories, getCategoryById } from '../../data/categories';
import './CategoryPage.css';

const categoryThemes = {
    'groceries': {
        gradient: 'linear-gradient(135deg, #059669 0%, #064e3b 100%)',
        accentColor: '#10b981',
        tag: 'Fresh & Organic Daily Staples',
        desc: 'Daily pulses, rice, pure oils, spices, dairy products & kitchen essentials in Haldwani.',
    },
    'stationery': {
        gradient: 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)',
        accentColor: '#8b5cf6',
        tag: 'School, College & Office Supplies',
        desc: 'Registers, copies, pens, chart papers, files, folders & complete office stationery supplies.',
    },
    'household-personal': {
        gradient: 'linear-gradient(135deg, #0284c7 0%, #0c4a6e 100%)',
        accentColor: '#0ea5e9',
        tag: 'Home Hygiene & Personal Care',
        desc: 'Top quality cleaning supplies, detergents, soaps, hygiene essentials & household goods.',
    },
};

export default function CategoryPage() {
    const { categoryId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const subId = searchParams.get('sub');

    // Initialize with local category structure for instant rendering
    const [category, setCategory] = useState(() => getCategoryById(categoryId));
    const [allProducts, setAllProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const [searchWithin, setSearchWithin] = useState('');
    const [sortBy, setSortBy] = useState('popular');
    const [priceRange, setPriceRange] = useState('all');
    const [activeSub, setActiveSub] = useState(subId || 'all');
    const [viewMode, setViewMode] = useState('grid');

    // Update active subcategory if URL parameter changes
    useEffect(() => {
        setActiveSub(subId || 'all');
    }, [subId, categoryId]);

    // Fetch Category & Products
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch categories to find current one by slug or id
                const catsRes = await categoriesApi.getAll();
                if (catsRes?.categories && catsRes.categories.length > 0) {
                    const currentCat = catsRes.categories.find(c => c.slug === categoryId || c.id === categoryId);
                    if (currentCat) setCategory(currentCat);
                } else {
                    const fallback = getCategoryById(categoryId);
                    if (fallback) setCategory(fallback);
                }

                // Fetch products for this category
                const params = { category: categoryId };
                if (activeSub && activeSub !== 'all') {
                    params.subcategory = activeSub;
                }
                const prodRes = await productsApi.getAll(params);
                if (prodRes?.products) {
                    setAllProducts(prodRes.products);
                }
            } catch (err) {
                console.error("Failed to load category data", err);
                const fallback = getCategoryById(categoryId);
                if (fallback) setCategory(fallback);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [categoryId, activeSub]);

    const filteredProducts = useMemo(() => {
        let result = [...allProducts];

        if (searchWithin.trim()) {
            const q = searchWithin.toLowerCase();
            result = result.filter(p => p.name?.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q));
        }

        if (priceRange !== 'all') {
            const [min, max] = priceRange.split('-').map(Number);
            result = result.filter((p) => p.price >= min && (max ? p.price <= max : true));
        }

        switch (sortBy) {
            case 'price-low': result.sort((a, b) => a.price - b.price); break;
            case 'price-high': result.sort((a, b) => b.price - a.price); break;
            case 'rating': result.sort((a, b) => b.rating - a.rating); break;
            case 'discount': result.sort((a, b) => (b.mrp - b.price) / b.mrp - (a.mrp - a.price) / a.mrp); break;
            default: result.sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
        }

        return result;
    }, [allProducts, sortBy, priceRange, searchWithin]);

    if (categoryId === 'printing-binding') {
        return <PrintServicesPage />;
    }

    if (!category) {
        return (
            <div className="container section" style={{ textAlign: 'center', padding: '5rem 1rem' }}>
                <h2>Category not found</h2>
                <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>The requested category does not exist.</p>
                <Link to="/" className="btn btn-primary" style={{ marginTop: '1.5rem', display: 'inline-flex' }}>
                    <ArrowLeft size={16} /> Back to Home
                </Link>
            </div>
        );
    }

    const theme = categoryThemes[categoryId] || categoryThemes['groceries'];

    return (
        <div className="category-page">
            {/* ── Breadcrumb Bar ── */}
            <div className="cat-breadcrumb-strip">
                <div className="container cat-breadcrumb-inner">
                    <Link to="/" className="cat-crumb-link">Home</Link>
                    <ChevronRight size={14} className="cat-crumb-sep" />
                    <span className="cat-crumb-current">{category.name}</span>
                </div>
            </div>

            {/* ── Quick Switcher Bar Between 3 Categories ── */}
            <div className="cat-switcher-bar">
                <div className="container cat-switcher-inner">
                    {localCategories.map((c) => {
                        const isActive = c.id === categoryId || c.slug === categoryId;
                        return (
                            <Link
                                key={c.id}
                                to={`/category/${c.id}`}
                                className={`cat-switch-tab ${isActive ? 'active' : ''}`}
                            >
                                <CategoryIcon slug={c.id} size={16} />
                                <span>{c.name}</span>
                            </Link>
                        );
                    })}
                    <Link to="/category/printing-binding" className="cat-switch-tab print-tab">
                        <CategoryIcon slug="printing-binding" size={16} />
                        <span>Print Hub</span>
                    </Link>
                </div>
            </div>

            {/* ── Rich Category Hero Banner ── */}
            <section className="category-banner" style={{ background: theme.gradient }}>
                <div className="container category-banner-inner">
                    <div className="category-banner-content">
                        <span className="category-banner-tag">
                            <Sparkles size={13} /> {theme.tag}
                        </span>
                        <h1 className="category-banner-title">{category.name}</h1>
                        <p className="category-banner-hi">{category.nameHi}</p>
                        <p className="category-banner-desc">{theme.desc}</p>
                        
                        <div className="category-banner-badges">
                            <span className="cat-badge-item">
                                <Store size={14} /> 100% In-Store Freshness
                            </span>
                            <span className="cat-badge-item">
                                <ShieldCheck size={14} /> Best Local Haldwani Prices
                            </span>
                        </div>
                    </div>

                    <div className="category-banner-visual">
                        <div className="category-hero-glass-badge">
                            <CategoryIcon slug={category.slug || category.id} size={54} color="#ffffff" />
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Main Category Content Area ── */}
            <div className="container category-content">
                {/* Subcategory Pills Carousel */}
                {category.subcategories && category.subcategories.length > 0 && (
                    <div className="sub-pills-wrap">
                        <div className="sub-pills-header">
                            <span className="sub-pills-label">Subcategories:</span>
                        </div>
                        <div className="sub-pills-carousel">
                            <button 
                                className={`sub-pill ${activeSub === 'all' ? 'active' : ''}`} 
                                onClick={() => { setActiveSub('all'); navigate(`/category/${categoryId}`); }}
                            >
                                All {category.name}
                            </button>
                            {category.subcategories.map((sub) => (
                                <button
                                    key={sub.id}
                                    className={`sub-pill ${activeSub === sub.id ? 'active' : ''}`}
                                    onClick={() => { setActiveSub(sub.id); navigate(`/category/${categoryId}?sub=${sub.id}`); }}
                                >
                                    <span>{sub.name}</span>
                                    {sub.nameHi && <span className="sub-pill-hi">{sub.nameHi}</span>}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Toolbar Filter & Sort Controls */}
                <div className="category-toolbar">
                    <div className="toolbar-left">
                        {/* Search Within Category */}
                        <div className="category-search-box">
                            <Search size={16} className="cat-search-icon" />
                            <input
                                type="text"
                                placeholder={`Search in ${category.name}...`}
                                value={searchWithin}
                                onChange={(e) => setSearchWithin(e.target.value)}
                                className="cat-search-input"
                            />
                        </div>

                        {/* Price Filter */}
                        <select 
                            className="cat-filter-select" 
                            value={priceRange} 
                            onChange={(e) => setPriceRange(e.target.value)}
                        >
                            <option value="all">All Prices</option>
                            <option value="0-100">Under ₹100</option>
                            <option value="100-300">₹100 - ₹300</option>
                            <option value="300-500">₹300 - ₹500</option>
                            <option value="500-1000">₹500 - ₹1,000</option>
                            <option value="1000-99999">Above ₹1,000</option>
                        </select>

                        {/* Sort Filter */}
                        <select 
                            className="cat-filter-select" 
                            value={sortBy} 
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option value="popular">Sort: Most Popular</option>
                            <option value="price-low">Price: Low to High</option>
                            <option value="price-high">Price: High to Low</option>
                            <option value="rating">Top Rated</option>
                            <option value="discount">Best Savings</option>
                        </select>
                    </div>

                    <div className="toolbar-right">
                        <span className="result-count">
                            <strong>{filteredProducts.length}</strong> items found
                        </span>
                        <div className="view-mode-buttons">
                            <button 
                                className={`btn-icon view-btn ${viewMode === 'grid' ? 'active' : ''}`} 
                                onClick={() => setViewMode('grid')}
                                aria-label="Grid view"
                                title="Grid View"
                            >
                                <Grid3X3 size={17} />
                            </button>
                            <button 
                                className={`btn-icon view-btn ${viewMode === 'list' ? 'active' : ''}`} 
                                onClick={() => setViewMode('list')}
                                aria-label="List view"
                                title="List View"
                            >
                                <List size={17} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Products Grid or Empty Guide */}
                {loading ? (
                    <div className="category-loader-wrap">
                        <Loader size={36} className="spin" color="var(--primary)" />
                        <p>Loading items...</p>
                    </div>
                ) : filteredProducts.length > 0 ? (
                    <div className={`grid ${viewMode === 'grid' ? 'grid-4' : 'grid-1'}`}>
                        {filteredProducts.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                ) : (
                    <div className="cat-empty-showcase">
                        <div className="empty-badge-circle">
                            <PackageOpen size={48} color="var(--primary)" />
                        </div>
                        <h3>Fresh Inventory Coming Soon!</h3>
                        <p className="empty-sub-text">
                            We are currently stocking items in <strong>{category.name}</strong>. You can add new items directly from the staff/admin management panel.
                        </p>

                        {category.subcategories && (
                            <div className="empty-subcategories-list">
                                <h4>Available subcategories in this section:</h4>
                                <div className="empty-chips-grid">
                                    {category.subcategories.map(s => (
                                        <div key={s.id} className="empty-chip">
                                            <Check size={14} color="#16a34a" />
                                            <span>{s.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="empty-actions">
                            <Link to="/" className="btn btn-primary btn-lg">
                                <ShoppingBag size={18} /> Explore Store Home
                            </Link>
                            <Link to="/category/printing-binding" className="btn btn-secondary btn-lg" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                <Printer size={18} /> Visit Print Hub
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
