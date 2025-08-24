import { previewGenerator } from '@/utils/previewGenerator';
import { designApi } from '@/services/designApi';

export interface SavedImageInfo {
  path: string;
  filename: string;
  fullUrl: string;
}

export interface CustomizationImageData {
  customizationId: number;
  images: SavedImageInfo[];
}

class ImageService {
  private readonly UPLOAD_DIR = '/uploads/customized';
  private readonly BASE_URL = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  /**
   * Generate a unique filename for the customized image
   */
  private generateFilename(customizationId: number, designArea: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 6);
    return `design_${timestamp}_${customizationId}_${designArea}_${random}.png`;
  }

  /**
   * Convert data URL to blob for server upload
   */
  private dataURLToBlob(dataURL: string): Blob {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }

  /**
   * Save image blob to server
   */
  private async saveImageToServer(blob: Blob, filename: string): Promise<string> {
    const formData = new FormData();
    formData.append('image', blob, filename);
    formData.append('directory', 'customized');

    const response = await fetch('/api/upload-image', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to save image: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return result.path; // Should return the relative path like "/uploads/customized/filename.png"
  }

  /**
   * Generate and save customized images for a given customization option
   */
  async generateAndSaveCustomizedImages(customizationId: number): Promise<SavedImageInfo[]> {
    try {
      console.log('Generating images for customization ID:', customizationId);
      
      // Fetch customization data from the API
      const customizationOption = await designApi.getCustomizationOption(customizationId);
      
      if (!customizationOption || !customizationOption.option_data) {
        throw new Error(`No customization data found for ID: ${customizationId}`);
      }

      const { option_data } = customizationOption;
      const savedImages: SavedImageInfo[] = [];

      // Check if this is a design-type customization with canvas data
      if (customizationOption.option_type === 'design' && option_data.canvas_data) {
        const designArea = option_data.design_area || 'front';
        const productImageUrl = option_data.product_image_url || '';

        console.log('Generating image for design area:', designArea);

        // Generate high-quality preview image
        const dataURL = await previewGenerator.generatePreview(
          option_data.canvas_data,
          productImageUrl,
          {
            quality: 1,
            multiplier: 2,
            format: 'png',
            width: 800,
            height: 800
          }
        );

        // Convert to blob and save to server
        const blob = this.dataURLToBlob(dataURL);
        const filename = this.generateFilename(customizationId, designArea);
        const savedPath = await this.saveImageToServer(blob, filename);

        const imageInfo: SavedImageInfo = {
          path: savedPath,
          filename: filename,
          fullUrl: `${this.BASE_URL}${savedPath}`
        };

        savedImages.push(imageInfo);
        console.log('Successfully saved image:', imageInfo);
      } else {
        console.warn('Customization option is not a design type or has no canvas data:', customizationOption);
      }

      return savedImages;
    } catch (error) {
      console.error('Error generating and saving customized images:', error);
      throw error;
    }
  }

  /**
   * Generate and save images for multiple customization IDs
   */
  async generateAndSaveMultipleCustomizations(customizationIds: number[]): Promise<CustomizationImageData[]> {
    const results: CustomizationImageData[] = [];

    // Process sequentially to avoid canvas conflicts
    for (const customizationId of customizationIds) {
      try {
        const images = await this.generateAndSaveCustomizedImages(customizationId);
        results.push({
          customizationId,
          images
        });
      } catch (error) {
        console.error(`Failed to generate images for customization ${customizationId}:`, error);
        // Continue with other customizations even if one fails
        results.push({
          customizationId,
          images: []
        });
      }
    }

    return results;
  }

  /**
   * Clean up images (for failed orders or cleanup)
   */
  async cleanupImages(imagePaths: string[]): Promise<void> {
    try {
      const response = await fetch('/api/cleanup-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imagePaths }),
      });

      if (!response.ok) {
        console.warn('Failed to cleanup images:', response.status);
      }
    } catch (error) {
      console.error('Error cleaning up images:', error);
    }
  }
}

export const imageService = new ImageService();
