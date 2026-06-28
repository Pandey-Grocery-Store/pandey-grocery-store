// ── API Client with auth token management ──
const API_BASE = '/api';

function getToken() {
    return localStorage.getItem('auth_token');
}

async function request(endpoint, options = {}) {
    const token = getToken();
    const res = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers,
        },
        ...options,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
}

// Try API call, return null on failure (allows offline fallback)
async function tryRequest(endpoint, options = {}) {
    try {
        return await request(endpoint, options);
    } catch {
        return null;
    }
}

// ── Auth API ──
export const authApi = {
    register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    google: (idToken) => request('/auth/google', { method: 'POST', body: JSON.stringify({ idToken }) }),
    sendOtp: (email) => request('/auth/send-otp', { method: 'POST', body: JSON.stringify({ email }) }),
    verifyOtp: (email, code) => request('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ email, code }) }),
    me: () => request('/auth/me'),
};

// ── User API ──
export const userApi = {
    getProfile: () => request('/user/profile'),
    updateProfile: (data) => request('/user/profile', { method: 'PUT', body: JSON.stringify(data) }),
    changePassword: (data) => request('/user/password', { method: 'PUT', body: JSON.stringify(data) }),
    getAddresses: () => request('/user/address'),
    addAddress: (data) => request('/user/address', { method: 'POST', body: JSON.stringify(data) }),
    deleteAddress: (id) => request(`/user/address/${id}`, { method: 'DELETE' }),
};

// ── Categories API ──
export const categoriesApi = {
    getAll: () => tryRequest('/categories'),
};

// ── Products API ──
export const productsApi = {
    getAll: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return tryRequest(`/products${qs ? '?' + qs : ''}`);
    },
    getById: (id) => tryRequest(`/products/${id}`),
    create: (data) => request('/products', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/products/${id}`, { method: 'DELETE' }),
    updateStock: (id, stock) => request(`/products/${id}/stock`, { method: 'PATCH', body: JSON.stringify({ stock }) }),
};

// ── Orders API ──
export const ordersApi = {
    getAll: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return tryRequest(`/orders${qs ? '?' + qs : ''}`);
    },
    getMyOrders: () => tryRequest('/orders/my'),
    getById: (id) => tryRequest(`/orders/${id}`),
    create: (data) => request('/orders', { method: 'POST', body: JSON.stringify(data) }),
    updateStatus: (id, status) => request(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};

// ── Dashboard API ──
export const dashboardApi = {
    getStats: () => tryRequest('/dashboard/stats'),
    getTopProducts: () => tryRequest('/dashboard/top-products'),
};

// ── Upload API (Vercel Blob) ──
export const uploadApi = {
    uploadImage: async (file) => {
        const token = getToken();
        const res = await fetch(`${API_BASE}/upload?filename=${encodeURIComponent(file.name)}`, {
            method: 'POST',
            headers: {
                'Content-Type': file.type,
                ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: file,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed');
        return data;
    },
};

// ── Admin API ──
export const adminApi = {
    getUsers: () => request('/admin/users'),
    updateUserRole: (id, role) => request(`/admin/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
};
