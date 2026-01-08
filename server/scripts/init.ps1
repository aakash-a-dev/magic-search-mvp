Write-Host "Waiting for database to be ready..."
Start-Sleep -Seconds 10

Write-Host "Setting up database schema..."
npm run db:push

Write-Host "Initializing vector indexes..."
$env:PGPASSWORD = "postgres"
psql -h postgres -U postgres -d vibe_search -f prisma/init-vector-indexes.sql
if ($LASTEXITCODE -ne 0) {
    Write-Host "Vector indexes may already exist"
}

Write-Host "Seeding products..."
npm run seed:products

Write-Host "Waiting for embedding service to be ready..."
$maxAttempts = 60
$attempt = 0
do {
    try {
        $response = Invoke-WebRequest -Uri "http://embedding-service:8000/health/ready" -TimeoutSec 2 -ErrorAction Stop
        break
    } catch {
        $attempt++
        if ($attempt -lt $maxAttempts) {
            Write-Host "Waiting for embedding service... ($attempt/$maxAttempts)"
            Start-Sleep -Seconds 5
        } else {
            Write-Host "Embedding service not ready, continuing anyway..."
        }
    }
} while ($attempt -lt $maxAttempts)

Write-Host "Processing product embeddings..."
npm run process:products

Write-Host "Scraping Pinterest..."
npm run scrape:pinterest
if ($LASTEXITCODE -ne 0) {
    Write-Host "Pinterest scraping failed or incomplete"
}

Write-Host "Scraping Instagram..."
npm run scrape:instagram
if ($LASTEXITCODE -ne 0) {
    Write-Host "Instagram scraping failed or incomplete"
}

Write-Host "Processing scraped image embeddings..."
npm run process:images
if ($LASTEXITCODE -ne 0) {
    Write-Host "No scraped images to process"
}

Write-Host "Initialization complete!"


