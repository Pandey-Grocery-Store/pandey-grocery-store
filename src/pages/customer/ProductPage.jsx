import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
    ShoppingCart, 
    Heart, 
    Star, 
    Minus, 
    Plus, 
    Shield, 
    RotateCcw, 
    Share2, 
    Loader, 
    AlertTriangle, 
    Scale, 
    Box, 
    Calculator, 
    ArrowRightLeft, 
    Check, 
    Truck, 
    Sparkles, 
    Clock, 
    Store 
} from 'lucide-react';
import ProductCard from '../../components/ProductCard';
import { productsApi } from '../../lib/api';
import { useCart } from '../../context/CartContext';
import './ProductPage.css';

const WEIGHT_PRESETS = [
    { label: '250 g', multiplier: 0.25, grams: 250 },
    { label: '500 g', multiplier: 0.5, grams: 500 },
    { label: '1 kg', multiplier: 1, grams: 1000 },
    { label: '2 kg', multiplier: 2, grams: 2000 },
    { label: '5 kg', multiplier: 5, grams: 5000 },
    { label: '10 kg', multiplier: 10, grams: 10000 },
    { label: '25 kg (Bori)', multiplier: 25, grams: 25000 },
];

const RUPEE_PRESETS = [20, 50, 100, 200, 500, 1000];

export default function ProductPage() {
    const { productId } = useParams();
    const { addItem, items } = useCart();
    
    const [product, setProduct] = useState(null);
    const [related, setRelated] = useState([]);
    const [loading, setLoading] = useState(true);
    const [qty, setQty] = useState(1);
    const [wishlisted, setWishlisted] = useState(false);

    // Loose / By-Weight Interactive State
    const [selectedWeight, setSelectedWeight] = useState(WEIGHT_PRESETS[2]); // Default 1 kg
    const [calcMode, setCalcMode] = useState('preset'); // 'preset' | 'custom-rs' | 'custom-weight'
    const [customRsInput, setCustomRsInput] = useState('50');
    const [customWeightInput, setCustomWeightInput] = useState('1.5');
    const [addedAlert, setAddedAlert] = useState(false);

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
        setQty(1);
        setSelectedWeight(WEIGHT_PRESETS[2]);
        setCalcMode('preset');
        window.scrollTo(0, 0);
    }, [productId]);

    if (loading) {
        return (
            <div className="product-page-loading">
                <Loader className="spin" size={40} color="var(--primary)" />
                <p>Loading fresh product details...</p>
            </div>
        );
    }

    if (!product) return <div className="container section"><h2>Product not found</h2></div>;

    // Detect if this is a loose / weight product
    const isWeightProduct = product.unit?.toLowerCase().includes('kg') || 
                            product.description?.includes('[TYPE:weight]') ||
                            ['rice-grains', 'spices-masala', 'fresh-produce'].includes(product.subcategory);

    // Base price per 1 kg (or unit)
    const basePrice = Number(product.price) || 0;
    const baseMrp = Number(product.mrp) || basePrice;

    // Clean description text without raw [TYPE:weight]
    const cleanDescription = (product.description || '')
        .replace(/\[TYPE:weight\]/gi, '')
        .trim();

    // Calculations based on active selection
    let activePrice = basePrice;
    let activeMrp = baseMrp;
    let activeUnitLabel = product.unit || '1 Unit';
    let calculatedGrams = 1000;

    if (isWeightProduct) {
        if (calcMode === 'preset') {
            activePrice = Math.round(basePrice * selectedWeight.multiplier);
            activeMrp = Math.round(baseMrp * selectedWeight.multiplier);
            activeUnitLabel = selectedWeight.label;
            calculatedGrams = selectedWeight.grams;
        } else if (calcMode === 'custom-rs') {
            const enteredRs = Number(customRsInput) || 0;
            activePrice = enteredRs;
            activeMrp = Math.round(enteredRs * (baseMrp > basePrice ? baseMrp / basePrice : 1.15));
            calculatedGrams = basePrice > 0 ? Math.round((enteredRs / basePrice) * 1000) : 0;
            activeUnitLabel = calculatedGrams >= 1000 ? `${(calculatedGrams / 1000).toFixed(2)} kg` : `${calculatedGrams} g`;
        } else if (calcMode === 'custom-weight') {
            const enteredKg = Number(customWeightInput) || 0;
            activePrice = Math.round(enteredKg * basePrice);
            activeMrp = Math.round(enteredKg * baseMrp);
            calculatedGrams = Math.round(enteredKg * 1000);
            activeUnitLabel = `${enteredKg} kg`;
        }
    }

    const discount = activeMrp > activePrice ? Math.round(((activeMrp - activePrice) / activeMrp) * 100) : 0;
    const savings = activeMrp > activePrice ? activeMrp - activePrice : 0;

    // Cart matching
    const currentCartId = isWeightProduct 
        ? `${product.id}-${activeUnitLabel.replace(/[^a-zA-Z0-9]/g, '')}`
        : product.id;
    const inCartItem = items.find((i) => i.id === currentCartId || i.id === product.id);

    const handleAddToCart = () => {
        if (isWeightProduct) {
            addItem({
                ...product,
                id: currentCartId,
                baseId: product.id,
                name: `${product.name} (${activeUnitLabel})`,
                price: activePrice,
                mrp: activeMrp,
                unit: activeUnitLabel,
                image: product.image,
                qty: qty
            });
        } else {
            for (let i = 0; i < qty; i++) addItem(product);
        }
        setAddedAlert(true);
        setTimeout(() => setAddedAlert(false), 2500);
    };

    return (
        <div className="product-page animate-fade-in">
            <div className="container">
                {/* Breadcrumb */}
                <div className="breadcrumb">
                    <Link to="/">Home</Link> / 
                    <Link to={`/category/${product.category}`}>{product.category === 'groceries' ? 'Groceries & Staples' : product.category === 'stationery' ? 'Stationery & Office' : 'Household & Care'}</Link> / 
                    <span className="breadcrumb-current">{product.name}</span>
                </div>

                <div className="product-detail-card card">
                    {/* ── Left Column: Media & Visual Badge ── */}
                    <div className="product-image-section">
                        <div className="product-main-image-box">
                            <img 
                                src={product.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600'} 
                                alt={product.name} 
                                onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600'; }}
                            />
                            {discount > 0 && <span className="discount-badge-large">{discount}% OFF</span>}
                            
                            <span className={`product-type-badge-large ${isWeightProduct ? 'weight-type' : 'fixed-type'}`}>
                                {isWeightProduct ? <><Scale size={13} /> Sold by Weight (Loose)</> : <><Box size={13} /> Sealed Unit Pack</>}
                            </span>

                            <button 
                                className={`product-wishlist-btn ${wishlisted ? 'active' : ''}`} 
                                onClick={() => setWishlisted(!wishlisted)}
                                title={wishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                            >
                                <Heart size={20} fill={wishlisted ? '#dc2626' : 'none'} color={wishlisted ? '#dc2626' : '#64748b'} />
                            </button>
                        </div>

                        {/* Express Delivery Guarantee */}
                        <div className="express-badge-strip">
                            <Truck size={18} color="#059669" />
                            <div>
                                <strong>15–30 Mins Express Delivery</strong>
                                <span>Freshly weighed &amp; packed at Kaladhungi Rd Store, Haldwani</span>
                            </div>
                        </div>
                    </div>

                    {/* ── Right Column: Info, Calculator & Purchase Actions ── */}
                    <div className="product-info-section">
                        <div className="product-brand-bar">
                            <span className="product-brand-chip">{product.brand || 'Pandey Grocery Store'}</span>
                            <span className="store-verified-pill"><Store size={12} /> Local Store Inventory</span>
                        </div>

                        <h1 className="product-title">{product.name}</h1>
                        {product.nameHi && <p className="product-name-hi">{product.nameHi}</p>}

                        <div className="product-rating-row">
                            <div className="product-stars">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <Star key={s} size={15} fill={s <= Math.floor(product.rating || 4.5) ? '#f59e0b' : 'none'} color="#f59e0b" />
                                ))}
                                <span className="rating-value">{product.rating || 4.5}</span>
                            </div>
                            <span className="review-count">({product.reviews || 12} Haldwani customer reviews)</span>
                        </div>

                        {/* Dynamic Price Display Block */}
                        <div className="product-price-block">
                            <div className="price-main-line">
                                <span className="product-current-price">₹{activePrice}</span>
                                {activeMrp > activePrice && (
                                    <span className="product-mrp">MRP ₹{activeMrp}</span>
                                )}
                                {savings > 0 && (
                                    <span className="product-savings-pill">Save ₹{savings}</span>
                                )}
                            </div>
                            <span className="price-unit-subtext">
                                {isWeightProduct 
                                    ? `For ${activeUnitLabel} (Rate: ₹${basePrice}/kg)` 
                                    : `Per ${activeUnitLabel} • Inclusive of all taxes`}
                            </span>
                        </div>

                        {/* ══════════════════════════════════════════════════
                            ⚖️ BI-DIRECTIONAL PRICE <-> WEIGHT CALCULATOR
                            ══════════════════════════════════════════════════ */}
                        {isWeightProduct && (
                            <div className="weight-calculator-card">
                                <div className="calc-card-header">
                                    <div className="calc-header-title">
                                        <Scale size={16} color="var(--primary)" />
                                        <strong>Select Weight or Enter Custom ₹ Amount:</strong>
                                    </div>
                                </div>

                                {/* Mode Switch Tabs */}
                                <div className="calc-mode-tabs">
                                    <button 
                                        type="button"
                                        className={`calc-tab-btn ${calcMode === 'preset' ? 'active' : ''}`}
                                        onClick={() => setCalcMode('preset')}
                                    >
                                        Standard Packs
                                    </button>
                                    <button 
                                        type="button"
                                        className={`calc-tab-btn ${calcMode === 'custom-rs' ? 'active' : ''}`}
                                        onClick={() => setCalcMode('custom-rs')}
                                    >
                                        Enter ₹ Amount
                                    </button>
                                    <button 
                                        type="button"
                                        className={`calc-tab-btn ${calcMode === 'custom-weight' ? 'active' : ''}`}
                                        onClick={() => setCalcMode('custom-weight')}
                                    >
                                        Enter Weight (kg)
                                    </button>
                                </div>

                                {/* Mode 1: Preset Chips */}
                                {calcMode === 'preset' && (
                                    <div className="preset-chips-stream">
                                        {WEIGHT_PRESETS.slice(0, 5).map((preset) => {
                                            const isSelected = selectedWeight.label === preset.label;
                                            const cost = Math.round(basePrice * preset.multiplier);
                                            return (
                                                <button
                                                    type="button"
                                                    key={preset.label}
                                                    className={`weight-select-chip ${isSelected ? 'active' : ''}`}
                                                    onClick={() => setSelectedWeight(preset)}
                                                >
                                                    <span className="chip-wt">{preset.label}</span>
                                                    <span className="chip-cost">₹{cost}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Mode 2: Custom ₹ Input */}
                                {calcMode === 'custom-rs' && (
                                    <div className="calc-custom-body">
                                        <label className="custom-input-label">How much Rupees worth do you want?</label>
                                        <div className="custom-input-with-symbol">
                                            <span>₹</span>
                                            <input 
                                                type="number" 
                                                className="input custom-number-input"
                                                value={customRsInput}
                                                onChange={e => setCustomRsInput(e.target.value)}
                                                placeholder="e.g. 50, 100, 250"
                                                min={1}
                                            />
                                        </div>
                                        
                                        {/* Computed Weight Output */}
                                        <div className="computed-result-badge">
                                            <span>You will get:</span>
                                            <strong>{calculatedGrams} grams ({activeUnitLabel})</strong>
                                        </div>

                                        {/* Quick ₹ Shortcuts */}
                                        <div className="quick-rupee-pills">
                                            <span>Quick ₹:</span>
                                            {RUPEE_PRESETS.map(r => (
                                                <button 
                                                    key={r}
                                                    type="button"
                                                    className={`quick-r-chip ${customRsInput === String(r) ? 'active' : ''}`}
                                                    onClick={() => setCustomRsInput(String(r))}
                                                >
                                                    ₹{r}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Mode 3: Custom Weight Input */}
                                {calcMode === 'custom-weight' && (
                                    <div className="calc-custom-body">
                                        <label className="custom-input-label">Enter exact weight in Kilograms (kg):</label>
                                        <input 
                                            type="number" 
                                            step="0.1"
                                            className="input custom-number-input"
                                            value={customWeightInput}
                                            onChange={e => setCustomWeightInput(e.target.value)}
                                            placeholder="e.g. 1.5, 3.5, 7"
                                            min={0.1}
                                        />

                                        <div className="computed-result-badge">
                                            <span>Calculated Total:</span>
                                            <strong>₹{activePrice} for {customWeightInput} kg</strong>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Product Description */}
                        {cleanDescription && (
                            <div className="product-desc-box">
                                <h4>Product Highlights</h4>
                                <p>{cleanDescription}</p>
                            </div>
                        )}

                        {/* Quantity & Add to Cart Actions */}
                        <div className="product-actions-block">
                            <div className="qty-control-box">
                                <button 
                                    className="qty-btn"
                                    onClick={() => setQty(Math.max(1, qty - 1))}
                                    aria-label="Decrease quantity"
                                >
                                    <Minus size={15} />
                                </button>
                                <span className="qty-val">{qty}</span>
                                <button 
                                    className="qty-btn"
                                    onClick={() => setQty(qty + 1)}
                                    aria-label="Increase quantity"
                                >
                                    <Plus size={15} />
                                </button>
                            </div>

                            <button className="btn btn-primary add-to-cart-hero-btn" onClick={handleAddToCart}>
                                <ShoppingCart size={18} />
                                <span>Add to Cart ({activeUnitLabel} • ₹{activePrice * qty})</span>
                            </button>

                            <button 
                                className="btn btn-ghost btn-icon share-btn" 
                                title="Share product"
                                onClick={() => {
                                    if (navigator.share) {
                                        navigator.share({ title: product.name, url: window.location.href });
                                    } else {
                                        navigator.clipboard.writeText(window.location.href);
                                        alert('Product link copied to clipboard!');
                                    }
                                }}
                            >
                                <Share2 size={18} />
                            </button>
                        </div>

                        {/* Added to Cart Feedback Banner */}
                        {addedAlert && (
                            <div className="added-feedback-banner animate-fade-in">
                                <Check size={16} />
                                <span>Added <strong>{product.name} ({activeUnitLabel})</strong> to your basket!</span>
                                <Link to="/cart" className="view-cart-link">View Cart ➔</Link>
                            </div>
                        )}

                        {/* Stock Level Warning */}
                        {product.stock <= 10 && (
                            <div className="stock-alert-pill">
                                <AlertTriangle size={15} />
                                <span>Only {product.stock} {isWeightProduct ? 'kg' : 'units'} left in store inventory — order soon!</span>
                            </div>
                        )}

                        {/* Trust & Guarantee Badges */}
                        <div className="product-guarantees-grid">
                            <div className="guarantee-box">
                                <Shield size={18} color="#059669" />
                                <div>
                                    <strong>100% Quality Assured</strong>
                                    <span>Hygienically sorted &amp; weighed</span>
                                </div>
                            </div>
                            <div className="guarantee-box">
                                <RotateCcw size={18} color="#2563eb" />
                                <div>
                                    <strong>Easy Doorstep Returns</strong>
                                    <span>Instant replacement if not satisfied</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Related Products Grid ── */}
                {related.length > 0 && (
                    <div className="related-products-section section">
                        <div className="related-head-row">
                            <h2 className="related-title">Frequently Bought Together</h2>
                            <Link to={`/category/${product.category}`} className="see-more-link">
                                Browse Department ➔
                            </Link>
                        </div>
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
