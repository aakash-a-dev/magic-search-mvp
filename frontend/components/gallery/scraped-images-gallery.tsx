'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Loader2 } from 'lucide-react';
import { searchAPI, ScrapedImage, Product } from '@/lib/api';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ProductGrid } from '@/components/results/product-grid';

interface ScrapedImagesGalleryProps {
  onResults?: (results: Product[]) => void;
}

export function ScrapedImagesGallery({ onResults }: ScrapedImagesGalleryProps) {
  const [images, setImages] = useState<ScrapedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<ScrapedImage | null>(null);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [platform, setPlatform] = useState<'pinterest' | 'instagram' | undefined>();

  useEffect(() => {
    loadImages();
  }, [platform]);

  const loadImages = async () => {
    setLoading(true);
    try {
      const response = await searchAPI.getScrapedImages(50, 0, platform);
      setImages(response.images || []);
    } catch (error) {
      console.error('Error loading images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = async (image: ScrapedImage) => {
    setSelectedImage(image);
    setSearching(true);
    setSearchResults([]);

    try {
      const response = await searchAPI.searchFromScrapedImage(image.id, 20);
      setSearchResults(response.matches || []);
      if (onResults) {
        onResults(response.matches || []);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(12)].map((_, i) => (
          <Skeleton key={i} className="w-full h-64" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          variant={platform === undefined ? 'default' : 'outline'}
          onClick={() => setPlatform(undefined)}
        >
          All
        </Button>
        <Button
          variant={platform === 'pinterest' ? 'default' : 'outline'}
          onClick={() => setPlatform('pinterest')}
        >
          Pinterest
        </Button>
        <Button
          variant={platform === 'instagram' ? 'default' : 'outline'}
          onClick={() => setPlatform('instagram')}
        >
          Instagram
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image) => (
          <Card
            key={image.id}
            className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handleImageClick(image)}
          >
            <div className="relative w-full h-64 bg-gray-100">
              <Image
                src={image.image_url}
                alt={image.caption || 'Scraped image'}
                fill
                className="object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  const parent = (e.target as HTMLImageElement).parentElement;
                  if (parent) {
                    parent.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">Image not available</div>';
                  }
                }}
              />
              <Badge className="absolute top-2 right-2 bg-black/70">
                {image.source_platform}
              </Badge>
            </div>
            {image.caption && (
              <CardContent className="p-3">
                <p className="text-sm line-clamp-2">{image.caption}</p>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Similar Products</DialogTitle>
            <DialogDescription>
              Products matching the selected image
            </DialogDescription>
          </DialogHeader>
          {searching ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <ProductGrid products={searchResults} loading={false} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

