import 'dotenv/config';
import { ProductService } from '../services/database/product.service';

const SAMPLE_PRODUCTS = [
  {
    productId: 'NK-001',
    title: 'Nike Dunk Low Panda Black White Sneakers',
    category: 'Footwear',
    brandName: 'Nike',
    imageUrl: 'https://example.com/nike-dunk-panda.jpg',
    price: 110.00,
  },
  {
    productId: 'AD-002',
    title: 'Adidas Originals Superstar White Black',
    category: 'Footwear',
    brandName: 'Adidas',
    imageUrl: 'https://example.com/adidas-superstar.jpg',
    price: 80.00,
  },
  {
    productId: 'PR-003',
    title: 'Prada Classic Leather Handbag Black',
    category: 'Accessories',
    brandName: 'Prada',
    imageUrl: 'https://example.com/prada-handbag.jpg',
    price: 2500.00,
  },
  {
    productId: 'PT-004',
    title: 'Patagonia Baggies 5" Shorts Blue',
    category: 'Bottoms',
    brandName: 'Patagonia',
    imageUrl: 'https://example.com/patagonia-baggies.jpg',
    price: 65.00,
  },
  {
    productId: 'RL-005',
    title: 'Ralph Lauren Classic Fit Swim Trunks Navy',
    category: 'Bottoms',
    brandName: 'Ralph Lauren',
    imageUrl: 'https://example.com/ralph-swim-trunks.jpg',
    price: 75.00,
  },
  {
    productId: 'RB-006',
    title: 'Ray-Ban Aviator Classic Gold',
    category: 'Accessories',
    brandName: 'Ray-Ban',
    imageUrl: 'https://example.com/rayban-aviator.jpg',
    price: 154.00,
  },
  {
    productId: 'CT-007',
    title: 'Cartier Santos Watch Stainless Steel',
    category: 'Accessories',
    brandName: 'Cartier',
    imageUrl: 'https://example.com/cartier-santos.jpg',
    price: 7500.00,
  },
  {
    productId: 'ST-008',
    title: 'Oversized Black Hoodie Streetwear',
    category: 'Tops',
    brandName: null,
    imageUrl: 'https://example.com/black-hoodie.jpg',
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

