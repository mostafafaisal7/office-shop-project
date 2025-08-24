import { ApiProduct } from '@/services/api';

interface ProductFeaturesProps {
  product: ApiProduct;
}

const ProductFeatures = ({ product }: ProductFeaturesProps) => {
  return (
    <div>
      <h3 className="text-xl font-bold mb-6 text-gray-900">Product Features</h3>
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 text-sm">
          <div className="space-y-3 text-gray-700">
            <div><span className="font-medium">SKU:</span> {product.sku}</div>
            <div><span className="font-medium">Price:</span> ৳{product.base_price}</div>
            <div><span className="font-medium">Weight:</span> {product.weight}</div>
            {product.dimensions && (
              <div>
                <span className="font-medium">Dimensions:</span> {product.dimensions.length}" × {product.dimensions.width}" × {product.dimensions.height}"
              </div>
            )}
            <div><span className="font-medium">Customizable:</span> {product.is_customizable ? 'Yes' : 'No'}</div>
            <div><span className="font-medium">Status:</span> {product.status}</div>
            {product.tags && product.tags.length > 0 && (
              <div>
                <span className="font-medium">Tags:</span> {product.tags.join(', ')}
              </div>
            )}
            {/* {product.customization_options && product.customization_options.length > 0 && (
              <div>
                <span className="font-medium">Customization Options:</span>
                <ul className="mt-2 ml-4 list-disc">
                  {product.customization_options.map((option: any, index: number) => (
                    <li key={index}>{option.name || option.type}</li>
                  ))}
                </ul>
              </div>
            )} */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductFeatures;
