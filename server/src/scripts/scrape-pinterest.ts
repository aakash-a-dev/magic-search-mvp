import 'dotenv/config';
import { ScraperManager } from '../services/scraper/scraper-manager';

const PINTEREST_BOARDS = [
  { name: 'Minimal Streetwear', url: 'https://www.pinterest.com/search/pins/?q=minimal%20streetwear' },
  { name: "Men's Streetwear Outfit Ideas", url: 'https://www.pinterest.com/search/pins/?q=mens%20streetwear%20outfit%20ideas' },
  { name: 'Streetwear Outfit Ideas', url: 'https://www.pinterest.com/search/pins/?q=streetwear%20outfit%20ideas' },
  { name: 'Streetwear Fashion Instagram', url: 'https://www.pinterest.com/search/pins/?q=streetwear%20fashion%20instagram' },
  { name: 'Luxury Fashion – Roxx Inspire', url: 'https://www.pinterest.com/search/pins/?q=luxury%20fashion' },
  { name: 'Luxury Classy Outfits', url: 'https://www.pinterest.com/search/pins/?q=luxury%20classy%20outfits' },
  { name: 'Luxury Streetwear Brands', url: 'https://www.pinterest.com/search/pins/?q=luxury%20streetwear%20brands' },
];

async function main() {
  const manager = new ScraperManager({
    maxImages: 100,
    delayMs: 2000,
    headless: true,
  });

  try {
    await manager.initialize();
    console.log('Starting Pinterest scraping...\n');

    let totalScraped = 0;
    for (const board of PINTEREST_BOARDS) {
      console.log(`Scraping: ${board.name}...`);
      const count = await manager.scrapePinterestBoard(board.url);
      totalScraped += count;
      console.log(`✓ Scraped ${count} images from ${board.name}\n`);
    }

    console.log(`\n✓ Total images scraped: ${totalScraped}`);
  } catch (error) {
    console.error('Scraping failed:', error);
    process.exit(1);
  } finally {
    await manager.cleanup();
  }
}

main();

