import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Pandey Grocery Store database...\n');

    // ── Users ──
    const passwordHash = await bcrypt.hash('password123', 10);

    const customer = await prisma.user.upsert({
        where: { email: 'customer@pandeygrocery.com' },
        update: {},
        create: { name: 'Customer', email: 'customer@pandeygrocery.com', password: passwordHash, role: 'CUSTOMER', emailVerified: true },
    });
    const staff = await prisma.user.upsert({
        where: { email: 'staff@pandeygrocery.com' },
        update: {},
        create: { name: 'Staff Member', email: 'staff@pandeygrocery.com', password: passwordHash, role: 'STAFF', emailVerified: true },
    });
    const admin = await prisma.user.upsert({
        where: { email: 'grocerypandey.store@gmail.com' },
        update: {},
        create: { name: 'Admin', email: 'grocerypandey.store@gmail.com', password: passwordHash, role: 'ADMIN', emailVerified: true },
    });
    console.log('✅ Users seeded (customer, staff, admin) — password: password123');

    // ── Categories ──
    const categories = [
        { slug: 'groceries', name: 'Groceries', nameHi: 'किराना', icon: '🛒', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400', subcategories: JSON.stringify([{ id: 'rice-flour', name: 'Rice & Flour', nameHi: 'चावल और आटा' }, { id: 'pulses', name: 'Pulses & Lentils', nameHi: 'दालें' }, { id: 'oils', name: 'Cooking Oils', nameHi: 'खाना पकाने का तेल' }, { id: 'spices', name: 'Spices & Masala', nameHi: 'मसाले' }, { id: 'snacks', name: 'Snacks & Namkeen', nameHi: 'नमकीन और स्नैक्स' }, { id: 'dairy', name: 'Dairy Products', nameHi: 'डेयरी उत्पाद' }, { id: 'beverages', name: 'Beverages', nameHi: 'पेय पदार्थ' }, { id: 'household', name: 'Household Essentials', nameHi: 'घरेलू ज़रूरतें' }]) },
        { slug: 'utensils', name: 'Kitchen Utensils', nameHi: 'बर्तन', icon: '🍳', image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400', subcategories: JSON.stringify([{ id: 'steel', name: 'Steel Utensils', nameHi: 'स्टील के बर्तन' }, { id: 'cookware', name: 'Cookware', nameHi: 'कुकवेयर' }, { id: 'storage', name: 'Storage Containers', nameHi: 'स्टोरेज कंटेनर' }, { id: 'appliances', name: 'Small Appliances', nameHi: 'छोटे उपकरण' }]) },
    ];
    for (const cat of categories) {
        await prisma.category.upsert({ where: { slug: cat.slug }, update: cat, create: cat });
    }
    console.log('✅ Categories seeded (groceries, utensils)');

    // ── Products ──
    await prisma.product.deleteMany();
    const products = [
        { name: 'Basmati Rice - Premium', nameHi: 'बासमती चावल', category: 'groceries', subcategory: 'rice-flour', price: 185, mrp: 220, unit: '1 kg', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400', stock: 120, description: 'Aged long-grain basmati rice, aromatic and fluffy. Perfect for biryani and pulao.', brand: 'India Gate', rating: 4.5, reviews: 234 },
        { name: 'Whole Wheat Flour (Atta)', nameHi: 'गेहूं का आटा', category: 'groceries', subcategory: 'rice-flour', price: 55, mrp: 65, unit: '1 kg', image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400', stock: 200, description: 'Fresh stone-ground whole wheat atta for soft rotis.', brand: 'Aashirvaad', rating: 4.7, reviews: 567 },
        { name: 'Sooji (Semolina)', nameHi: 'सूजी', category: 'groceries', subcategory: 'rice-flour', price: 42, mrp: 50, unit: '500 g', image: 'https://images.unsplash.com/photo-1603569283847-aa295f0d016a?w=400', stock: 85, description: 'Fine quality sooji for halwa, upma and dosa.', brand: 'Rajdhani', rating: 4.3, reviews: 89 },
        { name: 'Poha (Flattened Rice)', nameHi: 'पोहा', category: 'groceries', subcategory: 'rice-flour', price: 38, mrp: 45, unit: '500 g', image: 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=400', stock: 60, description: 'Thin poha flakes, perfect for quick breakfast.', brand: 'Local', rating: 4.1, reviews: 45 },
        { name: 'Toor Dal (Arhar)', nameHi: 'तूर दाल', category: 'groceries', subcategory: 'pulses', price: 145, mrp: 170, unit: '1 kg', image: 'https://images.unsplash.com/photo-1585996746158-b4b65aa8bb41?w=400', stock: 150, description: 'Premium quality toor dal, cooks soft and quick.', brand: 'Tata Sampann', rating: 4.6, reviews: 312 },
        { name: 'Moong Dal (Yellow)', nameHi: 'मूंग दाल', category: 'groceries', subcategory: 'pulses', price: 130, mrp: 155, unit: '1 kg', image: 'https://images.unsplash.com/photo-1613743983303-b3e89f8a2b80?w=400', stock: 95, description: 'Split yellow moong dal, light and easy to digest.', brand: 'Tata Sampann', rating: 4.4, reviews: 198 },
        { name: 'Chana Dal', nameHi: 'चना दाल', category: 'groceries', subcategory: 'pulses', price: 95, mrp: 110, unit: '1 kg', image: 'https://images.unsplash.com/photo-1612257999756-bde18e699fbc?w=400', stock: 110, description: 'Split bengal gram for dal and snacks.', brand: 'Rajdhani', rating: 4.2, reviews: 76 },
        { name: 'Rajma (Red Kidney Beans)', nameHi: 'राजमा', category: 'groceries', subcategory: 'pulses', price: 160, mrp: 190, unit: '1 kg', image: 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=400', stock: 45, description: 'Premium Jammu rajma, perfect for rajma chawal.', brand: 'Rajdhani', rating: 4.8, reviews: 410 },
        { name: 'Mustard Oil', nameHi: 'सरसों का तेल', category: 'groceries', subcategory: 'oils', price: 180, mrp: 210, unit: '1 L', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400', stock: 80, description: 'Pure kachi ghani mustard oil with rich aroma.', brand: 'Fortune', rating: 4.5, reviews: 189 },
        { name: 'Refined Sunflower Oil', nameHi: 'सूरजमुखी तेल', category: 'groceries', subcategory: 'oils', price: 155, mrp: 175, unit: '1 L', image: 'https://images.unsplash.com/photo-1620706857370-e1b9770e8bb1?w=400', stock: 65, description: 'Light and heart-healthy refined sunflower oil.', brand: 'Fortune', rating: 4.3, reviews: 134 },
        { name: 'Desi Ghee', nameHi: 'देसी घी', category: 'groceries', subcategory: 'oils', price: 550, mrp: 620, unit: '500 ml', image: 'https://images.unsplash.com/photo-1631963982627-83e55e7ee510?w=400', stock: 40, description: 'Pure cow ghee, rich aroma, perfect for dal tadka and sweets.', brand: 'Amul', rating: 4.9, reviews: 678 },
        { name: 'Haldi (Turmeric Powder)', nameHi: 'हल्दी पाउडर', category: 'groceries', subcategory: 'spices', price: 45, mrp: 55, unit: '100 g', image: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400', stock: 200, description: 'Pure turmeric powder with high curcumin content.', brand: 'MDH', rating: 4.6, reviews: 321 },
        { name: 'Red Chilli Powder', nameHi: 'लाल मिर्च पाउडर', category: 'groceries', subcategory: 'spices', price: 65, mrp: 80, unit: '100 g', image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400', stock: 180, description: 'Premium Kashmiri red chilli powder for vibrant color.', brand: 'MDH', rating: 4.5, reviews: 256 },
        { name: 'Garam Masala', nameHi: 'गरम मसाला', category: 'groceries', subcategory: 'spices', price: 85, mrp: 100, unit: '100 g', image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400', stock: 150, description: 'Aromatic blend of whole spices, freshly ground.', brand: 'Everest', rating: 4.7, reviews: 445 },
        { name: 'Jeera (Cumin Seeds)', nameHi: 'जीरा', category: 'groceries', subcategory: 'spices', price: 72, mrp: 85, unit: '100 g', image: 'https://images.unsplash.com/photo-1599909533601-aa0e56090b3a?w=400', stock: 130, description: 'Whole cumin seeds for tempering and spice blends.', brand: 'Tata Sampann', rating: 4.4, reviews: 167 },
        { name: 'Aloo Bhujia', nameHi: 'आलू भुजिया', category: 'groceries', subcategory: 'snacks', price: 60, mrp: 70, unit: '200 g', image: 'https://images.unsplash.com/photo-1599490659213-e2b9527f3b40?w=400', stock: 90, description: 'Crispy and spicy aloo bhujia, perfect tea-time snack.', brand: "Haldiram's", rating: 4.6, reviews: 523 },
        { name: 'Namkeen Mixture', nameHi: 'नमकीन मिक्सचर', category: 'groceries', subcategory: 'snacks', price: 55, mrp: 65, unit: '200 g', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400', stock: 75, description: 'Classic Indian mixture with sev, peanuts and flakes.', brand: "Haldiram's", rating: 4.3, reviews: 234 },
        { name: 'Monaco Biscuits', nameHi: 'मोनैको बिस्कुट', category: 'groceries', subcategory: 'snacks', price: 30, mrp: 35, unit: '200 g', image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400', stock: 160, description: 'Salted crispy biscuits, perfect with chai.', brand: 'Parle', rating: 4.2, reviews: 189 },
        { name: 'Amul Butter', nameHi: 'अमूल मक्खन', category: 'groceries', subcategory: 'dairy', price: 56, mrp: 58, unit: '100 g', image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400', stock: 50, description: 'Utterly butterly delicious pasteurised butter.', brand: 'Amul', rating: 4.8, reviews: 890 },
        { name: 'Paneer (Fresh)', nameHi: 'पनीर', category: 'groceries', subcategory: 'dairy', price: 90, mrp: 100, unit: '200 g', image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400', stock: 30, description: 'Fresh cottage cheese, soft and creamy.', brand: 'Amul', rating: 4.5, reviews: 345 },
        { name: 'Milk Powder', nameHi: 'दूध पाउडर', category: 'groceries', subcategory: 'dairy', price: 220, mrp: 260, unit: '500 g', image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400', stock: 35, description: 'Instant milk powder for tea, sweets and cooking.', brand: 'Amul', rating: 4.3, reviews: 112 },
        { name: 'Taj Mahal Tea', nameHi: 'ताज महल चाय', category: 'groceries', subcategory: 'beverages', price: 145, mrp: 170, unit: '250 g', image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400', stock: 100, description: 'Premium long leaf tea with rich golden color.', brand: 'Brooke Bond', rating: 4.7, reviews: 567 },
        { name: 'Nescafe Classic Coffee', nameHi: 'नेस्कैफे कॉफी', category: 'groceries', subcategory: 'beverages', price: 195, mrp: 225, unit: '100 g', image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400', stock: 55, description: 'Instant coffee with rich aroma and smooth taste.', brand: 'Nescafe', rating: 4.6, reviews: 432 },
        { name: 'Bournvita Health Drink', nameHi: 'बॉर्नविटा', category: 'groceries', subcategory: 'beverages', price: 210, mrp: 245, unit: '500 g', image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400', stock: 70, description: 'Chocolate flavoured health drink for kids and adults.', brand: 'Cadbury', rating: 4.4, reviews: 290 },
        { name: 'Vim Dishwash Bar', nameHi: 'विम बार', category: 'groceries', subcategory: 'household', price: 30, mrp: 35, unit: '300 g', image: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=400', stock: 180, description: 'Lemon power dishwash bar for sparkling clean utensils.', brand: 'Vim', rating: 4.3, reviews: 234 },
        { name: 'Surf Excel Detergent', nameHi: 'सर्फ एक्सेल', category: 'groceries', subcategory: 'household', price: 120, mrp: 140, unit: '1 kg', image: 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=400', stock: 95, description: 'Easy wash detergent powder for tough stain removal.', brand: 'Surf Excel', rating: 4.5, reviews: 378 },
        { name: 'Lizol Floor Cleaner', nameHi: 'लिज़ॉल', category: 'groceries', subcategory: 'household', price: 110, mrp: 130, unit: '500 ml', image: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=400', stock: 60, description: 'Citrus disinfectant floor cleaner, kills 99.9% germs.', brand: 'Lizol', rating: 4.4, reviews: 198 },
        { name: 'Stainless Steel Thali Set', nameHi: 'स्टील थाली सेट', category: 'utensils', subcategory: 'steel', price: 450, mrp: 599, unit: '6 Pcs', image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=400', stock: 25, description: 'Premium stainless steel dinner set with thali, bowls, and glass.', brand: 'Classic Essentials', rating: 4.5, reviews: 156 },
        { name: 'Steel Water Bottle', nameHi: 'स्टील बोतल', category: 'utensils', subcategory: 'steel', price: 350, mrp: 450, unit: '1 L', image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400', stock: 40, description: 'Double-wall insulated steel bottle, keeps water cold 24 hrs.', brand: 'Milton', rating: 4.7, reviews: 567 },
        { name: 'Steel Serving Spoon Set', nameHi: 'स्टील सर्विंग चम्मच', category: 'utensils', subcategory: 'steel', price: 180, mrp: 250, unit: '4 Pcs', image: 'https://images.unsplash.com/photo-1593618998160-e34014e67546?w=400', stock: 55, description: 'Elegant serving spoon set for daily use and occasions.', brand: 'Classic Essentials', rating: 4.3, reviews: 89 },
        { name: 'Non-Stick Tawa', nameHi: 'नॉन-स्टिक तवा', category: 'utensils', subcategory: 'cookware', price: 599, mrp: 799, unit: '28 cm', image: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=400', stock: 18, description: 'Heavy-gauge aluminium non-stick tawa for perfect rotis and dosas.', brand: 'Prestige', rating: 4.6, reviews: 345 },
        { name: 'Pressure Cooker 3L', nameHi: 'प्रेशर कुकर', category: 'utensils', subcategory: 'cookware', price: 1250, mrp: 1599, unit: '3 L', image: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=400', stock: 15, description: 'Aluminium body pressure cooker with safety valve and gasket.', brand: 'Prestige', rating: 4.8, reviews: 890 },
        { name: 'Kadhai (Non-Stick)', nameHi: 'कड़ाही', category: 'utensils', subcategory: 'cookware', price: 750, mrp: 999, unit: '24 cm', image: 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?w=400', stock: 20, description: 'Deep non-stick kadhai with glass lid for Indian cooking.', brand: 'Hawkins', rating: 4.5, reviews: 234 },
        { name: 'Airtight Container Set', nameHi: 'एयरटाइट कंटेनर सेट', category: 'utensils', subcategory: 'storage', price: 399, mrp: 550, unit: '5 Pcs', image: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400', stock: 30, description: 'BPA-free airtight containers for storing pulses, rice and spices.', brand: 'Cello', rating: 4.4, reviews: 178 },
        { name: 'Masala Box (Spice Container)', nameHi: 'मसाला डब्बा', category: 'utensils', subcategory: 'storage', price: 299, mrp: 399, unit: '7 compartments', image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400', stock: 35, description: 'Stainless steel masala dabba with 7 bowls and spoon.', brand: 'Classic Essentials', rating: 4.6, reviews: 267 },
        { name: 'Mixer Grinder 500W', nameHi: 'मिक्सर ग्राइंडर', category: 'utensils', subcategory: 'appliances', price: 2499, mrp: 3299, unit: '3 Jars', image: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=400', stock: 10, description: 'Powerful 500W mixer grinder with 3 stainless steel jars.', brand: 'Bajaj', rating: 4.5, reviews: 456 },
        { name: 'Electric Kettle 1.5L', nameHi: 'इलेक्ट्रिक केटल', category: 'utensils', subcategory: 'appliances', price: 699, mrp: 899, unit: '1.5 L', image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400', stock: 22, description: 'Fast-boil electric kettle with auto shut-off and cool-touch handle.', brand: 'Pigeon', rating: 4.3, reviews: 189 },
        { name: 'Hand Blender', nameHi: 'हैंड ब्लेंडर', category: 'utensils', subcategory: 'appliances', price: 899, mrp: 1199, unit: '1 Pc', image: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=400', stock: 14, description: 'Compact hand blender for smoothies, soups and chutneys.', brand: 'Philips', rating: 4.4, reviews: 234 },
        { name: 'Gas Lighter (Auto)', nameHi: 'गैस लाइटर', category: 'utensils', subcategory: 'appliances', price: 149, mrp: 199, unit: '1 Pc', image: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=400', stock: 50, description: 'Long-reach automatic gas lighter with refillable body.', brand: 'Crystal', rating: 4.1, reviews: 98 },
        { name: 'Digital Kitchen Scale', nameHi: 'किचन तराज़ू', category: 'utensils', subcategory: 'appliances', price: 549, mrp: 699, unit: '1 Pc', image: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=400', stock: 18, description: 'High-precision digital scale (1g to 10kg) with tare function.', brand: 'HealthSense', rating: 4.5, reviews: 312 },
    ];
    for (const p of products) {
        await prisma.product.create({ data: p });
    }
    console.log(`✅ ${products.length} products seeded`);

    // ── Orders ──
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    const ordersData = [
        { orderNumber: 'ORD-1001', customer: 'Ravi Sharma', phone: '98765XXXXX', total: 605, subtotal: 605, status: 'delivered', paymentMode: 'UPI', address: '12, Shanti Nagar, Near Temple', deliveryType: 'delivery', timeSlot: '10:00 AM - 12:00 PM', items: [{ name: 'Basmati Rice', quantity: 2, price: 185 }, { name: 'Toor Dal', quantity: 1, price: 145 }, { name: 'Haldi Powder', quantity: 2, price: 45 }] },
        { orderNumber: 'ORD-1002', customer: 'Priya Verma', phone: '87654XXXXX', total: 898, subtotal: 898, status: 'packed', paymentMode: 'Card', address: '45, MG Road, Block B', deliveryType: 'delivery', timeSlot: '2:00 PM - 4:00 PM', items: [{ name: 'Non-Stick Tawa', quantity: 1, price: 599 }, { name: 'Masala Box', quantity: 1, price: 299 }] },
        { orderNumber: 'ORD-1003', customer: 'Amit Patel', phone: '76543XXXXX', total: 890, subtotal: 890, status: 'packing', paymentMode: 'COD', address: '78, Civil Lines', deliveryType: 'delivery', timeSlot: '4:00 PM - 6:00 PM', items: [{ name: 'Wheat Flour', quantity: 5, price: 55 }, { name: 'Mustard Oil', quantity: 2, price: 180 }, { name: 'Garam Masala', quantity: 3, price: 85 }] },
        { orderNumber: 'ORD-1004', customer: 'Sunita Devi', phone: '65432XXXXX', total: 458, subtotal: 458, status: 'new', paymentMode: 'UPI', address: '', deliveryType: 'pickup', timeSlot: '11:00 AM', items: [{ name: 'Taj Mahal Tea', quantity: 2, price: 145 }, { name: 'Amul Butter', quantity: 3, price: 56 }] },
        { orderNumber: 'ORD-1005', customer: 'Vikram Singh', phone: '54321XXXXX', total: 1430, subtotal: 1430, status: 'dispatched', paymentMode: 'Card', address: '23, Rajpur Road', deliveryType: 'delivery', timeSlot: '10:00 AM - 12:00 PM', items: [{ name: 'Pressure Cooker 3L', quantity: 1, price: 1250 }, { name: 'Serving Spoon Set', quantity: 1, price: 180 }] },
        { orderNumber: 'ORD-1006', customer: 'Meena Kumari', phone: '43210XXXXX', total: 2499, subtotal: 2499, status: 'delivered', paymentMode: 'UPI', address: '56, Nehru Colony', deliveryType: 'delivery', timeSlot: '2:00 PM - 4:00 PM', items: [{ name: 'Mixer Grinder', quantity: 1, price: 2499 }] },
        { orderNumber: 'ORD-1007', customer: 'Rahul Gupta', phone: '32109XXXXX', total: 410, subtotal: 410, status: 'new', paymentMode: 'COD', address: '89, Gandhi Nagar', deliveryType: 'delivery', timeSlot: '6:00 PM - 8:00 PM', items: [{ name: 'Aloo Bhujia', quantity: 3, price: 60 }, { name: 'Namkeen Mix', quantity: 2, price: 55 }, { name: 'Monaco', quantity: 4, price: 30 }] },
        { orderNumber: 'ORD-1008', customer: 'Anjali Mishra', phone: '21098XXXXX', total: 1299, subtotal: 1299, status: 'delivered', paymentMode: 'Wallet', address: '34, Sadar Bazar', deliveryType: 'delivery', timeSlot: '10:00 AM - 12:00 PM', items: [{ name: 'Container Set', quantity: 1, price: 399 }, { name: 'Thali Set', quantity: 2, price: 450 }] },
        { orderNumber: 'ORD-1009', customer: 'Deepak Kumar', phone: '10987XXXXX', total: 515, subtotal: 515, status: 'packing', paymentMode: 'UPI', address: '67, Lal Bagh', deliveryType: 'delivery', timeSlot: '12:00 PM - 2:00 PM', items: [{ name: 'Moong Dal', quantity: 2, price: 130 }, { name: 'Chana Dal', quantity: 1, price: 95 }, { name: 'Rajma', quantity: 1, price: 160 }] },
        { orderNumber: 'ORD-1010', customer: 'Pooja Yadav', phone: '09876XXXXX', total: 585, subtotal: 585, status: 'new', paymentMode: 'COD', address: '', deliveryType: 'pickup', timeSlot: '3:00 PM', items: [{ name: 'Nescafe Coffee', quantity: 1, price: 195 }, { name: 'Bournvita', quantity: 1, price: 210 }, { name: 'Paneer', quantity: 2, price: 90 }] },
        { orderNumber: 'ORD-1011', customer: 'Manish Tiwari', phone: '98760XXXXX', total: 699, subtotal: 699, status: 'delivered', paymentMode: 'UPI', address: '12, Station Road', deliveryType: 'delivery', timeSlot: '10:00 AM - 12:00 PM', items: [{ name: 'Electric Kettle', quantity: 1, price: 699 }] },
        { orderNumber: 'ORD-1012', customer: 'Kavita Joshi', phone: '87650XXXXX', total: 500, subtotal: 500, status: 'delivered', paymentMode: 'Card', address: '90, Kamla Nagar', deliveryType: 'delivery', timeSlot: '4:00 PM - 6:00 PM', items: [{ name: 'Vim Bar', quantity: 5, price: 30 }, { name: 'Surf Excel', quantity: 2, price: 120 }, { name: 'Lizol', quantity: 1, price: 110 }] },
    ];

    for (const o of ordersData) {
        const { items, ...orderData } = o;
        await prisma.order.create({
            data: {
                ...orderData,
                userId: customer.id,
                items: { create: items },
            },
        });
    }
    console.log(`✅ ${ordersData.length} orders seeded`);
    console.log('\n🎉 Database seeded successfully!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
