import { Link } from 'react-router-dom';
import { ShoppingCart, Heart, Star } from 'lucide-react';
import { useState, useCallback } from 'react';
import { useCart } from '../context/CartContext';
import './ProductCard.css';

function getWishlist() {
    try { return JSON.parse(localStorage.getItem('pandey_wishlist') || '[]'); } catch { return []; }
}

export default function ProductCard({ product }) {
    const { addItem } = useCart();
    const [added, setAdded] = useState(false);
    const [isWished, setIsWished] = useState(() => getWishlist().includes(product.id));

    const discountPercent = product.mrp > product.price
        ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
        : 0;

    const handleAdd = () => {
        addItem(product);
        setAdded(true);
        setTimeout(() => setAdded(false), 1200);
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
            {discountPercent > 0 && <span className="discount-badge">{discountPercent}% OFF</span>}
            <button
                className={`wishlist-btn ${isWished ? 'wished' : ''}`}
                onClick={toggleWishlist}
                title={isWished ? 'Remove from Wishlist' : 'Add to Wishlist'}
            >
                <Heart size={16} />
            </button>
            <Link to={`/product/${product.id}`} className="product-card-img-wrap">
                <img src={product.image} alt={product.name} className="product-card-img" loading="lazy" />
            </Link>
            <div className="product-card-body">
                <span className="product-card-brand">{product.brand}</span>
                <Link to={`/product/${product.id}`} className="product-card-name">{product.name}</Link>
                <span className="product-card-unit">{product.unit}</span>
                <div className="product-card-rating">
                    <Star size={12} fill="var(--warning)" color="var(--warning)" />
                    <span>{product.rating}</span>
                    <span className="rating-count">({product.reviews})</span>
                </div>
                <div className="product-card-footer">
                    <div className="product-card-price">
                        <span className="price">₹{product.price}</span>
                        {product.mrp > product.price && <span className="price-mrp">₹{product.mrp}</span>}
                    </div>
                    <button
                        className={`btn btn-sm ${added ? 'btn-added' : 'btn-primary'} add-to-cart-btn`}
                        onClick={handleAdd}
                    >
                        {added ? '✓ Added' : <><ShoppingCart size={14} /> Add</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
