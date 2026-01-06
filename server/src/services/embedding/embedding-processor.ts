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

    const metadata = await this.client.extractMetadata(product.title, product.imageUrl);
    
    await prisma.product.update({
      where: { productId },
      data: {
        extractedMetadata: metadata as Prisma.JsonValue,
      },
    });

    const [visualEmbedding, textEmbedding] = await Promise.all([
      this.client.generateImageEmbedding(product.imageUrl),
      this.client.generateTextEmbedding(product.title),
    ]);

    await Promise.all([
      prisma.$executeRaw`
        INSERT INTO product_visual_embeddings (product_id, embedding, model_version, created_at)
        VALUES (${product.productId}, ${this.arrayToVector(visualEmbedding)}::vector, 'clip-vit-base-patch32', NOW())
        ON CONFLICT (product_id) DO UPDATE
        SET embedding = EXCLUDED.embedding,
            model_version = EXCLUDED.model_version,
            created_at = NOW()
      `,
      prisma.$executeRaw`
        INSERT INTO product_text_embeddings (product_id, embedding, text_source, model_version, created_at)
        VALUES (${product.productId}, ${this.arrayToVector(textEmbedding)}::vector, 'title', 'all-MiniLM-L6-v2', NOW())
        ON CONFLICT (product_id) DO UPDATE
        SET embedding = EXCLUDED.embedding,
            model_version = EXCLUDED.model_version,
            created_at = NOW()
      `,
    ]);
  }

  async processScrapedImage(scrapedImageId: number): Promise<void> {
    const scrapedImage = await prisma.scrapedImage.findUnique({
      where: { id: scrapedImageId },
    });

    if (!scrapedImage) {
      throw new Error(`Scraped image ${scrapedImageId} not found`);
    }

    const visualEmbedding = await this.client.generateImageEmbedding(scrapedImage.imageUrl);

    let textEmbedding: number[] | null = null;
    if (scrapedImage.caption) {
      textEmbedding = await this.client.generateTextEmbedding(scrapedImage.caption);
    }

    await prisma.$executeRaw`
      INSERT INTO scraped_image_embeddings (scraped_image_id, embedding, model_version, created_at)
      VALUES (${scrapedImageId}, ${this.arrayToVector(visualEmbedding)}::vector, 'clip-vit-base-patch32', NOW())
      ON CONFLICT (scraped_image_id) DO UPDATE
      SET embedding = EXCLUDED.embedding,
          model_version = EXCLUDED.model_version,
          created_at = NOW()
    `;
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

  private arrayToVector(arr: number[]): string {
    return `[${arr.join(',')}]`;
  }
}

