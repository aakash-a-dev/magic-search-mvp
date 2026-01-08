# Vibe Search Frontend

A modern, user-friendly Next.js frontend for the Vibe Search multimodal fashion search application.

## Features

- 🔍 **Text Search**: Natural language search for products
- 🖼️ **Image Search**: Upload images or paste image URLs to find similar products
- 🎨 **Gallery View**: Browse scraped images from Pinterest and Instagram
- 📱 **Responsive Design**: Works beautifully on all devices
- ⚡ **Fast & Modern**: Built with Next.js 16 and ShadCN UI

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Backend API running on `http://localhost:3000`

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` file (already created):
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Text Search
1. Go to the "Text Search" tab
2. Type what you're looking for (e.g., "beach shorts", "sneakers")
3. Click "Search" or press Enter
4. View matching products in the Results tab

### Image Search
1. Go to the "Image Search" tab
2. Choose one of two options:
   - **Upload Image**: Click "Choose Image" and select a file from your device
   - **Image URL**: Paste an image URL in the text field
3. Click "Search Similar Products"
4. View matching products in the Results tab

### Gallery
1. Go to the "Gallery" tab
2. Browse scraped images from Pinterest and Instagram
3. Filter by platform (All, Pinterest, Instagram)
4. Click any image to find similar products
5. View results in a modal dialog

## Project Structure

```
frontend/
├── app/
│   ├── page.tsx          # Main page with tabs
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── components/
│   ├── search/
│   │   ├── text-search.tsx      # Text search component
│   │   └── image-search.tsx     # Image search component
│   ├── results/
│   │   └── product-grid.tsx     # Product results display
│   ├── gallery/
│   │   └── scraped-images-gallery.tsx  # Gallery component
│   └── ui/               # ShadCN UI components
├── lib/
│   └── api.ts            # API client functions
└── README.md
```

## Technologies

- **Next.js 16**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **ShadCN UI**: Beautiful, accessible component library
- **Axios**: HTTP client for API requests
- **Lucide React**: Icon library

## API Integration

The frontend uses the following API endpoints:

- `POST /api/search/text` - Text search
- `POST /api/search/image` - Image search (URL, base64, or file upload)
- `GET /api/search/scraped-images` - Get scraped images gallery
- `POST /api/search/from-scraped-image` - Search products from scraped image

All API calls are handled in `lib/api.ts`.

## Building for Production

```bash
npm run build
npm start
```

## Troubleshooting

### Images not loading
- Make sure the backend API is running
- Check that image URLs are accessible
- Verify `NEXT_PUBLIC_API_URL` in `.env.local`

### Search not working
- Ensure backend API is running on port 3000
- Check browser console for errors
- Verify API endpoints are accessible

### File upload issues
- Check file size (max 10MB)
- Ensure file is a valid image format
- Verify backend supports multipart/form-data
