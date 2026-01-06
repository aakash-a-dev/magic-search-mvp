import 'dotenv/config';
import { ProductService } from '../services/database/product.service';

const SAMPLE_PRODUCTS = [
  {
    productId: 'NK-001',
    title: 'Nike Dunk Low Panda Black White Sneakers',
    category: 'Footwear',
    brandName: 'Nike',
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
    price: 110.00,
  },
  {
    productId: 'AD-002',
    title: 'Adidas Originals Superstar White Black',
    category: 'Footwear',
    brandName: 'Adidas',
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800',
    price: 80.00,
  },
  {
    productId: 'PR-003',
    title: 'Prada Classic Leather Handbag Black',
    category: 'Accessories',
    brandName: 'Prada',
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800',
    price: 2500.00,
  },
  {
    productId: 'PT-004',
    title: 'Patagonia Baggies 5" Shorts Blue',
    category: 'Bottoms',
    brandName: 'Patagonia',
    imageUrl: 'https://images.unsplash.com/photo-1506629905607-ccf4c0e1b0c3?w=800',
    price: 65.00,
  },
  {
    productId: 'RL-005',
    title: 'Ralph Lauren Classic Fit Swim Trunks Navy',
    category: 'Bottoms',
    brandName: 'Ralph Lauren',
    imageUrl: 'https://images.unsplash.com/photo-1506629905607-ccf4c0e1b0c3?w=800',
    price: 75.00,
  },
  {
    productId: 'RB-006',
    title: 'Ray-Ban Aviator Classic Gold',
    category: 'Accessories',
    brandName: 'Ray-Ban',
    imageUrl: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800',
    price: 154.00,
  },
  {
    productId: 'CT-007',
    title: 'Cartier Santos Watch Stainless Steel',
    category: 'Accessories',
    brandName: 'Cartier',
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
    price: 7500.00,
  },
  {
    productId: 'ST-008',
    title: 'Oversized Black Hoodie Streetwear',
    category: 'Tops',
    brandName: null,
    imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800',
    price: 45.00,
  },
];

async function main() {
  const productService = new ProductService();

  try {
    console.log('Seeding products...');
    const result = await productService.createMany(SAMPLE_PRODUCTS);
    console.log(`✓ Seeded ${result.count} products`);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

main();

