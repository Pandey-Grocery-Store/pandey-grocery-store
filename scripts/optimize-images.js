import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputDir = path.join(__dirname, '../Shop Image');
const outputDir = path.join(__dirname, '../public/store-gallery');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Allowed file extensions
const allowedExts = ['.jpg', '.jpeg', '.png'];

fs.readdir(inputDir, async (err, files) => {
    if (err) {
        console.error('Error reading Shop Image directory:', err);
        return;
    }

    const imageFiles = files.filter(file => allowedExts.includes(path.extname(file).toLowerCase()));
    console.log(`Found ${imageFiles.length} images to process. Outputting to ${outputDir}...`);

    for (const file of imageFiles) {
        const inputPath = path.join(inputDir, file);
        const outputFilename = `${path.parse(file).name}.webp`;
        const outputPath = path.join(outputDir, outputFilename);

        try {
            await sharp(inputPath)
                .resize({ width: 800 }) // Resize to a max width of 800px for web
                .webp({ quality: 75 })   // Convert to WebP format with 75% quality for small size
                .toFile(outputPath);
            
            console.log(`✅ Optimized: ${file} -> ${outputFilename}`);
        } catch (error) {
            console.error(`❌ Failed to process ${file}:`, error);
        }
    }
    console.log('🎉 Image optimization complete!');
});
