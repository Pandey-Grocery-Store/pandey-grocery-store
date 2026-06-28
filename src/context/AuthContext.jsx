import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext();

// API helper — returns null on network failure (offline fallback)
async function tryApi(endpoint, options = {}) {
    const token = localStorage.getItem('auth_token');
    try {
        const res = await fetch(`/api${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` }),
                ...options.headers,
            },
            ...options,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Request failed');
        return data;
    } catch (err) {
        if (err.message && err.message !== 'Request failed') throw err;
        return null;
    }
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Restore session on mount
    useEffect(() => {
        const stored = localStorage.getItem('pandey_user');
        const token = localStorage.getItem('auth_token');

        if (stored) {
            setUser(JSON.parse(stored));
            setLoading(false);
            if (token) {
                tryApi('/auth/me').then(data => {
                    if (data?.user) {
                        setUser(data.user);
                        localStorage.setItem('pandey_user', JSON.stringify(data.user));
                    }
                });
            }
        } else if (token) {
            tryApi('/auth/me').then(data => {
                if (data?.user) {
                    setUser(data.user);
                    localStorage.setItem('pandey_user', JSON.stringify(data.user));
                }
            }).finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const persistUser = useCallback((userData, token) => {
        if (token) localStorage.setItem('auth_token', token);
        localStorage.setItem('pandey_user', JSON.stringify(userData));
        setUser(userData);
        return userData;
    }, []);

    // Email + password login
    const login = useCallback(async (email, password) => {
        const data = await tryApi('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        if (data?.token) {
            return persistUser(data.user, data.token);
        }
        throw new Error('Invalid email or password');
    }, [persistUser]);

    // Email + password register
    const register = useCallback(async (name, email, password) => {
        const data = await tryApi('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, password }),
        });
        if (data?.token) {
            return persistUser(data.user, data.token);
        }
        throw new Error('Registration failed');
    }, [persistUser]);

    // Google OAuth
    const loginWithGoogle = useCallback(async (idToken) => {
        const data = await tryApi('/auth/google', {
            method: 'POST',
            body: JSON.stringify({ idToken }),
        });
        if (data?.token) {
            return persistUser(data.user, data.token);
        }
        throw new Error('Google login failed');
    }, [persistUser]);

    // OTP
    const sendOtp = useCallback(async (email) => {
        const data = await tryApi('/auth/send-otp', {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
        if (data) return data;
        throw new Error('Failed to send OTP');
    }, []);

    const verifyOtp = useCallback(async (email, code) => {
        const data = await tryApi('/auth/verify-otp', {
            method: 'POST',
            body: JSON.stringify({ email, code }),
        });
        if (data?.token) {
            return persistUser(data.user, data.token);
        }
        throw new Error('Invalid OTP code');
    }, [persistUser]);

    // Logout
    const logout = useCallback(() => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('pandey_user');
        setUser(null);
    }, []);

    const value = {
        user,
        loading,
        isLoggedIn: !!user,
        login,
        register,
        loginWithGoogle,
        sendOtp,
        verifyOtp,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
