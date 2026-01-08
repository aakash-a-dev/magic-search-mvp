import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function runMigration() {
  console.log('🔄 Starting migration: Update text embeddings to 768 dimensions...\n');

  try {
    // Execute migration steps one by one (Prisma doesn't support multiple statements)
    console.log('📝 Step 1: Dropping existing index...');
    await prisma.$executeRawUnsafe(`
      DROP INDEX IF EXISTS product_text_embeddings_embedding_idx;
    `);
    console.log('   ✓ Index dropped\n');

    console.log('📝 Step 2: Deleting existing embeddings (they will be regenerated with new model)...');
    const deleteResult = await prisma.$executeRawUnsafe(`
      DELETE FROM product_text_embeddings;
    `);
    console.log('   ✓ Old embeddings deleted (will be regenerated with 768 dimensions)\n');

    console.log('📝 Step 3: Altering column to 768 dimensions...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE product_text_embeddings 
      ALTER COLUMN embedding TYPE vector(768);
    `);
    console.log('   ✓ Column updated to vector(768)\n');

    console.log('📝 Step 4: Recreating index...');
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS product_text_embeddings_embedding_idx 
      ON product_text_embeddings 
      USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100);
    `);
    console.log('   ✓ Index recreated\n');

    console.log('✅ Migration completed successfully!\n');
    console.log('📌 Next steps:');
    console.log('   1. Regenerate all product embeddings: npm run process:products');
    console.log('   2. The new embeddings will use 768 dimensions (all-mpnet-base-v2)\n');

  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    
    if (error.message.includes('does not exist')) {
      console.error('\n💡 Tip: Make sure the database and tables exist. Run: npm run db:push');
    } else if (error.message.includes('already exists') || error.message.includes('duplicate')) {
      console.error('\n💡 Tip: The column might already be updated. Check the current dimension with:');
      console.error('   SELECT column_name, data_type FROM information_schema.columns WHERE table_name = \'product_text_embeddings\' AND column_name = \'embedding\';');
    } else if (error.message.includes('cannot alter')) {
      console.error('\n💡 Tip: There might be existing data. You may need to clear old embeddings first.');
      console.error('   Consider: DELETE FROM product_text_embeddings; (if safe to do so)');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();

