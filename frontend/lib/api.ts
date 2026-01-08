import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Product {
  product_id: string;
  title: string;
  category: string | null;
  brand_name: string | null;
  image_url: string;
  price: number | null;
  extracted_metadata?: any;
  visual_score?: number;
  semantic_score?: number;
  combined_score?: number;
  match_reasons?: string[];
  relevance_reasons?: string[];
  matched_terms?: string[];
}

export interface ScrapedImage {
  id: number;
  image_url: string;
  source_url: string | null;
  source_platform: string;
  caption: string | null;
  hashtags: string[];
  engagement_metrics?: any;
  posted_date?: string;
  user_info?: any;
  similarity_score?: number;
}

export interface SearchFilters {
  category?: string[];
  brands?: string[];
  price_range?: [number, number];
  colors?: string[];
}

export const searchAPI = {
  textSearch: async (query: string, topK: number = 10, filters?: SearchFilters) => {
    const response = await api.post('/api/search/text', {
      query,
      top_k: topK,
      filters,
    });
    return response.data;
  },

  imageSearchByURL: async (imageUrl: string, topK: number = 10, filters?: SearchFilters) => {
    const response = await api.post('/api/search/image', {
      external_image_url: imageUrl,
      top_k: topK,
      filters,
    });
    return response.data;
  },

  imageSearchByBase64: async (imageBase64: string, topK: number = 10, filters?: SearchFilters) => {
    const response = await api.post('/api/search/image', {
      image_base64: imageBase64,
      top_k: topK,
      filters,
    });
    return response.data;
  },

  imageSearchByFile: async (file: File, topK: number = 10, filters?: SearchFilters) => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('top_k', topK.toString());
    if (filters) {
      formData.append('filters', JSON.stringify(filters));
    }

    const response = await axios.post(`${API_BASE_URL}/api/search/image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  hybridSearch: async (
    imageUrl?: string,
    query?: string,
    topK: number = 10,
    filters?: SearchFilters,
    visualWeight: number = 0.6,
    textWeight: number = 0.4
  ) => {
    const response = await api.post('/api/search/hybrid', {
      image_url: imageUrl,
      query,
      top_k: topK,
      filters,
      visual_weight: visualWeight,
      text_weight: textWeight,
    });
    return response.data;
  },

  getScrapedImages: async (limit: number = 50, offset: number = 0, platform?: 'pinterest' | 'instagram') => {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    if (platform) {
      params.append('platform', platform);
    }
    const response = await api.get(`/api/search/scraped-images?${params}`);
    return response.data;
  },

  searchFromScrapedImage: async (scrapedImageId: number, topK: number = 10, filters?: SearchFilters) => {
    const response = await api.post('/api/search/from-scraped-image', {
      scraped_image_id: scrapedImageId,
      top_k: topK,
      filters,
    });
    return response.data;
  },

  getProducts: async (limit: number = 50, offset: number = 0) => {
    const response = await api.get(`/api/search/products?limit=${limit}&offset=${offset}`);
    return response.data;
  },

  getUnified: async (
    scrapedLimit: number = 20,
    productsLimit: number = 20,
    platform?: 'pinterest' | 'instagram'
  ) => {
    const params = new URLSearchParams({
      scraped_limit: scrapedLimit.toString(),
      products_limit: productsLimit.toString(),
    });
    if (platform) {
      params.append('platform', platform);
    }
    const response = await api.get(`/api/search/unified?${params}`);
    return response.data;
  },
};

