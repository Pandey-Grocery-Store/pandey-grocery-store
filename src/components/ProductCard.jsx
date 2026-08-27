import { Link } from 'react-router-dom';
import { ShoppingBag, Heart, Star, Plus, Minus } from 'lucide-react';
import { useState, useCallback } from 'react';
import { useCart } from '../context/CartContext';
import './ProductCard.css';

function getWishlist() {
    try { return JSON.parse(localStorage.getItem('pandey_wishlist') || '[]'); } catch { return []; }
}

export default function ProductCard({ product }) {
    const { items, addItem, removeItem, updateQty } = useCart();
    const [isWished, setIsWished] = useState(() => getWishlist().includes(product.id));

    // Check if this product is already in cart
    const cartItem = items.find((i) => i.id === product.id);
    const inCartQty = cartItem ? cartItem.qty : 0;

    const discountPercent = product.mrp > product.price
        ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
        : 0;

    const savings = product.mrp > product.price ? product.mrp - product.price : 0;

    const handleAdd = (e) => {
        e.preventDefault();
        e.stopPropagation();
        addItem(product);
    };

    const handleIncrement = (e) => {
        e.preventDefault();
        e.stopPropagation();
        updateQty(product.id, inCartQty + 1);
    };

    const handleDecrement = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (inCartQty <= 1) {
            removeItem(product.id);
        } else {
            updateQty(product.id, inCartQty - 1);
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

    return (
        <div className="product-card card">
            {/* Top Discount Tag */}
            {discountPercent > 0 && (
                <span className="discount-badge">{discountPercent}% OFF</span>
            )}

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
                />
            </Link>

            {/* Product Info Body */}
            <div className="product-card-body">
                <div className="product-card-meta">
                    <span className="product-card-brand">{product.brand || 'Fresh'}</span>
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
                
                {product.unit && (
                    <span className="product-card-unit">{product.unit}</span>
                )}

                {/* Footer with Price & Interactive Cart Stepper */}
                <div className="product-card-footer">
                    <div className="product-card-price-group">
                        <div className="product-card-prices">
                            <span className="price">₹{product.price}</span>
                            {product.mrp > product.price && (
                                <span className="price-mrp">₹{product.mrp}</span>
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
        </div>
    );
}
