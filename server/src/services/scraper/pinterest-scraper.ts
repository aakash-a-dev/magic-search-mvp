import { Browser, BrowserContext, Page } from 'playwright';
import { BaseScraper } from './base-scraper';
import { ScrapedImageData } from '../../types/scraper.types';

export class PinterestScraper extends BaseScraper {
  private page: Page | null = null;

  async initialize(browser: Browser): Promise<void> {
    this.browser = browser;
    this.context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      viewport: { width: 1920, height: 1080 },
    });
    this.page = await this.context.newPage();
  }

  async *scrape(boardUrl: string): AsyncGenerator<ScrapedImageData, void, unknown> {
    if (!this.page) throw new Error('Scraper not initialized');

    let scrapedCount = 0;
    await this.page.goto(boardUrl, { waitUntil: 'networkidle', timeout: this.config.timeout });
    await this.delay(3000);

    while (scrapedCount < this.config.maxImages) {
      const pins = await this.page.$$('[data-test-id="pin"]');
      
      for (const pin of pins.slice(scrapedCount)) {
        if (scrapedCount >= this.config.maxImages) break;

        try {
          const imageData = await this.extractPinData(pin);
          if (imageData) {
            yield imageData;
            scrapedCount++;
          }
        } catch (error) {
          console.error(`Error extracting pin data: ${error}`);
        }
      }

      if (scrapedCount >= this.config.maxImages) break;

      const previousHeight = await this.page.evaluate('document.body.scrollHeight');
      await this.scrollPage(this.page, 2);
      await this.delay(this.config.delayMs);

      const currentHeight = await this.page.evaluate('document.body.scrollHeight');
      if (currentHeight === previousHeight) break;
    }
  }

  private async extractPinData(pin: any): Promise<ScrapedImageData | null> {
    if (!this.page) return null;

    try {
      const imageElement = await pin.$('img');
      if (!imageElement) return null;

      const imageUrl = await imageElement.getAttribute('src') || 
                      await imageElement.getAttribute('data-src');
      if (!imageUrl || imageUrl.includes('data:image')) return null;

      const linkElement = await pin.$('a[href*="/pin/"]');
      const sourceUrl = linkElement 
        ? `https://www.pinterest.com${await linkElement.getAttribute('href')}`
        : undefined;

      const titleElement = await pin.$('[data-test-id="pinrep-title"]');
      const caption = titleElement ? await titleElement.textContent() : undefined;

      const descriptionElement = await pin.$('[data-test-id="pinrep-description"]');
      const description = descriptionElement ? await descriptionElement.textContent() : undefined;
      const fullText = [caption, description].filter(Boolean).join(' ');

      const userElement = await pin.$('[data-test-id="username"]');
      const username = userElement ? await userElement.textContent() : undefined;

      return {
        imageUrl: imageUrl.replace(/\/\d+x\d+\//, '/originals/'),
        sourceUrl,
        sourcePlatform: 'pinterest',
        caption: fullText || undefined,
        hashtags: this.extractHashtags(fullText),
        postedDate: new Date(),
        userInfo: username ? { username } : undefined,
      };
    } catch (error) {
      return null;
    }
  }

  async cleanup(): Promise<void> {
    if (this.page) await this.page.close();
    if (this.context) await this.context.close();
    this.page = null;
    this.context = null;
  }
}

