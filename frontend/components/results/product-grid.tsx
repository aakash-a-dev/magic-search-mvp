'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Product } from '@/lib/api';
import Image from 'next/image';

interface ProductGridProps {
  products: Product[];
  loading: boolean;
}

export function ProductGrid({ products, loading }: ProductGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <Skeleton className="w-full h-64" />
            <CardHeader>
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2 mt-2" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">No products found</p>
        <p className="text-muted-foreground text-sm mt-2">
          Try adjusting your search terms or filters
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <Card key={product.product_id} className="overflow-hidden hover:shadow-lg transition-shadow">
          <div className="relative w-full h-64 bg-gray-100">
            <Image
              src={product.image_url}
              alt={product.title}
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
            {product.visual_score && (
              <Badge className="absolute top-2 right-2 bg-black/70">
                {Math.round(product.visual_score * 100)}% match
              </Badge>
            )}
            {product.semantic_score && (
              <Badge className="absolute top-2 right-2 bg-black/70">
                {Math.round(product.semantic_score * 100)}% match
              </Badge>
            )}
          </div>
          <CardHeader>
            <CardTitle className="text-lg line-clamp-2">{product.title}</CardTitle>
            <CardDescription>
              {product.brand_name && (
                <Badge variant="outline" className="mr-2">
                  {product.brand_name}
                </Badge>
              )}
              {product.category && (
                <Badge variant="secondary">{product.category}</Badge>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {product.price && (
              <p className="text-2xl font-bold">${product.price.toFixed(2)}</p>
            )}
            {product.match_reasons && product.match_reasons.length > 0 && (
              <div className="mt-2 space-y-1">
                {product.match_reasons.slice(0, 2).map((reason, idx) => (
                  <p key={idx} className="text-xs text-muted-foreground">
                    • {reason}
                  </p>
                ))}
              </div>
            )}
            {product.relevance_reasons && product.relevance_reasons.length > 0 && (
              <div className="mt-2 space-y-1">
                {product.relevance_reasons.slice(0, 2).map((reason, idx) => (
                  <p key={idx} className="text-xs text-muted-foreground">
                    • {reason}
                  </p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

