import { Browser, BrowserContext, Page } from 'playwright';
import { ScrapedImageData, ScraperConfig } from '../../types/scraper.types';

export abstract class BaseScraper {
  protected browser: Browser | null = null;
  protected context: BrowserContext | null = null;
  protected config: Required<ScraperConfig>;

  constructor(config: ScraperConfig = {}) {
    this.config = {
      maxImages: config.maxImages ?? 100,
      delayMs: config.delayMs ?? 2000,
      headless: config.headless ?? true,
      timeout: config.timeout ?? 30000,
    };
  }

  abstract initialize(browser: Browser): Promise<void>;
  abstract scrape(target: string): AsyncGenerator<ScrapedImageData, void, unknown>;
  abstract cleanup(): Promise<void>;

  protected async delay(ms: number = this.config.delayMs): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  protected async scrollPage(page: Page, times: number = 3): Promise<void> {
    for (let i = 0; i < times; i++) {
      await page.evaluate(() => {
        window.scrollBy(0, window.innerHeight);
      });
      await this.delay(1000);
    }
  }

  protected extractHashtags(text: string): string[] {
    const hashtagRegex = /#[\w]+/g;
    return text.match(hashtagRegex)?.map(tag => tag.slice(1).toLowerCase()) || [];
  }

  protected parseEngagement(text: string): number {
    const cleaned = text.replace(/[^\d.]/g, '');
    const num = parseFloat(cleaned);
    if (text.includes('K') || text.includes('k')) return num * 1000;
    if (text.includes('M') || text.includes('m')) return num * 1000000;
    return num || 0;
  }
}

