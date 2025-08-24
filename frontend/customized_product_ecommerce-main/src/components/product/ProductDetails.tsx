interface ProductDetailsProps {
  description: string;
}

const ProductDetails = ({ description }: ProductDetailsProps) => {
  return (
    <div>
      <h3 className="text-xl font-bold mb-6 text-gray-900">Product Description</h3>
      <div
        className="text-gray-600 prose max-w-none"
        dangerouslySetInnerHTML={{ __html: description }}
      />
    </div>
  );
};

export default ProductDetails;

