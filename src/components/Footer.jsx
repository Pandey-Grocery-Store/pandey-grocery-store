import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock, MessageCircle, ExternalLink, Printer } from 'lucide-react';
import './Footer.css';

export default function Footer() {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-grid">
                    <div className="footer-brand">
                        <div className="footer-logo">
                            <img src="/favicon.svg" alt="Pandey Grocery Store" className="logo-icon" width="34" height="34" />
                            <span className="logo-text">Pandey Grocery Store</span>
                        </div>
                        <p className="footer-desc">
                            Your trusted neighborhood store for quality Indian groceries, daily essentials, and instant in-store document &amp; ID card printing in Haldwani!
                        </p>
                        <div className="footer-social">
                            <a 
                                href="https://wa.me/919410516899" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="social-btn whatsapp" 
                                title="Chat on WhatsApp"
                            >
                                <MessageCircle size={18} />
                            </a>
                            <a 
                                href="https://share.google/3InE5GPOrGZNov2nQ" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="social-btn" 
                                title="Store Location"
                            >
                                <MapPin size={18} />
                            </a>
                        </div>
                    </div>

                    <div className="footer-col">
                        <h4>Explore</h4>
                        <Link to="/">Home</Link>
                        <Link to="/category/groceries">Groceries &amp; Staples</Link>
                        <Link to="/category/printing-binding" className="footer-highlight-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <Printer size={15} /> Print Hub &amp; ID Cards
                        </Link>
                        <Link to="/category/stationery">Stationery &amp; Office</Link>
                        <Link to="/category/household-personal">Household &amp; Care</Link>
                        <Link to="/offers">Today's Deals</Link>
                    </div>

                    <div className="footer-col">
                        <h4>Customer Care</h4>
                        <Link to="/account">My Profile &amp; Orders</Link>
                        <Link to="/wishlist">Saved Items</Link>
                        <Link to="/cart">My Shopping Cart</Link>
                        <Link to="/login">Sign In / Register</Link>
                    </div>

                    <div className="footer-col">
                        <h4>Store Location</h4>
                        <div className="footer-contact">
                            <MapPin size={16} />
                            <a href="https://share.google/3InE5GPOrGZNov2nQ" target="_blank" rel="noopener noreferrer" className="footer-map-link">
                                Lal Danth Bypass Rd, Radhe Krishna Puram / Adarsh Nagar, Heera Nagar, Haldwani, Uttarakhand 263139 <ExternalLink size={12} />
                            </a>
                        </div>
                        <div className="footer-contact">
                            <Phone size={16} />
                            <a href="tel:+919410516899">+91 9410516899</a>
                        </div>
                        <div className="footer-contact">
                            <Mail size={16} />
                            <span>grocerypandey.store@gmail.com</span>
                        </div>
                        <div className="footer-contact">
                            <Clock size={16} />
                            <span>Mon-Sun: 8:00 AM – 9:30 PM</span>
                        </div>
                    </div>
                </div>

                <div className="footer-payment">
                    <span>Accepted In Store:</span>
                    <div className="payment-icons">
                        <span className="payment-method">UPI / QR Code</span>
                        <span className="payment-method">GPay / PhonePe</span>
                        <span className="payment-method">Cards</span>
                        <span className="payment-method">Cash</span>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>© 2026 Pandey Grocery Store, Haldwani. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
