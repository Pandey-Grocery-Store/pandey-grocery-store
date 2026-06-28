import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ShoppingCart, Heart, Star, Minus, Plus, Truck, Shield, RotateCcw, Share2, Loader } from 'lucide-react';
import ProductCard from '../../components/ProductCard';
import { productsApi } from '../../lib/api';
import { useCart } from '../../context/CartContext';
import './ProductPage.css';

export default function ProductPage() {
    const { productId } = useParams();
    const { addItem, items } = useCart();
    
    const [product, setProduct] = useState(null);
    const [related, setRelated] = useState([]);
    const [loading, setLoading] = useState(true);
    const [qty, setQty] = useState(1);
    const [wishlisted, setWishlisted] = useState(false);

    useEffect(() => {
        const fetchProductData = async () => {
            setLoading(true);
            try {
                const res = await productsApi.getById(productId);
                if (res?.product) {
                    setProduct(res.product);
                    // Fetch related products in the same subcategory
                    const relRes = await productsApi.getAll({ subcategory: res.product.subcategory, limit: 5 });
                    if (relRes?.products) {
                        setRelated(relRes.products.filter((p) => p.id !== res.product.id).slice(0, 4));
                    }
                }
            } catch (err) {
                console.error("Failed to load product data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProductData();
        // Reset state on ID change
        setQty(1);
        window.scrollTo(0, 0);
    }, [productId]);

    if (loading) {
        return <div className="container section" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}><Loader className="spin" size={40} /></div>;
    }

    if (!product) return <div className="container section"><h2>Product not found</h2></div>;

    const discount = Math.round(((product.mrp - product.price) / product.mrp) * 100);
    const savings = product.mrp - product.price;
    const inCart = items.find((i) => i.id === product.id);

    const handleAddToCart = () => {
        for (let i = 0; i < qty; i++) addItem(product);
    };

    return (
        <div className="product-page">
            <div className="container">
                {/* Breadcrumb */}
                <div className="breadcrumb">
                    <Link to="/">Home</Link> / <Link to={`/category/${product.category}`}>{product.category === 'groceries' ? 'Groceries' : 'Kitchen Utensils'}</Link> / <span>{product.name}</span>
                </div>

                <div className="product-detail">
                    {/* Image */}
                    <div className="product-image-section">
                        <div className="product-main-image">
                            <img src={product.image} alt={product.name} />
                            {discount > 0 && <span className="discount-badge">{discount}% OFF</span>}
                            <button className={`product-wishlist ${wishlisted ? 'active' : ''}`} onClick={() => setWishlisted(!wishlisted)}>
                                <Heart size={20} fill={wishlisted ? 'var(--danger)' : 'none'} />
                            </button>
                        </div>
                    </div>

                    {/* Info */}
                    <div className="product-info-section">
                        <span className="product-brand-tag">{product.brand}</span>
                        <h1 className="product-title">{product.name}</h1>
                        <p className="product-name-hi">{product.nameHi}</p>

                        <div className="product-rating-row">
                            <div className="product-stars">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <Star key={s} size={16} fill={s <= Math.floor(product.rating) ? '#f59e0b' : 'none'} color="#f59e0b" />
                                ))}
                                <span className="rating-value">{product.rating}</span>
                            </div>
                            <span className="review-count">{product.reviews} reviews</span>
                        </div>

                        <div className="product-price-block">
                            <span className="product-current-price">₹{product.price}</span>
                            {product.mrp > product.price && (
                                <>
                                    <span className="product-mrp">MRP ₹{product.mrp}</span>
                                    <span className="product-savings badge badge-success">You save ₹{savings}</span>
                                </>
                            )}
                        </div>
                        <p className="product-tax-info">Inclusive of all taxes</p>

                        <div className="product-unit">
                            <span>Pack Size:</span> <strong>{product.unit}</strong>
                        </div>

                        <p className="product-desc">{product.description}</p>

                        <div className="product-actions">
                            <div className="qty-control">
                                <button onClick={() => setQty(Math.max(1, qty - 1))}><Minus size={16} /></button>
                                <span>{qty}</span>
                                <button onClick={() => setQty(qty + 1)}><Plus size={16} /></button>
                            </div>
                            <button className="btn btn-primary btn-lg" onClick={handleAddToCart}>
                                <ShoppingCart size={18} />
                                {inCart ? 'Add More to Cart' : 'Add to Cart'}
                            </button>
                            <button className="btn btn-ghost btn-icon" title="Share">
                                <Share2 size={18} />
                            </button>
                        </div>

                        {product.stock <= 10 && (
                            <p className="stock-warning">⚠️ Only {product.stock} left in stock — order soon!</p>
                        )}

                        <div className="product-guarantees">
                            <div className="guarantee-item">
                                <Truck size={18} />
                                <div>
                                    <strong>Free Delivery</strong>
                                    <span>On orders above ₹500</span>
                                </div>
                            </div>
                            <div className="guarantee-item">
                                <Shield size={18} />
                                <div>
                                    <strong>Secure Payment</strong>
                                    <span>UPI, Card & COD</span>
                                </div>
                            </div>
                            <div className="guarantee-item">
                                <RotateCcw size={18} />
                                <div>
                                    <strong>Easy Returns</strong>
                                    <span>7-day return policy</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Related */}
                {related.length > 0 && (
                    <div className="related-section section">
                        <h2 className="section-title">You May Also Like</h2>
                        <div className="grid grid-4">
                            {related.map((p) => (
                                <ProductCard key={p.id} product={p} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
