const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const product = await prisma.product.findFirst({
        where: { name: { contains: 'A4 Printing Paper' } }
    });
    
    if (product) {
        console.log('Found product:', product.name);
        const res = await prisma.product.update({
            where: { id: product.id },
            data: { image: 'https://m.media-amazon.com/images/I/61r5aP0gN-L._AC_UF1000,1000_QL80_.jpg' }
        });
        console.log('Updated:', res.name, res.image);
    } else {
        console.log('Product not found');
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
