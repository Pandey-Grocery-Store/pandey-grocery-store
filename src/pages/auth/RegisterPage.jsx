import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
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
            setError('Passwords do not match');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            await register(name, email, password);
            navigate('/');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignup = async () => {
        setError('');
        try {
            if (!window.google) {
                setError('Google Sign-In not loaded. Please refresh and try again.');
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
                ux_mode: 'popup',
            });

            // Use renderButton approach for reliable popup flow
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
                        setError('Google popup was blocked. Please allow popups or try again.');
                    }
                    setTimeout(() => btnDiv.remove(), 1000);
                });
            }, 300);
        } catch {
            setError('Google signup failed. Please try again.');
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <Link to="/" className="auth-logo">
                        <img src="/favicon.svg" alt="Pandey Grocery Store" width="40" height="40" />
                    </Link>
                    <h1>Create Account</h1>
                    <p>Join Pandey Grocery Store and start shopping</p>
                </div>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleRegister} className="auth-form">
                    <div className="form-field">
                        <label>Full Name</label>
                        <div className="input-wrapper">
                            <User size={18} />
                            <input type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} required />
                        </div>
                    </div>
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
                            <input type={showPassword ? 'text' : 'password'} placeholder="Min 6 characters" value={password} onChange={e => setPassword(e.target.value)} required />
                            <button type="button" className="toggle-pw" onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                    <div className="form-field">
                        <label>Confirm Password</label>
                        <div className="input-wrapper">
                            <Lock size={18} />
                            <input type={showPassword ? 'text' : 'password'} placeholder="Re-enter password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
                        {loading ? <Loader2 size={18} className="spin" /> : <><ArrowRight size={18} /> Create Account</>}
                    </button>
                </form>

                <div className="auth-divider"><span>or</span></div>

                <button className="btn auth-google" onClick={handleGoogleSignup}>
                    <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" /><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" /><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" /><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" /></svg>
                    Sign up with Google
                </button>

                <div className="auth-footer">
                    Already have an account? <Link to="/login">Sign in</Link>
                </div>
            </div>
        </div>
    );
}
