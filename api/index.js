import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { put } from '@vercel/blob';

// ── Prisma Client (singleton for serverless) ──
const globalForPrisma = globalThis;
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// ── Auth helpers ──
function generateToken(user) {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role, name: user.name },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
}

function authenticate(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    try {
        req.user = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
        next();
    } catch {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

function authorize(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Access denied' });
        }
        next();
    };
}

// ── Google OAuth ──
async function verifyGoogleToken(idToken) {
    try {
        const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
        const ticket = await client.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
        const p = ticket.getPayload();
        return { googleId: p.sub, email: p.email, name: p.name, avatar: p.picture, emailVerified: p.email_verified };
    } catch { return null; }
}

// ── Express App ──
const app = express();
app.use(cors());
app.use(express.json());

// Health
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Helper: auto-promote admin by email from env (supports comma-separated list)
async function checkAndSetAdminRole(user) {
    const adminEmails = (process.env.ADMIN_EMAIL || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
    if (adminEmails.includes(user.email.toLowerCase()) && user.role !== 'ADMIN') {
        const updated = await prisma.user.update({ where: { id: user.id }, data: { role: 'ADMIN' } });
        return updated;
    }
    return user;
}

// ════════════════════ AUTH ════════════════════
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password required' });
        if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) return res.status(409).json({ error: 'Email already registered' });
        const user = await prisma.user.create({ data: { name, email, password: await bcrypt.hash(password, 10), provider: 'local' } });
        res.status(201).json({ token: generateToken(user), user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar } });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Registration failed' }); }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
        let user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.password) return res.status(401).json({ error: 'Invalid email or password' });
        if (!(await bcrypt.compare(password, user.password))) return res.status(401).json({ error: 'Invalid email or password' });
        user = await checkAndSetAdminRole(user);
        res.json({ token: generateToken(user), user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar } });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Login failed' }); }
});

app.post('/api/auth/google', async (req, res) => {
    try {
        const g = await verifyGoogleToken(req.body.idToken);
        if (!g) return res.status(401).json({ error: 'Invalid Google token' });
        let user = await prisma.user.findUnique({ where: { email: g.email } });
        if (user) { if (!user.googleId) user = await prisma.user.update({ where: { id: user.id }, data: { googleId: g.googleId, avatar: user.avatar || g.avatar, emailVerified: true } }); }
        else { user = await prisma.user.create({ data: { name: g.name, email: g.email, googleId: g.googleId, avatar: g.avatar, provider: 'google', emailVerified: true } }); }
        user = await checkAndSetAdminRole(user);
        res.json({ token: generateToken(user), user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar } });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Google auth failed' }); }
});

app.post('/api/auth/send-otp', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email required' });
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        await prisma.otp.updateMany({ where: { email, used: false }, data: { used: true } });
        await prisma.otp.create({ data: { email, code, expiresAt: new Date(Date.now() + 600000) } });
        console.log(`📧 OTP for ${email}: ${code}`);
        res.json({ message: 'OTP sent' });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to send OTP' }); }
});

app.post('/api/auth/verify-otp', async (req, res) => {
    try {
        const { email, code } = req.body;
        if (!email || !code) return res.status(400).json({ error: 'Email and OTP required' });
        const otp = await prisma.otp.findFirst({ where: { email, code, used: false, expiresAt: { gt: new Date() } }, orderBy: { createdAt: 'desc' } });
        if (!otp) return res.status(401).json({ error: 'Invalid or expired OTP' });
        await prisma.otp.update({ where: { id: otp.id }, data: { used: true } });
        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) user = await prisma.user.create({ data: { name: email.split('@')[0], email, provider: 'otp', emailVerified: true } });
        else await prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } });
        res.json({ token: generateToken(user), user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar } });
    } catch (err) { console.error(err); res.status(500).json({ error: 'OTP verification failed' }); }
});

app.get('/api/auth/me', authenticate, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { id: true, name: true, email: true, role: true, avatar: true, phone: true, emailVerified: true, provider: true, createdAt: true } });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ user });
    } catch (err) { res.status(500).json({ error: 'Failed to get user' }); }
});

// ════════════════════ USER ════════════════════
app.put('/api/user/profile', authenticate, async (req, res) => {
    try {
        const { name, phone, avatar } = req.body;
        const user = await prisma.user.update({ where: { id: req.user.id }, data: { ...(name && { name }), ...(phone && { phone }), ...(avatar && { avatar }) }, select: { id: true, name: true, email: true, role: true, avatar: true, phone: true } });
        res.json({ user });
    } catch (err) { res.status(500).json({ error: 'Failed to update profile' }); }
});

app.put('/api/user/password', authenticate, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: 'Min 6 chars' });
        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (user.password) { if (!currentPassword || !(await bcrypt.compare(currentPassword, user.password))) return res.status(401).json({ error: 'Current password incorrect' }); }
        await prisma.user.update({ where: { id: req.user.id }, data: { password: await bcrypt.hash(newPassword, 10) } });
        res.json({ message: 'Password updated' });
    } catch (err) { res.status(500).json({ error: 'Failed to change password' }); }
});

app.get('/api/user/addresses', authenticate, async (req, res) => {
    try { res.json({ addresses: await prisma.address.findMany({ where: { userId: req.user.id }, orderBy: { isDefault: 'desc' } }) }); }
    catch (err) { res.status(500).json({ error: 'Failed to get addresses' }); }
});

app.post('/api/user/addresses', authenticate, async (req, res) => {
    try {
        const { label, name, phone, line1, line2, city, state, pincode, isDefault } = req.body;
        if (isDefault) await prisma.address.updateMany({ where: { userId: req.user.id }, data: { isDefault: false } });
        const address = await prisma.address.create({ data: { label, name, phone, line1, line2, city, state, pincode, isDefault: !!isDefault, userId: req.user.id } });
        res.status(201).json({ address });
    } catch (err) { res.status(500).json({ error: 'Failed to add address' }); }
});

// ════════════════════ PRODUCTS ════════════════════
app.get('/api/products', async (req, res) => {
    try {
        const { category, subcategory, search, sort, limit } = req.query;
        const where = { isActive: true };
        if (category) where.category = category;
        if (subcategory) where.subcategory = subcategory;
        if (search) where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { brand: { contains: search, mode: 'insensitive' } }, { description: { contains: search, mode: 'insensitive' } }];
        let orderBy = { createdAt: 'desc' };
        if (sort === 'price-low') orderBy = { price: 'asc' };
        else if (sort === 'price-high') orderBy = { price: 'desc' };
        else if (sort === 'rating') orderBy = { rating: 'desc' };
        else if (sort === 'reviews') orderBy = { reviews: 'desc' };
        res.json({ products: await prisma.product.findMany({ where, orderBy, take: limit ? parseInt(limit) : undefined }) });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to fetch products' }); }
});

app.get('/api/products/:id', async (req, res) => {
    try {
        const product = await prisma.product.findUnique({ where: { id: req.params.id } });
        if (!product) return res.status(404).json({ error: 'Not found' });
        res.json({ product });
    } catch (err) { res.status(500).json({ error: 'Failed to fetch product' }); }
});

app.post('/api/products', authenticate, authorize('MANAGEMENT', 'ADMIN'), async (req, res) => {
    try {
        const { name, nameHi, brand, category, subcategory, price, mrp, unit, image, description, stock, rating } = req.body;
        if (!name || !brand || !category || !subcategory || !price || !mrp || !unit) return res.status(400).json({ error: 'Missing fields' });
        res.status(201).json({ product: await prisma.product.create({ data: { name, nameHi, brand, category, subcategory, price: parseFloat(price), mrp: parseFloat(mrp), unit, image: image || '', description, stock: parseInt(stock) || 100, rating: parseFloat(rating) || 4.0 } }) });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to create product' }); }
});

app.put('/api/products/:id', authenticate, authorize('MANAGEMENT', 'ADMIN'), async (req, res) => {
    try {
        const data = {};
        ['name', 'nameHi', 'brand', 'category', 'subcategory', 'unit', 'image', 'description'].forEach(f => { if (req.body[f] !== undefined) data[f] = req.body[f]; });
        ['price', 'mrp', 'rating'].forEach(f => { if (req.body[f] !== undefined) data[f] = parseFloat(req.body[f]); });
        ['stock', 'reviews'].forEach(f => { if (req.body[f] !== undefined) data[f] = parseInt(req.body[f]); });
        if (req.body.isActive !== undefined) data.isActive = Boolean(req.body.isActive);
        res.json({ product: await prisma.product.update({ where: { id: req.params.id }, data }) });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to update product' }); }
});

app.delete('/api/products/:id', authenticate, authorize('ADMIN'), async (req, res) => {
    try { await prisma.product.update({ where: { id: req.params.id }, data: { isActive: false } }); res.json({ message: 'Product deactivated' }); }
    catch (err) { res.status(500).json({ error: 'Failed to delete product' }); }
});

app.patch('/api/products/:id/stock', authenticate, authorize('MANAGEMENT', 'ADMIN'), async (req, res) => {
    try { res.json({ product: await prisma.product.update({ where: { id: req.params.id }, data: { stock: parseInt(req.body.stock) } }) }); }
    catch (err) { res.status(500).json({ error: 'Failed to update stock' }); }
});

// ════════════════════ ORDERS ════════════════════
app.get('/api/orders', authenticate, authorize('MANAGEMENT', 'ADMIN'), async (req, res) => {
    try {
        const where = {};
        if (req.query.status && req.query.status !== 'all') where.status = req.query.status;
        const orders = await prisma.order.findMany({ where, include: { items: true }, orderBy: { createdAt: 'desc' } });
        res.json({ orders: orders.map(o => ({ id: o.orderNumber, dbId: o.id, customer: o.customer || 'Customer', phone: o.phone || '', items: o.items.map(i => ({ name: i.name, qty: i.quantity, price: i.price })), total: o.total, status: o.status, payment: o.paymentMode, date: o.createdAt.toISOString().split('T')[0], address: o.address || '', deliveryType: o.deliveryType === 'delivery' ? 'home' : 'pickup', timeSlot: o.timeSlot || '' })) });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to fetch orders' }); }
});

app.post('/api/orders', authenticate, async (req, res) => {
    try {
        const { items, subtotal, discount, deliveryFee, total, deliveryType, paymentMode, addressId, timeSlot, customer, phone, address } = req.body;
        if (!items?.length || !total) return res.status(400).json({ error: 'Missing fields' });
        const count = await prisma.order.count();
        const order = await prisma.order.create({ data: { orderNumber: `ORD-${String(count + 1001).padStart(4, '0')}`, userId: req.user.id, subtotal: parseFloat(subtotal) || total, discount: parseFloat(discount) || 0, deliveryFee: parseFloat(deliveryFee) || 0, total: parseFloat(total), deliveryType: deliveryType || 'delivery', paymentMode: paymentMode || 'cod', addressId: addressId || null, customer: customer || req.user.name, phone: phone || '', address: address || '', timeSlot: timeSlot || '', items: { create: items.map(i => ({ name: i.name, price: parseFloat(i.price), quantity: parseInt(i.quantity) || 1, image: i.image || null })) } }, include: { items: true } });
        res.status(201).json({ order });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to create order' }); }
});

app.patch('/api/orders/:id/status', authenticate, authorize('MANAGEMENT', 'ADMIN'), async (req, res) => {
    try {
        const { status } = req.body;
        if (!['new', 'packing', 'packed', 'dispatched', 'delivered'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
        res.json({ order: await prisma.order.update({ where: { id: req.params.id }, data: { status }, include: { items: true } }) });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to update status' }); }
});

// ════════════════════ DASHBOARD ════════════════════
app.get('/api/dashboard/stats', authenticate, authorize('MANAGEMENT', 'ADMIN'), async (req, res) => {
    try {
        const [orders, products, users] = await Promise.all([
            prisma.order.findMany({ select: { total: true, status: true } }),
            prisma.product.findMany({ where: { isActive: true }, select: { stock: true } }),
            prisma.user.count({ where: { role: 'CUSTOMER' } }),
        ]);
        const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
        const activeOrders = orders.filter(o => ['new', 'packing', 'packed', 'dispatched'].includes(o.status)).length;
        const statusCounts = {};
        orders.forEach(o => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });
        res.json({ stats: { totalRevenue, activeOrders, customers: users, lowStock: products.filter(p => p.stock <= 10).length, totalProducts: products.length, totalOrders: orders.length }, statusCounts });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to fetch stats' }); }
});

app.get('/api/dashboard/top-products', authenticate, authorize('MANAGEMENT', 'ADMIN'), async (req, res) => {
    try { res.json({ products: await prisma.product.findMany({ where: { isActive: true }, orderBy: { reviews: 'desc' }, take: 5 }) }); }
    catch (err) { res.status(500).json({ error: 'Failed to fetch top products' }); }
});

// ════════════════════ UPLOAD (Vercel Blob) ════════════════════
app.post('/api/upload', authenticate, authorize('MANAGEMENT', 'ADMIN'), express.raw({ type: 'image/*', limit: '5mb' }), async (req, res) => {
    try {
        const filename = req.query.filename || `product-${Date.now()}.jpg`;
        const blob = await put(`pandey-grocery-store/${filename}`, req.body, { access: 'public', token: process.env.BLOB_READ_WRITE_TOKEN });
        res.json({ url: blob.url });
    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ error: 'Upload failed' });
    }
});

// ════════════════════ ADMIN: USER MANAGEMENT ════════════════════
app.get('/api/admin/users', authenticate, authorize('ADMIN'), async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, name: true, email: true, role: true, avatar: true, phone: true, provider: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ users });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to fetch users' }); }
});

app.patch('/api/admin/users/:id/role', authenticate, authorize('ADMIN'), async (req, res) => {
    try {
        const { role } = req.body;
        if (!['CUSTOMER', 'DELIVERY', 'MANAGEMENT'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role. Must be CUSTOMER, DELIVERY, or MANAGEMENT' });
        }
        // Don't allow changing own role
        if (req.params.id === req.user.id) {
            return res.status(400).json({ error: 'Cannot change your own role' });
        }
        const user = await prisma.user.update({
            where: { id: req.params.id },
            data: { role },
            select: { id: true, name: true, email: true, role: true, avatar: true, phone: true },
        });
        res.json({ user });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to update user role' }); }
});

// ════════════════════ DELIVERY TRACKING ════════════════════
// In-memory store for live delivery locations (resets on cold start, that's fine for real-time)
const deliveryLocations = new Map();

// Delivery person updates their location
app.post('/api/delivery/location', authenticate, authorize('DELIVERY', 'ADMIN'), async (req, res) => {
    try {
        const { lat, lng, orderId } = req.body;
        if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });
        const key = orderId || req.user.id;
        deliveryLocations.set(key, {
            deliveryPersonId: req.user.id,
            deliveryPersonName: req.user.name,
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            updatedAt: new Date().toISOString(),
        });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed to update location' }); }
});

// Customer/staff gets delivery location for an order
app.get('/api/delivery/location/:orderId', authenticate, async (req, res) => {
    try {
        const loc = deliveryLocations.get(req.params.orderId);
        if (!loc) return res.json({ location: null });
        res.json({ location: loc });
    } catch (err) { res.status(500).json({ error: 'Failed to get location' }); }
});

// Admin/Management assigns a delivery person to an order
app.patch('/api/orders/:id/assign', authenticate, authorize('MANAGEMENT', 'ADMIN'), async (req, res) => {
    try {
        const { deliveryPersonId } = req.body;
        if (!deliveryPersonId) return res.status(400).json({ error: 'deliveryPersonId required' });
        // Verify the delivery person exists and has DELIVERY role
        const dp = await prisma.user.findUnique({ where: { id: deliveryPersonId } });
        if (!dp || dp.role !== 'DELIVERY') return res.status(400).json({ error: 'Invalid delivery person' });
        const order = await prisma.order.update({
            where: { id: req.params.id },
            data: { status: 'dispatched', customer: `Assigned: ${dp.name}` },
            include: { items: true },
        });
        // Store assignment in memory for tracking
        deliveryLocations.set(req.params.id, {
            deliveryPersonId: dp.id,
            deliveryPersonName: dp.name,
            lat: 29.2183, lng: 79.5130, // Default: Haldwani center
            updatedAt: new Date().toISOString(),
        });
        res.json({ order, deliveryPerson: { id: dp.id, name: dp.name } });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to assign delivery' }); }
});

// Delivery person sees their assigned orders
app.get('/api/delivery/my-orders', authenticate, authorize('DELIVERY'), async (req, res) => {
    try {
        // Find orders where the delivery person is assigned (stored in customer field as "Assigned: Name")
        const orders = await prisma.order.findMany({
            where: { status: { in: ['dispatched', 'packed'] } },
            include: { items: true },
            orderBy: { updatedAt: 'desc' },
        });
        // Filter to this delivery person's assignments
        const myOrders = orders.filter(o => {
            const loc = deliveryLocations.get(o.id);
            return loc && loc.deliveryPersonId === req.user.id;
        }).map(o => ({
            id: o.id,
            orderNumber: o.orderNumber,
            customer: o.customer?.replace('Assigned: ', '') || 'Customer',
            phone: o.phone,
            address: o.address,
            total: o.total,
            status: o.status,
            items: o.items.map(i => ({ name: i.name, qty: i.quantity })),
        }));
        res.json({ orders: myOrders });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to fetch orders' }); }
});

// Get all delivery persons (for assignment dropdown)
app.get('/api/delivery/persons', authenticate, authorize('MANAGEMENT', 'ADMIN'), async (req, res) => {
    try {
        const persons = await prisma.user.findMany({
            where: { role: 'DELIVERY' },
            select: { id: true, name: true, email: true, phone: true },
        });
        res.json({ persons });
    } catch (err) { res.status(500).json({ error: 'Failed to get delivery persons' }); }
});

// ── Export for Vercel ──
export default app;
