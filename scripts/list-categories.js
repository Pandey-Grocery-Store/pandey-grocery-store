import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function listCategories() {
    const categories = await prisma.category.findMany();
    console.log(categories.map(c => c.slug));
}
listCategories().finally(() => prisma.$disconnect());
