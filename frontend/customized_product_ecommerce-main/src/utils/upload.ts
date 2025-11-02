// import { uploadProductMedia } from './uploadsApi'; // your existing function
import { useAuthStore } from '@/store/authStore';



export async function uploadProductMedia(file: File, productId: number, token: string) {
  const formData = new FormData();
  formData.append("file", file); // Make sure 'file' matches backend

  // Use environment variable for API URL
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

  // Use customer upload endpoint that uses same infrastructure as admin
  const response = await fetch(`${API_URL}/products/${productId}/customer-upload`, {
    method: "POST",
    body: formData,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    let errorMessage = "Failed to upload file";
    try {
      const error = await response.json();
      errorMessage = error.detail || errorMessage;
    } catch {}
    throw new Error(errorMessage);
  }

  return await response.json();
}

export async function uploadDesignPreview(
  previewBlob: Blob,
  productId: number,
  token: string,
  filename?: string
): Promise<{ success: boolean; file_url: string }> {
  // Create a file from the blob with a proper filename
  const file = new File([previewBlob], filename || `preview_${productId}_${Date.now()}.png`, {
    type: 'image/png'
  });

  console.log(`📤 Uploading design preview using admin's system approach`);
  
  // Use the same approach as admin frontend - call uploadProductMedia
  try {
    const result = await uploadProductMedia(file, productId, token);
    
    return {
      success: true,
      file_url: result.file_url || result.url || result.image_url
    };
  } catch (error) {
    console.error('❌ Error uploading design preview via admin system:', error);
    throw error;
  }
}


export async function saveDesignPreviewToServer(
  productId: number,
  previewBlob: Blob,
  filename?: string
): Promise<string> {
  const token = useAuthStore.getState().tokens?.accessToken;
  if (!token) throw new Error('User not authenticated');

  const result = await uploadDesignPreview(previewBlob, productId, token, filename);
  return result.file_url; // This URL will be saved to cart
}
