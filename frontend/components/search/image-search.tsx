'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Link as LinkIcon, Loader2, X, Search } from 'lucide-react';
import { searchAPI, Product } from '@/lib/api';

interface ImageSearchProps {
  onResults: (results: Product[]) => void;
  onLoading: (loading: boolean) => void;
}

export function ImageSearch({ onResults, onLoading }: ImageSearchProps) {
  const [imageUrl, setImageUrl] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSearchByURL = async () => {
    if (!imageUrl.trim()) return;

    setIsSearching(true);
    onLoading(true);

    try {
      const response = await searchAPI.imageSearchByURL(imageUrl, 20);
      onResults(response.matches || []);
    } catch (error) {
      console.error('Search error:', error);
      onResults([]);
    } finally {
      setIsSearching(false);
      onLoading(false);
    }
  };

  const handleSearchByFile = async () => {
    if (!fileInputRef.current?.files?.[0]) return;

    const file = fileInputRef.current.files[0];
    setIsSearching(true);
    onLoading(true);

    try {
      const response = await searchAPI.imageSearchByFile(file, 20);
      onResults(response.matches || []);
    } catch (error) {
      console.error('Search error:', error);
      onResults([]);
    } finally {
      setIsSearching(false);
      onLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchByURL();
    }
  };

  const clearUploadedImage = () => {
    setUploadedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Search by Image</CardTitle>
        <CardDescription>
          Upload an image or paste an image URL to find similar products
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload Image</TabsTrigger>
            <TabsTrigger value="url">Image URL</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="image-upload"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Choose Image
                </Button>
              </div>

              {uploadedImage && (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={uploadedImage}
                    alt="Uploaded"
                    className="w-full h-64 object-contain rounded-lg border"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={clearUploadedImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <Button
                onClick={handleSearchByFile}
                disabled={isSearching || !uploadedImage}
                className="w-full"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Search Similar Products
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="url" className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Paste image URL here..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button onClick={handleSearchByURL} disabled={isSearching || !imageUrl.trim()}>
                {isSearching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <LinkIcon className="mr-2 h-4 w-4" />
                    Search
                  </>
                )}
              </Button>
            </div>
            {imageUrl && (
              <div className="mt-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-full h-64 object-contain rounded-lg border"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

