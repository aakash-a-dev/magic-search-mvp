import 'dotenv/config';
import { EmbeddingProcessor } from '../services/embedding/embedding-processor';
import { EmbeddingClient } from '../services/embedding/embedding-client';

async function main() {
  const client = new EmbeddingClient();
  
  console.log('Checking embedding service health...');
  const isHealthy = await client.healthCheck();
  
  if (!isHealthy) {
    console.error('Embedding service is not available. Please start it first.');
    console.error('Run: cd embedding-service && python -m uvicorn app.main:app --reload');
    process.exit(1);
  }

  console.log('Checking if models are loaded...');
  let isReady = await client.readinessCheck();
  let attempts = 0;
  const maxAttempts = 60;
  
  while (!isReady && attempts < maxAttempts) {
    console.log(`Waiting for models to load... (${attempts + 1}/${maxAttempts})`);
    await new Promise(resolve => setTimeout(resolve, 2000));
    isReady = await client.readinessCheck();
    attempts++;
  }
  
  if (!isReady) {
    console.error('Models failed to load. Please check the embedding service logs.');
    process.exit(1);
  }

  console.log('✓ Embedding service is ready\n');

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

