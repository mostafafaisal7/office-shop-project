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

  // --------------------- TEMP CANVAS ---------------------
  private async createTempCanvas(width: number = 600, height: number = 600): Promise<{ canvas: Canvas; element: HTMLCanvasElement }> {
    const canvasElement = document.createElement('canvas');
    canvasElement.width = width;
    canvasElement.height = height;
    canvasElement.style.position = 'absolute';
    canvasElement.style.left = '-9999px';
    canvasElement.style.top = '-9999px';
    canvasElement.style.visibility = 'hidden';
    document.body.appendChild(canvasElement);

    const canvas = new Canvas(canvasElement, {
      width,
      height,
      backgroundColor: '#f3f4f6',
      renderOnAddRemove: true,
      skipTargetFind: false,
      selection: false,
      preserveObjectStacking: true,
    });

    canvas.renderAll();
    return new Promise((resolve) => setTimeout(() => resolve({ canvas, element: canvasElement }), 100));
  }

  private safeDisposeTempCanvas(canvasInfo: { canvas: Canvas; element: HTMLCanvasElement }): void {
    const { canvas, element } = canvasInfo;
    try {
      if (canvas.backgroundImage) canvas.backgroundImage = undefined;
      // ✅ FIX: Add disposal check before calling clear() to prevent clearRect errors
      if (canvas.clear && !canvas.disposed) {
        try {
          canvas.clear();
        } catch (clearErr) {
          console.error('Error clearing canvas during disposal:', clearErr);
        }
      }
      if (canvas.dispose) canvas.dispose();
    } catch (err) { console.error('Error disposing canvas:', err); }

    try {
      if (element && document.body.contains(element)) {
        element.parentNode?.removeChild(element);
      }
    } catch (err) {
      console.error('Error removing canvas element:', err);
      try {
        const orphaned = document.querySelectorAll('canvas[style*="-9999px"]');
        orphaned.forEach(c => c.parentNode?.removeChild(c));
      } catch (cleanupErr) { console.error('Final cleanup error:', cleanupErr); }
    }
  }

  // --------------------- IMAGE LOADING ---------------------
  private async loadBackgroundImage(backgroundImageUrl: string, canvas: Canvas): Promise<FabricImage> {
    return new Promise((resolve, reject) => {
      FabricImage.fromURL(backgroundImageUrl, { crossOrigin: 'anonymous' as const })
        .then((img: FabricImage) => {
          const scale = Math.min(canvas.getWidth() / (img.width || 1), canvas.getHeight() / (img.height || 1));
          img.set({
            scaleX: scale,
            scaleY: scale,
            left: canvas.getWidth() / 2,
            top: canvas.getHeight() / 2,
            originX: 'center',
            originY: 'center',
            selectable: false,
            evented: false,
            crossOrigin: 'anonymous'
          });
          resolve(img);
        })
        .catch(reject);
    });
  }

  private async loadCanvasData(canvas: Canvas, canvasData: any): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // ✅ FIX: Clone canvas data and fix blob URLs before loading
        const fixedCanvasData = { ...canvasData };

        // Remove blob background
        if (fixedCanvasData.backgroundImage?.src?.startsWith("blob:")) {
          delete fixedCanvasData.backgroundImage;
        }

        // Fix object blob URLs - restore savedImageUrl
        if (fixedCanvasData.objects) {
          fixedCanvasData.objects = fixedCanvasData.objects.map((obj: any) => {
            if (obj.type?.toLowerCase() === "image" && obj.src?.startsWith("blob:")) {
              // Restore from savedImageUrl if available
              obj.src = obj.savedImageUrl || obj.src;
            }
            return obj;
          });
        }

        canvas.loadFromJSON(fixedCanvasData, () => {
          try {
            // ✅ FIX: Restore custom properties after loadFromJSON
            // loadFromJSON recreates objects and loses custom properties
            canvas.getObjects().forEach((canvasObj: any, index: number) => {
              const originalData = fixedCanvasData.objects[index];

              if (canvasObj.type?.toLowerCase() === 'image' && originalData?.savedImageUrl) {
                // Assign directly - Fabric.js v6 requirement
                canvasObj.savedImageUrl = originalData.savedImageUrl;
              }

              // Set crossOrigin for all images
              if (canvasObj.type?.toLowerCase() === 'image') {
                canvasObj.set({ crossOrigin: 'anonymous' });
              }
            });
            resolve();
          } catch (err) { reject(err); }
        });
      } catch (err) { reject(err); }
    });
  }

  // --------------------- ENSURE ALL IMAGES LOADED ---------------------
  private async ensureImagesLoaded(canvas: Canvas): Promise<void> {
    const promises: Promise<void>[] = [];

    if (canvas.backgroundImage) {
      const bg = canvas.backgroundImage as FabricImage;
      if (!bg.getElement().complete) {
        promises.push(new Promise(res => bg.getElement().onload = () => res()));
      }
    }

    canvas.getObjects().forEach(obj => {
      if (obj.type === 'image') {
        const imgObj = obj as FabricImage;
        if (!imgObj.getElement().complete) {
          promises.push(new Promise(res => imgObj.getElement().onload = () => res()));
        }
      }
    });

    await Promise.all(promises);
    canvas.renderAll();
    await new Promise(res => setTimeout(res, 50));
  }

  // --------------------- GENERATE DATA URL ---------------------
  private async generateDataURL(canvas: Canvas, options: { format: string; quality: number; multiplier: number }): Promise<string> {
    await this.ensureImagesLoaded(canvas);

    return new Promise((resolve, reject) => {
      try {
        const formatType = options.format === 'jpeg' ? 'jpeg' : 'png';
        const dataURL = canvas.toDataURL({ format: formatType as 'png' | 'jpeg', quality: options.quality, multiplier: options.multiplier });
        if (!dataURL || dataURL.length < 50) reject(new Error('Invalid data URL'));
        else resolve(dataURL);
      } catch (err) { reject(err); }
    });
  }

  // --------------------- MAIN PREVIEW GENERATION ---------------------
  public async generatePreview(canvasData: any, backgroundImageUrl: string, options: PreviewOptions = {}): Promise<string> {
    const { width = 600, height = 600, quality = 1, format = 'png', multiplier = 2 } = options;
    let canvasInfo: { canvas: Canvas; element: HTMLCanvasElement } | null = null;

    try {
      canvasInfo = await this.createTempCanvas(width, height);
      const { canvas } = canvasInfo;

      if (backgroundImageUrl) {
        const img = await this.loadBackgroundImage(backgroundImageUrl, canvas);
        canvas.backgroundImage = img;
      }

      if (canvasData?.objects?.length) {
        await this.loadCanvasData(canvas, canvasData);
      }

      const dataURL = await this.generateDataURL(canvas, { format, quality, multiplier });
      this.safeDisposeTempCanvas(canvasInfo);
      return dataURL;
    } catch (err) {
      console.error('Error generating preview:', err);
      if (canvasInfo) this.safeDisposeTempCanvas(canvasInfo);
      throw err;
    }
  }

  // --------------------- GENERATE ALL VIEWS ---------------------
  public async generatePreviewsForAllViews(
    productId: string,
    variationId: string,
    availableViews: { area: string; image: string }[],
    loadDesignFromStorage: (productId: string, variationId: string, area: string) => any
  ): Promise<{ [key: string]: string }> {
    const previews: { [key: string]: string } = {};

    for (const view of availableViews) {
      try {
        const savedDesign = await loadDesignFromStorage(productId, variationId, view.area);
        const previewUrl = await this.generatePreview(
          savedDesign?.canvas_data || null,
          view.image,
          { quality: 1, multiplier: 2 }
        );
        previews[view.area] = previewUrl;
      } catch (err) {
        console.error(`Error generating preview for ${view.area}:`, err);
        try {
          const fallback = await this.generatePreview(null, view.image, { quality: 1, multiplier: 2 });
          previews[view.area] = fallback;
        } catch (fallbackErr) {
          console.error(`Failed fallback preview for ${view.area}:`, fallbackErr);
        }
      }
    }

    return previews;
  }
}

export const previewGenerator = PreviewGenerator.getInstance();
