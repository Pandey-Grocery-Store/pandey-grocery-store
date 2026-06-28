import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
    await prisma.product.updateMany({
        where: { name: 'Desi Ghee' },
        data: { image: 'https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=400' }
    });
    console.log("Updated Desi Ghee with working image.");
}
run().finally(() => prisma.$disconnect());
