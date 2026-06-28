import Scraper from 'images-scraper';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const google = new Scraper({
  puppeteer: {
    headless: "new",
  }
});

async function run() {
    try {
        console.log("Searching for Desi Ghee image...");
        const results = await google.scrape('Amul Desi Ghee jar', 1);
        if (results && results.length > 0) {
            const url = results[0].url;
            console.log(`Found: ${url}`);
            
            await prisma.product.updateMany({
                where: { name: 'Desi Ghee' },
                data: { image: url }
            });
            console.log("Updated Desi Ghee successfully.");
        } else {
            console.log("No results found.");
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
run();
