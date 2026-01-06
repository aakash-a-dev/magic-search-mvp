import 'dotenv/config';
import { EmbeddingProcessor } from '../services/embedding/embedding-processor';
import { EmbeddingClient } from '../services/embedding/embedding-client';

async function main() {
  const client = new EmbeddingClient();
  
  console.log('Checking embedding service health...');
  const isHealthy = await client.healthCheck();
  
  if (!isHealthy) {
    console.error('Embedding service is not available. Please start it first.');
    console.error('Run: cd embedding-service && uvicorn app.main:app --reload');
    process.exit(1);
  }

  console.log('✓ Embedding service is healthy\n');

  const processor = new EmbeddingProcessor();
  
  const imageId = process.argv[2];
  
  if (imageId) {
    console.log(`Processing single scraped image: ${imageId}`);
    try {
      await processor.processScrapedImage(parseInt(imageId));
      console.log(`✓ Successfully processed scraped image ${imageId}`);
    } catch (error) {
      console.error(`✗ Failed to process scraped image:`, error);
      process.exit(1);
    }
  } else {
    console.log('Processing all scraped images...\n');
    const result = await processor.processAllScrapedImages();
    console.log(`\n✓ Processing complete:`);
    console.log(`  Success: ${result.success}`);
    console.log(`  Failed: ${result.failed}`);
  }
}

main();

