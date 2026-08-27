import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
    Mail, 
    Lock, 
    User, 
    Eye, 
    EyeOff, 
    ArrowRight, 
    Loader2, 
    ShoppingBasket, 
    Printer, 
    BookOpen, 
    Sparkles, 
    ShieldCheck, 
    CheckCircle2, 
    Store,
    ArrowLeft,
    Tag
} from 'lucide-react';
import './AuthPages.css';

export default function RegisterPage() {
    const { register, loginWithGoogle } = useAuth();
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match. Please verify.');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        setLoading(true);
        try {
            await register(name, email, password);
            navigate('/');
        } catch (err) {
            setError(err.message || 'Account registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignup = async () => {
        setError('');
        try {
            if (!window.google) {
                setError('Google Sign-In is loading. Please try again in a moment.');
                return;
            }
            window.google.accounts.id.initialize({
                client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
                callback: async (response) => {
                    setLoading(true);
                    try {
                        await loginWithGoogle(response.credential);
                        navigate('/');
                    } catch (err) {
                        setError(err.message || 'Google registration failed.');
                    } finally {
                        setLoading(false);
                    }
                },
                ux_mode: 'popup',
            });

            const btnDiv = document.createElement('div');
            btnDiv.style.position = 'fixed';
            btnDiv.style.top = '-9999px';
            document.body.appendChild(btnDiv);
            window.google.accounts.id.renderButton(btnDiv, {
                type: 'standard',
                size: 'large',
                theme: 'outline',
            });
            setTimeout(() => {
                const gBtn = btnDiv.querySelector('div[role="button"]') || btnDiv.querySelector('iframe');
                if (gBtn) gBtn.click();
                window.google.accounts.id.prompt((notification) => {
                    if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                        setError('Google popup was blocked. Please allow popups or use manual form.');
                    }
                    setTimeout(() => btnDiv.remove(), 1000);
                });
            }, 300);
        } catch {
            setError('Google sign-up failed. Please try again.');
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-container">
                {/* ─── Left Side: Brand Showcase Panel (PC) ─── */}
                <div className="auth-brand-side">
                    <div className="brand-side-top">
                        <Link to="/" className="brand-logo-pill">
                            <Store size={20} color="#ffffff" />
                            <span>Pandey Grocery Store</span>
                        </Link>
                    </div>

                    <div className="brand-side-content">
                        <span className="brand-sub-badge">
                            <Sparkles size={14} /> Join Pandey Store Community
                        </span>
                        <h2>Create Your Free Account for Easy Grocery &amp; Print Orders</h2>
                        <p className="brand-desc-text">
                            Join thousands of happy customers in Haldwani. Save your delivery addresses, track in-store print jobs, and unlock special member deals.
                        </p>

                        <div className="brand-feature-pills">
                            <div className="brand-feat-item">
                                <div className="feat-icon-box" style={{ background: '#ecfdf5', color: '#059669' }}>
                                    <Tag size={18} />
                                </div>
                                <div>
                                    <strong>Exclusive Daily Deals</strong>
                                    <span>Special discount pricing on household staples</span>
                                </div>
                            </div>

                            <div className="brand-feat-item">
                                <div className="feat-icon-box" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                                    <Printer size={18} />
                                </div>
                                <div>
                                    <strong>1-Tap WiFi Print Uploads</strong>
                                    <span>Upload &amp; crop documents &amp; ID cards directly</span>
                                </div>
                            </div>

                            <div className="brand-feat-item">
                                <div className="feat-icon-box" style={{ background: '#eff6ff', color: '#2563eb' }}>
                                    <ShoppingBasket size={18} />
                                </div>
                                <div>
                                    <strong>Order Tracking &amp; History</strong>
                                    <span>Reorder your family favorites in seconds</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="brand-side-footer">
                        <div className="trust-indicator">
                            <ShieldCheck size={16} color="#10b981" />
                            <span>Safe, Secure &amp; 100% Free Registration</span>
                        </div>
                    </div>
                </div>

                {/* ─── Right Side: Register Form Card ─── */}
                <div className="auth-form-side">
                    <div className="auth-card-inner">
                        <div className="auth-mobile-top">
                            <Link to="/" className="auth-back-link">
                                <ArrowLeft size={16} /> Home
                            </Link>
                            <Link to="/" className="auth-mobile-logo">
                                <Store size={18} color="var(--primary)" />
                                <span>Pandey Store</span>
                            </Link>
                        </div>

                        <div className="auth-header-block">
                            <h1>Create an Account</h1>
                            <p>Get started with quick grocery orders and instant prints</p>
                        </div>

                        {error && (
                            <div className="auth-alert-error animate-fade-in">
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleRegister} className="auth-main-form">
                            <div className="auth-input-group">
                                <label>Full Name</label>
                                <div className="auth-input-field">
                                    <User size={18} className="input-icon" />
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Ramesh Pandey" 
                                        value={name} 
                                        onChange={e => setName(e.target.value)} 
                                        required 
                                    />
                                </div>
                            </div>

                            <div className="auth-input-group">
                                <label>Email Address</label>
                                <div className="auth-input-field">
                                    <Mail size={18} className="input-icon" />
                                    <input 
                                        type="email" 
                                        placeholder="name@example.com" 
                                        value={email} 
                                        onChange={e => setEmail(e.target.value)} 
                                        required 
                                    />
                                </div>
                            </div>

                            <div className="auth-input-group">
                                <label>Create Password</label>
                                <div className="auth-input-field">
                                    <Lock size={18} className="input-icon" />
                                    <input 
                                        type={showPassword ? 'text' : 'password'} 
                                        placeholder="Minimum 6 characters" 
                                        value={password} 
                                        onChange={e => setPassword(e.target.value)} 
                                        required 
                                    />
                                    <button 
                                        type="button" 
                                        className="pw-toggle-btn" 
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label="Toggle password visibility"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="auth-input-group">
                                <label>Confirm Password</label>
                                <div className="auth-input-field">
                                    <Lock size={18} className="input-icon" />
                                    <input 
                                        type={showPassword ? 'text' : 'password'} 
                                        placeholder="Re-enter your password" 
                                        value={confirmPassword} 
                                        onChange={e => setConfirmPassword(e.target.value)} 
                                        required 
                                    />
                                </div>
                            </div>

                            <button type="submit" className="btn btn-primary auth-submit-btn" disabled={loading}>
                                {loading ? (
                                    <><Loader2 size={18} className="spin" /> Creating Account...</>
                                ) : (
                                    <>Create Account <ArrowRight size={18} /></>
                                )}
                            </button>
                        </form>

                        <div className="auth-divider-line">
                            <span>or sign up with</span>
                        </div>

                        <button type="button" className="google-auth-btn" onClick={handleGoogleSignup}>
                            <svg width="18" height="18" viewBox="0 0 48 48">
                                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                            </svg>
                            <span>Google Account</span>
                        </button>

                        <div className="auth-switch-footer">
                            <span>Already have an account?</span>
                            <Link to="/login" className="auth-switch-link">Sign In</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
