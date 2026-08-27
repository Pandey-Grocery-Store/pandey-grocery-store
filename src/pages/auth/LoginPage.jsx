import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
    Mail, 
    Lock, 
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
    KeyRound
} from 'lucide-react';
import './AuthPages.css';

export default function LoginPage() {
    const { login, sendOtp, verifyOtp, loginWithGoogle } = useAuth();
    const navigate = useNavigate();

    const [tab, setTab] = useState('password'); // 'password' | 'otp'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handlePasswordLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    const handleSendOtp = async () => {
        if (!email) { setError('Please enter your email address'); return; }
        setError('');
        setLoading(true);
        try {
            await sendOtp(email);
            setOtpSent(true);
        } catch (err) {
            setError(err.message || 'Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await verifyOtp(email, otpCode);
            navigate('/');
        } catch (err) {
            setError(err.message || 'Invalid OTP code.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
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
                        setError(err.message || 'Google login failed.');
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
                        setError('Google popup was blocked. Please allow popups or use email login.');
                    }
                    setTimeout(() => btnDiv.remove(), 1000);
                });
            }, 300);
        } catch (err) {
            setError('Google login failed. Please try again.');
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
                            <Sparkles size={14} /> Haldwani Superstore &amp; Print Hub
                        </span>
                        <h2>Everything for Home, School &amp; Office Under One Roof</h2>
                        <p className="brand-desc-text">
                            Access fresh groceries, student &amp; office stationery, household goods, or upload documents and ID cards for instant counter printing.
                        </p>

                        <div className="brand-feature-pills">
                            <div className="brand-feat-item">
                                <div className="feat-icon-box" style={{ background: '#ecfdf5', color: '#059669' }}>
                                    <ShoppingBasket size={18} />
                                </div>
                                <div>
                                    <strong>Fresh Groceries &amp; Staples</strong>
                                    <span>Pure oils, basmati rice, farm pulses</span>
                                </div>
                            </div>

                            <div className="brand-feat-item">
                                <div className="feat-icon-box" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                                    <BookOpen size={18} />
                                </div>
                                <div>
                                    <strong>Stationery &amp; Office Goods</strong>
                                    <span>Classmate registers, pens, folders</span>
                                </div>
                            </div>

                            <div className="brand-feat-item">
                                <div className="feat-icon-box" style={{ background: '#eff6ff', color: '#2563eb' }}>
                                    <Printer size={18} />
                                </div>
                                <div>
                                    <strong>Instant Print &amp; ID Card Hub</strong>
                                    <span>Auto-fit A4 sheets &amp; passport photos</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="brand-side-footer">
                        <div className="trust-indicator">
                            <ShieldCheck size={16} color="#10b981" />
                            <span>Trusted by 1,000+ Haldwani Families</span>
                        </div>
                    </div>
                </div>

                {/* ─── Right Side: Auth Form Card ─── */}
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
                            <h1>Welcome Back</h1>
                            <p>Sign in to manage orders, wishlist &amp; instant prints</p>
                        </div>

                        {/* Segmented Auth Method Tabs */}
                        <div className="auth-segmented-tabs">
                            <button 
                                className={`auth-seg-tab ${tab === 'password' ? 'active' : ''}`} 
                                onClick={() => { setTab('password'); setError(''); }}
                                type="button"
                            >
                                <Lock size={14} /> Password
                            </button>
                            <button 
                                className={`auth-seg-tab ${tab === 'otp' ? 'active' : ''}`} 
                                onClick={() => { setTab('otp'); setError(''); setOtpSent(false); }}
                                type="button"
                            >
                                <KeyRound size={14} /> Email OTP
                            </button>
                        </div>

                        {error && (
                            <div className="auth-alert-error animate-fade-in">
                                <span>{error}</span>
                            </div>
                        )}

                        {tab === 'password' ? (
                            <form onSubmit={handlePasswordLogin} className="auth-main-form">
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
                                    <div className="input-label-row">
                                        <label>Password</label>
                                        <button 
                                            type="button" 
                                            className="link-btn-text"
                                            onClick={() => { setTab('otp'); setError(''); }}
                                        >
                                            Forgot / Use OTP
                                        </button>
                                    </div>
                                    <div className="auth-input-field">
                                        <Lock size={18} className="input-icon" />
                                        <input 
                                            type={showPassword ? 'text' : 'password'} 
                                            placeholder="Enter your password" 
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

                                <button type="submit" className="btn btn-primary auth-submit-btn" disabled={loading}>
                                    {loading ? (
                                        <><Loader2 size={18} className="spin" /> Signing In...</>
                                    ) : (
                                        <>Sign In to Account <ArrowRight size={18} /></>
                                    )}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleVerifyOtp} className="auth-main-form">
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
                                            disabled={otpSent}
                                        />
                                    </div>
                                </div>

                                {!otpSent ? (
                                    <button 
                                        type="button" 
                                        className="btn btn-primary auth-submit-btn" 
                                        onClick={handleSendOtp} 
                                        disabled={loading || !email}
                                    >
                                        {loading ? <><Loader2 size={18} className="spin" /> Sending OTP...</> : 'Send 6-Digit OTP'}
                                    </button>
                                ) : (
                                    <>
                                        <div className="auth-input-group">
                                            <label>Enter 6-digit code sent to {email}</label>
                                            <div className="auth-input-field otp-field">
                                                <input 
                                                    type="text" 
                                                    placeholder="• • • • • •" 
                                                    value={otpCode} 
                                                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                                                    maxLength={6} 
                                                    required 
                                                    autoFocus
                                                />
                                            </div>
                                        </div>

                                        <button 
                                            type="submit" 
                                            className="btn btn-primary auth-submit-btn" 
                                            disabled={loading || otpCode.length !== 6}
                                        >
                                            {loading ? <><Loader2 size={18} className="spin" /> Verifying...</> : 'Verify & Sign In'}
                                        </button>

                                        <button 
                                            type="button" 
                                            className="auth-resend-link" 
                                            onClick={handleSendOtp} 
                                            disabled={loading}
                                        >
                                            Didn't receive code? Resend OTP
                                        </button>
                                    </>
                                )}
                            </form>
                        )}

                        <div className="auth-divider-line">
                            <span>or continue with</span>
                        </div>

                        <button type="button" className="google-auth-btn" onClick={handleGoogleLogin}>
                            <svg width="18" height="18" viewBox="0 0 48 48">
                                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                            </svg>
                            <span>Google Account</span>
                        </button>

                        <div className="auth-switch-footer">
                            <span>Don't have an account?</span>
                            <Link to="/register" className="auth-switch-link">Create Account</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
