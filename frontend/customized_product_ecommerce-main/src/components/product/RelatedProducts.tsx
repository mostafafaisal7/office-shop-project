import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface RelatedProduct {
  id: number;
  name: string;
  price: string;
  image: string;
  categoryName?: string;
}

interface RelatedProductsProps {
  products: RelatedProduct[];
}

const RelatedProducts = ({ products }: RelatedProductsProps) => {
  return (
    <div className="mt-16">
      <h3 className="text-2xl font-bold mb-8 text-gray-900">Related products</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {products.map((product) => (
          <Link key={product.id} href={`/products/${product.id}`}>
            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-square overflow-hidden">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
              </div>
              <CardContent className="p-4">
                <div className="text-xs text-gray-500 mb-1">
                  {product.categoryName?.toUpperCase() || 'CUSTOM PRODUCTS'}
                </div>
                <h4 className="font-medium text-sm mb-2">{product.name}</h4>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-green-600">{product.price}</span>
                  <Button size="sm" className="bg-teal-500 hover:bg-teal-600">
                    SELECT OPTIONS
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RelatedProducts;
