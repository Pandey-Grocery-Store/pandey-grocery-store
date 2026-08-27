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

    let data;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        try {
            data = await res.json();
        } catch {
            data = { error: 'Invalid JSON response from server' };
        }
    } else {
        const text = await res.text().catch(() => '');
        data = { error: text || `Server error (${res.status})` };
    }

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
    forgotPassword: (email) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
    resetPassword: (email, code, newPassword) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ email, code, newPassword }) }),
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

// ── Orders & Khata API ──
export const ordersApi = {
    getAll: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return tryRequest(`/orders${qs ? '?' + qs : ''}`);
    },
    getMyOrders: () => tryRequest('/orders/my'),
    getById: (id) => tryRequest(`/orders/${id}`),
    create: (data) => request('/orders', { method: 'POST', body: JSON.stringify(data) }),
    staffCreate: (data) => request('/orders/staff-create', { method: 'POST', body: JSON.stringify(data) }),
    updateStatus: (id, status) => request(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    updatePayment: (id, data) => request(`/orders/${id}/payment`, { method: 'PATCH', body: JSON.stringify(data) }),
};

// ── Customer Accounts & Khata Profiles API ──
export const customersApi = {
    getAll: () => tryRequest('/customers'),
    create: (data) => request('/customers', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/customers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
};

// ── Dashboard API ──
export const dashboardApi = {
    getStats: () => tryRequest('/dashboard/stats'),
    getTopProducts: () => tryRequest('/dashboard/top-products'),
};

// ── Categories & Subcategories API ──
export const categoriesApi = {
    getAll: () => tryRequest('/categories'),
    addSubcategory: (categoryId, data) => request(`/categories/${categoryId}/subcategories`, { method: 'POST', body: JSON.stringify(data) }),
};

// ── Upload API (Vercel Blob + Local DataURI Fallback) ──
export const uploadApi = {
    uploadImage: async (file) => {
        try {
            const token = getToken();
            const res = await fetch(`${API_BASE}/upload?filename=${encodeURIComponent(file.name)}`, {
                method: 'POST',
                headers: {
                    'Content-Type': file.type,
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
                body: file,
            });
            if (res.ok) {
                const data = await res.json();
                if (data?.url) return data;
            }
        } catch (e) {
            console.warn('Remote upload failed, converting to local data URI:', e);
        }

        // Instant local FileReader fallback
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve({ url: reader.result });
            reader.onerror = () => resolve({ url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400' });
            reader.readAsDataURL(file);
        });
    },
    uploadPrintFile: async (file) => {
        const token = getToken();
        const res = await fetch(`${API_BASE}/upload/print?filename=${encodeURIComponent(file.name)}`, {
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

// ── Print Jobs API ──
export const printJobsApi = {
    create: (data) => request('/print-jobs', { method: 'POST', body: JSON.stringify(data) }),
    getMyJobs: () => tryRequest('/print-jobs/my'),
    getAll: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return tryRequest(`/print-jobs${qs ? '?' + qs : ''}`);
    },
    updateStatus: (id, status, price) => request(`/print-jobs/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, price }) }),
};

// ── Admin API ──
export const adminApi = {
    getUsers: () => request('/admin/users'),
    updateUserRole: (id, role) => request(`/admin/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
};

// ── Email & Notifications API ──
export const notificationsApi = {
    getStatus: () => tryRequest('/notifications/status'),
    sendTestEmail: (data) => request('/notifications/test-email', { method: 'POST', body: JSON.stringify(data) }),
    sendBroadcast: (data) => request('/notifications/broadcast-email', { method: 'POST', body: JSON.stringify(data) }),
};


