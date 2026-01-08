'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TextSearch } from '@/components/search/text-search';
import { ImageSearch } from '@/components/search/image-search';
import { ProductGrid } from '@/components/results/product-grid';
import { ScrapedImagesGallery } from '@/components/gallery/scraped-images-gallery';
import { Product } from '@/lib/api';
import { Search, Image as ImageIcon, Images } from 'lucide-react';

export default function Home() {
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('text');

  const handleResults = (results: Product[]) => {
    setSearchResults(results);
    setActiveTab('results');
  };

  const handleLoading = (isLoading: boolean) => {
    setLoading(isLoading);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2">Vibe Search</h1>
          <p className="text-muted-foreground text-lg">
            Find fashion products using text, images, or browse our gallery
          </p>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="text">
              <Search className="mr-2 h-4 w-4" />
              Text Search
            </TabsTrigger>
            <TabsTrigger value="image">
              <ImageIcon className="mr-2 h-4 w-4" />
              Image Search
            </TabsTrigger>
            <TabsTrigger value="gallery">
              <Images className="mr-2 h-4 w-4" />
              Gallery
            </TabsTrigger>
            <TabsTrigger value="results">
              Results ({searchResults.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="space-y-6">
            <TextSearch onResults={handleResults} onLoading={handleLoading} />
          </TabsContent>

          <TabsContent value="image" className="space-y-6">
            <ImageSearch onResults={handleResults} onLoading={handleLoading} />
          </TabsContent>

          <TabsContent value="gallery" className="space-y-6">
            <div className="mb-4">
              <h2 className="text-2xl font-semibold mb-2">Browse Images</h2>
              <p className="text-muted-foreground">
                Click on any image to find similar products
              </p>
            </div>
            <ScrapedImagesGallery onResults={handleResults} />
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            <div className="mb-4">
              <h2 className="text-2xl font-semibold mb-2">
                Search Results ({searchResults.length})
              </h2>
            </div>
            <ProductGrid products={searchResults} loading={loading} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
