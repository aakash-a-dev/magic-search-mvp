import { EmbeddingClient } from './embedding-client';
import prisma from '../../config/database';
import { Prisma } from '@prisma/client';

export class EmbeddingProcessor {
  private client: EmbeddingClient;

  constructor() {
    this.client = new EmbeddingClient();
  }

  async processProduct(productId: string): Promise<void> {
    const product = await prisma.product.findUnique({
      where: { productId },
    });

    if (!product) {
      throw new Error(`Product ${productId} not found`);
    }

    const metadata = await this.client.extractMetadata(product.title, product.imageUrl).catch(() => {
      return this.client.extractMetadata(product.title);
    });
    
    await prisma.product.update({
      where: { productId },
      data: {
        extractedMetadata: metadata as Prisma.JsonValue,
      },
    });

    // Create enriched text for better embeddings: include title, category, brand, colors, style
    const enrichedText = this.createEnrichedText(product.title, metadata, product.category, product.brandName);
    const textEmbedding = await this.client.generateTextEmbedding(enrichedText);

    await prisma.$executeRaw`
      INSERT INTO product_text_embeddings (product_id, embedding, text_source, model_version, created_at)
      VALUES (${product.productId}, ${this.arrayToVector(textEmbedding)}::vector, 'enriched', 'all-mpnet-base-v2', NOW())
      ON CONFLICT (product_id) DO UPDATE
      SET embedding = EXCLUDED.embedding,
          model_version = EXCLUDED.model_version,
          created_at = NOW()
    `;

    try {
      const visualEmbedding = await this.client.generateImageEmbedding(product.imageUrl);
      await prisma.$executeRaw`
        INSERT INTO product_visual_embeddings (product_id, embedding, model_version, created_at)
        VALUES (${product.productId}, ${this.arrayToVector(visualEmbedding)}::vector, 'clip-vit-base-patch32', NOW())
        ON CONFLICT (product_id) DO UPDATE
        SET embedding = EXCLUDED.embedding,
            model_version = EXCLUDED.model_version,
            created_at = NOW()
      `;
    } catch (error: any) {
      console.warn(`⚠ Skipping visual embedding for ${productId}: ${error.message || 'Image URL invalid or unreachable'}`);
    }
  }

  async processScrapedImage(scrapedImageId: number): Promise<void> {
    const scrapedImage = await prisma.scrapedImage.findUnique({
      where: { id: scrapedImageId },
    });

    if (!scrapedImage) {
      throw new Error(`Scraped image ${scrapedImageId} not found`);
    }

    try {
      const visualEmbedding = await this.client.generateImageEmbedding(scrapedImage.imageUrl);
      await prisma.$executeRaw`
        INSERT INTO scraped_image_embeddings (scraped_image_id, embedding, model_version, created_at)
        VALUES (${scrapedImageId}, ${this.arrayToVector(visualEmbedding)}::vector, 'clip-vit-base-patch32', NOW())
        ON CONFLICT (scraped_image_id) DO UPDATE
        SET embedding = EXCLUDED.embedding,
            model_version = EXCLUDED.model_version,
            created_at = NOW()
      `;
    } catch (error: any) {
      throw new Error(`Failed to process image ${scrapedImageId}: ${error.message || 'Image URL invalid or unreachable'}`);
    }
  }

  async processBatchProducts(productIds: string[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const productId of productIds) {
      try {
        await this.processProduct(productId);
        success++;
      } catch (error) {
        console.error(`Failed to process product ${productId}:`, error);
        failed++;
      }
    }

    return { success, failed };
  }

  async processBatchScrapedImages(scrapedImageIds: number[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const id of scrapedImageIds) {
      try {
        await this.processScrapedImage(id);
        success++;
      } catch (error) {
        console.error(`Failed to process scraped image ${id}:`, error);
        failed++;
      }
    }

    return { success, failed };
  }

  async processAllProducts(): Promise<{ success: number; failed: number }> {
    const products = await prisma.product.findMany({
      select: { productId: true },
    });

    const productIds = products.map(p => p.productId);
    return this.processBatchProducts(productIds);
  }

  async processAllScrapedImages(): Promise<{ success: number; failed: number }> {
    const scrapedImages = await prisma.scrapedImage.findMany({
      select: { id: true },
    });

    const ids = scrapedImages.map(img => img.id);
    return this.processBatchScrapedImages(ids);
  }

  private createEnrichedText(
    title: string,
    metadata: any,
    category: string | null,
    brandName: string | null
  ): string {
    const parts: string[] = [title];
    
    if (brandName) parts.push(brandName);
    if (category) parts.push(category);
    
    if (metadata) {
      if (metadata.brand) parts.push(metadata.brand);
      if (metadata.category) parts.push(metadata.category);
      if (metadata.colors && Array.isArray(metadata.colors) && metadata.colors.length > 0) {
        parts.push(metadata.colors.join(' '));
      }
      if (metadata.style && Array.isArray(metadata.style) && metadata.style.length > 0) {
        parts.push(metadata.style.join(' '));
      }
      if (metadata.type) parts.push(metadata.type);
    }
    
    return parts.join(' ').trim();
  }

  private arrayToVector(arr: number[]): string {
    return `[${arr.join(',')}]`;
  }
}

