$baseUrl = "http://localhost:3000"

Write-Host "=== Testing Vibe Search API ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Health Check" -ForegroundColor Yellow
Invoke-RestMethod -Uri "$baseUrl/health" -Method Get | ConvertTo-Json
Write-Host ""

Write-Host "2. Text Search - Basic" -ForegroundColor Yellow
$body = @{
    query = "beach shorts"
    top_k = 5
} | ConvertTo-Json

Invoke-RestMethod -Uri "$baseUrl/api/search/text" -Method Post -Body $body -ContentType "application/json" | ConvertTo-Json -Depth 5
Write-Host ""

Write-Host "3. Text Search - With Filters" -ForegroundColor Yellow
$body = @{
    query = "sneakers"
    top_k = 5
    filters = @{
        category = @("Footwear")
        brands = @("Nike")
        price_range = @(50, 200)
    }
} | ConvertTo-Json -Depth 3

Invoke-RestMethod -Uri "$baseUrl/api/search/text" -Method Post -Body $body -ContentType "application/json" | ConvertTo-Json -Depth 5
Write-Host ""

Write-Host "4. Image Search" -ForegroundColor Yellow
$body = @{
    external_image_url = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800"
    top_k = 5
} | ConvertTo-Json

Invoke-RestMethod -Uri "$baseUrl/api/search/image" -Method Post -Body $body -ContentType "application/json" | ConvertTo-Json -Depth 5
Write-Host ""

Write-Host "5. Hybrid Search" -ForegroundColor Yellow
$body = @{
    query = "sneakers"
    top_k = 5
} | ConvertTo-Json

Invoke-RestMethod -Uri "$baseUrl/api/search/hybrid" -Method Post -Body $body -ContentType "application/json" | ConvertTo-Json -Depth 5
Write-Host ""

Write-Host "6. Scraped Images Search - By Image" -ForegroundColor Yellow
$body = @{
    image_url = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800"
    top_k = 5
    platform = "pinterest"
} | ConvertTo-Json

Invoke-RestMethod -Uri "$baseUrl/api/search/scraped-images" -Method Post -Body $body -ContentType "application/json" | ConvertTo-Json -Depth 5
Write-Host ""

Write-Host "7. Scraped Images Search - By Text" -ForegroundColor Yellow
$body = @{
    query = "streetwear"
    top_k = 5
    platform = "pinterest"
} | ConvertTo-Json

Invoke-RestMethod -Uri "$baseUrl/api/search/scraped-images" -Method Post -Body $body -ContentType "application/json" | ConvertTo-Json -Depth 5
Write-Host ""

Write-Host "8. Get Scraped Images Gallery" -ForegroundColor Yellow
Invoke-RestMethod -Uri "$baseUrl/api/search/scraped-images?limit=10" -Method Get | ConvertTo-Json -Depth 5
Write-Host ""

Write-Host "9. Get Products" -ForegroundColor Yellow
Invoke-RestMethod -Uri "$baseUrl/api/search/products?limit=10" -Method Get | ConvertTo-Json -Depth 5
Write-Host ""

Write-Host "10. Get Unified Data (Scraped Images + Products Together)" -ForegroundColor Yellow
Invoke-RestMethod -Uri "$baseUrl/api/search/unified?scraped_limit=10&products_limit=10" -Method Get | ConvertTo-Json -Depth 5
Write-Host ""

Write-Host "11. Search Products from Scraped Image (Click to Search)" -ForegroundColor Yellow
$body = @{
    scraped_image_id = 1
    top_k = 5
} | ConvertTo-Json

Invoke-RestMethod -Uri "$baseUrl/api/search/from-scraped-image" -Method Post -Body $body -ContentType "application/json" | ConvertTo-Json -Depth 5
Write-Host ""

Write-Host "=== Tests Complete ===" -ForegroundColor Green

