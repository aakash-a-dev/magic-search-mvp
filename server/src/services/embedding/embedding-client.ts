import axios, { AxiosInstance } from 'axios';

export interface ImageEmbeddingRequest {
  image_url: string;
}

export interface TextEmbeddingRequest {
  text: string;
}

export interface BatchImageEmbeddingRequest {
  image_urls: string[];
}

export interface BatchTextEmbeddingRequest {
  texts: string[];
}

export interface EmbeddingResponse {
  embedding: number[];
  dimension: number;
}

export interface MetadataRequest {
  title: string;
  image_url?: string;
}

export interface MetadataResponse {
  brand?: string;
  category?: string;
  colors: string[];
  style: string[];
  type?: string;
  dominant_colors?: number[][];
}

export class EmbeddingClient {
  private client: AxiosInstance;

  constructor(baseURL: string = process.env.EMBEDDING_SERVICE_URL || 'http://localhost:8000') {
    this.client = axios.create({
      baseURL,
      timeout: 120000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async generateImageEmbedding(imageUrl: string): Promise<number[]> {
    const response = await this.client.post<EmbeddingResponse>(
      '/api/v1/embeddings/image',
      { image_url: imageUrl }
    );
    return response.data.embedding;
  }

  async generateTextEmbedding(text: string): Promise<number[]> {
    const response = await this.client.post<EmbeddingResponse>(
      '/api/v1/embeddings/text',
      { text }
    );
    return response.data.embedding;
  }

  async generateBatchImageEmbeddings(imageUrls: string[]): Promise<number[][]> {
    const response = await this.client.post<EmbeddingResponse[]>(
      '/api/v1/embeddings/image/batch',
      { image_urls: imageUrls }
    );
    return response.data.map(item => item.embedding);
  }

  async generateBatchTextEmbeddings(texts: string[]): Promise<number[][]> {
    const response = await this.client.post<EmbeddingResponse[]>(
      '/api/v1/embeddings/text/batch',
      { texts }
    );
    return response.data.map(item => item.embedding);
  }

  async extractMetadata(title: string, imageUrl?: string): Promise<MetadataResponse> {
    const response = await this.client.post<MetadataResponse>(
      '/api/v1/metadata/extract',
      { title, image_url: imageUrl }
    );
    return response.data;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch {
      return false;
    }
  }

  async readinessCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health/ready');
      return response.status === 200;
    } catch {
      return false;
    }
  }
}

