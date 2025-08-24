interface ReviewImagesProps {
  images: string[];
}

const ReviewImages = ({ images }: ReviewImagesProps) => {
  return (
    <div className="mt-16">
      <h3 className="text-2xl font-bold mb-8 text-gray-900">Reviews with Images</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {images.map((image, index) => (
          <div key={index} className="aspect-square rounded-lg overflow-hidden">
            <img src={image} alt={`Review ${index + 1}`} className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewImages;