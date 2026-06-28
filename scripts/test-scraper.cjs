const Scraper = require('images-scraper');
const google = new Scraper({
  puppeteer: {
    headless: 'new',
  }
});

async function run() {
    const results = await google.scrape('Surf Excel Matic Liquid bottle PNG official', 1);
    console.log(results[0]?.url);
}
run().catch(console.error);
