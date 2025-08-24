import Link from "next/link";

interface Product {
  id: number;
  name: string;
  price: string;
  image: string;
}

interface ProductGridProps {
  title: string;
  products: Product[];
  bgColor: string;
  categorySlug?: string;
}

export const ProductGrid = ({ title, products, bgColor, categorySlug }: ProductGridProps) => {
  return (
    <section className={`py-16 ${bgColor}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{title}</h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-6">
            Explore our carefully curated selection of high-quality products designed for your professional and educational needs
          </p>
          <div className="w-24 h-1 bg-orange-500 mx-auto mb-8"></div>
          <Link 
            href={categorySlug ? `/categories/${categorySlug}` : "/products"} 
            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold"
          >
            {categorySlug ? `View All ${title} →` : "View All Products →"}
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {products.map((product) => (
            <Link key={product.id} href={`/products/${product.id}`}>
                <div 
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden group cursor-pointer"
                >
                <div className="aspect-square overflow-hidden">
                    <img 
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                </div>
                <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {product.name}
                    </h3>
                    <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-orange-600">{product.price}</span>
                    <button className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors">
                        Add to Cart
                    </button>
                    </div>
                </div>
                </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
