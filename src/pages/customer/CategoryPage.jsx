import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useState, useMemo, useEffect } from 'react';
import { SlidersHorizontal, Grid3X3, List, Loader, PackageOpen, ArrowLeft } from 'lucide-react';
import ProductCard from '../../components/ProductCard';
import PrintServicesPage from './PrintServicesPage';
import CategoryIcon from '../../components/CategoryIcon';
import { productsApi, categoriesApi } from '../../lib/api';
import { getCategoryById } from '../../data/categories';
import './CategoryPage.css';

export default function CategoryPage() {
    const { categoryId } = useParams();
    const [searchParams] = useSearchParams();
    const subId = searchParams.get('sub');

    // Initialize with local category structure for instant rendering
    const [category, setCategory] = useState(() => getCategoryById(categoryId));
    const [allProducts, setAllProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const [sortBy, setSortBy] = useState('popular');
    const [priceRange, setPriceRange] = useState('all');
    const [activeSub, setActiveSub] = useState(subId || 'all');
    const [viewMode, setViewMode] = useState('grid');

    // Update active subcategory if URL parameter changes
    useEffect(() => {
        if (subId) setActiveSub(subId);
    }, [subId]);

    // Fetch Category & Products
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch categories to find the current one by slug
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

        if (priceRange !== 'all') {
            const [min, max] = priceRange.split('-').map(Number);
            result = result.filter((p) => p.price >= min && (max ? p.price <= max : true));
        }

        switch (sortBy) {
            case 'price-low': result.sort((a, b) => a.price - b.price); break;
            case 'price-high': result.sort((a, b) => b.price - a.price); break;
            case 'rating': result.sort((a, b) => b.rating - a.rating); break;
            case 'discount': result.sort((a, b) => (b.mrp - b.price) / b.mrp - (a.mrp - a.price) / a.mrp); break;
            default: result.sort((a, b) => b.reviews - a.reviews);
        }

        return result;
    }, [allProducts, sortBy, priceRange]);

    if (categoryId === 'printing-binding') {
        return <PrintServicesPage />;
    }

    if (!category) {
        return (
            <div className="container section" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                <h2>Category not found</h2>
                <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>The requested category does not exist.</p>
                <Link to="/" className="btn btn-primary" style={{ marginTop: '1.5rem', display: 'inline-flex' }}>
                    <ArrowLeft size={16} /> Back to Home
                </Link>
            </div>
        );
    }

    return (
        <div className="category-page">
            <div 
                className="category-hero" 
                style={{ 
                    backgroundImage: `linear-gradient(135deg, rgba(22, 163, 74, 0.85), rgba(15, 23, 42, 0.8)), url(${category.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800'})` 
                }}
            >
                <div className="container">
                    <div className="category-hero-icon-wrap" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', marginBottom: '0.75rem' }}>
                        <CategoryIcon slug={category.slug || category.id} size={32} color="#ffffff" />
                    </div>
                    <h1>{category.name}</h1>
                    <p>{category.nameHi} • {allProducts.length} items</p>
                </div>
            </div>

            <div className="container category-content">
                {/* Subcategory Pills */}
                {category.subcategories && category.subcategories.length > 0 && (
                    <div className="sub-pills">
                        <button 
                            className={`sub-pill ${activeSub === 'all' ? 'active' : ''}`} 
                            onClick={() => setActiveSub('all')}
                        >
                            All
                        </button>
                        {category.subcategories.map((sub) => (
                            <button
                                key={sub.id}
                                className={`sub-pill ${activeSub === sub.id ? 'active' : ''}`}
                                onClick={() => setActiveSub(sub.id)}
                            >
                                {sub.name}
                            </button>
                        ))}
                    </div>
                )}

                {/* Toolbar */}
                <div className="category-toolbar">
                    <div className="toolbar-left">
                        <SlidersHorizontal size={16} />
                        <select className="input" style={{ width: 'auto' }} value={priceRange} onChange={(e) => setPriceRange(e.target.value)}>
                            <option value="all">All Prices</option>
                            <option value="0-100">Under ₹100</option>
                            <option value="100-300">₹100 - ₹300</option>
                            <option value="300-500">₹300 - ₹500</option>
                            <option value="500-1000">₹500 - ₹1,000</option>
                            <option value="1000-99999">Above ₹1,000</option>
                        </select>
                        <select className="input" style={{ width: 'auto' }} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                            <option value="popular">Most Popular</option>
                            <option value="price-low">Price: Low to High</option>
                            <option value="price-high">Price: High to Low</option>
                            <option value="rating">Top Rated</option>
                            <option value="discount">Best Discount</option>
                        </select>
                    </div>
                    <div className="toolbar-right">
                        <span className="result-count">{filteredProducts.length} items</span>
                        <button 
                            className={`btn btn-icon btn-ghost ${viewMode === 'grid' ? 'active' : ''}`} 
                            onClick={() => setViewMode('grid')}
                            aria-label="Grid view"
                        >
                            <Grid3X3 size={18} />
                        </button>
                        <button 
                            className={`btn btn-icon btn-ghost ${viewMode === 'list' ? 'active' : ''}`} 
                            onClick={() => setViewMode('list')}
                            aria-label="List view"
                        >
                            <List size={18} />
                        </button>
                    </div>
                </div>

                {/* Products Grid */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                        <Loader size={32} className="spin" style={{ margin: '0 auto', color: 'var(--primary)' }} />
                        <p style={{ marginTop: '0.75rem', color: 'var(--text-secondary)' }}>Loading products...</p>
                    </div>
                ) : filteredProducts.length > 0 ? (
                    <div className={`grid ${viewMode === 'grid' ? 'grid-4' : 'grid-1'}`}>
                        {filteredProducts.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                ) : (
                    <div className="empty-state" style={{ textAlign: 'center', padding: '4rem 1rem', background: 'var(--bg-secondary)', borderRadius: '16px' }}>
                        <PackageOpen size={48} style={{ color: 'var(--primary)', margin: '0 auto 1rem' }} />
                        <h3>No products added yet</h3>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                            Products will be added soon through the staff management panel.
                        </p>
                        <Link to="/" className="btn btn-secondary" style={{ marginTop: '1.5rem', display: 'inline-flex' }}>
                            <ArrowLeft size={16} /> Explore All Categories
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
