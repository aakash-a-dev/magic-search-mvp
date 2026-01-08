import { chromium, Browser } from 'playwright';
import { PinterestScraper } from './pinterest-scraper';
import { InstagramScraper } from './instagram-scraper';
import { ScrapedImageData, ScraperConfig } from '../../types/scraper.types';
import prisma from '../../config/database';

export class ScraperManager {
  private browser: Browser | null = null;
  private config: ScraperConfig;

  constructor(config: ScraperConfig = {}) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    this.browser = await chromium.launch({
      headless: this.config.headless ?? true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
      ],
    });
  }

  async scrapePinterestBoard(boardUrl: string): Promise<number> {
    if (!this.browser) throw new Error('Manager not initialized');

    const scraper = new PinterestScraper(this.config);
    await scraper.initialize(this.browser);

    let savedCount = 0;
    try {
      for await (const imageData of scraper.scrape(boardUrl)) {
        await this.saveScrapedImage(imageData);
        savedCount++;
      }
    } finally {
      await scraper.cleanup();
    }

    return savedCount;
  }

  async scrapeInstagramProfile(profileUrl: string, username?: string, password?: string): Promise<number> {
    if (!this.browser) throw new Error('Manager not initialized');

    const scraper = new InstagramScraper(this.config);
    await scraper.initialize(this.browser);

    if (username && password) {
      await scraper.login(username, password);
    }

    let savedCount = 0;
    try {
      for await (const imageData of scraper.scrape(profileUrl)) {
        await this.saveScrapedImage(imageData);
        savedCount++;
      }
    } finally {
      await scraper.cleanup();
    }

    return savedCount;
  }

  private async saveScrapedImage(data: ScrapedImageData): Promise<void> {
    try {
      await prisma.scrapedImage.create({
        data: {
          imageUrl: data.imageUrl,
          sourceUrl: data.sourceUrl,
          sourcePlatform: data.sourcePlatform,
          caption: data.caption,
          hashtags: data.hashtags,
          engagementMetrics: data.engagementMetrics as any,
          postedDate: data.postedDate,
          userInfo: data.userInfo as any,
        },
      });
    } catch (error) {
      console.error(`Failed to save scraped image: ${error}`);
    }
  }

  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

