import prisma from '../../config/database';
import { EmbeddingClient } from '../embedding/embedding-client';

export interface SearchFilters {
  category?: string[];
  brandName?: string[];
  priceRange?: [number, number];
  colors?: string[];
}

export interface SearchResult {
  productId: string;
  title: string;
  category: string | null;
  brandName: string | null;
  imageUrl: string;
  price: number | null;
  extractedMetadata: any;
  visualScore?: number;
  semanticScore?: number;
  titleMatchBonus?: number;
  combinedScore: number;
  matchReasons?: string[];
}

export class SearchService {
  private embeddingClient: EmbeddingClient;

  constructor() {
    this.embeddingClient = new EmbeddingClient();
  }

  async searchByImage(
    imageUrl: string,
    topK: number = 10,
    filters?: SearchFilters
  ): Promise<SearchResult[]> {
    try {
      const queryEmbedding = await this.embeddingClient.generateImageEmbedding(imageUrl);
      const vectorStr = `[${queryEmbedding.join(',')}]`;

      let whereClause = 'WHERE pve.embedding IS NOT NULL';
      const params: any[] = [vectorStr, topK];
      let paramIndex = 3;

      if (filters?.category && filters.category.length > 0) {
        whereClause += ` AND p.category = ANY($${paramIndex})`;
        params.push(filters.category);
        paramIndex++;
      }

      if (filters?.brandName && filters.brandName.length > 0) {
        whereClause += ` AND p.brand_name = ANY($${paramIndex})`;
        params.push(filters.brandName);
        paramIndex++;
      }

      if (filters?.priceRange) {
        whereClause += ` AND p.price >= $${paramIndex} AND p.price <= $${paramIndex + 1}`;
        params.push(filters.priceRange[0], filters.priceRange[1]);
        paramIndex += 2;
      }

      const query = `
        SELECT 
          p.product_id,
          p.title,
          p.category,
          p.brand_name,
          p.image_url,
          p.price,
          p.extracted_metadata,
          GREATEST(0, LEAST(1, 1 - (pve.embedding <=> $1::vector))) AS visual_score
        FROM products p
        INNER JOIN product_visual_embeddings pve ON p.product_id = pve.product_id
        ${whereClause}
        AND (1 - (pve.embedding <=> $1::vector)) > 0.3
        ORDER BY (1 - (pve.embedding <=> $1::vector)) DESC
        LIMIT $2
      `;

      const results = await prisma.$queryRawUnsafe(query, ...params) as any[];

      if (results.length === 0) {
        console.warn('No products with visual embeddings found. Products may need visual embeddings generated.');
        return [];
      }

      return results.map((r: any) => {
        const visualScore = Math.max(0, Math.min(1, parseFloat(r.visual_score)));
        return {
          productId: r.product_id,
          title: r.title,
          category: r.category,
          brandName: r.brand_name,
          imageUrl: r.image_url,
          price: r.price ? parseFloat(r.price) : null,
          extractedMetadata: r.extracted_metadata,
          visualScore,
          combinedScore: visualScore, // For image search, visual score is the main score
        };
      });
    } catch (error) {
      console.error('Image search error:', error);
      return [];
    }
  }

  async searchByText(
    queryText: string,
    topK: number = 10,
    filters?: SearchFilters
  ): Promise<SearchResult[]> {
    // Expand query with synonyms and related terms for better matching
    const expandedQuery = this.expandQuery(queryText);
    const queryEmbedding = await this.embeddingClient.generateTextEmbedding(expandedQuery);
    const vectorStr = `[${queryEmbedding.join(',')}]`;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [vectorStr, topK];
    let paramIndex = 3;

    if (filters?.category && filters.category.length > 0) {
      whereClause += ` AND p.category = ANY($${paramIndex})`;
      params.push(filters.category);
      paramIndex++;
    }

    if (filters?.brandName && filters.brandName.length > 0) {
      whereClause += ` AND p.brand_name = ANY($${paramIndex})`;
      params.push(filters.brandName);
      paramIndex++;
    }

    if (filters?.priceRange) {
      whereClause += ` AND p.price >= $${paramIndex} AND p.price <= $${paramIndex + 1}`;
      params.push(filters.priceRange[0], filters.priceRange[1]);
      paramIndex += 2;
    }

    const keywords = queryText.toLowerCase().split(/\s+/).filter(k => k.length > 2);
    
    // Enhanced title matching with multiple keyword bonuses
    let titleMatchBonus = '0';
    let categoryMatchBonus = '0';
    let brandMatchBonus = '0';
    
    if (keywords.length > 0) {
      const keywordConditions = keywords.map((_, idx) => {
        const paramIdx = paramIndex + idx;
        return `LOWER(p.title) LIKE '%' || LOWER($${paramIdx}) || '%'`;
      }).join(' OR ');
      titleMatchBonus = `CASE WHEN ${keywordConditions} THEN 0.20 ELSE 0 END`;
      
      // Category match bonus
      const categoryConditions = keywords.map((_, idx) => {
        const paramIdx = paramIndex + idx;
        return `LOWER(p.category) LIKE '%' || LOWER($${paramIdx}) || '%'`;
      }).join(' OR ');
      categoryMatchBonus = `CASE WHEN ${categoryConditions} THEN 0.10 ELSE 0 END`;
      
      // Brand match bonus
      const brandConditions = keywords.map((_, idx) => {
        const paramIdx = paramIndex + idx;
        return `LOWER(p.brand_name) LIKE '%' || LOWER($${paramIdx}) || '%'`;
      }).join(' OR ');
      brandMatchBonus = `CASE WHEN ${brandConditions} THEN 0.15 ELSE 0 END`;
    }

    // Improved scoring with better normalization and metadata boosting
    const query = `
      SELECT 
        p.product_id,
        p.title,
        p.category,
        p.brand_name,
        p.image_url,
        p.price,
        p.extracted_metadata,
        GREATEST(0, LEAST(1, 1 - (pte.embedding <=> $1::vector))) AS semantic_score,
        ${titleMatchBonus} AS title_match_bonus,
        ${categoryMatchBonus} AS category_match_bonus,
        ${brandMatchBonus} AS brand_match_bonus
      FROM products p
      INNER JOIN product_text_embeddings pte ON p.product_id = pte.product_id
      ${whereClause}
      ORDER BY (
        GREATEST(0, LEAST(1, 1 - (pte.embedding <=> $1::vector))) * 0.7 +
        ${titleMatchBonus} * 0.15 +
        ${categoryMatchBonus} * 0.08 +
        ${brandMatchBonus} * 0.07
      ) DESC
      LIMIT $2
    `;

    if (keywords.length > 0) {
      params.push(...keywords);
    }
    const results = await prisma.$queryRawUnsafe(query, ...params) as any[];

    return results.map((r: any) => {
      const semanticScore = parseFloat(r.semantic_score);
      const titleBonus = parseFloat(r.title_match_bonus || 0);
      const categoryBonus = parseFloat(r.category_match_bonus || 0);
      const brandBonus = parseFloat(r.brand_match_bonus || 0);
      const combinedScore = semanticScore * 0.7 + titleBonus * 0.15 + categoryBonus * 0.08 + brandBonus * 0.07;
      
      return {
        productId: r.product_id,
        title: r.title,
        category: r.category,
        brandName: r.brand_name,
        imageUrl: r.image_url,
        price: r.price ? parseFloat(r.price) : null,
        extractedMetadata: r.extracted_metadata,
        semanticScore,
        titleMatchBonus: titleBonus,
        combinedScore: Math.min(1, combinedScore), // Cap at 1.0
      };
    });
  }

  private expandQuery(queryText: string): string {
    // Add fashion-specific query expansion
    const lowerQuery = queryText.toLowerCase();
    const expansions: string[] = [queryText];
    
    // Common fashion synonyms
    const synonyms: { [key: string]: string[] } = {
      'sneaker': ['shoe', 'footwear', 'trainer', 'athletic shoe'],
      'shoe': ['sneaker', 'footwear', 'trainer'],
      'shirt': ['top', 'tee', 't-shirt', 'blouse'],
      'pant': ['trouser', 'pants', 'jeans'],
      'jacket': ['coat', 'outerwear', 'blazer'],
      'watch': ['timepiece', 'wristwatch'],
      'bag': ['handbag', 'purse', 'tote', 'backpack'],
    };
    
    const words = lowerQuery.split(/\s+/);
    for (const word of words) {
      if (synonyms[word]) {
        expansions.push(...synonyms[word]);
      }
    }
    
    return expansions.join(' ');
  }

  async hybridSearch(
    imageUrl?: string,
    queryText?: string,
    topK: number = 10,
    filters?: SearchFilters,
    visualWeight: number = 0.6,
    textWeight: number = 0.4
  ): Promise<SearchResult[]> {
    let visualResults: SearchResult[] = [];
    let textResults: SearchResult[] = [];

    if (imageUrl) {
      visualResults = await this.searchByImage(imageUrl, topK * 2, filters);
    }

    if (queryText) {
      textResults = await this.searchByText(queryText, topK * 2, filters);
    }

    const combined = new Map<string, SearchResult>();

    visualResults.forEach(result => {
      const existing = combined.get(result.productId);
      if (existing) {
        existing.visualScore = result.visualScore;
        existing.combinedScore = 
          (existing.visualScore || 0) * visualWeight + 
          (existing.semanticScore || 0) * textWeight;
      } else {
        result.combinedScore = (result.visualScore || 0) * visualWeight;
        combined.set(result.productId, result);
      }
    });

    textResults.forEach(result => {
      const existing = combined.get(result.productId);
      if (existing) {
        existing.semanticScore = result.semanticScore;
        existing.combinedScore = 
          (existing.visualScore || 0) * visualWeight + 
          (existing.semanticScore || 0) * textWeight;
      } else {
        result.combinedScore = (result.semanticScore || 0) * textWeight;
        combined.set(result.productId, result);
      }
    });

    return Array.from(combined.values())
      .sort((a, b) => b.combinedScore - a.combinedScore)
      .slice(0, topK);
  }
}

