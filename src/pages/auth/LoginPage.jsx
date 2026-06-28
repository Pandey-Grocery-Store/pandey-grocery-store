import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
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
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSendOtp = async () => {
        if (!email) { setError('Enter your email first'); return; }
        setError('');
        setLoading(true);
        try {
            await sendOtp(email);
            setOtpSent(true);
        } catch (err) {
            setError(err.message);
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
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError('');
        try {
            if (!window.google) {
                setError('Google Sign-In not loaded. Check your Google Client ID.');
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
                        setError(err.message);
                    } finally {
                        setLoading(false);
                    }
                },
            });
            window.google.accounts.id.prompt();
        } catch (err) {
            setError('Google login failed');
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <Link to="/" className="auth-logo">
                        <img src="/favicon.svg" alt="Pandey Grocery Store" width="40" height="40" />
                    </Link>
                    <h1>Welcome Back</h1>
                    <p>Sign in to your Pandey Grocery Store account</p>
                </div>

                <div className="auth-tabs">
                    <button className={`auth-tab ${tab === 'password' ? 'active' : ''}`} onClick={() => { setTab('password'); setError(''); }}>
                        Email & Password
                    </button>
                    <button className={`auth-tab ${tab === 'otp' ? 'active' : ''}`} onClick={() => { setTab('otp'); setError(''); setOtpSent(false); }}>
                        Email OTP
                    </button>
                </div>

                {error && <div className="auth-error">{error}</div>}

                {tab === 'password' ? (
                    <form onSubmit={handlePasswordLogin} className="auth-form">
                        <div className="form-field">
                            <label>Email</label>
                            <div className="input-wrapper">
                                <Mail size={18} />
                                <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                            </div>
                        </div>
                        <div className="form-field">
                            <label>Password</label>
                            <div className="input-wrapper">
                                <Lock size={18} />
                                <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                                <button type="button" className="toggle-pw" onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
                            {loading ? <Loader2 size={18} className="spin" /> : <><ArrowRight size={18} /> Sign In</>}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOtp} className="auth-form">
                        <div className="form-field">
                            <label>Email</label>
                            <div className="input-wrapper">
                                <Mail size={18} />
                                <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required disabled={otpSent} />
                            </div>
                        </div>
                        {!otpSent ? (
                            <button type="button" className="btn btn-primary auth-submit" onClick={handleSendOtp} disabled={loading}>
                                {loading ? <Loader2 size={18} className="spin" /> : 'Send OTP'}
                            </button>
                        ) : (
                            <>
                                <div className="form-field">
                                    <label>Enter 6-digit code sent to {email}</label>
                                    <div className="input-wrapper otp-input">
                                        <input type="text" placeholder="000000" value={otpCode} onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))} maxLength={6} required />
                                    </div>
                                </div>
                                <button type="submit" className="btn btn-primary auth-submit" disabled={loading || otpCode.length !== 6}>
                                    {loading ? <Loader2 size={18} className="spin" /> : 'Verify & Sign In'}
                                </button>
                                <button type="button" className="auth-resend" onClick={handleSendOtp} disabled={loading}>Resend Code</button>
                            </>
                        )}
                    </form>
                )}

                <div className="auth-divider"><span>or</span></div>

                <button className="btn auth-google" onClick={handleGoogleLogin}>
                    <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" /><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" /><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" /><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" /></svg>
                    Continue with Google
                </button>

                <div className="auth-footer">
                    Don't have an account? <Link to="/register">Create one</Link>
                </div>
            </div>
        </div>
    );
}
