'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Loader2 } from 'lucide-react';
import { searchAPI, Product } from '@/lib/api';

interface TextSearchProps {
  onResults: (results: Product[]) => void;
  onLoading: (loading: boolean) => void;
}

export function TextSearch({ onResults, onLoading }: TextSearchProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    onLoading(true);

    try {
      const response = await searchAPI.textSearch(query, 20);
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
      handleSearch();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Search by Text</CardTitle>
        <CardDescription>
          Describe what you're looking for in natural language
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Input
            placeholder="e.g., beach shorts, sneakers, luxury watch..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={isSearching || !query.trim()}>
            {isSearching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Search
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}




