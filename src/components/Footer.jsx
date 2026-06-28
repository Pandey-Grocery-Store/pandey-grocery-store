import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock, Facebook, Instagram, MessageCircle } from 'lucide-react';
import './Footer.css';

export default function Footer() {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-grid">
                    <div className="footer-brand">
                        <div className="footer-logo">
                            <img src="/favicon.svg" alt="Pandey Grocery Store" className="logo-icon" width="36" height="36" />
                            <span className="logo-text">Pandey Grocery Store</span>
                        </div>
                        <p className="footer-desc">Your trusted neighborhood store for quality Indian groceries, daily essentials, and household products in Haldwani!</p>
                        <div className="footer-social">
                            <a href="#" className="social-btn" title="Facebook"><Facebook size={18} /></a>
                            <a href="#" className="social-btn" title="Instagram"><Instagram size={18} /></a>
                            <a href="#" className="social-btn whatsapp" title="WhatsApp"><MessageCircle size={18} /></a>
                        </div>
                    </div>

                    <div className="footer-col">
                        <h4>Quick Links</h4>
                        <Link to="/">Home</Link>
                        <Link to="/category/groceries">Groceries</Link>
                        <Link to="/category/utensils">Kitchen Utensils</Link>
                        <Link to="/offers">Today's Offers</Link>
                        <Link to="/account">My Account</Link>
                    </div>

                    <div className="footer-col">
                        <h4>Customer Service</h4>
                        <Link to="#">Shipping Policy</Link>
                        <Link to="#">Return & Refund</Link>
                        <Link to="#">Privacy Policy</Link>
                        <Link to="#">Terms & Conditions</Link>
                        <Link to="#">FAQ</Link>
                    </div>

                    <div className="footer-col">
                        <h4>Contact Us</h4>
                        <div className="footer-contact">
                            <MapPin size={15} />
                            <span>Lal Danth Bypass Rd, Radhe Krishna Puram / Adarsh Nagar, Heera Nagar, Haldwani, Uttarakhand 263139</span>
                        </div>
                        <div className="footer-contact">
                            <Phone size={15} />
                            <span>8273287789</span>
                        </div>
                        <div className="footer-contact">
                            <Mail size={15} />
                            <span>grocerypandey.store@gmail.com</span>
                        </div>
                        <div className="footer-contact">
                            <Clock size={15} />
                            <span>Mon-Sun: 8:00 AM - 9:30 PM</span>
                        </div>
                    </div>
                </div>

                <div className="footer-payment">
                    <span>We Accept:</span>
                    <div className="payment-icons">
                        <span className="payment-method">UPI</span>
                        <span className="payment-method">Visa</span>
                        <span className="payment-method">Mastercard</span>
                        <span className="payment-method">RuPay</span>
                        <span className="payment-method">COD</span>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>© 2026 Pandey Grocery Store. All rights reserved. Made with ❤️ in Haldwani, India</p>
                </div>
            </div>
        </footer>
    );
}
