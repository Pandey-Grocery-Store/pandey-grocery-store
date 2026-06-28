import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function seed() {
    try {
        console.log("Creating Stationery category...");
        await prisma.category.upsert({
            where: { slug: 'stationery' },
            update: {},
            create: {
                slug: 'stationery',
                name: 'Stationery & Office',
                nameHi: 'स्टेशनरी',
                icon: '📚',
                image: 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=1200',
                subcategories: JSON.stringify([{id: 'notebooks', name: 'Notebooks'}, {id: 'pens-pencils', name: 'Pens & Pencils'}, {id: 'art-supplies', name: 'Art Supplies'}])
            }
        });

        console.log("Creating Household category...");
        await prisma.category.upsert({
            where: { slug: 'household-personal' },
            update: {},
            create: {
                slug: 'household-personal',
                name: 'Household & Care',
                nameHi: 'घरेलू सामान',
                icon: '🧼',
                image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200',
                subcategories: JSON.stringify([{id: 'cleaning', name: 'Cleaning'}, {id: 'personal-care', name: 'Personal Care'}, {id: 'detergents', name: 'Detergents'}])
            }
        });

        console.log("Adding stationery products...");
        const stationeryProducts = [
            { name: 'Classmate Notebook', nameHi: 'नोटबुक', brand: 'Classmate', category: 'stationery', subcategory: 'notebooks', price: 45, mrp: 50, unit: '1 pc', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/A_blank_white_notebook.jpg/500px-A_blank_white_notebook.jpg', stock: 100, description: 'High quality long notebook with smooth pages.', rating: 4.8, reviews: 320 },
            { name: 'Reynolds Ball Pens', nameHi: 'पेन', brand: 'Reynolds', category: 'stationery', subcategory: 'pens-pencils', price: 45, mrp: 50, unit: 'Pack of 5', image: 'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=400', stock: 150, description: 'Smooth writing blue ball pens.', rating: 4.7, reviews: 410 },
            { name: 'A4 Printing Paper', nameHi: 'ए4 पेपर', brand: 'JK Copier', category: 'stationery', subcategory: 'notebooks', price: 290, mrp: 350, unit: '500 Sheets', image: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=400', stock: 50, description: 'Premium quality A4 size white paper for printing and copying.', rating: 4.9, reviews: 500 },
            { name: 'Camel Water Colors', nameHi: 'रंग', brand: 'Camel', category: 'stationery', subcategory: 'art-supplies', price: 90, mrp: 100, unit: '12 Shades', image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400', stock: 80, description: 'Vibrant water colors for students and artists.', rating: 4.5, reviews: 150 },
            { name: 'Classmate Geometry Box', nameHi: 'ज्योमेट्री बॉक्स', brand: 'Classmate', category: 'stationery', subcategory: 'pens-pencils', price: 120, mrp: 150, unit: '1 Box', image: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400', stock: 40, description: 'Mathematical drawing instruments.', rating: 4.6, reviews: 200 },
        ];

        console.log("Adding household products...");
        const householdProducts = [
            { name: 'Surf Excel Matic Liquid', nameHi: 'सर्फ एक्सेल', brand: 'Surf Excel', category: 'household-personal', subcategory: 'detergents', price: 220, mrp: 250, unit: '1 L', image: 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=400', stock: 120, description: 'Front load liquid detergent for tough stain removal.', rating: 4.9, reviews: 890 },
            { name: 'Dettol Original Soap', nameHi: 'डेटॉल साबुन', brand: 'Dettol', category: 'household-personal', subcategory: 'personal-care', price: 135, mrp: 150, unit: '4 x 125g', image: 'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=400', stock: 200, description: 'Germ protection bathing soap.', rating: 4.8, reviews: 1100 },
            { name: 'Harpic Power Plus', nameHi: 'हार्पिक', brand: 'Harpic', category: 'household-personal', subcategory: 'cleaning', price: 175, mrp: 199, unit: '1 L', image: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=400', stock: 90, description: 'Toilet cleaner for 10x better cleaning.', rating: 4.7, reviews: 750 },
            { name: 'Colgate Strong Teeth', nameHi: 'कोलगेट', brand: 'Colgate', category: 'household-personal', subcategory: 'personal-care', price: 110, mrp: 120, unit: '200 g', image: 'https://images.unsplash.com/photo-1559598467-f8b76c8155d0?w=400', stock: 250, description: 'Anti-cavity toothpaste for strong teeth.', rating: 4.8, reviews: 1500 },
            { name: 'Parachute Coconut Oil', nameHi: 'नारियल तेल', brand: 'Parachute', category: 'household-personal', subcategory: 'personal-care', price: 190, mrp: 210, unit: '500 ml', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/A_bottle_of_Parachute_coconut_oil.jpg/500px-A_bottle_of_Parachute_coconut_oil.jpg', stock: 150, description: '100% pure coconut hair oil.', rating: 4.9, reviews: 980 }
        ];

        for (const p of [...stationeryProducts, ...householdProducts]) {
            await prisma.product.upsert({
                where: { name: p.name }, // Requires name to be unique or use createMany, let's just create if not exists
                update: {},
                create: p
            }).catch(async (e) => {
                // If upsert fails because name isn't unique indexed, we can just create
                const existing = await prisma.product.findFirst({where: {name: p.name}});
                if (!existing) await prisma.product.create({data: p});
            });
        }
        
        console.log("Database seeded successfully with new categories and products!");
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

seed();
