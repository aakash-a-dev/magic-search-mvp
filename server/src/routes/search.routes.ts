import { Router, Request, Response } from 'express';
import multer from 'multer';
import { SearchService } from '../services/search/search.service';
import { ScrapedImageSearchService } from '../services/search/scraped-image-search.service';
import { ScrapedImageService } from '../services/database/scraped-image.service';
import { ProductService } from '../services/database/product.service';
import { z } from 'zod';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

const router = Router();
const searchService = new SearchService();
const scrapedImageSearchService = new ScrapedImageSearchService();
const scrapedImageService = new ScrapedImageService();
const productService = new ProductService();

const SearchFiltersSchema = z.object({
  category: z.array(z.string()).optional(),
  brands: z.array(z.string()).optional(),
  price_range: z.tuple([z.number(), z.number()]).optional(),
  colors: z.array(z.string()).optional(),
}).optional();

const ImageSearchSchema = z.object({
  external_image_url: z.string().url().optional(),
  image_base64: z.string().optional(),
  top_k: z.number().int().min(1).max(100).default(10),
  filters: SearchFiltersSchema,
  rerank: z.boolean().default(true),
}).refine(data => data.external_image_url || data.image_base64, {
  message: "Either external_image_url or image_base64 must be provided",
});

const TextSearchSchema = z.object({
  query: z.string().min(1),
  top_k: z.number().int().min(1).max(100).default(10),
  filters: SearchFiltersSchema,
});

router.post('/image', upload.single('image'), async (req: Request, res: Response) => {
  try {
    let imageInput: string;
    
    if (req.file) {
      const base64 = req.file.buffer.toString('base64');
      const mimeType = req.file.mimetype;
      imageInput = `data:${mimeType};base64,${base64}`;
    } else {
      const body = ImageSearchSchema.parse(req.body);
      imageInput = body.external_image_url || body.image_base64 || '';
      
      if (!imageInput) {
        return res.status(400).json({ error: 'Either external_image_url, image_base64, or image file must be provided' });
      }
    }
    
    let topK = 10;
    let filters: any = undefined;
    
    if (req.file) {
      topK = req.body.top_k ? parseInt(req.body.top_k) : 10;
      if (req.body.filters) {
        const filtersData = typeof req.body.filters === 'string' ? JSON.parse(req.body.filters) : req.body.filters;
        filters = {
          category: filtersData.category,
          brandName: filtersData.brands,
          priceRange: filtersData.price_range,
          colors: filtersData.colors,
        };
      }
    } else {
      const body = ImageSearchSchema.parse(req.body);
      topK = body.top_k;
      filters = body.filters ? {
        category: body.filters.category,
        brandName: body.filters.brands,
        priceRange: body.filters.price_range,
        colors: body.filters.colors,
      } : undefined;
    }

    const results = await searchService.searchByImage(
      imageInput,
      topK,
      filters
    );

    if (results.length === 0) {
      return res.json({
        query_analysis: {
          detected_items: [],
          extracted_from_image: {
            dominant_colors: [],
            inferred_style: [],
            detected_category: null,
          },
        },
        matches: [],
        total_results: 0,
        search_time_ms: 0,
        warning: "No products with visual embeddings found. Products may need visual embeddings generated. Try text search instead or run: npm run process:products",
      });
    }

    const queryAnalysis = {
      detected_items: [],
      extracted_from_image: {
        dominant_colors: [],
        inferred_style: [],
        detected_category: null,
      },
    };

    res.json({
      query_analysis: queryAnalysis,
      matches: results.map(r => ({
        product_id: r.productId,
        name: r.title.split(' ').slice(0, 3).join(' '),
        title: r.title,
        extracted_metadata: r.extractedMetadata,
        visual_score: r.visualScore,
        combined_score: r.combinedScore,
        price: r.price,
        image_url: r.imageUrl,
        match_reasons: r.matchReasons || [],
      })),
      total_results: results.length,
      search_time_ms: 0,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request', details: error.errors });
    }
    if (error instanceof Error && error.message === 'Only image files are allowed') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Search failed', message: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.post('/text', async (req: Request, res: Response) => {
  try {
    const body = TextSearchSchema.parse(req.body);
    
    const filters = body.filters ? {
      category: body.filters.category,
      brandName: body.filters.brands,
      priceRange: body.filters.price_range,
      colors: body.filters.colors,
    } : undefined;

    const results = await searchService.searchByText(
      body.query,
      body.top_k,
      filters
    );

    const keywords = body.query.toLowerCase().split(/\s+/);
    const expandedTerms = [
      ...keywords,
      ...keywords.map(k => k + 's'),
      ...keywords.map(k => k + 'es'),
    ];

    res.json({
      query_understanding: {
        original_query: body.query,
        intent: `find ${keywords.join(' ')}`,
        extracted_keywords: keywords,
        expanded_terms: expandedTerms,
      },
      inferred_context: {
        category: filters?.category?.[0] || null,
        use_case: keywords.join('/'),
        style: [],
      },
      matches: results.map(r => {
        const matchedTerms = keywords.filter(k => r.title.toLowerCase().includes(k));
        const relevanceReasons: string[] = [];
        
        if (matchedTerms.length > 0) {
          relevanceReasons.push(`Title contains: ${matchedTerms.join(', ')}`);
        }
        if (r.category && keywords.some(k => r.category?.toLowerCase().includes(k))) {
          relevanceReasons.push(`Category matches: ${r.category}`);
        }
        if (r.semanticScore && r.semanticScore > 0.5) {
          relevanceReasons.push(`High semantic similarity: ${(r.semanticScore * 100).toFixed(1)}%`);
        }

        return {
          product_id: r.productId,
          name: r.title.split(' ').slice(0, 3).join(' '),
          title: r.title,
          extracted_metadata: r.extractedMetadata,
          semantic_score: r.semanticScore,
          title_match_score: parseFloat(r.titleMatchBonus || '0'),
          relevance_reasons: relevanceReasons,
          matched_terms: matchedTerms,
          image_url: r.imageUrl,
          price: r.price,
        };
      }),
      search_strategy: 'Hybrid: BM25 text search + semantic embeddings',
      total_results: results.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request', details: error.errors });
    }
    res.status(500).json({ error: 'Search failed', message: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.post('/hybrid', async (req: Request, res: Response) => {
  try {
    const body = z.object({
      image_url: z.string().url().optional(),
      query: z.string().optional(),
      top_k: z.number().int().min(1).max(100).default(10),
      filters: SearchFiltersSchema,
      visual_weight: z.number().min(0).max(1).default(0.6),
      text_weight: z.number().min(0).max(1).default(0.4),
    }).parse(req.body);

    if (!body.image_url && !body.query) {
      return res.status(400).json({ error: 'Either image_url or query must be provided' });
    }

    const filters = body.filters ? {
      category: body.filters.category,
      brandName: body.filters.brands,
      priceRange: body.filters.price_range,
      colors: body.filters.colors,
    } : undefined;

    const results = await searchService.hybridSearch(
      body.image_url,
      body.query,
      body.top_k,
      filters,
      body.visual_weight,
      body.text_weight
    );

    res.json({
      matches: results.map(r => ({
        product_id: r.productId,
        title: r.title,
        extracted_metadata: r.extractedMetadata,
        visual_score: r.visualScore,
        semantic_score: r.semanticScore,
        combined_score: r.combinedScore,
        price: r.price,
        image_url: r.imageUrl,
      })),
      total_results: results.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request', details: error.errors });
    }
    res.status(500).json({ error: 'Search failed', message: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.get('/scraped-images', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const platform = req.query.platform as 'pinterest' | 'instagram' | undefined;

    const images = await scrapedImageService.findAll({
      limit,
      offset,
      platform,
    });

    res.json({
      images: images.map(img => ({
        id: img.id,
        image_url: img.imageUrl,
        source_url: img.sourceUrl,
        source_platform: img.sourcePlatform,
        caption: img.caption,
        hashtags: img.hashtags,
        engagement_metrics: img.engagementMetrics,
        posted_date: img.postedDate,
        user_info: img.userInfo,
      })),
      total: images.length,
      limit,
      offset,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch scraped images', message: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.post('/from-scraped-image', async (req: Request, res: Response) => {
  try {
    const body = z.object({
      scraped_image_id: z.number().int(),
      top_k: z.number().int().min(1).max(100).default(10),
      filters: SearchFiltersSchema,
    }).parse(req.body);

    const scrapedImage = await scrapedImageService.findById(body.scraped_image_id);
    if (!scrapedImage) {
      return res.status(404).json({ error: 'Scraped image not found' });
    }

    const filters = body.filters ? {
      category: body.filters.category,
      brandName: body.filters.brands,
      priceRange: body.filters.price_range,
      colors: body.filters.colors,
    } : undefined;

    const results = await searchService.searchByImage(
      scrapedImage.imageUrl,
      body.top_k,
      filters
    );

    const queryAnalysis = {
      detected_items: [],
      extracted_from_image: {
        dominant_colors: [],
        inferred_style: [],
        detected_category: null,
      },
      source_scraped_image: {
        id: scrapedImage.id,
        caption: scrapedImage.caption,
        hashtags: scrapedImage.hashtags,
        platform: scrapedImage.sourcePlatform,
      },
    };

    res.json({
      query_analysis: queryAnalysis,
      matches: results.map(r => ({
        product_id: r.productId,
        name: r.title.split(' ').slice(0, 3).join(' '),
        title: r.title,
        extracted_metadata: r.extractedMetadata,
        visual_score: r.visualScore,
        combined_score: r.combinedScore,
        price: r.price,
        image_url: r.imageUrl,
        match_reasons: r.matchReasons || [],
      })),
      total_results: results.length,
      search_time_ms: 0,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request', details: error.errors });
    }
    res.status(500).json({ error: 'Search failed', message: error instanceof Error ? error.message : 'Unknown error' });
  }
});

const ScrapedImageSearchSchema = z.object({
  image_url: z.string().url().optional(),
  query: z.string().optional(),
  top_k: z.number().int().min(1).max(100).default(10),
  platform: z.enum(['pinterest', 'instagram']).optional(),
});

router.post('/scraped-images', async (req: Request, res: Response) => {
  try {
    const body = ScrapedImageSearchSchema.parse(req.body);

    if (!body.image_url && !body.query) {
      return res.status(400).json({ error: 'Either image_url or query must be provided' });
    }

    let results;
    if (body.image_url) {
      results = await scrapedImageSearchService.searchByImage(
        body.image_url,
        body.top_k,
        body.platform
      );
    } else {
      results = await scrapedImageSearchService.searchByText(
        body.query!,
        body.top_k,
        body.platform
      );
    }

    res.json({
      matches: results.map(r => ({
        id: r.id,
        image_url: r.imageUrl,
        source_url: r.sourceUrl,
        source_platform: r.sourcePlatform,
        caption: r.caption,
        hashtags: r.hashtags,
        engagement_metrics: r.engagementMetrics,
        posted_date: r.postedDate,
        user_info: r.userInfo,
        similarity_score: r.similarityScore,
      })),
      total_results: results.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request', details: error.errors });
    }
    res.status(500).json({ error: 'Search failed', message: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.get('/products', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const products = await productService.findAll({
      limit,
      offset,
    });

    res.json({
      products: products.map(p => ({
        product_id: p.productId,
        title: p.title,
        category: p.category,
        brand_name: p.brandName,
        image_url: p.imageUrl,
        price: p.price,
        extracted_metadata: p.extractedMetadata,
      })),
      total: products.length,
      limit,
      offset,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products', message: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.get('/unified', async (req: Request, res: Response) => {
  try {
    const scrapedLimit = parseInt(req.query.scraped_limit as string) || 20;
    const scrapedOffset = parseInt(req.query.scraped_offset as string) || 0;
    const productsLimit = parseInt(req.query.products_limit as string) || 20;
    const productsOffset = parseInt(req.query.products_offset as string) || 0;
    const platform = req.query.platform as 'pinterest' | 'instagram' | undefined;

    const [scrapedImages, products] = await Promise.all([
      scrapedImageService.findAll({
        limit: scrapedLimit,
        offset: scrapedOffset,
        platform,
      }),
      productService.findAll({
        limit: productsLimit,
        offset: productsOffset,
      }),
    ]);

    res.json({
      scraped_images: {
        items: scrapedImages.map(img => ({
          id: img.id,
          image_url: img.imageUrl,
          source_url: img.sourceUrl,
          source_platform: img.sourcePlatform,
          caption: img.caption,
          hashtags: img.hashtags,
          engagement_metrics: img.engagementMetrics,
          posted_date: img.postedDate,
          user_info: img.userInfo,
        })),
        total: scrapedImages.length,
        limit: scrapedLimit,
        offset: scrapedOffset,
      },
      products: {
        items: products.map(p => ({
          product_id: p.productId,
          title: p.title,
          category: p.category,
          brand_name: p.brandName,
          image_url: p.imageUrl,
          price: p.price,
          extracted_metadata: p.extractedMetadata,
        })),
        total: products.length,
        limit: productsLimit,
        offset: productsOffset,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch unified data', message: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;

