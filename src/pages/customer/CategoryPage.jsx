import { useParams, useSearchParams } from 'react-router-dom';
import { useState, useMemo, useEffect } from 'react';
import { SlidersHorizontal, Grid3X3, List, Loader, ExternalLink } from 'lucide-react';
import ProductCard from '../../components/ProductCard';
import { productsApi, categoriesApi } from '../../lib/api';
import './CategoryPage.css';

export default function CategoryPage() {
    const { categoryId } = useParams();
    const [searchParams] = useSearchParams();
    const subId = searchParams.get('sub');

    const [category, setCategory] = useState(null);
    const [allProducts, setAllProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const [sortBy, setSortBy] = useState('popular');
    const [priceRange, setPriceRange] = useState('all');
    const [activeSub, setActiveSub] = useState(subId || 'all');
    const [viewMode, setViewMode] = useState('grid');

    // Fetch Category & Products
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch categories to find the current one by slug
                const catsRes = await categoriesApi.getAll();
                if (catsRes?.categories) {
                    const currentCat = catsRes.categories.find(c => c.slug === categoryId);
                    setCategory(currentCat || null);
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

    if (loading) {
        return <div className="container section" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}><Loader className="spin" size={40} /></div>;
    }

    if (categoryId === 'printing-binding') {
        return (
            <div className="category-page">
                <div className="container section" style={{ textAlign: 'center', padding: '5rem 2rem', background: 'var(--bg-secondary)', borderRadius: '16px', margin: '3rem auto', maxWidth: '800px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                    <div style={{ background: 'var(--bg-primary)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                        <ExternalLink size={36} color="var(--primary)" />
                    </div>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Document Printing & Binding</h1>
                    <p style={{ fontSize: '1.2rem', marginBottom: '2.5rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        We provide high-quality document printing, thesis binding, photo prints, and custom stationery through our dedicated platform, <strong>Fun Printing</strong>.
                    </p>
                    <a href="https://funprinting.store/" target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-lg" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.2rem', padding: '1.2rem 2.5rem', borderRadius: '12px' }}>
                        Visit Fun Printing Store <ExternalLink size={20} />
                    </a>
                    <p style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-tertiary)' }}>Opens in a new tab</p>
                </div>
            </div>
        );
    }

    if (!category) return <div className="container section"><h2>Category not found</h2></div>;

    return (
        <div className="category-page">
            <div className="category-hero" style={{ backgroundImage: `linear-gradient(135deg, rgba(232,89,12,0.85), rgba(249,115,22,0.75)), url(${category.image})` }}>
                <div className="container">
                    <span className="category-hero-icon">{category.icon}</span>
                    <h1>{category.name}</h1>
                    <p>{category.nameHi} • {allProducts.length} products</p>
                </div>
            </div>

            <div className="container category-content">
                {/* Subcategory Pills */}
                {category.subcategories && category.subcategories.length > 0 && (
                    <div className="sub-pills">
                        <button className={`sub-pill ${activeSub === 'all' ? 'active' : ''}`} onClick={() => setActiveSub('all')}>
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
                        <span className="result-count">{filteredProducts.length} products</span>
                        <button className={`btn btn-icon btn-ghost ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}><Grid3X3 size={18} /></button>
                        <button className={`btn btn-icon btn-ghost ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}><List size={18} /></button>
                    </div>
                </div>

                {/* Products Grid */}
                {filteredProducts.length > 0 ? (
                    <div className={`grid ${viewMode === 'grid' ? 'grid-4' : 'grid-1'}`}>
                        {filteredProducts.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <span className="empty-icon">🔍</span>
                        <h3>No products found</h3>
                        <p>Try adjusting your filters or browse a different category.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
