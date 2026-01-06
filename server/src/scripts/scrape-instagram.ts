import 'dotenv/config';
import { ScraperManager } from '../services/scraper/scraper-manager';

const INSTAGRAM_PROFILES = [
  '@minimalstreetstyle',
  '@outfitgrid',
  '@outfitpage',
  '@mensfashionpost',
  '@stadiumgoods',
  '@flightclub',
  '@hodinkee',
  '@wristcheck',
  '@purseblog',
  '@sunglasshut',
  '@rayban',
  '@prada',
  '@cartier',
  '@thesolesupplier',
];

async function main() {
  const manager = new ScraperManager({
    maxImages: 50,
    delayMs: 3000,
    headless: true,
  });

  const username = process.env.INSTAGRAM_USERNAME;
  const password = process.env.INSTAGRAM_PASSWORD;

  try {
    await manager.initialize();
    console.log('Starting Instagram scraping...\n');

    let totalScraped = 0;
    for (const profile of INSTAGRAM_PROFILES) {
      const profileUrl = `https://www.instagram.com/${profile.replace('@', '')}/`;
      console.log(`Scraping: ${profile}...`);
      
      try {
        const count = await manager.scrapeInstagramProfile(
          profileUrl,
          username,
          password
        );
        totalScraped += count;
        console.log(`✓ Scraped ${count} images from ${profile}\n`);
      } catch (error) {
        console.error(`✗ Failed to scrape ${profile}: ${error}\n`);
      }
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

