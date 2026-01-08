#!/bin/sh

echo "Waiting for database to be ready..."
sleep 10

echo "Setting up database schema..."
npm run db:push

echo "Initializing vector indexes..."
psql $DATABASE_URL -f prisma/init-vector-indexes.sql || echo "Vector indexes may already exist"

echo "Seeding products..."
npm run seed:products

echo "Waiting for embedding service to be ready..."
until curl -f http://embedding-service:8000/health/ready > /dev/null 2>&1; do
  echo "Waiting for embedding service..."
  sleep 5
done

echo "Processing product embeddings..."
npm run process:products

echo "Scraping Pinterest..."
npm run scrape:pinterest || echo "Pinterest scraping failed or incomplete"

echo "Scraping Instagram..."
npm run scrape:instagram || echo "Instagram scraping failed or incomplete"

echo "Processing scraped image embeddings..."
npm run process:images || echo "No scraped images to process"

echo "Initialization complete!"


