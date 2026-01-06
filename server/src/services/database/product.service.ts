import prisma from '../../config/database';
import { Prisma } from '@prisma/client';

export interface CreateProductInput {
  productId: string;
  title: string;
  category?: string;
  brandName?: string;
  imageUrl: string;
  price?: number;
  extractedMetadata?: Record<string, any>;
}

export class ProductService {
  async create(data: CreateProductInput) {
    return prisma.product.create({
      data: {
        productId: data.productId,
        title: data.title,
        category: data.category,
        brandName: data.brandName,
        imageUrl: data.imageUrl,
        price: data.price ? new Prisma.Decimal(data.price) : null,
        extractedMetadata: data.extractedMetadata as Prisma.JsonValue,
      },
    });
  }

  async createMany(products: CreateProductInput[]) {
    return prisma.product.createMany({
      data: products.map(p => ({
        productId: p.productId,
        title: p.title,
        category: p.category,
        brandName: p.brandName,
        imageUrl: p.imageUrl,
        price: p.price ? new Prisma.Decimal(p.price) : null,
        extractedMetadata: p.extractedMetadata as Prisma.JsonValue,
      })),
      skipDuplicates: true,
    });
  }

  async findById(productId: string) {
    return prisma.product.findUnique({
      where: { productId },
      include: {
        visualEmbedding: true,
        textEmbedding: true,
      },
    });
  }

  async findAll(limit: number = 100, offset: number = 0) {
    return prisma.product.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByCategory(category: string, limit: number = 100) {
    return prisma.product.findMany({
      where: { category },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByBrand(brandName: string, limit: number = 100) {
    return prisma.product.findMany({
      where: { brandName },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateMetadata(productId: string, metadata: Record<string, any>) {
    return prisma.product.update({
      where: { productId },
      data: {
        extractedMetadata: metadata as Prisma.JsonValue,
      },
    });
  }
}

