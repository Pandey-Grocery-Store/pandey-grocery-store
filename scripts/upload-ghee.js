import { put } from '@vercel/blob';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function run() {
    try {
        const imagePath = '/Users/adityapandeydev/.gemini/antigravity-ide/brain/cabf7707-8c15-41d4-997a-17707797930c/desi_ghee_jar_1782650335147.png';
        const fileBuffer = fs.readFileSync(imagePath);
        
        console.log("Uploading to Vercel Blob...");
        const blob = await put('desi_ghee.png', fileBuffer, { 
            access: 'public',
            token: process.env.BLOB_READ_WRITE_TOKEN
        });
        
        console.log(`Uploaded: ${blob.url}`);
        
        console.log("Updating database...");
        await prisma.product.updateMany({
            where: { name: 'Desi Ghee' },
            data: { image: blob.url }
        });
        console.log("Done!");
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
run();
