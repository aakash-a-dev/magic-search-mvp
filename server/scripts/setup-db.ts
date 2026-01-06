import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

async function setupDatabase() {
  try {
    console.log('Enabling pgvector extension...');
    await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS vector;');
    console.log('✓ pgvector extension enabled');
    
    await prisma.$disconnect();
    
    console.log('\nRunning Prisma db push...');
    execSync('npx prisma db push', { stdio: 'inherit', cwd: process.cwd() });
    
    console.log('\n✓ Database setup complete!');
  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();

