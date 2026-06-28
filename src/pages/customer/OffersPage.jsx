import { Link } from 'react-router-dom';
import { Tag, Clock, ArrowRight, Star, Zap, Gift, Percent } from 'lucide-react';
import ProductCard from '../../components/ProductCard';
import { products } from '../../data/products';
import './OffersPage.css';

const offers = [
    { code: 'WELCOME100', discount: '₹100 Off', desc: 'Flat ₹100 off on your first order above ₹300', minOrder: 300, icon: Gift, color: '#e8590c', gradient: 'linear-gradient(135deg, #e8590c, #f97316)' },
    { code: 'SAVE10', discount: '10% Off', desc: '10% off up to ₹200 on orders above ₹500', minOrder: 500, icon: Percent, color: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)' },
    { code: 'FREEDELIVERY', discount: 'Free Delivery', desc: 'Free delivery on orders above ₹500', minOrder: 500, icon: Zap, color: '#10b981', gradient: 'linear-gradient(135deg, #10b981, #34d399)' },
    { code: 'UTENSIL15', discount: '15% Off', desc: '15% off on kitchen utensils up to ₹300. Min order ₹800', minOrder: 800, icon: Star, color: '#3b82f6', gradient: 'linear-gradient(135deg, #3b82f6, #60a5fa)' },
];

const dealProducts = products.filter(p => p.mrp > p.price).sort((a, b) => (1 - a.price / a.mrp) - (1 - b.price / b.mrp)).reverse().slice(0, 8);

export default function OffersPage() {
    return (
        <div className="offers-page">
            {/* Hero Banner */}
            <section className="offers-hero">
                <div className="container">
                    <div className="offers-hero-content animate-fade-in">
                        <span className="offers-hero-badge"><Zap size={16} /> Limited Time</span>
                        <h1>Today's Best <span className="highlight">Offers</span></h1>
                        <p>Save big on groceries & kitchen essentials. Use our exclusive coupon codes at checkout!</p>
                    </div>
                </div>
            </section>

            {/* Coupon Cards */}
            <section className="section">
                <div className="container">
                    <h2 className="section-title"><Tag size={24} /> Coupon Codes</h2>
                    <p className="section-subtitle">Apply these codes at checkout and save instantly</p>
                    <div className="coupon-grid">
                        {offers.map((offer, i) => {
                            const Icon = offer.icon;
                            return (
                                <div key={offer.code} className="coupon-card animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                                    <div className="coupon-card-left" style={{ background: offer.gradient }}>
                                        <Icon size={28} color="white" />
                                        <span className="coupon-discount">{offer.discount}</span>
                                    </div>
                                    <div className="coupon-card-right">
                                        <p className="coupon-desc">{offer.desc}</p>
                                        <div className="coupon-code-row">
                                            <code className="coupon-code-text">{offer.code}</code>
                                            <button
                                                className="btn btn-sm btn-primary"
                                                onClick={() => navigator.clipboard.writeText(offer.code)}
                                            >
                                                Copy
                                            </button>
                                        </div>
                                        <span className="coupon-min">Min. order: ₹{offer.minOrder}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Deal Products */}
            <section className="section" style={{ background: 'var(--bg-tertiary)' }}>
                <div className="container">
                    <div className="section-header-row">
                        <div>
                            <h2 className="section-title">🔥 Best Deals</h2>
                            <p className="section-subtitle">Products with the biggest discounts right now</p>
                        </div>
                        <Link to="/category/groceries" className="btn btn-secondary">
                            View All <ArrowRight size={16} />
                        </Link>
                    </div>
                    <div className="grid grid-4">
                        {dealProducts.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Info Banner */}
            <section className="offers-info-section">
                <div className="container offers-info-grid">
                    <div className="offers-info-card">
                        <Clock size={28} color="var(--primary)" />
                        <h3>Daily Deals</h3>
                        <p>New offers added every day. Check back often!</p>
                    </div>
                    <div className="offers-info-card">
                        <Tag size={28} color="var(--primary)" />
                        <h3>Stackable Savings</h3>
                        <p>Product discounts + coupon codes give you extra savings.</p>
                    </div>
                    <div className="offers-info-card">
                        <Gift size={28} color="var(--primary)" />
                        <h3>Refer & Earn</h3>
                        <p>Share Pandey Grocery Store with friends and earn reward points.</p>
                    </div>
                </div>
            </section>
        </div>
    );
}
