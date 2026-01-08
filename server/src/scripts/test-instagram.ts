import 'dotenv/config';
import { ScraperManager } from '../services/scraper/scraper-manager';

async function main() {
  const manager = new ScraperManager({
    maxImages: 5,
    delayMs: 2000,
    headless: false,
  });

  const username = process.env.INSTAGRAM_USERNAME;
  const password = process.env.INSTAGRAM_PASSWORD;

  const testProfile = 'minimalstreetstyle';

  try {
    await manager.initialize();
    console.log(`Testing Instagram scraping for: @${testProfile}\n`);

    const count = await manager.scrapeInstagramProfile(
      `https://www.instagram.com/${testProfile}/`,
      username,
      password
    );

    console.log(`\n✓ Successfully scraped ${count} images from @${testProfile}`);
  } catch (error) {
    console.error('Test failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  } finally {
    await manager.cleanup();
  }
}

main();







