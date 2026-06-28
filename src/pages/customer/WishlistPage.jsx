import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { products } from '../../data/products';
import './WishlistPage.css';

export default function WishlistPage() {
    // Persist wishlist in localStorage
    const [wishlistIds, setWishlistIds] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('pandey_wishlist') || '[]');
        } catch {
            return [];
        }
    });

    const { addItem } = useCart();

    const wishItems = products.filter(p => wishlistIds.includes(p.id));

    const removeFromWishlist = useCallback((id) => {
        setWishlistIds(prev => {
            const next = prev.filter(wid => wid !== id);
            localStorage.setItem('pandey_wishlist', JSON.stringify(next));
            return next;
        });
    }, []);

    const moveToCart = useCallback((product) => {
        addItem(product);
        removeFromWishlist(product.id);
    }, [addItem, removeFromWishlist]);

    if (wishItems.length === 0) {
        return (
            <div className="container section empty-wishlist">
                <div className="empty-wishlist-content animate-fade-in">
                    <div className="empty-wishlist-icon">
                        <Heart size={48} />
                    </div>
                    <h2>Your wishlist is empty</h2>
                    <p>Save products you love by tapping the heart icon on any product card.</p>
                    <Link to="/" className="btn btn-primary btn-lg">
                        Browse Products <ArrowRight size={18} />
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="wishlist-page">
            <div className="container">
                <div className="wishlist-header">
                    <h1 className="page-title">
                        <Heart size={24} className="title-icon" /> My Wishlist
                        <span className="wishlist-count">{wishItems.length} items</span>
                    </h1>
                </div>

                <div className="wishlist-grid">
                    {wishItems.map((item, index) => {
                        const discountPercent = item.mrp > item.price ? Math.round(((item.mrp - item.price) / item.mrp) * 100) : 0;
                        return (
                            <div key={item.id} className="wishlist-card card animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                                {discountPercent > 0 && <span className="discount-badge">{discountPercent}% OFF</span>}
                                <Link to={`/product/${item.id}`} className="wishlist-card-img-wrap">
                                    <img src={item.image} alt={item.name} className="wishlist-card-img" />
                                </Link>
                                <div className="wishlist-card-body">
                                    <span className="wishlist-card-brand">{item.brand}</span>
                                    <Link to={`/product/${item.id}`} className="wishlist-card-name">{item.name}</Link>
                                    <span className="wishlist-card-unit">{item.unit}</span>
                                    <div className="wishlist-card-price">
                                        <span className="price">₹{item.price}</span>
                                        {item.mrp > item.price && <span className="price-mrp">₹{item.mrp}</span>}
                                    </div>
                                    <div className="wishlist-card-actions">
                                        <button className="btn btn-primary btn-sm" onClick={() => moveToCart(item)}>
                                            <ShoppingCart size={14} /> Add to Cart
                                        </button>
                                        <button className="btn btn-ghost btn-icon wishlist-remove" onClick={() => removeFromWishlist(item.id)}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
