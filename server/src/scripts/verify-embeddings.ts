import 'dotenv/config';
import prisma from '../config/database';

async function verifyEmbeddings() {
  console.log('🔍 Verifying Embeddings...\n');

  const totalProducts = await prisma.product.count();
  const productsWithTextEmbedding = await prisma.productTextEmbedding.count();
  const productsWithVisualEmbedding = await prisma.productVisualEmbedding.count();

  const totalScrapedImages = await prisma.scrapedImage.count();
  const scrapedImagesWithEmbedding = await prisma.scrapedImageEmbedding.count();

  console.log('📊 PRODUCT EMBEDDINGS:');
  console.log(`  Total Products: ${totalProducts}`);
  console.log(`  ✅ Text Embeddings: ${productsWithTextEmbedding} (${((productsWithTextEmbedding / totalProducts) * 100).toFixed(1)}%)`);
  console.log(`  ✅ Visual Embeddings: ${productsWithVisualEmbedding} (${((productsWithVisualEmbedding / totalProducts) * 100).toFixed(1)}%)`);
  
  if (productsWithTextEmbedding < totalProducts) {
    console.log(`  ⚠️  Missing Text Embeddings: ${totalProducts - productsWithTextEmbedding}`);
  }
  if (productsWithVisualEmbedding < totalProducts) {
    console.log(`  ⚠️  Missing Visual Embeddings: ${totalProducts - productsWithVisualEmbedding}`);
    
    const productsWithoutVisual = await prisma.product.findMany({
      where: {
        visualEmbedding: null,
      },
      select: {
        productId: true,
        title: true,
        imageUrl: true,
      },
    });
    
    console.log(`\n  Products missing visual embeddings:`);
    productsWithoutVisual.forEach(p => {
      const isPlaceholder = p.imageUrl.includes('example.com');
      console.log(`    - ${p.productId}: ${p.title.substring(0, 40)}... ${isPlaceholder ? '(Placeholder URL)' : ''}`);
    });
  }

  console.log('\n📊 SCRAPED IMAGE EMBEDDINGS:');
  console.log(`  Total Scraped Images: ${totalScrapedImages}`);
  console.log(`  ✅ Visual Embeddings: ${scrapedImagesWithEmbedding} (${((scrapedImagesWithEmbedding / totalScrapedImages) * 100).toFixed(1)}%)`);
  
  if (scrapedImagesWithEmbedding < totalScrapedImages) {
    console.log(`  ⚠️  Missing Embeddings: ${totalScrapedImages - scrapedImagesWithEmbedding}`);
  }

  console.log('\n📊 EMBEDDING QUALITY CHECK:');
  
  const textEmbeddings = await prisma.productTextEmbedding.findMany({
    select: {
      productId: true,
      modelVersion: true,
      textSource: true,
      createdAt: true,
    },
    take: 5,
  });

  const visualEmbeddings = await prisma.productVisualEmbedding.findMany({
    select: {
      productId: true,
      modelVersion: true,
      createdAt: true,
    },
    take: 5,
  });

  const scrapedEmbeddings = await prisma.scrapedImageEmbedding.findMany({
    select: {
      scrapedImageId: true,
      modelVersion: true,
      createdAt: true,
    },
    take: 5,
  });

  console.log('\n  Sample Text Embeddings:');
  textEmbeddings.forEach(e => {
    console.log(`    ✓ ${e.productId}: ${e.textSource} (${e.modelVersion})`);
  });

  console.log('\n  Sample Visual Embeddings (Products):');
  visualEmbeddings.forEach(e => {
    console.log(`    ✓ ${e.productId}: ${e.modelVersion}`);
  });

  console.log('\n  Sample Visual Embeddings (Scraped Images):');
  scrapedEmbeddings.forEach(e => {
    console.log(`    ✓ Scraped Image #${e.scrapedImageId}: ${e.modelVersion}`);
  });

  console.log('\n✅ Verification Complete!\n');

  const allGood = 
    productsWithTextEmbedding === totalProducts &&
    productsWithVisualEmbedding === totalProducts &&
    scrapedImagesWithEmbedding === totalScrapedImages;

  if (allGood) {
    console.log('🎉 All embeddings are correctly stored!');
  } else {
    console.log('⚠️  Some embeddings are missing. Run processing scripts to generate them.');
    console.log('\n  To fix missing embeddings:');
    if (productsWithTextEmbedding < totalProducts || productsWithVisualEmbedding < totalProducts) {
      console.log('    npm run process:products');
    }
    if (scrapedImagesWithEmbedding < totalScrapedImages) {
      console.log('    npm run process:images');
    }
  }
}

verifyEmbeddings()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

