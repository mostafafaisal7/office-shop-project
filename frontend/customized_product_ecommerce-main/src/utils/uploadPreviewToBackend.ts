'use client';

export const uploadPreviewToBackend = async (
  dataUrl: string,
  uploadType: 'products' | 'users' | 'categories' | 'previews' = 'previews'
): Promise<string> => {
  try {
    // Convert dataUrl to blob
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const file = new File([blob], `preview_${Date.now()}.png`, { type: 'image/png' });

    // Create FormData for backend upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_type', uploadType);

    // Upload to backend FastAPI endpoint
    const response = await fetch('http://127.0.0.1:8000/uploads/image', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed with status: ${response.status}`);
    }

    const result = await response.json();
    return result.image_url; // Backend returns the full URL in 'image_url' field
  } catch (error) {
    console.error('Failed to upload preview to backend:', error);
    throw error;
  }
};
