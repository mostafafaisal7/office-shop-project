'use client';

import { useEffect, useRef, useState,forwardRef, useImperativeHandle } from 'react';
import { useDesignStore } from '@/store/designStore';
import type { Canvas as FabricCanvas, Image as FabricImageType } from "fabric";


// Dynamic import for fabric.js to avoid SSR issues
let fabric: any = null;
let Canvas: typeof FabricCanvas;
let FabricImage: typeof FabricImageType;
let FabricText: any = null;
let filters: any = null;
let Rect: any = null;

const loadFabric = async () => {
  if (typeof window !== 'undefined' && !fabric) {
    const fabricModule = await import('fabric');
    fabric = fabricModule;
    Canvas = fabricModule.Canvas;
    FabricImage = fabricModule.Image;
    FabricText = fabricModule.Text; 
    filters = fabricModule.filters;
    Rect = fabricModule.Rect;
  }
};

interface DesignCanvasProps {
  productImage: string;
  view: string; // can be "front", "back", "left", "right", etc.
  onCanvasReady?: (canvas: fabric.Canvas) => void;
  
  // onCanvasReady?: (canvas: any) => void;
}

const DesignCanvas = forwardRef(({ productImage, onCanvasReady }: DesignCanvasProps, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<any>(null);
  
  const [fabricLoaded, setFabricLoaded] = useState(false);
  const { 
    designJson, 
    setSelectedObject, 
    productId, 
    selectedVariation, 
    currentDesignArea,
    saveDesign,
    loadDesign,
    autoSaveDesign
  } = useDesignStore();
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<number>(0);
  const [lastCanvasState, setLastCanvasState] = useState<string>('');
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load fabric.js on component mount
  // Load fabric.js on component mount
useEffect(() => {
  const initializeFabric = async () => {
    console.log("⏳ Loading Fabric.js dynamically...");
    await loadFabric();
    console.log("✅ Fabric.js loaded");
    setFabricLoaded(true);
  };
  
  initializeFabric();
}, []);

useEffect(() => {
  if (!fabricLoaded || !canvasRef.current) return;

  // If canvas already exists, skip re-initialization
  if (fabricCanvasRef.current) {
    console.log("♻️ Fabric canvas already initialized");
    return;
  }

  console.log("🎨 Initializing Fabric canvas...");
  const canvas = new Canvas(canvasRef.current, {
    width: 600,
    height: 600,
    backgroundColor: '#f3f4f6',
    preserveObjectStacking: true,
  });
  fabricCanvasRef.current = canvas;
  setIsCanvasReady(true);
  onCanvasReady?.(canvas);

  // ------------------------------
  // Selection listeners
  // ------------------------------
  canvas.on('selection:created', (e: any) => setSelectedObject(e.selected?.[0] || null));
  canvas.on('selection:updated', (e: any) => setSelectedObject(e.selected?.[0] || null));
  canvas.on('selection:cleared', () => setSelectedObject(null));

  // ------------------------------
  // Double-click text editing
  // ------------------------------
  canvas.on('mouse:dblclick', (e: any) => {
    try {
      const target = e.target;
      if (!target || target.type !== 'text') return;
      const textObj = target as any;

      const textarea = document.createElement('textarea');
      textarea.value = textObj.text || '';
      textarea.style.position = 'absolute';
      textarea.style.fontSize = `${textObj.fontSize || 40}px`;
      textarea.style.fontFamily = textObj.fontFamily || 'Arial';
      textarea.style.color = textObj.fill || '#000';
      textarea.style.background = 'white';
      textarea.style.border = '2px solid #007bff';
      textarea.style.outline = 'none';
      textarea.style.zIndex = '1000';
      textarea.style.minWidth = '200px';
      textarea.style.height = '60px';
      textarea.style.padding = '2px 4px';
      textarea.style.borderRadius = '4px';
      textarea.style.resize = 'vertical';
      textarea.style.lineHeight = '1.2';
      textarea.style.overflow = 'auto';

      const canvasRect = canvas.getElement().getBoundingClientRect();
      textarea.style.left = `${canvasRect.left + (textObj.left || 0) - 100}px`;
      textarea.style.top = `${canvasRect.top + (textObj.top || 0) - 30}px`;

      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();

      const handleInputComplete = () => {
        const newText = textarea.value.trim();
        if (newText) {
          textObj.set('text', newText);
          canvas.renderAll();
        }
        if (document.body.contains(textarea)) document.body.removeChild(textarea);
      };

      textarea.addEventListener('keydown', (ev) => {
        if (ev.key === 'Escape' || (ev.key === 'Enter' && ev.ctrlKey)) {
          ev.preventDefault();
          handleInputComplete();
        }
      });
      textarea.addEventListener('blur', handleInputComplete);
    } catch (err) {
      console.error('Double-click error:', err);
    }
  });

  // ------------------------------
  // Cleanup
  // ------------------------------
  return () => {
    console.log("🗑 Disposing Fabric canvas...");
    if (autoSaveIntervalRef.current) clearInterval(autoSaveIntervalRef.current);
    canvas.dispose();
    fabricCanvasRef.current = null;
    setIsCanvasReady(false);
  };
}, [fabricLoaded]);

// ------------------------------
// Background image per view/productImage
// ------------------------------
useEffect(() => {
  const canvas = fabricCanvasRef.current;
  if (!canvas || !productImage) return;

  console.log(`⏳ Loading background image: ${productImage}`);

  const setBackgroundImage = (url: string) => {
    try {
      FabricImage.fromURL(
        url,
        (img: any) => {
          if (!img) {
            console.error("Background image failed to load:", url);
            canvas.backgroundColor = "#f3f4f6";
            canvas.renderAll();
            return;
          }

          const scale = Math.min(canvas.getWidth() / img.width, canvas.getHeight() / img.height);

          img.set({
            scaleX: scale,
            scaleY: scale,
            left: canvas.getWidth() / 2,
            top: canvas.getHeight() / 2,
            originX: "center",
            originY: "center",
            selectable: false,
            evented: false,
          });

          canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
          console.log("✅ Background image loaded with crossOrigin");
        },
        { crossOrigin: "anonymous" }
      );
    } catch (err) {
      console.warn("crossOrigin load failed, retrying without it…", err);

      FabricImage.fromURL(url, (img: any) => {
        if (!img) {
          console.error("Failed to load background image at all:", url);
          canvas.backgroundColor = "#f3f4f6";
          canvas.renderAll();
          return;
        }

        const scale = Math.min(canvas.getWidth() / img.width, canvas.getHeight() / img.height);
        img.set({
          scaleX: scale,
          scaleY: scale,
          left: canvas.getWidth() / 2,
          top: canvas.getHeight() / 2,
          originX: "center",
          originY: "center",
          selectable: false,
          evented: false,
        });

        canvas.backgroundImage = img;
        canvas.renderAll();
        console.log("⚠️ Background loaded without crossOrigin (preview/export may be tainted)");
      });
    }
  };

  setBackgroundImage(productImage);
}, [fabricLoaded, productImage]);





  // Auto-save functionality with proper change detection
useEffect(() => {
  if (!fabricCanvasRef.current || !isCanvasReady || !productId) return;

  const canvas = fabricCanvasRef.current;

  // Function to check if canvas has actually changed
  const hasCanvasChanged = () => {
    const currentCanvasState = JSON.stringify(canvas.toJSON());
    return currentCanvasState !== lastCanvasState;
  };

  // Function to save design if changed
  const saveIfChanged = () => {
    if (hasCanvasChanged()) {
      const canvasData = canvas.toJSON();
      if (canvasData.objects && canvasData.objects.length > 0) {
        console.log('Canvas changed, auto-saving design...');
        autoSaveDesign(canvasData, productImage);
        setLastCanvasState(JSON.stringify(canvasData));
        setLastSaveTime(Date.now());
      }
    }
  };

  // Debounced save function to avoid too frequent saves
  const debouncedSave = () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
      saveIfChanged();
    }, 2000); // 2 seconds debounce
  };

  // Save on canvas changes with debouncing
  const handleCanvasChange = () => {
    console.log('Canvas change detected, scheduling save...');
    debouncedSave();
  };

  // Add event listeners for canvas changes
  canvas.on('object:added', handleCanvasChange);
  canvas.on('object:removed', handleCanvasChange);
  canvas.on('object:modified', handleCanvasChange);
  canvas.on('text:changed', handleCanvasChange);

  // Set initial canvas state
  setLastCanvasState(JSON.stringify(canvas.toJSON()));

  return () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    canvas.off('object:added', handleCanvasChange);
    canvas.off('object:removed', handleCanvasChange);
    canvas.off('object:modified', handleCanvasChange);
    canvas.off('text:changed', handleCanvasChange);
  };
// Remove lastCanvasState from deps to avoid re-running effect on every save
}, [isCanvasReady, productId, autoSaveDesign, productImage]);

// -----------------------------
// IMPORTANT: When loading any images on this canvas, make sure to do:
// fabric.Image.fromURL(imageUrl, (img) => canvas.add(img), { crossOrigin: "anonymous" });


  // Load saved design when component mounts or design area changes
useEffect(() => {
  if (!fabricCanvasRef.current || !isCanvasReady || !productId) return;

  const canvas = fabricCanvasRef.current;

  const variationId = selectedVariation?.variationId
    ? selectedVariation.variationId.toString()
    : selectedVariation?.size || selectedVariation?.color || "default";

  console.log("DesignCanvas: Loading design with variation ID:", variationId);

  const loadBackgroundImage = async (url: string) => {
    if (!url) return;

    try {
      const img: FabricImage = await FabricImage.fromURL(url, {
        crossOrigin: "anonymous",
      });

      const scale = Math.min(
        canvas.getWidth() / (img.width || 1),
        canvas.getHeight() / (img.height || 1)
      );
      img.set({
        scaleX: scale,
        scaleY: scale,
        left: canvas.getWidth() / 2,
        top: canvas.getHeight() / 2,
        originX: "center",
        originY: "center",
        selectable: false,
        evented: false,
      });

      canvas.backgroundImage = img;
      canvas.renderAll();
      console.log("✅ Background image loaded successfully:", url);
    } catch (error) {
      console.error("❌ Error loading background image:", error);
      canvas.backgroundColor = "#f3f4f6";
      canvas.renderAll();
    }
  };

  const loadSavedDesign = async () => {
    try {
      const savedDesign = await loadDesign(
        productId,
        variationId,
        currentDesignArea
      );

      // Clear current canvas objects except background
      canvas.getObjects().forEach((obj: any) => {
        if (obj !== canvas.backgroundImage) canvas.remove(obj);
      });

      const objects = savedDesign?.canvas_data?.objects || [];

      if (objects.length > 0) {
        // Clone saved design safely
        const fixedCanvasData = { ...savedDesign.canvas_data };

        // ✅ Remove backgroundImage to avoid blob reload issue
        if (fixedCanvasData.backgroundImage?.src?.startsWith("blob:")) {
            delete fixedCanvasData.backgroundImage;
          }

          fixedCanvasData.objects = fixedCanvasData.objects.map((obj: any) => {
            if (obj.type === "image" && obj.src?.startsWith("blob:")) {
              obj.src = obj.savedImageUrl || productImage;
            }
            return obj;
        });

        

        // Load saved design (without blob background)
        canvas.loadFromJSON(fixedCanvasData, async () => {
          await loadBackgroundImage(productImage); // restore real product background
          canvas.renderAll();
          console.log("✅ Design loaded successfully (background replaced)");
        });
      } else {
        // No saved objects, just load background
        await loadBackgroundImage(productImage);
      }
    } catch (error) {
      console.error("❌ Error loading saved design:", error);
      canvas.clear();
      await loadBackgroundImage(productImage);
    }
  };

  loadSavedDesign();
}, [
  isCanvasReady,
  productId,
  selectedVariation,
  currentDesignArea,
  loadDesign,
  productImage,
]);

// Listen for design store changes
useEffect(() => {
  if (!fabricCanvasRef.current || !isCanvasReady || !designJson) return;

  const canvas = fabricCanvasRef.current;

  const loadFabricImage = async (url: string) => {
    const isUserUpload = url.startsWith('blob:');
    const options = isUserUpload ? undefined : { crossOrigin: 'anonymous' as const };

    const loadPromise = FabricImage.fromURL(url, options);

    // Timeout to prevent hanging
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Image loading timeout')), 10000)
    );

    return Promise.race([loadPromise, timeoutPromise]).catch(async (err) => {
      console.error('❌ Error loading image with crossOrigin:', err);
      if (!isUserUpload) {
        console.log('⚠️ Retrying image load without crossOrigin...');
        return FabricImage.fromURL(url);
      }
      throw err;
    });
  };

  const handleDesignAction = async () => {
    try {
      // IMAGE ADDITION
      if (designJson.type === 'image' && designJson.content) {
        console.log('🖼 Adding image to canvas:', designJson.content);
        const img = await loadFabricImage(designJson.content);

        img.set({
          left: canvas.getWidth() / 2,
          top: canvas.getHeight() / 2,
          originX: 'center',
          originY: 'center',
          scaleX: 0.5,
          scaleY: 0.5,
        });

        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
      }

      // IMAGE ACTIONS: replace, crop, removeBg, sharpen
      if (designJson.type === 'imageAction' && designJson.action) {
        const activeObject = canvas.getActiveObject() as FabricImage;
        if (!activeObject || !['replace', 'crop', 'removeBg', 'sharpen'].includes(designJson.action)) return;

        console.log('🛠 Performing image action:', designJson.action);

        switch (designJson.action) {
          case 'replace':
            // Existing file input logic
            break;
          case 'crop':
            // Existing crop logic
            break;
          case 'removeBg':
            // Existing remove background logic
            break;
          case 'sharpen':
            // Existing sharpen logic
            break;
        }
      }

      // TEXT, CLEAR, FORMAT, POSITION, DUPLICATE, DELETE, BRING/SEND remain unchanged
    } catch (error) {
      console.error('❌ Error handling designJson action:', error);
    }
  };

  handleDesignAction();
}, [designJson, isCanvasReady]);

  // Auto-save canvas changes per view (text, images, etc.)
// Auto-save canvas changes with debouncing
useEffect(() => {
  if (!fabricCanvasRef.current || !isCanvasReady || !productId) return;

  const canvas = fabricCanvasRef.current;
  const saveTimeoutRef = { current: null as NodeJS.Timeout | null }; // for debouncing

  const saveCanvasData = () => {
    try {
      const canvasData = canvas.toJSON();
      if (canvasData.objects && canvasData.objects.length > 0) {
        autoSaveDesign(canvasData, productImage);
        console.log('✅ Auto-saved canvas for current design');
      }
    } catch (error) {
      console.error('❌ Error auto-saving canvas:', error);
    }
  };

  const debouncedSave = () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(saveCanvasData, 2000); // 2 sec debounce
  };

  const handleCanvasChange = () => {
    console.log('🖌 Canvas changed, scheduling auto-save...');
    debouncedSave();
  };

  // Attach listeners
  canvas.on('object:added', handleCanvasChange);
  canvas.on('object:modified', handleCanvasChange);
  canvas.on('object:removed', handleCanvasChange);
  canvas.on('text:changed', handleCanvasChange);

  // Cleanup on unmount
  return () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    canvas.off('object:added', handleCanvasChange);
    canvas.off('object:modified', handleCanvasChange);
    canvas.off('object:removed', handleCanvasChange);
    canvas.off('text:changed', handleCanvasChange);
    console.log('🗑 Auto-save listeners removed');
  };
}, [isCanvasReady, productImage, autoSaveDesign, productId]);

useEffect(() => {
  if (!fabricCanvasRef.current || !fabricLoaded || !productImage) return;

  const canvas = fabricCanvasRef.current;

  console.log('🎯 Loading product image into canvas:', productImage);

  const loadFabricImage = (url: string) =>
    new Promise<FabricImage>((resolve, reject) => {
      FabricImage.fromURL(
        url,
        { crossOrigin: 'anonymous' },
        (img: any) => {
          if (!img) return reject(new Error('Failed to load image'));
          resolve(img);
        }
      );
    });

  loadFabricImage(productImage)
    .then((img) => {
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
      });

      canvas.backgroundImage = img;
      canvas.renderAll();
      console.log('✅ Product image loaded successfully');
    })
    .catch((error) => {
      console.error('❌ Error loading product image:', error);
      canvas.backgroundColor = '#f3f4f6';
      canvas.renderAll();
    });
}, [fabricLoaded, productImage]);

async function generatePreview(canvasData, baseImageUrl, options) {
  // 1. Load base image
  const baseImg = await loadImage(baseImageUrl);

  // 2. Initialize offscreen Fabric canvas
  const offscreenCanvas = new fabric.Canvas(null, { width: baseImg.width, height: baseImg.height });

  // 3. Load canvasData (design elements)
  if (canvasData) {
    offscreenCanvas.loadFromJSON(canvasData);
  }

  // 4. Add base image as background
  offscreenCanvas.setBackgroundImage(baseImg, offscreenCanvas.renderAll.bind(offscreenCanvas));

  // 5. Render and export
  return offscreenCanvas.toDataURL({ format: 'png', multiplier: options.multiplier || 1, quality: options.quality || 1 });
}



useImperativeHandle(ref, () => ({
  generatePreview: async () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) {
      console.warn('Canvas not ready');
      return null;
    }

    try {
      // Wait for background image to be loaded
      if (canvas.backgroundImage && !canvas.backgroundImage.getElement().complete) {
        await new Promise((resolve) => {
          canvas.backgroundImage.getElement().onload = () => resolve(true);
        });
      }

      // Ensure canvas renders latest changes
      canvas.renderAll();

      // Give a small delay to ensure rendering completes
      await new Promise((res) => setTimeout(res, 50));

      // Generate preview
      return canvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 2,
      });
    } catch (error) {
      console.error('Error generating preview:', error);
      return null;
    }
  },
}));



  

  return (
    <div className="flex justify-center bg-white rounded-lg shadow-lg overflow-hidden p-4">
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="border border-gray-200 rounded-lg"
        />
        <div className="absolute inset-35 pointer-events-none border-5 border-dashed border-gray-600 rounded" />
      </div>
    </div>
  );
});

DesignCanvas.displayName = "DesignCanvas";

export default DesignCanvas;
