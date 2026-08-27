import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { put } from '@vercel/blob';
import {
    sendOtpEmail,
    sendOrderConfirmationEmail,
    sendOrderStatusUpdateEmail,
    sendPrintJobEmail,
    sendAdminNewOrderAlert,
    sendWelcomeEmail,
    sendBroadcastNotificationEmail,
    sendPasswordChangedAlert,
    sendPasswordResetOtpEmail,
    sendPrintJobStatusUpdateEmail,
    sendDeliveryAssignmentCustomerEmail,
    sendDeliveryAssignmentRiderEmail,
    sendLowStockAlertEmail,
    sendStaffOrderReceiptEmail,
    sendMonthlyKhataReminderEmail,
    verifySmtpConnection,
    sendEmail
} from './emailService.js';

// ── Prisma Client (singleton for serverless) ──
const globalForPrisma = globalThis;
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// ── Auth helpers ──
const JWT_SECRET = process.env.JWT_SECRET || 'pandey_grocery_store_secret_jwt_key_2026_secure';

function generateToken(user) {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role, name: user.name },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
}

async function authenticate(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    try {
        const decoded = jwt.verify(header.split(' ')[1], JWT_SECRET);
        req.user = decoded;
        
        // Guarantee email & name are present even if using an older token
        if (!req.user.email && req.user.id) {
            try {
                const dbUser = await prisma.user.findUnique({
                    where: { id: req.user.id },
                    select: { id: true, email: true, name: true, role: true }
                });
                if (dbUser) {
                    req.user.email = dbUser.email;
                    req.user.name = dbUser.name;
                    req.user.role = dbUser.role;
                }
            } catch (dbErr) {
                console.error('Error fetching user email in auth middleware:', dbErr);
            }
        }
        
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
        let { name, email, password } = req.body;
        if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password required' });
        if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
        email = email.trim().toLowerCase();
        name = name.trim();

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            // If the account was created by the manager/POS and has not had a password set yet, allow the customer to claim it
            if (!existing.password) {
                const hashedPassword = await bcrypt.hash(password, 10);
                const updated = await prisma.user.update({
                    where: { id: existing.id },
                    data: {
                        name: existing.name || name,
                        password: hashedPassword,
                        emailVerified: true,
                        provider: 'local'
                    }
                });
                sendWelcomeEmail(updated.email, updated.name).catch(e => console.error('Welcome email error:', e.message));
                return res.status(200).json({ 
                    token: generateToken(updated), 
                    user: { id: updated.id, name: updated.name, email: updated.email, role: updated.role, avatar: updated.avatar },
                    message: 'Account successfully linked with your store history!'
                });
            }
            return res.status(409).json({ error: 'An account with this email already exists. Please log in or use Forgot Password.' });
        }

        const user = await prisma.user.create({ 
            data: { 
                name, 
                email, 
                password: await bcrypt.hash(password, 10), 
                provider: 'local',
                emailVerified: false 
            } 
        });
        sendWelcomeEmail(user.email, user.name).catch(e => console.error('Welcome email error:', e.message));
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
        if (user) { 
            if (!user.googleId) user = await prisma.user.update({ where: { id: user.id }, data: { googleId: g.googleId, avatar: user.avatar || g.avatar, emailVerified: true } }); 
        } else { 
            user = await prisma.user.create({ data: { name: g.name, email: g.email, googleId: g.googleId, avatar: g.avatar, provider: 'google', emailVerified: true } });
            sendWelcomeEmail(user.email, user.name).catch(e => console.error('Google welcome email error:', e.message));
        }
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
        
        // Send OTP via email
        try {
            await sendOtpEmail(email, code);
            console.log(`📧 OTP sent to ${email}`);
        } catch (mailErr) {
            console.error('SMTP error:', mailErr.message);
            // Still return success - OTP is saved in DB, user can retry
        }
        
        res.json({ message: 'OTP sent to your email' });
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
        if (!user) {
            user = await prisma.user.create({ data: { name: email.split('@')[0], email, provider: 'otp', emailVerified: true } });
            sendWelcomeEmail(user.email, user.name).catch(e => console.error('OTP welcome email error:', e.message));
        } else {
            await prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } });
        }
        res.json({ token: generateToken(user), user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar } });
    } catch (err) { console.error(err); res.status(500).json({ error: 'OTP verification failed' }); }
});

// ── Forgot Password: Send 6-Digit Password Reset OTP Email ──
app.post('/api/auth/forgot-password', async (req, res) => {
    try {
        let { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email address required' });
        email = email.trim().toLowerCase();

        let user = await prisma.user.findFirst({
            where: { email: { equals: email, mode: 'insensitive' } }
        });

        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        await prisma.otp.updateMany({ where: { email, used: false }, data: { used: true } });
        await prisma.otp.create({ data: { email, code: resetCode, expiresAt: new Date(Date.now() + 600000) } });

        const recipientName = user ? user.name : email.split('@')[0];
        const mailRes = await sendPasswordResetOtpEmail(email, resetCode, recipientName);
        console.log(`📧 Password reset code sent to ${email} (Success: ${mailRes.success})`);

        if (!mailRes.success && mailRes.error) {
            console.error('Email delivery error details:', mailRes.error);
        }

        res.json({ success: true, message: `6-digit password recovery code sent to ${email}` });
    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ error: err.message || 'Failed to process password reset request' });
    }
});

// ── Reset Password with Verified OTP Code ──
app.post('/api/auth/reset-password', async (req, res) => {
    try {
        let { email, code, newPassword } = req.body;
        if (!email || !code || !newPassword) return res.status(400).json({ error: 'Email, recovery code, and new password are required' });
        if (newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
        email = email.trim().toLowerCase();
        code = code.trim();

        const otp = await prisma.otp.findFirst({
            where: { email: { equals: email, mode: 'insensitive' }, code, used: false, expiresAt: { gt: new Date() } },
            orderBy: { createdAt: 'desc' }
        });

        if (!otp) return res.status(401).json({ error: 'Invalid or expired recovery code' });
        await prisma.otp.update({ where: { id: otp.id }, data: { used: true } });

        let user = await prisma.user.findFirst({
            where: { email: { equals: email, mode: 'insensitive' } }
        });
        if (!user) return res.status(404).json({ error: 'User account not found' });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword, emailVerified: true }
        });

        // Send security alert confirmation
        sendPasswordChangedAlert(updatedUser.email, updatedUser.name).catch(e => console.error('Password reset alert error:', e.message));

        res.json({
            success: true,
            message: 'Password reset successfully. You are now logged in.',
            token: generateToken(updatedUser),
            user: { id: updatedUser.id, name: updatedUser.name, email: updatedUser.email, role: updatedUser.role, avatar: updatedUser.avatar }
        });
    } catch (err) {
        console.error('Reset password error:', err);
        res.status(500).json({ error: err.message || 'Failed to reset password' });
    }
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
        
        // Security notification email
        if (user.email) {
            sendPasswordChangedAlert(user.email, user.name).catch(e => console.error('Password alert email error:', e.message));
        }

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

// ════════════════════ CATEGORIES & SUBCATEGORIES ════════════════════
const BASE_CATEGORIES = [
    {
        id: 'groceries',
        slug: 'groceries',
        name: 'Groceries & Staples',
        nameHi: 'किराना एवं दैनिक सामग्री',
        icon: 'ShoppingBasket',
        image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400',
        subcategories: [
            { id: 'rice-grains', name: 'Rice & Grains', nameHi: 'चावल और अनाज' },
            { id: 'spices-masala', name: 'Spices & Masalas', nameHi: 'मसाले और गरम मसाले' },
            { id: 'cooking-oil', name: 'Cooking Oil', nameHi: 'खाना पकाने का तेल' },
            { id: 'packaged-foods', name: 'Packaged Foods', nameHi: 'पैक्ड खाद्य पदार्थ' },
            { id: 'dairy-products', name: 'Dairy Products', nameHi: 'डेयरी उत्पाद' },
            { id: 'beverages', name: 'Beverages', nameHi: 'पेय पदार्थ' },
            { id: 'snacks', name: 'Snacks & Namkeen', nameHi: 'स्नैक्स और नमकीन' },
            { id: 'fresh-produce', name: 'Fresh Fruits & Vegetables', nameHi: 'ताज़ी फल और सब्ज़ियाँ' },
        ],
    },
    {
        id: 'stationery',
        slug: 'stationery',
        name: 'Stationery & Office',
        nameHi: 'स्टेशनरी एवं ऑफिस सामग्री',
        icon: 'BookOpen',
        image: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400',
        subcategories: [
            { id: 'notebooks-registers', name: 'Notebooks & Registers', nameHi: 'कॉपी एवं रजिस्टर' },
            { id: 'pens-pencils', name: 'Pens, Pencils & School Supplies', nameHi: 'पेन, पेंसिल एवं स्कूल सामग्री' },
            { id: 'files-folders', name: 'Files & Folders', nameHi: 'फ़ाइलें और फ़ोल्डर' },
            { id: 'art-craft', name: 'Art, Craft & Chart Paper', nameHi: 'आर्ट, क्राफ्ट एवं चार्ट पेपर' },
            { id: 'office-supplies', name: 'Sticky Notes & Office Supplies', nameHi: 'कार्यालय सामग्री' },
        ],
    },
    {
        id: 'household-personal',
        slug: 'household-personal',
        name: 'Household & Care',
        nameHi: 'घरेलू एवं पर्सनल केयर',
        icon: 'Sparkles',
        image: 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=400',
        subcategories: [
            { id: 'household-products', name: 'Household Products', nameHi: 'घरेलू सामान' },
            { id: 'cleaning-supplies', name: 'Cleaning Supplies', nameHi: 'सफाई का सामान' },
            { id: 'personal-care', name: 'Personal Care Products', nameHi: 'पर्सनल केयर' },
        ],
    },
];

app.get('/api/categories', async (req, res) => {
    try {
        let dbCategories = await prisma.category.findMany();
        if (!dbCategories || dbCategories.length === 0) {
            // Seed base categories in DB
            for (const cat of BASE_CATEGORIES) {
                await prisma.category.upsert({
                    where: { slug: cat.slug },
                    update: {},
                    create: {
                        id: cat.id,
                        slug: cat.slug,
                        name: cat.name,
                        nameHi: cat.nameHi,
                        icon: cat.icon,
                        image: cat.image,
                        subcategories: JSON.stringify(cat.subcategories)
                    }
                });
            }
            dbCategories = await prisma.category.findMany();
        }

        const formatted = dbCategories.map(c => {
            let parsedSubs = [];
            try { parsedSubs = JSON.parse(c.subcategories); } catch { parsedSubs = []; }
            const baseCat = BASE_CATEGORIES.find(b => b.slug === c.slug);
            const baseSubs = baseCat ? baseCat.subcategories : [];
            const mergedSubs = [...baseSubs];
            for (const sub of parsedSubs) {
                if (!mergedSubs.some(m => m.id === sub.id)) {
                    mergedSubs.push(sub);
                }
            }
            return {
                id: c.id,
                slug: c.slug,
                name: c.name,
                nameHi: c.nameHi,
                icon: c.icon,
                image: c.image,
                subcategories: mergedSubs
            };
        });

        res.json({ categories: formatted });
    } catch (err) {
        console.error('Fetch categories error:', err);
        res.json({ categories: BASE_CATEGORIES });
    }
});

// Admin creates a dynamic subcategory
app.post('/api/categories/:categoryId/subcategories', authenticate, authorize('MANAGEMENT', 'ADMIN'), async (req, res) => {
    try {
        const { categoryId } = req.params;
        const { name, nameHi } = req.body;
        if (!name || !name.trim()) return res.status(400).json({ error: 'Subcategory name is required' });

        const subId = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `sub-${Date.now()}`;
        const newSub = { id: subId, name: name.trim(), nameHi: nameHi?.trim() || name.trim() };

        let cat = await prisma.category.findFirst({ where: { OR: [{ id: categoryId }, { slug: categoryId }] } });
        if (!cat) {
            const base = BASE_CATEGORIES.find(b => b.id === categoryId || b.slug === categoryId);
            if (!base) return res.status(404).json({ error: 'Category not found' });
            cat = await prisma.category.create({
                data: {
                    id: base.id,
                    slug: base.slug,
                    name: base.name,
                    nameHi: base.nameHi,
                    icon: base.icon,
                    image: base.image,
                    subcategories: JSON.stringify([...base.subcategories, newSub])
                }
            });
        } else {
            let subs = [];
            try { subs = JSON.parse(cat.subcategories); } catch { subs = []; }
            if (!subs.some(s => s.id === subId)) {
                subs.push(newSub);
                cat = await prisma.category.update({
                    where: { id: cat.id },
                    data: { subcategories: JSON.stringify(subs) }
                });
            }
        }

        res.status(201).json({ success: true, subcategory: newSub, category: cat });
    } catch (err) {
        console.error('Create subcategory error:', err);
        res.status(500).json({ error: 'Failed to create subcategory' });
    }
});

// ════════════════════ PRODUCTS ════════════════════
app.get('/api/products', async (req, res) => {
    try {
        const { category, subcategory, search, sort, limit } = req.query;
        const where = { isActive: true };
        if (category && category !== 'all') where.category = category;
        if (subcategory && subcategory !== 'all') where.subcategory = subcategory;
        if (search) where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { brand: { contains: search, mode: 'insensitive' } }, { description: { contains: search, mode: 'insensitive' } }];
        let orderBy = { createdAt: 'desc' };
        if (sort === 'price-low') orderBy = { price: 'asc' };
        else if (sort === 'price-high') orderBy = { price: 'desc' };
        else if (sort === 'rating') orderBy = { rating: 'desc' };
        else if (sort === 'reviews') orderBy = { reviews: 'desc' };
        const products = await prisma.product.findMany({ where, orderBy, take: limit ? parseInt(limit) : undefined });
        res.json({ products });
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
        const { name, nameHi, brand, category, subcategory, price, mrp, unit, image, description, stock, rating, productType } = req.body;
        if (!name || !brand || !category || !price || !mrp) return res.status(400).json({ error: 'Missing required product fields' });
        
        // Auto-resolve raw Category ID to slug (e.g. cmtb5... -> stationery)
        let resolvedCategory = category.trim();
        const matchedCat = await prisma.category.findFirst({
            where: { OR: [{ id: resolvedCategory }, { slug: resolvedCategory }] }
        });
        if (matchedCat) {
            resolvedCategory = matchedCat.slug;
        }

        const fallbackImg = resolvedCategory === 'stationery' 
            ? 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400'
            : resolvedCategory === 'household-personal'
            ? 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=400'
            : 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400';

        const finalImage = (image && image.trim()) ? image.trim() : fallbackImg;
        const finalUnit = unit?.trim() || (productType === 'weight' ? '1 kg' : '1 Unit');

        const product = await prisma.product.create({
            data: {
                name: name.trim(),
                nameHi: nameHi?.trim() || null,
                brand: brand.trim(),
                category: resolvedCategory,
                subcategory: subcategory?.trim() || 'all',
                price: parseFloat(price),
                mrp: parseFloat(mrp),
                unit: finalUnit,
                image: finalImage,
                description: description?.trim() || (productType === 'weight' ? '[TYPE:weight] Fresh loose grocery item sold by weight' : null),
                stock: parseInt(stock) !== undefined && !isNaN(parseInt(stock)) ? parseInt(stock) : 50,
                rating: parseFloat(rating) || 4.5,
            }
        });

        res.status(201).json({ success: true, product });
    } catch (err) {
        console.error('Create product error:', err);
        res.status(500).json({ error: err.message || 'Failed to create product' });
    }
});

app.put('/api/products/:id', authenticate, authorize('MANAGEMENT', 'ADMIN'), async (req, res) => {
    try {
        const data = {};
        ['name', 'nameHi', 'brand', 'category', 'subcategory', 'unit', 'image', 'description'].forEach(f => { if (req.body[f] !== undefined) data[f] = req.body[f]; });
        if (data.category) {
            const matchedCat = await prisma.category.findFirst({
                where: { OR: [{ id: data.category }, { slug: data.category }] }
            });
            if (matchedCat) data.category = matchedCat.slug;
        }
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

// ════════════════════ ORDERS & STORE KHATA ════════════════════
// Helper to parse payment status & amounts
function parseOrderPayment(paymentMode, total) {
    const raw = String(paymentMode || 'cod').toLowerCase();
    let status = 'PAID';
    let mode = 'cash';
    let paidAmount = total;
    let dueAmount = 0;

    if (raw.includes('khata_due') || raw === 'due' || raw === 'pending' || raw === 'udhar') {
        status = 'PENDING';
        mode = 'khata_due';
        paidAmount = 0;
        dueAmount = total;
    } else if (raw.includes('khata_partial') || raw.includes('partial')) {
        status = 'PARTIAL';
        mode = 'khata_partial';
        // Extract paid amount if stored as "khata_partial:paid=300:due=200"
        const paidMatch = raw.match(/paid=([0-9.]+)/);
        const dueMatch = raw.match(/due=([0-9.]+)/);
        paidAmount = paidMatch ? parseFloat(paidMatch[1]) : Math.round(total / 2);
        dueAmount = dueMatch ? parseFloat(dueMatch[1]) : total - paidAmount;
    } else if (raw === 'cod') {
        status = 'PENDING';
        mode = 'cod';
        paidAmount = 0;
        dueAmount = total;
    } else if (raw.includes('upi')) {
        status = 'PAID';
        mode = 'upi';
        paidAmount = total;
        dueAmount = 0;
    } else if (raw.includes('cash') || raw.includes('hand')) {
        status = 'PAID';
        mode = 'cash';
        paidAmount = total;
        dueAmount = 0;
    } else {
        status = 'PAID';
        mode = raw;
        paidAmount = total;
        dueAmount = 0;
    }

    return { status, mode, paidAmount, dueAmount };
}

// User's own orders & Khata transactions (any logged-in user)
app.get('/api/orders/my', authenticate, async (req, res) => {
    try {
        const userOrConditions = [{ userId: req.user.id }];
        if (req.user.phone) {
            userOrConditions.push({ phone: req.user.phone });
        }
        if (req.user.name && req.user.name.length > 2 && req.user.name.toLowerCase() !== 'customer' && req.user.name.toLowerCase() !== 'walk-in customer') {
            userOrConditions.push({ customer: { equals: req.user.name, mode: 'insensitive' } });
        }

        const orders = await prisma.order.findMany({ 
            where: { OR: userOrConditions }, 
            include: { items: true, deliveryAddr: true }, 
            orderBy: { createdAt: 'desc' } 
        });

        // Background auto-link any unlinked orders to this user's account
        for (const o of orders) {
            if (o.userId !== req.user.id) {
                prisma.order.update({ where: { id: o.id }, data: { userId: req.user.id } }).catch(() => {});
            }
        }

        res.json({ 
            orders: orders.map(o => {
                const pay = parseOrderPayment(o.paymentMode, o.total);
                return { 
                    id: o.orderNumber, 
                    dbId: o.id, 
                    orderNumber: o.orderNumber,
                    customer: o.customer || req.user.name || 'Customer', 
                    phone: o.phone || '', 
                    items: o.items.map(i => ({ name: i.name, qty: i.quantity, quantity: i.quantity, price: i.price, image: i.image })), 
                    subtotal: o.subtotal,
                    discount: o.discount,
                    deliveryFee: o.deliveryFee,
                    total: o.total, 
                    status: o.status, 
                    payment: pay.mode,
                    paymentStatus: pay.status,
                    paidAmount: pay.paidAmount,
                    dueAmount: pay.dueAmount,
                    date: o.createdAt.toISOString().split('T')[0], 
                    createdAt: o.createdAt,
                    address: o.address || (o.deliveryAddr ? `${o.deliveryAddr.line1}, ${o.deliveryAddr.city} - ${o.deliveryAddr.pincode}` : ''), 
                    deliveryType: o.deliveryType === 'delivery' ? 'home' : 'pickup',
                    timeSlot: o.timeSlot || 'Standard Delivery'
                };
            }) 
        });
    } catch (err) { console.error('GET /api/orders/my error:', err); res.status(500).json({ error: 'Failed to fetch your orders' }); }
});

// All orders & Kirana Khata tracking (admin/management only)
app.get('/api/orders', authenticate, authorize('MANAGEMENT', 'ADMIN'), async (req, res) => {
    try {
        const where = {};
        if (req.query.status && req.query.status !== 'all') where.status = req.query.status;
        const orders = await prisma.order.findMany({ 
            where, 
            include: { items: true, user: true, deliveryAddr: true }, 
            orderBy: { createdAt: 'desc' } 
        });
        res.json({ 
            orders: orders.map(o => {
                const pay = parseOrderPayment(o.paymentMode, o.total);
                return { 
                    id: o.orderNumber, 
                    dbId: o.id, 
                    orderNumber: o.orderNumber,
                    customer: o.customer || o.user?.name || 'Customer', 
                    phone: o.phone || o.user?.phone || '', 
                    email: o.user?.email || '',
                    items: o.items.map(i => ({ name: i.name, qty: i.quantity, quantity: i.quantity, price: i.price, image: i.image })), 
                    subtotal: o.subtotal,
                    discount: o.discount,
                    deliveryFee: o.deliveryFee,
                    total: o.total, 
                    status: o.status, 
                    payment: pay.mode, 
                    paymentStatus: pay.status,
                    paidAmount: pay.paidAmount,
                    dueAmount: pay.dueAmount,
                    date: o.createdAt.toISOString().split('T')[0], 
                    createdAt: o.createdAt,
                    address: o.address || (o.deliveryAddr ? `${o.deliveryAddr.line1}, ${o.deliveryAddr.city} - ${o.deliveryAddr.pincode}` : ''), 
                    deliveryType: o.deliveryType === 'delivery' ? 'home' : 'pickup', 
                    timeSlot: o.timeSlot || 'Standard Delivery' 
                };
            }) 
        });
    } catch (err) { console.error('GET /api/orders error:', err); res.status(500).json({ error: 'Failed to fetch orders' }); }
});

// Single order details (for tracking / invoice)
app.get('/api/orders/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const order = await prisma.order.findFirst({
            where: {
                OR: [{ id }, { orderNumber: id }],
                ...(req.user.role === 'CUSTOMER' ? { userId: req.user.id } : {})
            },
            include: { items: true, user: true, deliveryAddr: true }
        });
        if (!order) return res.status(404).json({ error: 'Order not found' });
        const pay = parseOrderPayment(order.paymentMode, order.total);
        res.json({
            order: {
                id: order.orderNumber,
                dbId: order.id,
                orderNumber: order.orderNumber,
                customer: order.customer || order.user?.name || 'Customer',
                phone: order.phone || order.user?.phone || '',
                email: order.user?.email || '',
                items: order.items.map(i => ({ name: i.name, qty: i.quantity, quantity: i.quantity, price: i.price, image: i.image })),
                subtotal: order.subtotal,
                discount: order.discount,
                deliveryFee: order.deliveryFee,
                total: order.total,
                status: order.status,
                payment: pay.mode,
                paymentStatus: pay.status,
                paidAmount: pay.paidAmount,
                dueAmount: pay.dueAmount,
                date: order.createdAt.toISOString().split('T')[0],
                createdAt: order.createdAt,
                address: order.address || (order.deliveryAddr ? `${order.deliveryAddr.line1}, ${order.deliveryAddr.city} - ${order.deliveryAddr.pincode}` : ''),
                deliveryType: order.deliveryType === 'delivery' ? 'home' : 'pickup',
                timeSlot: order.timeSlot || 'Standard Delivery'
            }
        });
    } catch (err) {
        console.error('Fetch single order error:', err);
        res.status(500).json({ error: 'Failed to fetch order' });
    }
});

// Manager updates payment status (Mark as Paid Hand-to-Hand, Settle Khata, Record Partial)
app.patch('/api/orders/:id/payment', authenticate, authorize('MANAGEMENT', 'ADMIN'), async (req, res) => {
    try {
        const { paymentStatus, paidAmount, dueAmount, paymentMode } = req.body;
        let finalPaymentMode = 'paid_cash';

        if (paymentStatus === 'PAID') {
            finalPaymentMode = paymentMode || 'paid_cash';
        } else if (paymentStatus === 'PENDING') {
            finalPaymentMode = 'khata_due';
        } else if (paymentStatus === 'PARTIAL') {
            finalPaymentMode = `khata_partial:paid=${paidAmount || 0}:due=${dueAmount || 0}`;
        }

        const order = await prisma.order.update({
            where: { id: req.params.id },
            data: { paymentMode: finalPaymentMode },
            include: { items: true, user: true }
        });

        const pay = parseOrderPayment(order.paymentMode, order.total);
        res.json({ success: true, order: { ...order, ...pay } });
    } catch (err) {
        console.error('Update payment error:', err);
        res.status(500).json({ error: 'Failed to update payment status' });
    }
});

// ════════════════════ CUSTOMER ACCOUNTS (MANAGEMENT / ADMIN) ════════════════════
// Get all registered customers with order counts and due balances
app.get('/api/customers', authenticate, authorize('MANAGEMENT', 'ADMIN'), async (req, res) => {
    try {
        const customers = await prisma.user.findMany({
            where: { role: 'CUSTOMER' },
            include: {
                orders: {
                    select: { total: true, paymentMode: true, status: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const formatted = customers.map(c => {
            const isPlaceholderEmail = c.email.includes('@pandeygrocery.local');
            let totalSpent = 0;
            let dueBalance = 0;

            c.orders.forEach(o => {
                const pay = parseOrderPayment(o.paymentMode, o.total);
                totalSpent += Number(o.total) || 0;
                dueBalance += Number(pay.dueAmount) || 0;
            });

            return {
                id: c.id,
                name: c.name,
                email: isPlaceholderEmail ? '' : c.email,
                phone: c.phone || '',
                orderCount: c.orders.length,
                totalSpent,
                dueBalance,
                createdAt: c.createdAt
            };
        });

        res.json({ customers: formatted });
    } catch (err) {
        console.error('Fetch customers error:', err);
        res.status(500).json({ error: 'Failed to fetch customer accounts' });
    }
});

// Manager creates a customer account (Name required, Email & Phone optional)
app.post('/api/customers', authenticate, authorize('MANAGEMENT', 'ADMIN'), async (req, res) => {
    try {
        let { name, email, phone, address } = req.body;
        if (!name || !name.trim()) return res.status(400).json({ error: 'Customer name is required' });

        name = name.trim();
        email = email ? email.trim().toLowerCase() : '';
        phone = phone ? phone.trim() : '';

        // If email provided, verify uniqueness
        if (email) {
            const existing = await prisma.user.findUnique({ where: { email } });
            if (existing) return res.status(400).json({ error: 'A customer with this email address already exists' });
        } else {
            // Generate resilient placeholder email
            const safePhone = phone ? phone.replace(/[^0-9]/g, '') : '';
            const randomSuffix = Math.floor(1000 + Math.random() * 9000);
            email = safePhone 
                ? `cust_${safePhone}_${randomSuffix}@pandeygrocery.local` 
                : `cust_${Date.now()}_${randomSuffix}@pandeygrocery.local`;
        }

        const customer = await prisma.user.create({
            data: {
                name,
                email,
                phone: phone || null,
                role: 'CUSTOMER',
                provider: 'manager_created',
                emailVerified: false,
                ...(address ? {
                    addresses: {
                        create: {
                            name,
                            line1: address,
                            city: 'Haldwani',
                            state: 'Uttarakhand',
                            pincode: '263139',
                            phone: phone || ''
                        }
                    }
                } : {})
            }
        });

        res.status(201).json({
            success: true,
            customer: {
                id: customer.id,
                name: customer.name,
                email: email.includes('@pandeygrocery.local') ? '' : customer.email,
                phone: customer.phone || '',
                orderCount: 0,
                dueBalance: 0
            }
        });
    } catch (err) {
        console.error('Create customer account error:', err);
        res.status(500).json({ error: 'Failed to create customer account' });
    }
});

// Manager updates customer account details (e.g. adding their real email so they can log in)
app.patch('/api/customers/:id', authenticate, authorize('MANAGEMENT', 'ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        let { name, email, phone } = req.body;
        
        const customer = await prisma.user.findUnique({ where: { id } });
        if (!customer) return res.status(404).json({ error: 'Customer not found' });

        const updateData = {};
        if (name && name.trim()) updateData.name = name.trim();
        if (phone !== undefined) updateData.phone = phone.trim() || null;

        if (email !== undefined && email.trim()) {
            email = email.trim().toLowerCase();
            // If updating to a real email (not placeholder), ensure no other user has it
            if (!email.includes('@pandeygrocery.local')) {
                const existing = await prisma.user.findFirst({
                    where: { 
                        email: { equals: email, mode: 'insensitive' },
                        id: { not: id }
                    }
                });
                if (existing) return res.status(400).json({ error: 'This email is already registered to another user' });
            }
            updateData.email = email;
            updateData.provider = 'manager_updated';
        }

        const updated = await prisma.user.update({
            where: { id },
            data: updateData
        });

        res.json({
            success: true,
            message: 'Customer account updated successfully',
            customer: {
                id: updated.id,
                name: updated.name,
                email: updated.email.includes('@pandeygrocery.local') ? '' : updated.email,
                phone: updated.phone || ''
            }
        });
    } catch (err) {
        console.error('Update customer error:', err);
        res.status(500).json({ error: 'Failed to update customer account' });
    }
});

// Manager creates an order on behalf of customer (In-store counter or Phone/Khata order)
app.post('/api/orders/staff-create', authenticate, authorize('MANAGEMENT', 'ADMIN'), async (req, res) => {
    try {
        const { customerId, customerName, customerPhone, customerEmail, customerAddress, items, subtotal, discount, total, paymentType, paidAmount, dueAmount, deliveryType, notes } = req.body;
        if (!items || !items.length || !total) return res.status(400).json({ error: 'Order items and total amount are required' });

        let finalPaymentMode = 'paid_cash';
        if (paymentType === 'PAID_CASH') finalPaymentMode = 'paid_cash';
        else if (paymentType === 'PAID_UPI') finalPaymentMode = 'paid_upi';
        else if (paymentType === 'KHATA_DUE') finalPaymentMode = 'khata_due';
        else if (paymentType === 'KHATA_PARTIAL') finalPaymentMode = `khata_partial:paid=${paidAmount || 0}:due=${dueAmount || 0}`;

        // Determine user to link: provided customerId, or lookup / auto-create
        let targetUserId = customerId;
        let finalCustomerName = customerName?.trim() || 'Walk-in Customer';
        let finalCustomerPhone = customerPhone?.trim() || '';
        let finalCustomerEmail = customerEmail?.trim().toLowerCase() || '';

        if (!targetUserId) {
            if (finalCustomerEmail && !finalCustomerEmail.includes('@pandeygrocery.local')) {
                const found = await prisma.user.findFirst({ where: { email: finalCustomerEmail } });
                if (found) {
                    targetUserId = found.id;
                    finalCustomerName = found.name;
                    if (!finalCustomerPhone && found.phone) finalCustomerPhone = found.phone;
                }
            }
            if (!targetUserId && finalCustomerPhone) {
                const found = await prisma.user.findFirst({ where: { phone: finalCustomerPhone, role: 'CUSTOMER' } });
                if (found) {
                    targetUserId = found.id;
                    finalCustomerName = found.name;
                    if (!finalCustomerEmail && found.email && !found.email.includes('@pandeygrocery.local')) {
                        finalCustomerEmail = found.email;
                    }
                }
            }
            if (!targetUserId && finalCustomerName && finalCustomerName.toLowerCase() !== 'walk-in customer') {
                const found = await prisma.user.findFirst({
                    where: {
                        name: { equals: finalCustomerName, mode: 'insensitive' },
                        role: 'CUSTOMER'
                    }
                });
                if (found) {
                    targetUserId = found.id;
                    if (!finalCustomerPhone && found.phone) finalCustomerPhone = found.phone;
                    if (!finalCustomerEmail && found.email && !found.email.includes('@pandeygrocery.local')) {
                        finalCustomerEmail = found.email;
                    }
                }
            }
            // Auto-create customer user profile if name is provided
            if (!targetUserId && finalCustomerName && finalCustomerName.toLowerCase() !== 'walk-in customer') {
                try {
                    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
                    const safePhone = finalCustomerPhone ? finalCustomerPhone.replace(/[^0-9]/g, '') : '';
                    const safeEmail = finalCustomerEmail || (safePhone 
                        ? `cust_${safePhone}_${randomSuffix}@pandeygrocery.local` 
                        : `cust_${Date.now()}_${randomSuffix}@pandeygrocery.local`);
                    
                    const newCust = await prisma.user.create({
                        data: {
                            name: finalCustomerName,
                            email: safeEmail,
                            phone: finalCustomerPhone || null,
                            role: 'CUSTOMER',
                            provider: 'pos_counter',
                            emailVerified: false
                        }
                    });
                    targetUserId = newCust.id;
                } catch (e) {
                    console.error('Auto-create customer error:', e);
                    targetUserId = req.user.id;
                }
            }
            if (!targetUserId) {
                targetUserId = req.user.id;
            }
        }

        const count = await prisma.order.count();
        const order = await prisma.order.create({
            data: {
                orderNumber: `ORD-${String(count + 1001).padStart(4, '0')}`,
                userId: targetUserId,
                subtotal: parseFloat(subtotal) || total,
                discount: parseFloat(discount) || 0,
                deliveryFee: 0,
                total: parseFloat(total),
                deliveryType: deliveryType || 'pickup',
                paymentMode: finalPaymentMode,
                customer: finalCustomerName,
                phone: finalCustomerPhone,
                address: customerAddress?.trim() || 'In-store Counter Sale',
                timeSlot: notes?.trim() || 'Store Direct Sale',
                status: 'delivered',
                items: {
                    create: items.map(i => ({
                        name: i.name,
                        price: parseFloat(i.price),
                        quantity: parseInt(i.quantity) || parseInt(i.qty) || 1,
                        image: i.image || null
                    }))
                }
            },
            include: { items: true }
        });

        // Deduct product stock
        for (const item of items) {
            if (item.id && !String(item.id).includes('custom')) {
                try {
                    const cleanId = String(item.id).split('-')[0];
                    await prisma.product.update({
                        where: { id: cleanId },
                        data: { stock: { decrement: parseInt(item.quantity) || parseInt(item.qty) || 1 } }
                    });
                } catch (e) {
                    console.error('Failed to deduct stock for', item.id, e);
                }
            }
        }

        // Send order creation receipt email to customer if they have a valid email
        try {
            let customerRecipientEmail = finalCustomerEmail;
            if (!customerRecipientEmail && targetUserId) {
                const u = await prisma.user.findUnique({ where: { id: targetUserId }, select: { email: true } });
                if (u?.email) customerRecipientEmail = u.email;
            }
            if (customerRecipientEmail && !customerRecipientEmail.includes('@pandeygrocery.local')) {
                const payModeLabel = finalPaymentMode === 'paid_cash' 
                    ? '💵 Cash Paid' 
                    : finalPaymentMode === 'paid_upi' 
                        ? '📱 Online UPI Paid' 
                        : '🔴 Store Khata (Due)';
                sendStaffOrderReceiptEmail(customerRecipientEmail, order, payModeLabel).catch(err => {
                    console.error('[EmailService] Staff order receipt email sending failed:', err);
                });
            }
        } catch (emailErr) {
            console.error('[EmailService] Order creation receipt check error:', emailErr);
        }

        res.status(201).json({ success: true, order });
    } catch (err) {
        console.error('Staff create order error:', err);
        res.status(500).json({ error: 'Failed to create order on behalf of customer' });
    }
});

// Helper: Process and send peaceful monthly Khata statement reminder emails
export async function processMonthlyKhataReminders() {
    const customers = await prisma.user.findMany({
        where: { role: 'CUSTOMER' },
        include: { orders: true }
    });

    const currentMonth = new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' });
    const sentList = [];

    for (const cust of customers) {
        if (!cust.email || cust.email.includes('@pandeygrocery.local')) continue;

        // Calculate total due across all orders for this customer
        const totalDue = cust.orders.reduce((sum, o) => {
            const pay = parseOrderPayment(o.paymentMode, o.total);
            return sum + (pay.dueAmount || 0);
        }, 0);

        if (totalDue > 0) {
            try {
                await sendMonthlyKhataReminderEmail(cust.email, cust.name, totalDue, currentMonth);
                sentList.push({ name: cust.name, email: cust.email, due: totalDue });
            } catch (e) {
                console.error(`[EmailService] Failed to send monthly Khata email to ${cust.email}:`, e);
            }
        }
    }

    return { count: sentList.length, sentList, month: currentMonth };
}

// Manager / Admin trigger for monthly Khata reminder emails
app.post('/api/khata/send-monthly-reminders', authenticate, authorize('MANAGEMENT', 'ADMIN'), async (req, res) => {
    try {
        const result = await processMonthlyKhataReminders();
        res.json({ success: true, message: `Sent peaceful Khata statement reminders to ${result.count} customers`, ...result });
    } catch (err) {
        console.error('Send monthly khata reminders endpoint error:', err);
        res.status(500).json({ error: 'Failed to send monthly Khata reminders' });
    }
});

app.post('/api/orders', authenticate, async (req, res) => {
    try {
        const { items, subtotal, discount, deliveryFee, total, deliveryType, paymentMode, addressId, timeSlot, customer, phone, address } = req.body;
        if (!items?.length || !total) return res.status(400).json({ error: 'Missing fields' });
        const count = await prisma.order.count();
        const order = await prisma.order.create({ 
            data: { 
                orderNumber: `ORD-${String(count + 1001).padStart(4, '0')}`, 
                userId: req.user.id, 
                subtotal: parseFloat(subtotal) || total, 
                discount: parseFloat(discount) || 0, 
                deliveryFee: parseFloat(deliveryFee) || 0, 
                total: parseFloat(total), 
                deliveryType: deliveryType || 'delivery', 
                paymentMode: paymentMode || 'cod', 
                addressId: addressId || null, 
                customer: customer || req.user.name, 
                phone: phone || '', 
                address: address || '', 
                timeSlot: timeSlot || '', 
                items: { create: items.map(i => ({ name: i.name, price: parseFloat(i.price), quantity: parseInt(i.quantity) || parseInt(i.qty) || 1, image: i.image || null })) } 
            }, 
            include: { items: true } 
        });
        
        // Deduct stock for each item & check for low inventory
        for (const item of items) {
            if (item.id && !item.id.includes('custom')) {
                try {
                    const cleanId = item.id.split('-')[0];
                    const updatedProduct = await prisma.product.update({
                        where: { id: cleanId },
                        data: { stock: { decrement: parseInt(item.quantity) || parseInt(item.qty) || 1 } }
                    });
                    if (updatedProduct && updatedProduct.stock <= 5) {
                        sendLowStockAlertEmail(updatedProduct).catch(e => console.error('Low stock email error:', e.message));
                    }
                } catch (e) {
                    console.error('Failed to deduct stock for', item.id, e);
                }
            }
        }
        
        // Send Email notifications asynchronously
        let customerEmail = req.body.email || req.user?.email;
        if (!customerEmail && req.user?.id) {
            const userDoc = await prisma.user.findUnique({ where: { id: req.user.id } });
            customerEmail = userDoc?.email;
        }
        if (customerEmail) {
            sendOrderConfirmationEmail(customerEmail, order).catch(e => console.error('Order confirmation email error:', e.message));
        }
        sendAdminNewOrderAlert(order).catch(e => console.error('Admin order alert email error:', e.message));

        res.status(201).json({ order });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to create order' }); }
});

app.patch('/api/orders/:id/status', authenticate, authorize('MANAGEMENT', 'ADMIN'), async (req, res) => {
    try {
        const { status } = req.body;
        if (!['new', 'packing', 'packed', 'dispatched', 'delivered'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
        const order = await prisma.order.update({ 
            where: { id: req.params.id }, 
            data: { status }, 
            include: { items: true, user: true } 
        });

        let recipientEmail = order.user?.email;
        if (!recipientEmail && order.userId) {
            const userDoc = await prisma.user.findUnique({ where: { id: order.userId } });
            recipientEmail = userDoc?.email;
        }
        if (recipientEmail) {
            sendOrderStatusUpdateEmail(recipientEmail, order, status).catch(e => console.error('Status update email error:', e.message));
        }

        res.json({ order });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to update status' }); }
});

// ════════════════════ DASHBOARD ════════════════════
app.get('/api/dashboard/stats', authenticate, authorize('MANAGEMENT', 'ADMIN'), async (req, res) => {
    try {
        const [orders, products, users] = await Promise.all([
            prisma.order.findMany({ select: { total: true, status: true, createdAt: true } }),
            prisma.product.findMany({ where: { isActive: true }, select: { stock: true } }),
            prisma.user.count({ where: { role: 'CUSTOMER' } }),
        ]);
        const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
        const activeOrders = orders.filter(o => ['new', 'packing', 'packed', 'dispatched'].includes(o.status)).length;
        const statusCounts = {};
        orders.forEach(o => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });
        
        // Compute real monthly revenue (last 6 months)
        const monthlyRevenue = [];
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            monthlyRevenue.push({ month: monthNames[d.getMonth()], revenue: 0 });
        }
        orders.forEach(o => {
            const d = new Date(o.createdAt);
            const m = monthNames[d.getMonth()];
            const record = monthlyRevenue.find(r => r.month === m);
            if (record && d.getFullYear() === now.getFullYear() || (d.getFullYear() === now.getFullYear() - 1 && now.getMonth() - d.getMonth() < 6)) {
                if (record) record.revenue += o.total;
            }
        });

        res.json({ stats: { totalRevenue, activeOrders, customers: users, lowStock: products.filter(p => p.stock <= 10).length, totalProducts: products.length, totalOrders: orders.length, monthlyRevenue }, statusCounts });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to fetch stats' }); }
});

app.get('/api/dashboard/top-products', authenticate, authorize('MANAGEMENT', 'ADMIN'), async (req, res) => {
    try { res.json({ products: await prisma.product.findMany({ where: { isActive: true }, orderBy: { reviews: 'desc' }, take: 5 }) }); }
    catch (err) { res.status(500).json({ error: 'Failed to fetch top products' }); }
});

// ════════════════════ UPLOAD (Vercel Blob + Base64 Fallback) ════════════════════
app.post('/api/upload', authenticate, authorize('MANAGEMENT', 'ADMIN'), express.raw({ type: 'image/*', limit: '10mb' }), async (req, res) => {
    try {
        const filename = req.query.filename || `product-${Date.now()}.jpg`;
        if (process.env.BLOB_READ_WRITE_TOKEN) {
            try {
                const blob = await put(`pandey-grocery-store/${filename}`, req.body, { access: 'public', token: process.env.BLOB_READ_WRITE_TOKEN });
                return res.json({ url: blob.url });
            } catch (blobErr) {
                console.warn('Vercel blob upload failed, using base64 fallback:', blobErr.message);
            }
        }
        
        // Base64 Data URL fallback for immediate local persistence
        const mime = req.headers['content-type'] || 'image/jpeg';
        const base64 = req.body.toString('base64');
        const dataUrl = `data:${mime};base64,${base64}`;
        res.json({ url: dataUrl });
    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ error: 'Upload failed' });
    }
});

// Upload for print services (any authenticated customer)
app.post('/api/upload/print', authenticate, express.raw({ type: ['image/*', 'application/pdf'], limit: '15mb' }), async (req, res) => {
    try {
        const filename = req.query.filename || `print-${Date.now()}.jpg`;
        if (process.env.BLOB_READ_WRITE_TOKEN) {
            try {
                const blob = await put(`pandey-grocery-store/print-jobs/${filename}`, req.body, { access: 'public', token: process.env.BLOB_READ_WRITE_TOKEN });
                return res.json({ url: blob.url });
            } catch (blobErr) {
                console.warn('Vercel blob print upload failed, using fallback:', blobErr.message);
            }
        }
        
        const mime = req.headers['content-type'] || 'image/jpeg';
        const base64 = req.body.toString('base64');
        const dataUrl = `data:${mime};base64,${base64}`;
        res.json({ url: dataUrl });
    } catch (err) {
        console.error('Print upload error:', err);
        res.status(500).json({ error: 'Upload failed' });
    }
});

// ════════════════════ PRINT JOBS ════════════════════
// Customer creates a print job
app.post('/api/print-jobs', authenticate, async (req, res) => {
    try {
        const { type, fileUrls, outputUrl, quantity, notes } = req.body;
        if (!type || !['document', 'id-card', 'passport-photo'].includes(type)) {
            return res.status(400).json({ error: 'Invalid type. Must be document, id-card, or passport-photo' });
        }
        if (!fileUrls || !fileUrls.length) {
            return res.status(400).json({ error: 'At least one file is required' });
        }
        const count = await prisma.printJob.count();
        const job = await prisma.printJob.create({
            data: {
                jobNumber: `PRT-${String(count + 1001).padStart(4, '0')}`,
                type,
                fileUrls: JSON.stringify(fileUrls),
                outputUrl: outputUrl || null,
                quantity: parseInt(quantity) || 1,
                notes: notes || null,
                userId: req.user.id,
            }
        });

        let targetEmail = req.user?.email;
        if (!targetEmail && req.user?.id) {
            const u = await prisma.user.findUnique({ where: { id: req.user.id } });
            targetEmail = u?.email;
        }
        if (targetEmail) {
            sendPrintJobEmail(targetEmail, job).catch(e => console.error('Print job email error:', e.message));
        }

        res.status(201).json({ job });
    } catch (err) {
        console.error('Create print job error:', err);
        res.status(500).json({ error: 'Failed to create print job' });
    }
});

// Customer gets their own print jobs
app.get('/api/print-jobs/my', authenticate, async (req, res) => {
    try {
        const jobs = await prisma.printJob.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ jobs: jobs.map(j => ({ ...j, fileUrls: JSON.parse(j.fileUrls || '[]') })) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch print jobs' });
    }
});

// Management/Admin gets all print jobs
app.get('/api/print-jobs', authenticate, authorize('MANAGEMENT', 'ADMIN'), async (req, res) => {
    try {
        const where = {};
        if (req.query.status && req.query.status !== 'all') where.status = req.query.status;
        const jobs = await prisma.printJob.findMany({
            where,
            include: { user: { select: { name: true, email: true, phone: true } } },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ jobs: jobs.map(j => ({ ...j, fileUrls: JSON.parse(j.fileUrls || '[]') })) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch print jobs' });
    }
});

// Management updates print job status (accept payment, mark done, etc.)
app.patch('/api/print-jobs/:id/status', authenticate, authorize('MANAGEMENT', 'ADMIN'), async (req, res) => {
    try {
        const { status, price } = req.body;
        if (!['pending', 'paid', 'printing', 'done', 'cancelled'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        const data = { status };
        if (price !== undefined) data.price = parseFloat(price);
        const job = await prisma.printJob.update({ 
            where: { id: req.params.id }, 
            data, 
            include: { user: { select: { email: true, name: true } } } 
        });

        let targetEmail = job.user?.email;
        if (!targetEmail && job.userId) {
            const u = await prisma.user.findUnique({ where: { id: job.userId } });
            targetEmail = u?.email;
        }

        if (targetEmail && (status === 'done' || status === 'paid')) {
            sendPrintJobStatusUpdateEmail(targetEmail, job, status).catch(e => console.error('Print job status email error:', e.message));
        }

        res.json({ job: { ...job, fileUrls: JSON.parse(job.fileUrls || '[]') } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update print job' });
    }
});

// Management/Admin deletes a print job
app.delete('/api/print-jobs/:id', authenticate, authorize('MANAGEMENT', 'ADMIN'), async (req, res) => {
    try {
        await prisma.printJob.delete({ where: { id: req.params.id } });
        res.json({ success: true, message: 'Print job deleted' });
    } catch (err) {
        console.error('Delete print job error:', err);
        res.status(500).json({ error: 'Failed to delete print job' });
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
            include: { items: true, user: true },
        });
        // Store assignment in memory for tracking
        deliveryLocations.set(req.params.id, {
            deliveryPersonId: dp.id,
            deliveryPersonName: dp.name,
            lat: 29.2183, lng: 79.5130, // Default: Haldwani center
            updatedAt: new Date().toISOString(),
        });

        // Email notifications for delivery assignment
        let recipientEmail = order.user?.email;
        if (!recipientEmail && order.userId) {
            const userDoc = await prisma.user.findUnique({ where: { id: order.userId } });
            recipientEmail = userDoc?.email;
        }
        if (recipientEmail) {
            sendDeliveryAssignmentCustomerEmail(recipientEmail, order, dp.name).catch(e => console.error('Delivery customer email error:', e.message));
        }
        if (dp.email) {
            sendDeliveryAssignmentRiderEmail(dp.email, order).catch(e => console.error('Delivery rider email error:', e.message));
        }

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

// ════════════════════ NOTIFICATIONS & EMAIL SERVICE ════════════════════
app.get('/api/notifications/status', authenticate, authorize('MANAGEMENT', 'ADMIN'), async (req, res) => {
    try {
        const smtpStatus = await verifySmtpConnection();
        res.json({
            smtp: smtpStatus,
            triggers: [
                { id: 'otp', name: 'OTP Login Verification', target: 'Customer on Sign In / Register', active: true, channel: 'Email (SMTP)' },
                { id: 'order_confirm', name: 'Order Confirmation Receipt', target: 'Customer on Checkout', active: true, channel: 'Email (SMTP)' },
                { id: 'admin_order_alert', name: 'New Order Admin Alert', target: 'Store Management', active: true, channel: 'Email (SMTP)' },
                { id: 'order_status', name: 'Order Status & Live Tracking', target: 'Customer on Packing/Dispatch', active: true, channel: 'Email (SMTP)' },
                { id: 'print_job', name: 'Print Hub Job Confirmation', target: 'Customer on File Upload', active: true, channel: 'Email (SMTP)' },
                { id: 'welcome', name: 'Welcome & Onboarding', target: 'New Customer Account', active: true, channel: 'Email (SMTP)' },
            ]
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to check notification status' });
    }
});

app.post('/api/notifications/test-email', authenticate, authorize('MANAGEMENT', 'ADMIN'), async (req, res) => {
    try {
        const { to, template } = req.body;
        const targetEmail = to || req.user.email;
        if (!targetEmail) return res.status(400).json({ error: 'Recipient email required' });

        let result;
        if (template === 'order_confirm') {
            result = await sendOrderConfirmationEmail(targetEmail, {
                orderNumber: 'ORD-TEST-1001',
                total: 389,
                subtotal: 389,
                deliveryType: 'delivery',
                customer: req.user.name || 'Store Test Customer',
                address: 'Near Durga Mandir, Kusumkhera, Haldwani, Uttarakhand',
                items: [
                    { name: 'Fresh Aashirvaad Shudh Chakki Atta (5kg)', quantity: 1, price: 210 },
                    { name: 'Tata Salt Vaccum Evaporated (1kg)', quantity: 1, price: 28 },
                    { name: 'Classmate Spiral Ruled Notebook (160p)', quantity: 2, price: 65 }
                ]
            });
        } else if (template === 'order_status') {
            result = await sendOrderStatusUpdateEmail(targetEmail, {
                orderNumber: 'ORD-TEST-1001',
                customer: req.user.name || 'Store Test Customer',
                total: 389
            }, 'dispatched');
        } else if (template === 'welcome') {
            result = await sendWelcomeEmail(targetEmail, req.user.name || 'Valued Customer');
        } else if (template === 'print_job') {
            result = await sendPrintJobEmail(targetEmail, {
                jobNumber: 'PRT-TEST-501',
                type: 'id-card',
                quantity: 2,
                status: 'Processing 300 DPI'
            });
        } else {
            result = await sendBroadcastNotificationEmail({
                to: targetEmail,
                subject: '🔔 Pandey Grocery Store — Email Service Live Test',
                headline: 'Email Notification Service Active! 🛒',
                message: 'Hello! This is a live test notification from your Pandey Grocery Store automated email system. All order confirmations, real-time delivery status alerts, and print confirmations are configured and operating smoothly across Haldwani.',
                buttonText: 'Visit Store Online',
                buttonUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://pandeygrocery-store.vercel.app'
            });
        }

        res.json({ success: result.success, messageId: result.messageId, reason: result.reason || result.error, targetEmail });
    } catch (err) {
        console.error('Test email error:', err);
        res.status(500).json({ error: err.message || 'Failed to send test email' });
    }
});

app.post('/api/notifications/broadcast-email', authenticate, authorize('ADMIN'), async (req, res) => {
    try {
        const { audience, targetEmail, subject, headline, message, buttonText, buttonUrl } = req.body;
        if (!subject || !message) return res.status(400).json({ error: 'Subject and message are required' });

        let recipientEmails = [];
        if (audience === 'single' && targetEmail) {
            recipientEmails = [targetEmail];
        } else {
            const users = await prisma.user.findMany({
                where: { email: { not: null } },
                select: { email: true }
            });
            recipientEmails = users.map(u => u.email).filter(Boolean);
        }

        if (!recipientEmails.length) return res.status(400).json({ error: 'No recipient emails found' });

        let sentCount = 0;
        let failCount = 0;

        for (const email of recipientEmails) {
            try {
                const mailRes = await sendBroadcastNotificationEmail({
                    to: email,
                    subject,
                    headline,
                    message,
                    buttonText,
                    buttonUrl: buttonUrl || 'https://pandeygrocery-store.vercel.app'
                });
                if (mailRes.success) sentCount++;
                else failCount++;
            } catch {
                failCount++;
            }
        }

        res.json({ success: true, sentCount, failCount, totalRecipients: recipientEmails.length });
    } catch (err) {
        console.error('Broadcast email error:', err);
        res.status(500).json({ error: 'Failed to send broadcast email' });
    }
});

// ── Local Dev Server Listener (Port 5001 for Vite proxy) ──
if (!process.env.VERCEL) {
    const PORT = process.env.PORT || 5001;
    app.listen(PORT, () => {
        console.log(`🚀 Pandey Grocery API running locally on http://localhost:${PORT}`);
    });
}

// ── Export for Vercel ──
export default app;
