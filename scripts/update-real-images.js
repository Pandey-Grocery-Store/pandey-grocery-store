import google from 'googlethis';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const queries = {
    'Classmate Notebook': 'Classmate notebook front cover official image',
    'Reynolds Ball Pens': 'Reynolds blue ball pen pack official image',
    'A4 Printing Paper': 'JK Copier A4 Paper 500 sheets pack official image',
    'Camel Water Colors': 'Camel water colors 12 shades official box',
    'Classmate Geometry Box': 'Classmate Asteroid geometry box open',
    'Surf Excel Matic Liquid': 'Surf Excel Matic liquid bottle front',
    'Dettol Original Soap': 'Dettol original soap bar pack front',
    'Harpic Power Plus': 'Harpic Power Plus toilet cleaner bottle',
    'Colgate Strong Teeth': 'Colgate strong teeth toothpaste box',
    'Parachute Coconut Oil': 'Parachute coconut oil blue bottle 500ml',
};

async function getImageUrl(query) {
    try {
        const images = await google.image(query, { safe: false });
        if (images && images.length > 0) {
            // Find an image from a reputable domain if possible, or just the first high-res one
            const bestImage = images.find(img => img.width > 200 && img.url.startsWith('http')) || images[0];
            return bestImage.url;
        }
    } catch (e) {
        console.error("Error fetching", query, e.message);
    }
    return null;
}

async function run() {
    console.log("Updating product images...");
    for (const [name, query] of Object.entries(queries)) {
        const url = await getImageUrl(query);
        if (url) {
            console.log(`[${name}] -> ${url}`);
            await prisma.product.updateMany({
                where: { name: name },
                data: { image: url }
            });
        }
    }
    
    console.log("Updating category images...");
    const statImg = await getImageUrl("Stationery items flatlay aesthetic high quality background");
    if (statImg) {
        await prisma.category.updateMany({
            where: { slug: 'stationery' },
            data: { image: statImg }
        });
        console.log(`[Stationery] -> ${statImg}`);
    }
    
    const houseImg = await getImageUrl("Household cleaning products flatlay aesthetic high quality background");
    if (houseImg) {
        await prisma.category.updateMany({
            where: { slug: 'household-personal' },
            data: { image: houseImg }
        });
        console.log(`[Household] -> ${houseImg}`);
    }
    
    console.log("Done updating images!");
    await prisma.$disconnect();
}
run();
