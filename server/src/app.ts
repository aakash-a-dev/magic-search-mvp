import express from 'express';
import cors from 'cors';
import searchRoutes from './routes/search.routes';

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'vibe-search-api' });
});

app.use('/api/search', searchRoutes);

app.get('/', (req, res) => {
  res.json({
    service: 'Vibe Search API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      unified: 'GET /api/search/unified',
      products: 'GET /api/search/products',
      scrapedImagesGallery: 'GET /api/search/scraped-images',
      imageSearch: 'POST /api/search/image (supports: URL, base64, or file upload)',
      textSearch: 'POST /api/search/text',
      hybridSearch: 'POST /api/search/hybrid',
      searchFromScrapedImage: 'POST /api/search/from-scraped-image',
      scrapedImagesSearch: 'POST /api/search/scraped-images',
    },
  });
});

export default app;

