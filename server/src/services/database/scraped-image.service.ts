import prisma from '../../config/database';

export interface FindAllOptions {
  limit?: number;
  offset?: number;
  platform?: 'pinterest' | 'instagram';
}

export class ScrapedImageService {
  async findAll(options: FindAllOptions = {}) {
    const { limit = 100, offset = 0, platform } = options;
    return prisma.scrapedImage.findMany({
      where: platform ? { sourcePlatform: platform } : undefined,
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByPlatform(platform: 'pinterest' | 'instagram', limit: number = 100) {
    return prisma.scrapedImage.findMany({
      where: { sourcePlatform: platform },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: number) {
    return prisma.scrapedImage.findUnique({
      where: { id },
      include: { embedding: true },
    });
  }

  async count() {
    return prisma.scrapedImage.count();
  }

  async countByPlatform(platform: 'pinterest' | 'instagram') {
    return prisma.scrapedImage.count({
      where: { sourcePlatform: platform },
    });
  }
}

