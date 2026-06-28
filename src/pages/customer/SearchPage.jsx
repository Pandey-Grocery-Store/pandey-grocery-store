import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, SlidersHorizontal, X, Loader } from 'lucide-react';
import ProductCard from '../../components/ProductCard';
import { productsApi, categoriesApi } from '../../lib/api';
import './SearchPage.css';

export default function SearchPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const q = searchParams.get('q') || '';
    
    const [query, setQuery] = useState(q);
    const [sortBy, setSortBy] = useState('relevance');
    const [categoryFilter, setCategoryFilter] = useState('all');
    
    const [allProducts, setAllProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch categories once
    useEffect(() => {
        categoriesApi.getAll().then(res => {
            if (res?.categories) setCategories(res.categories);
        }).catch(console.error);
    }, []);

    // Fetch products based on search query
    useEffect(() => {
        if (!q.trim()) {
            setAllProducts([]);
            return;
        }
        const fetchResults = async () => {
            setLoading(true);
            try {
                const res = await productsApi.getAll({ search: q.trim() });
                if (res?.products) {
                    setAllProducts(res.products);
                }
            } catch (err) {
                console.error("Failed to search products", err);
            } finally {
                setLoading(false);
            }
        };
        fetchResults();
    }, [q]);

    const results = useMemo(() => {
        let filtered = [...allProducts];

        if (categoryFilter !== 'all') {
            filtered = filtered.filter(p => p.category === categoryFilter);
        }

        switch (sortBy) {
            case 'price-low': return [...filtered].sort((a, b) => a.price - b.price);
            case 'price-high': return [...filtered].sort((a, b) => b.price - a.price);
            case 'rating': return [...filtered].sort((a, b) => b.rating - a.rating);
            case 'discount': return [...filtered].sort((a, b) => (1 - b.price / b.mrp) - (1 - a.price / a.mrp));
            default: return filtered;
        }
    }, [allProducts, sortBy, categoryFilter]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (query.trim()) {
            setSearchParams({ q: query.trim() });
        }
    };

    return (
        <div className="search-page">
            <div className="container">
                {/* Search Bar */}
                <form onSubmit={handleSearch} className="search-page-bar animate-fade-in">
                    <Search size={20} className="search-page-icon" />
                    <input
                        type="text"
                        className="search-page-input"
                        placeholder="Search for products, brands, categories..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        autoFocus
                    />
                    {query && (
                        <button type="button" className="search-clear" onClick={() => { setQuery(''); setSearchParams({}); }}>
                            <X size={18} />
                        </button>
                    )}
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? <Loader className="spin" size={18} /> : 'Search'}
                    </button>
                </form>

                {q ? (
                    loading ? (
                         <div className="container section" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '30vh' }}><Loader className="spin" size={40} /></div>
                    ) : (
                        <>
                            {/* Filters Row */}
                            <div className="search-meta animate-fade-in">
                                <p className="search-result-count">
                                    {results.length} result{results.length !== 1 ? 's' : ''} for "<strong>{q}</strong>"
                                </p>
                                <div className="search-filters">
                                    <div className="filter-group">
                                        <SlidersHorizontal size={14} />
                                        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="filter-select">
                                            <option value="all">All Categories</option>
                                            {categories.map(c => (
                                                <option key={c.id} value={c.slug}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="filter-select">
                                        <option value="relevance">Sort by Relevance</option>
                                        <option value="price-low">Price: Low to High</option>
                                        <option value="price-high">Price: High to Low</option>
                                        <option value="rating">Highest Rated</option>
                                        <option value="discount">Biggest Discount</option>
                                    </select>
                                </div>
                            </div>

                            {/* Results */}
                            {results.length > 0 ? (
                                <div className="grid grid-4 search-results">
                                    {results.map(product => (
                                        <ProductCard key={product.id} product={product} />
                                    ))}
                                </div>
                            ) : (
                                <div className="no-results animate-fade-in">
                                    <span className="no-results-icon">🔍</span>
                                    <h3>No products found</h3>
                                    <p>Try different keywords or browse our categories</p>
                                    <div className="no-results-suggestions">
                                        <Link to="/category/groceries" className="btn btn-secondary btn-sm">🛒 Groceries</Link>
                                        <Link to="/category/utensils" className="btn btn-secondary btn-sm">🍳 Utensils</Link>
                                        <Link to="/offers" className="btn btn-secondary btn-sm">🏷️ Offers</Link>
                                    </div>
                                </div>
                            )}
                        </>
                    )
                ) : (
                    <div className="search-empty animate-fade-in">
                        <span className="search-empty-icon">🔍</span>
                        <h2>What are you looking for?</h2>
                        <p>Search for groceries, spices, utensils, brands and more</p>
                        <div className="popular-searches">
                            <span className="popular-label">Popular:</span>
                            {['Basmati Rice', 'Toor Dal', 'Pressure Cooker', 'Tea', 'Ghee', 'Masala'].map(term => (
                                <button
                                    key={term}
                                    className="popular-tag"
                                    onClick={() => { setQuery(term); setSearchParams({ q: term }); }}
                                >
                                    {term}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
