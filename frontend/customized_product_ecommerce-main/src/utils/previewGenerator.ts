'use client';

import { Canvas, FabricImage } from 'fabric';

export interface PreviewOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: string;
  multiplier?: number;
}

export class PreviewGenerator {
  private static instance: PreviewGenerator;

  private constructor() {}

  public static getInstance(): PreviewGenerator {
    if (!PreviewGenerator.instance) {
      PreviewGenerator.instance = new PreviewGenerator();
    }
    return PreviewGenerator.instance;
  }

  private async createTempCanvas(width: number = 600, height: number = 600): Promise<{ canvas: Canvas; element: HTMLCanvasElement }> {
    // Create a temporary canvas element
    const canvasElement = document.createElement('canvas');
    canvasElement.width = width;
    canvasElement.height = height;
    canvasElement.style.position = 'absolute';
    canvasElement.style.left = '-9999px';
    canvasElement.style.top = '-9999px';
    canvasElement.style.visibility = 'hidden';
    document.body.appendChild(canvasElement);

    // Create Fabric canvas with v6 compatible options
    const canvas = new Canvas(canvasElement, {
      width,
      height,
      backgroundColor: '#f3f4f6',
      renderOnAddRemove: true,
      skipTargetFind: false,
      selection: false,
      preserveObjectStacking: true,
    });

    // Ensure canvas is properly initialized for v6
    canvas.renderAll();
    
    // Add a small delay to ensure canvas is ready
    return new Promise<{ canvas: Canvas; element: HTMLCanvasElement }>((resolve) => {
      setTimeout(() => {
        resolve({ canvas, element: canvasElement });
      }, 100);
    });
  }

  private safeDisposeTempCanvas(canvasInfo: { canvas: Canvas; element: HTMLCanvasElement }): void {
    const { canvas, element } = canvasInfo;
    
    try {
      // Clear background image first
      if (canvas && canvas.backgroundImage) {
        canvas.backgroundImage = undefined;
      }
      
      // Clear all objects
      if (canvas && typeof canvas.clear === 'function') {
        canvas.clear();
      }
      
      // Dispose the fabric canvas
      if (canvas && typeof canvas.dispose === 'function') {
        canvas.dispose();
      }
    } catch (canvasError) {
      console.error('Error disposing canvas:', canvasError);
    }

    try {
      // Remove the DOM element
      if (element && document.body.contains(element)) {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        } else {
          document.body.removeChild(element);
        }
      }
    } catch (elementError) {
      console.error('Error removing canvas element:', elementError);
      // Final cleanup attempt
      try {
        const orphanedCanvases = document.querySelectorAll('canvas[style*="-9999px"]');
        orphanedCanvases.forEach(orphanedCanvas => {
          if (orphanedCanvas.parentNode) {
            orphanedCanvas.parentNode.removeChild(orphanedCanvas);
          }
        });
      } catch (cleanupError) {
        console.error('Error in final cleanup:', cleanupError);
      }
    }
  }

  private async generateDataURL(canvas: Canvas, options: { format: string; quality: number; multiplier: number }): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        // Validate canvas before any operations
        if (!canvas) {
          reject(new Error('Canvas is invalid or disposed'));
          return;
        }

        // For Fabric.js v6, renderAll() is synchronous and doesn't need to be awaited
        try {
          canvas.renderAll();
        } catch (renderError) {
          console.warn('Error during renderAll:', renderError);
        }
        
        // Use requestAnimationFrame for better timing with Fabric.js v6
        requestAnimationFrame(() => {
          try {
            // Additional render to ensure everything is ready
            try {
              canvas.renderAll();
            } catch (renderError) {
              console.warn('Error during second renderAll:', renderError);
            }
            
            // Use setTimeout for extra safety with v6's async rendering
            setTimeout(() => {
              try {
                // For Fabric.js v6, we need to handle the toDataURL method differently
                let dataURL: string;
                
                try {
                  // Try the v6 approach first with proper options
                  const formatType = options.format === 'png' ? 'png' : options.format === 'jpeg' ? 'jpeg' : 'png';
                  const toDataURLOptions = {
                    format: formatType as 'png' | 'jpeg',
                    quality: options.quality,
                    multiplier: options.multiplier
                  };
                  
                  dataURL = canvas.toDataURL(toDataURLOptions);
                } catch (v6Error) {
                  console.warn('V6 toDataURL failed, trying fallback:', v6Error);
                  
                  try {
                    // Fallback to simpler options
                    const formatType = options.format === 'png' ? 'png' : options.format === 'jpeg' ? 'jpeg' : 'png';
                    dataURL = canvas.toDataURL({
                      format: formatType as 'png' | 'jpeg',
                      quality: options.quality,
                      multiplier: options.multiplier
                    });
                  } catch (fallbackError) {
                    console.warn('Fallback toDataURL failed, trying canvas element:', fallbackError);
                    
                    // Final fallback to direct canvas element access
                    const canvasElement = canvas.getElement();
                    if (canvasElement && typeof canvasElement.toDataURL === 'function') {
                      dataURL = canvasElement.toDataURL(`image/${options.format}`, options.quality);
                    } else {
                      throw new Error('Unable to generate data URL from canvas');
                    }
                  }
                }
                
                if (!dataURL || dataURL.length < 100) {
                  throw new Error('Generated data URL is invalid or empty');
                }
                
                resolve(dataURL);
              } catch (error) {
                console.error('Error generating data URL:', error);
                reject(error);
              }
            }, 300); // Reduced timeout
          } catch (error) {
            console.error('Error in render callback:', error);
            reject(error);
          }
        });
      } catch (error) {
        console.error('Error in generateDataURL:', error);
        reject(error);
      }
    });
  }

  public async generatePreview(
    canvasData: any,
    backgroundImageUrl: string,
    options: PreviewOptions = {}
  ): Promise<string> {
    const {
      width = 600,
      height = 600,
      quality = 1,
      format = 'png',
      multiplier = 2
    } = options;

    let canvasInfo: { canvas: Canvas; element: HTMLCanvasElement } | null = null;

    try {
      // Create temporary canvas
      canvasInfo = await this.createTempCanvas(width, height);
      const { canvas } = canvasInfo;

      // Load background image if provided
      if (backgroundImageUrl) {
        const img = await this.loadBackgroundImage(backgroundImageUrl, canvas);
        canvas.backgroundImage = img;
      }

      // Load canvas data if available
      if (canvasData && canvasData.objects && canvasData.objects.length > 0) {
        await this.loadCanvasData(canvas, canvasData, backgroundImageUrl);
      }

      // Generate the preview
      const dataURL = await this.generateDataURL(canvas, { format, quality, multiplier });
      
      // Clean up
      this.safeDisposeTempCanvas(canvasInfo);
      
      return dataURL;
    } catch (error) {
      console.error('Error generating preview:', error);
      
      // Clean up on error
      if (canvasInfo) {
        this.safeDisposeTempCanvas(canvasInfo);
      }
      
      throw error;
    }
  }

  private async loadBackgroundImage(backgroundImageUrl: string, canvas: Canvas): Promise<FabricImage> {
    return new Promise((resolve, reject) => {
      FabricImage.fromURL(backgroundImageUrl, { crossOrigin: 'anonymous' as const })
        .then((img: FabricImage) => {
          // Scale image to fit canvas while maintaining aspect ratio
          const canvasWidth = canvas.getWidth();
          const canvasHeight = canvas.getHeight();
          const imgWidth = img.width || 1;
          const imgHeight = img.height || 1;
          
          const scale = Math.min(canvasWidth / imgWidth, canvasHeight / imgHeight);
          
          img.set({
            scaleX: scale,
            scaleY: scale,
            left: canvasWidth / 2,
            top: canvasHeight / 2,
            originX: 'center',
            originY: 'center',
            selectable: false,
            evented: false,
          });

          resolve(img);
        })
        .catch((error) => {
          console.error('Error loading background image with CORS:', error);
          // Fallback without crossOrigin
          FabricImage.fromURL(backgroundImageUrl)
            .then((img: FabricImage) => {
              const canvasWidth = canvas.getWidth();
              const canvasHeight = canvas.getHeight();
              const imgWidth = img.width || 1;
              const imgHeight = img.height || 1;
              
              const scale = Math.min(canvasWidth / imgWidth, canvasHeight / imgHeight);
              
              img.set({
                scaleX: scale,
                scaleY: scale,
                left: canvasWidth / 2,
                top: canvasHeight / 2,
                originX: 'center',
                originY: 'center',
                selectable: false,
                evented: false,
              });

              resolve(img);
            })
            .catch((fallbackError) => {
              console.error('Error loading background image (fallback):', fallbackError);
              reject(fallbackError);
            });
        });
    });
  }

  private async loadCanvasData(canvas: Canvas, canvasData: any, backgroundImageUrl?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        canvas.loadFromJSON(canvasData, () => {
          // Restore background image after loading JSON if we have one
          if (backgroundImageUrl && canvas.backgroundImage) {
            // Background image should already be set, just ensure it's rendered
            canvas.renderAll();
          }
          resolve();
        });
      } catch (error) {
        console.error('Error loading canvas data:', error);
        reject(error);
      }
    });
  }

  public async generatePreviewsForAllViews(
    productId: string,
    variationId: string,
    availableViews: { area: string; image: string }[],
    loadDesignFromStorage: (productId: string, variationId: string, area: string) => any
  ): Promise<{ [key: string]: string }> {
    const previews: { [key: string]: string } = {};
    
    // Process views sequentially to avoid canvas conflicts
    for (const view of availableViews) {
      try {
        console.log(`Loading design for preview - Product: ${productId}, Variation: ${variationId}, Area: ${view.area}`);
        const savedDesign = await loadDesignFromStorage(productId, variationId, view.area);
        
        console.log(`Loaded design for ${view.area}:`, savedDesign ? 'found design data' : 'no design data');
        
        // Always generate a preview - either with design data or just background
        const previewUrl = await this.generatePreview(
          savedDesign?.canvas_data || null,
          view.image,
          { quality: 1, multiplier: 2 }
        );
        
        previews[view.area] = previewUrl;
        console.log(`Generated preview for ${view.area}:`, savedDesign?.canvas_data ? 'with design' : 'background only');
      } catch (error) {
        console.error(`Error generating preview for view ${view.area}:`, error);
        // Try to generate at least a background-only preview as fallback
        try {
          const fallbackPreview = await this.generatePreview(
            null,
            view.image,
            { quality: 1, multiplier: 2 }
          );
          previews[view.area] = fallbackPreview;
          console.log(`Generated fallback preview for ${view.area}`);
        } catch (fallbackError) {
          console.error(`Failed to generate fallback preview for ${view.area}:`, fallbackError);
        }
      }
    }
    
    return previews;
  }
}

export const previewGenerator = PreviewGenerator.getInstance();
