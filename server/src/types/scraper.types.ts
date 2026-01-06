export interface ScrapedImageData {
  imageUrl: string;
  sourceUrl?: string;
  sourcePlatform: 'pinterest' | 'instagram';
  caption?: string;
  hashtags: string[];
  engagementMetrics?: {
    likes?: number;
    comments?: number;
    shares?: number;
  };
  postedDate?: Date;
  userInfo?: {
    username?: string;
    displayName?: string;
    profileUrl?: string;
  };
}

export interface ScraperConfig {
  maxImages?: number;
  delayMs?: number;
  headless?: boolean;
  timeout?: number;
}

export interface PinterestBoard {
  name: string;
  url: string;
}

export interface InstagramProfile {
  username: string;
  url: string;
}

