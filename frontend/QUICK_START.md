# Quick Start Guide

## Prerequisites

1. **Backend API must be running** on `http://localhost:3000`
   - Make sure you've started the server: `cd server && npm run dev`
   - Make sure the embedding service is running: `cd embedding-service && python -m uvicorn app.main:app --reload`

## Starting the Frontend

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies (if not already done):
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and go to:
```
http://localhost:3001
```

## Using the Application

### Text Search
1. Click on "Text Search" tab
2. Type what you're looking for (e.g., "beach shorts", "sneakers")
3. Press Enter or click "Search"
4. View results in the "Results" tab

### Image Search - Upload
1. Click on "Image Search" tab
2. Click "Choose Image" button
3. Select an image file from your computer
4. Click "Search Similar Products"
5. View results in the "Results" tab

### Image Search - URL
1. Click on "Image Search" tab
2. Switch to "Image URL" tab
3. Paste an image URL (e.g., from Unsplash, Pinterest)
4. Click "Search"
5. View results in the "Results" tab

### Gallery
1. Click on "Gallery" tab
2. Browse scraped images
3. Filter by platform (All, Pinterest, Instagram)
4. Click any image to find similar products
5. Results appear in a modal dialog

## Troubleshooting

### "Failed to fetch" errors
- Make sure backend API is running on port 3000
- Check browser console for detailed error messages
- Verify `NEXT_PUBLIC_API_URL` in `.env.local` is correct

### Images not loading
- Check that image URLs are accessible
- Some images may be blocked by CORS - this is normal
- The app will show "Image not available" for broken images

### Search returns no results
- Make sure products have been seeded: `cd server && npm run seed:products`
- Make sure embeddings have been generated: `cd server && npm run process:products`
- Check backend logs for errors

