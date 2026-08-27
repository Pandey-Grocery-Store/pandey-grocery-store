import { Link } from 'react-router-dom';
import { ShoppingBag, Heart, Star, Plus, Minus, Scale, ArrowRightLeft, Check } from 'lucide-react';
import { useState, useCallback } from 'react';
import { useCart } from '../context/CartContext';
import './ProductCard.css';

function getWishlist() {
    try { return JSON.parse(localStorage.getItem('pandey_wishlist') || '[]'); } catch { return []; }
}

const WEIGHT_OPTIONS = [
    { label: '250 g', multiplier: 0.25 },
    { label: '500 g', multiplier: 0.5 },
    { label: '1 kg', multiplier: 1 },
    { label: '2 kg', multiplier: 2 },
    { label: '5 kg', multiplier: 5 },
];

export default function ProductCard({ product }) {
    const { items, addItem, removeItem, updateQty } = useCart();
    const [isWished, setIsWished] = useState(() => getWishlist().includes(product.id));
    
    // Check if this product is loose / by weight
    const isWeightProduct = product.unit?.toLowerCase().includes('kg') || product.description?.includes('[TYPE:weight]');
    const [selectedWeight, setSelectedWeight] = useState(WEIGHT_OPTIONS[2]); // Default 1 kg
    const [showWeightModal, setShowWeightModal] = useState(false);
    const [customRs, setCustomRs] = useState('');
    const [customGrams, setCustomGrams] = useState('');

    // Cart tracking
    const currentCartId = isWeightProduct ? `${product.id}-${selectedWeight.label.replace(' ', '')}` : product.id;
    const cartItem = items.find((i) => i.id === currentCartId || i.id === product.id);
    const inCartQty = cartItem ? cartItem.qty : 0;

    // Pricing calculation
    const basePrice = product.price || 0;
    const currentPrice = isWeightProduct ? Math.round(basePrice * selectedWeight.multiplier) : basePrice;
    const baseMrp = product.mrp || basePrice;
    const currentMrp = isWeightProduct ? Math.round(baseMrp * selectedWeight.multiplier) : baseMrp;

    const discountPercent = currentMrp > currentPrice
        ? Math.round(((currentMrp - currentPrice) / currentMrp) * 100)
        : 0;
    const savings = currentMrp > currentPrice ? currentMrp - currentPrice : 0;

    const handleAdd = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isWeightProduct) {
            addItem({
                ...product,
                id: currentCartId,
                baseId: product.id,
                name: `${product.name} (${selectedWeight.label})`,
                price: currentPrice,
                mrp: currentMrp,
                unit: selectedWeight.label,
                image: product.image
            });
        } else {
            addItem(product);
        }
    };

    const handleIncrement = (e) => {
        e.preventDefault();
        e.stopPropagation();
        updateQty(currentCartId, inCartQty + 1);
    };

    const handleDecrement = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (inCartQty <= 1) {
            removeItem(currentCartId);
        } else {
            updateQty(currentCartId, inCartQty - 1);
        }
    };

    const toggleWishlist = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        const list = getWishlist();
        let next;
        if (list.includes(product.id)) {
            next = list.filter(id => id !== product.id);
            setIsWished(false);
        } else {
            next = [...list, product.id];
            setIsWished(true);
        }
        localStorage.setItem('pandey_wishlist', JSON.stringify(next));
    }, [product.id]);

    // Handle Custom ₹ / Gram calculation
    const handleCustomRsChange = (val) => {
        setCustomRs(val);
        if (basePrice > 0 && Number(val) > 0) {
            const grams = Math.round((Number(val) / basePrice) * 1000);
            setCustomGrams(grams);
        } else {
            setCustomGrams('');
        }
    };

    const handleAddCustomWeight = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!customRs || Number(customRs) <= 0) return;
        const grams = customGrams || Math.round((Number(customRs) / basePrice) * 1000);
        const weightLabel = grams >= 1000 ? `${(grams / 1000).toFixed(2)} kg` : `${grams} g`;
        addItem({
            ...product,
            id: `${product.id}-custom-${grams}g`,
            baseId: product.id,
            name: `${product.name} (${weightLabel})`,
            price: Number(customRs),
            mrp: Math.round(Number(customRs) * 1.15),
            unit: weightLabel,
            image: product.image
        });
        setShowWeightModal(false);
        setCustomRs('');
        setCustomGrams('');
    };

    return (
        <div className="product-card card">
            {/* Top Badges */}
            <div className="product-card-badges-row">
                {discountPercent > 0 && (
                    <span className="discount-badge">{discountPercent}% OFF</span>
                )}
                {isWeightProduct && (
                    <span className="weight-type-pill" title="Loose item sold by weight">
                        <Scale size={11} /> By Weight
                    </span>
                )}
            </div>

            {/* Floating Wishlist Button */}
            <button
                className={`wishlist-btn ${isWished ? 'wished' : ''}`}
                onClick={toggleWishlist}
                aria-label={isWished ? 'Remove from Wishlist' : 'Add to Wishlist'}
                title={isWished ? 'Remove from Wishlist' : 'Add to Wishlist'}
            >
                <Heart size={16} fill={isWished ? 'currentColor' : 'none'} />
            </button>

            {/* Product Image Link */}
            <Link to={`/product/${product.id}`} className="product-card-img-wrap">
                <img 
                    src={product.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400'} 
                    alt={product.name} 
                    className="product-card-img" 
                    loading="lazy" 
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400'; }}
                />
            </Link>

            {/* Product Info Body */}
            <div className="product-card-body">
                <div className="product-card-meta">
                    <span className="product-card-brand">{product.brand || 'Store Fresh'}</span>
                    {product.rating > 0 && (
                        <div className="product-card-rating">
                            <Star size={11} fill="#f59e0b" color="#f59e0b" />
                            <span>{product.rating}</span>
                        </div>
                    )}
                </div>

                <Link to={`/product/${product.id}`} className="product-card-name" title={product.name}>
                    {product.name}
                </Link>

                {/* Weight Options Selector for Loose Items */}
                {isWeightProduct ? (
                    <div className="card-weight-selector-row">
                        <div className="card-weight-chips">
                            {WEIGHT_OPTIONS.slice(0, 3).map((opt) => (
                                <button
                                    key={opt.label}
                                    type="button"
                                    className={`weight-chip ${selectedWeight.label === opt.label ? 'active' : ''}`}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setSelectedWeight(opt);
                                    }}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                        <button 
                            type="button" 
                            className="custom-calc-link"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setShowWeightModal(true);
                            }}
                            title="Enter custom Rupees ₹ or Weight"
                        >
                            Custom ₹
                        </button>
                    </div>
                ) : (
                    product.unit && <span className="product-card-unit">{product.unit}</span>
                )}

                {/* Footer with Price & Interactive Cart Stepper */}
                <div className="product-card-footer">
                    <div className="product-card-price-group">
                        <div className="product-card-prices">
                            <span className="price">₹{currentPrice}</span>
                            {currentMrp > currentPrice && (
                                <span className="price-mrp">₹{currentMrp}</span>
                            )}
                        </div>
                        {savings > 0 && (
                            <span className="savings-tag">Save ₹{savings}</span>
                        )}
                    </div>

                    {/* Cart Add / Stepper Controls */}
                    <div className="product-card-action">
                        {inCartQty > 0 ? (
                            <div className="card-qty-stepper">
                                <button 
                                    className="stepper-btn minus" 
                                    onClick={handleDecrement}
                                    aria-label="Decrease quantity"
                                >
                                    <Minus size={13} />
                                </button>
                                <span className="stepper-count">{inCartQty}</span>
                                <button 
                                    className="stepper-btn plus" 
                                    onClick={handleIncrement}
                                    aria-label="Increase quantity"
                                >
                                    <Plus size={13} />
                                </button>
                            </div>
                        ) : (
                            <button
                                className="btn btn-sm btn-primary add-to-cart-btn"
                                onClick={handleAdd}
                                aria-label={`Add ${product.name} to cart`}
                            >
                                <Plus size={14} className="add-icon" />
                                <span>Add</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Custom Weight / Rupee Modal */}
            {showWeightModal && (
                <div className="weight-modal-overlay animate-fade-in" onClick={(e) => { e.stopPropagation(); setShowWeightModal(false); }}>
                    <div className="weight-calc-modal-card" onClick={e => e.stopPropagation()}>
                        <div className="w-modal-header">
                            <div className="w-modal-title">
                                <Scale size={16} color="var(--primary)" />
                                <h4>Custom ₹ / Weight for {product.name}</h4>
                            </div>
                            <button className="btn-icon btn-ghost btn-xs" onClick={() => setShowWeightModal(false)}>
                                <X size={16} />
                            </button>
                        </div>

                        <div className="w-modal-body">
                            <span className="w-rate-label">Store Rate: <strong>₹{basePrice} / kg</strong></span>

                            <div className="w-calc-input-block">
                                <label>Enter Rupees (₹) you want to buy:</label>
                                <div className="w-input-group">
                                    <span>₹</span>
                                    <input 
                                        type="number" 
                                        className="input" 
                                        placeholder="e.g. 50, 100" 
                                        value={customRs} 
                                        onChange={e => handleCustomRsChange(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {customGrams && (
                                <div className="w-computed-box animate-fade-in">
                                    <span className="c-label">You will receive:</span>
                                    <strong className="c-val">{customGrams} grams</strong>
                                    <span className="c-sub">({(customGrams / 1000).toFixed(2)} kg) for ₹{customRs}</span>
                                </div>
                            )}

                            {/* Quick Presets */}
                            <div className="w-quick-presets">
                                <span>Quick ₹:</span>
                                {[20, 50, 100, 200, 500].map(amt => (
                                    <button 
                                        key={amt} 
                                        type="button" 
                                        className={`w-preset-btn ${customRs === String(amt) ? 'active' : ''}`}
                                        onClick={() => handleCustomRsChange(String(amt))}
                                    >
                                        ₹{amt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="w-modal-footer">
                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowWeightModal(false)}>
                                Cancel
                            </button>
                            <button 
                                type="button" 
                                className="btn btn-primary btn-sm" 
                                disabled={!customRs || Number(customRs) <= 0}
                                onClick={handleAddCustomWeight}
                            >
                                <Plus size={14} /> Add ₹{customRs || 0} to Cart
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
