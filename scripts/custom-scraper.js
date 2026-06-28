import puppeteer from 'puppeteer';

async function scrapeImages(queries) {
    const browser = await puppeteer.launch({ 
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage();
    
    const results = {};
    for (const q of queries) {
        try {
            console.log(`Searching for: ${q}`);
            await page.goto(`https://www.google.com/search?q=${encodeURIComponent(q)}&tbm=isch`, { waitUntil: 'domcontentloaded' });
            
            // Wait for images to load
            await page.waitForSelector('img');
            
            // Extract the first decent image URL (ignoring small icons)
            const imgUrl = await page.evaluate(() => {
                const imgs = Array.from(document.querySelectorAll('img'));
                // Filter out small base64 images or icons
                const validImgs = imgs.filter(img => {
                    const src = img.src || img.dataset.src;
                    return src && src.startsWith('http') && !src.includes('favicon') && img.width > 50;
                });
                return validImgs.length > 0 ? (validImgs[0].dataset.src || validImgs[0].src) : null;
            });
            
            results[q] = imgUrl;
            console.log(`Found: ${imgUrl}`);
        } catch (e) {
            console.error(`Error for ${q}:`, e.message);
        }
    }
    
    await browser.close();
    console.log(JSON.stringify(results, null, 2));
}

const queries = [
    "Classmate Notebook official product image",
    "Reynolds Ball Pens official product image",
    "A4 Printing Paper ream official image",
    "Camel Water Colors 12 shades official image",
    "Classmate Geometry Box official image",
    "Surf Excel Matic Liquid bottle official image",
    "Dettol Original Soap bar official image",
    "Harpic Power Plus toilet cleaner bottle official image",
    "Colgate Strong Teeth toothpaste official image",
    "Parachute Coconut Oil 500ml official image",
    "Stationery items background flatlay high quality",
    "Household cleaning products background high quality"
];

scrapeImages(queries);
