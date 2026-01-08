import prisma from '../../config/database';
import { EmbeddingClient } from '../embedding/embedding-client';

export interface ScrapedImageSearchResult {
  id: number;
  imageUrl: string;
  sourceUrl: string | null;
  sourcePlatform: string;
  caption: string | null;
  hashtags: string[];
  engagementMetrics: any;
  postedDate: Date | null;
  userInfo: any;
  similarityScore: number;
}

export class ScrapedImageSearchService {
  private embeddingClient: EmbeddingClient;

  constructor() {
    this.embeddingClient = new EmbeddingClient();
  }

  async searchByImage(
    imageUrl: string,
    topK: number = 10,
    platform?: 'pinterest' | 'instagram'
  ): Promise<ScrapedImageSearchResult[]> {
    try {
      const queryEmbedding = await this.embeddingClient.generateImageEmbedding(imageUrl);
      const vectorStr = `[${queryEmbedding.join(',')}]`;

      let whereClause = 'WHERE sie.embedding IS NOT NULL';
      const params: any[] = [vectorStr, topK];
      let paramIndex = 3;

      if (platform) {
        whereClause += ` AND si.source_platform = $${paramIndex}`;
        params.push(platform);
        paramIndex++;
      }

      const query = `
        SELECT 
          si.id,
          si.image_url,
          si.source_url,
          si.source_platform,
          si.caption,
          si.hashtags,
          si.engagement_metrics,
          si.posted_date,
          si.user_info,
          1 - (sie.embedding <=> $1::vector) AS similarity_score
        FROM scraped_images si
        INNER JOIN scraped_image_embeddings sie ON si.id = sie.scraped_image_id
        ${whereClause}
        ORDER BY (1 - (sie.embedding <=> $1::vector)) DESC
        LIMIT $2
      `;

      const results = await prisma.$queryRawUnsafe(query, ...params) as any[];

      return results.map((r: any) => ({
        id: r.id,
        imageUrl: r.image_url,
        sourceUrl: r.source_url,
        sourcePlatform: r.source_platform,
        caption: r.caption,
        hashtags: r.hashtags || [],
        engagementMetrics: r.engagement_metrics,
        postedDate: r.posted_date,
        userInfo: r.user_info,
        similarityScore: parseFloat(r.similarity_score),
      }));
    } catch (error) {
      console.error('Scraped image search error:', error);
      return [];
    }
  }

  async searchByText(
    queryText: string,
    topK: number = 10,
    platform?: 'pinterest' | 'instagram'
  ): Promise<ScrapedImageSearchResult[]> {
    try {
      const queryEmbedding = await this.embeddingClient.generateTextEmbedding(queryText);
      const vectorStr = `[${queryEmbedding.join(',')}]`;

      let whereClause = 'WHERE sie.embedding IS NOT NULL';
      const params: any[] = [vectorStr, topK];
      let paramIndex = 3;

      if (platform) {
        whereClause += ` AND si.source_platform = $${paramIndex}`;
        params.push(platform);
        paramIndex++;
      }

      if (queryText) {
        whereClause += ` AND (si.caption ILIKE '%' || $${paramIndex} || '%' OR array_to_string(si.hashtags, ' ') ILIKE '%' || $${paramIndex} || '%')`;
        params.push(queryText);
        paramIndex++;
      }

      const query = `
        SELECT 
          si.id,
          si.image_url,
          si.source_url,
          si.source_platform,
          si.caption,
          si.hashtags,
          si.engagement_metrics,
          si.posted_date,
          si.user_info,
          1 - (sie.embedding <=> $1::vector) AS similarity_score
        FROM scraped_images si
        INNER JOIN scraped_image_embeddings sie ON si.id = sie.scraped_image_id
        ${whereClause}
        ORDER BY (1 - (sie.embedding <=> $1::vector)) DESC
        LIMIT $2
      `;

      const results = await prisma.$queryRawUnsafe(query, ...params) as any[];

      return results.map((r: any) => ({
        id: r.id,
        imageUrl: r.image_url,
        sourceUrl: r.source_url,
        sourcePlatform: r.source_platform,
        caption: r.caption,
        hashtags: r.hashtags || [],
        engagementMetrics: r.engagement_metrics,
        postedDate: r.posted_date,
        userInfo: r.user_info,
        similarityScore: parseFloat(r.similarity_score),
      }));
    } catch (error) {
      console.error('Scraped image text search error:', error);
      return [];
    }
  }
}



