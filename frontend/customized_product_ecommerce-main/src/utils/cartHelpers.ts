import { useCartStore } from '@/store/cartStore';

// Call this function when the user saves a design on the canvas
export const addCustomDesignToCart = async (options: {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  size?: string;
  color?: string;
  previewImageUrl: string; // The canvas-generated image URL
  customizationId: number;
}) => {
  const cartStore = useCartStore.getState();

  const { productId, productName, quantity, price, size, color, previewImageUrl, customizationId } = options;

  const newItem = {
    productId,
    name: productName,
    size,
    color,
    quantity,
    price,
    customDesign: true,
    image: previewImageUrl,        // ✅ Immediately use the canvas preview
    customizationId,               // Link to backend customization
  };

  await cartStore.addItem(newItem);

  if (customizationId) {
    await cartStore.generatePreviewForItem(
      `${productId}-${size || 'default'}-${color || 'default'}`,
      customizationId
    );
  }

  console.log('✅ Custom design added to cart with preview:', previewImageUrl);
};
