import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const terms = {
    'Toor Dal (Arhar)': 'Pigeon_pea',
    'Chana Dal': 'Chickpea',
    'Desi Ghee': 'Ghee',
    'Jeera (Cumin Seeds)': 'Cumin',
    'Aloo Bhujia': 'Bikaneri_bhujia'
};

async function getWikiImage(pageTitle) {
    const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${pageTitle}&prop=pageimages&format=json&pithumbsize=400`;
    const res = await fetch(url);
    const data = await res.json();
    const pages = data.query.pages;
    for (const id in pages) {
        if (pages[id].thumbnail) {
            return pages[id].thumbnail.source;
        }
    }
    return null;
}

async function run() {
    for (const [name, wiki] of Object.entries(terms)) {
        const url = await getWikiImage(wiki);
        if (url) {
            console.log(`Updating ${name} -> ${url}`);
            await prisma.product.updateMany({
                where: { name: name },
                data: { image: url }
            });
        } else {
            console.log(`No image found for ${name}`);
        }
    }
}

run().finally(() => prisma.$disconnect());
