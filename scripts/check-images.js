import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkImages() {
    const products = await prisma.product.findMany();
    console.log(`Checking ${products.length} product images...`);
    
    let broken = [];
    for (const p of products) {
        try {
            const res = await fetch(p.image, { method: 'HEAD' });
            if (!res.ok) {
                broken.push({ id: p.id, name: p.name, image: p.image });
            }
        } catch (e) {
            broken.push({ id: p.id, name: p.name, image: p.image });
        }
    }
    
    console.log(`Found ${broken.length} broken images.`);
    for (const b of broken) {
        console.log(`- ${b.name}: ${b.image}`);
    }
}

checkImages().finally(() => prisma.$disconnect());
