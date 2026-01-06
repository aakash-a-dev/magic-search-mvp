import { Browser, BrowserContext, Page } from 'playwright';
import { BaseScraper } from './base-scraper';
import { ScrapedImageData } from '../../types/scraper.types';

export class InstagramScraper extends BaseScraper {
  private page: Page | null = null;
  private isLoggedIn = false;

  async initialize(browser: Browser): Promise<void> {
    this.browser = browser;
    this.context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
      viewport: { width: 375, height: 812 },
    });
    this.page = await this.context.newPage();
  }

  async login(username?: string, password?: string): Promise<void> {
    if (!this.page) throw new Error('Scraper not initialized');
    if (!username || !password) return;

    await this.page.goto('https://www.instagram.com/accounts/login/', {
      waitUntil: 'networkidle',
      timeout: this.config.timeout,
    });

    await this.delay(2000);

    await this.page.fill('input[name="username"]', username);
    await this.page.fill('input[name="password"]', password);
    await this.page.click('button[type="submit"]');

    await this.page.waitForURL('**/accounts/onetap/**', { timeout: 10000 }).catch(() => {});
    await this.delay(3000);

    const saveInfoButton = await this.page.$('button:has-text("Not Now")');
    if (saveInfoButton) await saveInfoButton.click();

    this.isLoggedIn = true;
  }

  async *scrape(profileUrl: string): AsyncGenerator<ScrapedImageData, void, unknown> {
    if (!this.page) throw new Error('Scraper not initialized');

    let scrapedCount = 0;
    await this.page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: this.config.timeout });
    await this.delay(5000);

    await this.scrollPage(this.page, 3);

    const postSelectors = [
      'article a[href*="/p/"]',
      'a[href*="/p/"]',
      'div[role="button"] a[href*="/p/"]',
    ];

    let posts: any[] = [];
    for (const selector of postSelectors) {
      posts = await this.page.$$(selector);
      if (posts.length > 0) break;
    }

    if (posts.length === 0) {
      console.warn('No posts found. Instagram may require login or profile is private.');
      return;
    }

    const postUrls: string[] = [];
    const seenUrls = new Set<string>();

    for (const post of posts.slice(0, this.config.maxImages * 2)) {
      const href = await post.getAttribute('href');
      if (href && !seenUrls.has(href)) {
        const fullUrl = href.startsWith('http') ? href : `https://www.instagram.com${href}`;
        postUrls.push(fullUrl);
        seenUrls.add(href);
      }
    }

    for (const postUrl of postUrls) {
      if (scrapedCount >= this.config.maxImages) break;

      try {
        await this.page.goto(postUrl, { waitUntil: 'domcontentloaded', timeout: this.config.timeout });
        await this.delay(2000);

        const imageData = await this.extractPostData(postUrl);
        if (imageData) {
          yield imageData;
          scrapedCount++;
        }
      } catch (error) {
        console.error(`Error scraping post ${postUrl}: ${error}`);
      }
    }
  }

  private async extractPostData(postUrl: string): Promise<ScrapedImageData | null> {
    if (!this.page) return null;

    try {
      const imageSelectors = [
        'article img[src*="scontent"]',
        'img[src*="scontent"]',
        'article img',
        'img[alt*="Photo"]',
      ];

      let imageElement = null;
      for (const selector of imageSelectors) {
        imageElement = await this.page.$(selector);
        if (imageElement) break;
      }

      if (!imageElement) {
        const allImages = await this.page.$$('img');
        for (const img of allImages) {
          const src = await img.getAttribute('src');
          if (src && (src.includes('scontent') || src.includes('cdninstagram'))) {
            imageElement = img;
            break;
          }
        }
      }

      if (!imageElement) return null;

      const imageUrl = await imageElement.getAttribute('src');
      if (!imageUrl || imageUrl.includes('data:image')) return null;

      const captionSelectors = [
        'article span',
        'h1 + span',
        '[data-testid="post-caption"]',
      ];

      let caption: string | undefined;
      for (const selector of captionSelectors) {
        const element = await this.page.$(selector);
        if (element) {
          const text = await element.textContent();
          if (text && text.length > 10) {
            caption = text;
            break;
          }
        }
      }

      const likeSelectors = [
        'section span:has-text("like")',
        'button span:has-text("like")',
        '[aria-label*="like"]',
      ];

      let likes: number | undefined;
      for (const selector of likeSelectors) {
        const element = await this.page.$(selector);
        if (element) {
          const text = await element.textContent();
          if (text) {
            likes = this.parseEngagement(text);
            break;
          }
        }
      }

      const timeElement = await this.page.$('article time');
      const postedDate = timeElement 
        ? new Date(await timeElement.getAttribute('datetime') || new Date())
        : undefined;

      const usernameMatch = postUrl.match(/instagram\.com\/([^\/]+)/);
      const username = usernameMatch ? usernameMatch[1] : undefined;

      return {
        imageUrl,
        sourceUrl: postUrl,
        sourcePlatform: 'instagram',
        caption: caption || undefined,
        hashtags: this.extractHashtags(caption || ''),
        engagementMetrics: {
          likes,
        },
        postedDate,
        userInfo: username ? { username } : undefined,
      };
    } catch (error) {
      console.error(`Error extracting post data: ${error}`);
      return null;
    }
  }

  async cleanup(): Promise<void> {
    if (this.page) await this.page.close();
    if (this.context) await this.context.close();
    this.page = null;
    this.context = null;
    this.isLoggedIn = false;
  }
}

