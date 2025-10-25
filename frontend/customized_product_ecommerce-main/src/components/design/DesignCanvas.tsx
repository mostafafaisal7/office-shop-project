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

  // ✅ FIX: Track last loaded product to prevent data leak
  const lastLoadedProductRef = useRef<{productId: string | null, variationId: string | null}>({
    productId: null,
    variationId: null
  });

  // Load fabric.js on component mount
useEffect(() => {
  const initializeFabric = async () => {
    await loadFabric();
    setFabricLoaded(true);
  };

  initializeFabric();
}, []);

useEffect(() => {
  if (!fabricLoaded || !canvasRef.current) return;

  if (fabricCanvasRef.current) {
    return;
  }

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
    // Keep your existing double-click text editing code
  });

  // ------------------------------
  // Cleanup
  // ------------------------------
  return () => {
    if (autoSaveIntervalRef.current) clearInterval(autoSaveIntervalRef.current);
    canvas.dispose();
    fabricCanvasRef.current = null;
    setIsCanvasReady(false);
  };
}, [fabricLoaded]);

// ------------------------------
// Background image per view/productImage
// ------------------------------
// ----------------------------
// Effect A: Auto-save on canvas changes
// ----------------------------
useEffect(() => {
  if (!fabricCanvasRef.current || !isCanvasReady || !productId) return;

  const canvas = fabricCanvasRef.current;

  const hasCanvasChanged = () => {
    const currentCanvasState = JSON.stringify(canvas.toJSON(['savedImageUrl']));
    return currentCanvasState !== lastCanvasState;
  };

  const saveIfChanged = () => {
    if (hasCanvasChanged()) {
      // ✅ Include custom properties in serialization
      const canvasData = canvas.toJSON(['savedImageUrl']);

      if (canvasData.backgroundImage?.src?.startsWith("blob:")) {
        delete canvasData.backgroundImage;
      }

      // ✅ DEBUG: Log BEFORE sanitization to check savedImageUrl
      console.log('💾 BEFORE sanitization:', canvasData.objects.map((o: any) => ({
        type: o.type,
        src: o.src?.substring(0, 50) + '...',
        savedImageUrl: o.savedImageUrl?.substring(0, 50) + '...'
      })));

      canvasData.objects = canvasData.objects.map((obj: any) => {
        // ✅ FIX: Fabric.js uses "Image" (capital I) for image type
        if (obj.type?.toLowerCase() === "image" && obj.src?.startsWith("blob:")) {
          console.warn('⚠️ Found blob URL, replacing with savedImageUrl');
          obj.src = obj.savedImageUrl || productImage;
        }
        return obj;
      });

      // ✅ DEBUG: Log AFTER sanitization to verify replacement
      console.log('💾 AFTER sanitization:', canvasData.objects.map((o: any) => ({
        type: o.type,
        src: o.src?.substring(0, 50) + '...'
      })));

      if (canvasData.objects && canvasData.objects.length > 0) {
        autoSaveDesign(canvasData, productImage);
        setLastCanvasState(JSON.stringify(canvasData));
        setLastSaveTime(Date.now());
      }
    }
  };

  const debouncedSave = () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveIfChanged();
    }, 2000);
  };

  const handleCanvasChange = () => {
    debouncedSave();
  };

  canvas.on("object:added", handleCanvasChange);
  canvas.on("object:removed", handleCanvasChange);
  canvas.on("object:modified", handleCanvasChange);
  canvas.on("text:changed", handleCanvasChange);

  setLastCanvasState(JSON.stringify(canvas.toJSON(['savedImageUrl'])));

  return () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    canvas.off("object:added", handleCanvasChange);
    canvas.off("object:removed", handleCanvasChange);
    canvas.off("object:modified", handleCanvasChange);
    canvas.off("text:changed", handleCanvasChange);
  };
}, [isCanvasReady, productId, autoSaveDesign, productImage]);

// ----------------------------
// Effect B: Load saved design + restore product background
// ----------------------------
useEffect(() => {
  if (!fabricCanvasRef.current || !isCanvasReady || !productId) return;

  const canvas = fabricCanvasRef.current;

  const variationId = selectedVariation?.variationId
    ? selectedVariation.variationId.toString()
    : selectedVariation?.size || selectedVariation?.color || "default";

  // ✅ DEFINE loadBackgroundImage BEFORE using it
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
      // ✅ FIX: Safe renderAll with disposal check
      if (!canvas.disposed) {
        canvas.renderAll();
      }
    } catch (error) {
      console.error("❌ Failed to load background image:", error);
      if (!canvas.disposed) {
        canvas.backgroundColor = "#f3f4f6";
        canvas.renderAll();
      }
    }
  };

  // ✅ FIX: Detect product/variation change and clear canvas to prevent data leak
  const currentProductKey = `${productId}_${variationId}`;
  const lastProductKey = `${lastLoadedProductRef.current.productId}_${lastLoadedProductRef.current.variationId}`;

  const isProductChanged = currentProductKey !== lastProductKey && lastLoadedProductRef.current.productId !== null;

  if (isProductChanged) {
    console.log('🔄 Product changed - clearing canvas to prevent data leak');
    console.log('  Previous:', lastProductKey);
    console.log('  Current:', currentProductKey);
    canvas.getObjects().forEach((obj: any) => {
      if (obj !== canvas.backgroundImage) canvas.remove(obj);
    });
    // ✅ FIX: Safe renderAll with disposal check
    if (!canvas.disposed) {
      canvas.renderAll();
    }
  }

  // Update last loaded product reference
  lastLoadedProductRef.current = { productId, variationId };

  // ✅ FIX: Don't load if no valid variation is selected
  // This prevents loading wrong designs with "default" key
  if (!selectedVariation?.variationId && !selectedVariation?.size && !selectedVariation?.color) {
    canvas.getObjects().forEach((obj: any) => {
      if (obj !== canvas.backgroundImage) canvas.remove(obj);
    });
    loadBackgroundImage(productImage);
    return;
  }

  const loadSavedDesign = async () => {
    try {
      // ✅ FIX: Use designStore's loadDesign method instead of direct localStorage access
      // This ensures we use the correct storage format (Map in 'ecommerce_designs' key)
      let designData = null;

      try {
        // Use the designStore's loadDesign which handles both localStorage and database
        designData = await loadDesign(productId, variationId, currentDesignArea);
      } catch (err) {
        console.error('Failed to load design:', err);
      }

      // ✅ FIX: Validate design belongs to current product (prevent data leak)
      if (designData && designData.product_id && designData.product_id.toString() !== productId) {
        console.warn('⚠️ DATA LEAK PREVENTED: Design belongs to different product');
        console.warn(`  Design product ID: ${designData.product_id}`);
        console.warn(`  Current product ID: ${productId}`);
        designData = null; // Reject design from wrong product
      }

      // 3️⃣ Clear canvas except background
      canvas.getObjects().forEach((obj: any) => {
        if (obj !== canvas.backgroundImage) canvas.remove(obj);
      });

      if (designData?.canvas_data?.objects?.length > 0) {
        const fixedCanvasData = { ...designData.canvas_data };

        // Remove blob background
        if (fixedCanvasData.backgroundImage?.src?.startsWith("blob:")) {
          delete fixedCanvasData.backgroundImage;
        }

        // Fix object blobs
        fixedCanvasData.objects = fixedCanvasData.objects.map((obj: any) => {
          // ✅ FIX: Fabric.js uses "Image" (capital I) for image type
          if (obj.type?.toLowerCase() === "image" && obj.src?.startsWith("blob:")) {
            obj.src = obj.savedImageUrl || productImage;
          }
          return obj;
        });

        canvas.loadFromJSON(fixedCanvasData, async () => {
          // ✅ CRITICAL FIX: Restore custom properties after loadFromJSON
          // canvas.loadFromJSON recreates objects and loses custom properties
          canvas.getObjects().forEach((canvasObj: any, index: number) => {
            const originalData = fixedCanvasData.objects[index];
            // ✅ FIX: Fabric.js uses "Image" (capital I) for image type
            if (canvasObj.type?.toLowerCase() === 'image' && originalData?.savedImageUrl) {
              // ✅ CRITICAL: Assign directly, not via .set() - Fabric.js v6 requirement
              canvasObj.savedImageUrl = originalData.savedImageUrl;
              // ✅ DEBUG: Log restored savedImageUrl
              console.log('✅ Restored savedImageUrl:', originalData.savedImageUrl?.substring(0, 50) + '...');
            }
          });

          await loadBackgroundImage(productImage);
          // ✅ FIX: Safe renderAll with disposal check
          if (!canvas.disposed) {
            canvas.renderAll();
          }
        });
      } else {
        await loadBackgroundImage(productImage);
      }
    } catch (error) {
      console.error("❌ Error loading saved design:", error);
      // ✅ FIX: Wrap canvas.clear() in try-catch to prevent clearRect errors
      try {
        if (canvas && !canvas.disposed) {
          canvas.clear();
          await loadBackgroundImage(productImage);
        }
      } catch (clearError) {
        console.error("❌ Error clearing canvas:", clearError);
        // Canvas already disposed, just reload background
        try {
          await loadBackgroundImage(productImage);
        } catch (bgError) {
          console.error("❌ Error loading background:", bgError);
        }
      }
    }
  };

  loadSavedDesign();
  // ✅ FIX: Removed productImage from dependencies to prevent loops
  // productImage is used inside but doesn't need to trigger reload
  // Only reload when productId, variation, or design area changes
}, [
  isCanvasReady,
  productId,
  selectedVariation,
  currentDesignArea,
  loadDesign,
]);





  // Auto-save functionality with proper change detection

// -----------------------------
// IMPORTANT: When loading any images on this canvas, make sure to do:
// fabric.Image.fromURL(imageUrl, (img) => canvas.add(img), { crossOrigin: "anonymous" });


  // Load saved design when component mounts or design area changes
// useEffect(() => {
//   if (!fabricCanvasRef.current || !isCanvasReady || !productId) return;

//   const canvas = fabricCanvasRef.current;

//   const variationId = selectedVariation?.variationId
//     ? selectedVariation.variationId.toString()
//     : selectedVariation?.size || selectedVariation?.color || "default";

//   console.log("DesignCanvas: Loading design with variation ID:", variationId);

//   const loadBackgroundImage = async (url: string) => {
//     if (!url) return;

//     try {
//       const img: FabricImage = await FabricImage.fromURL(url, {
//         crossOrigin: "anonymous",
//       });

//       const scale = Math.min(
//         canvas.getWidth() / (img.width || 1),
//         canvas.getHeight() / (img.height || 1)
//       );
//       img.set({
//         scaleX: scale,
//         scaleY: scale,
//         left: canvas.getWidth() / 2,
//         top: canvas.getHeight() / 2,
//         originX: "center",
//         originY: "center",
//         selectable: false,
//         evented: false,
//       });

//       canvas.backgroundImage = img;
//       canvas.renderAll();
//       console.log("✅ Background image loaded successfully:", url);
//     } catch (error) {
//       console.error("❌ Error loading background image:", error);
//       canvas.backgroundColor = "#f3f4f6";
//       canvas.renderAll();
//     }
//   };

//   const loadSavedDesign = async () => {
//     try {
//       const savedDesign = await loadDesign(
//         productId,
//         variationId,
//         currentDesignArea
//       );

//       // Clear current canvas objects except background
//       canvas.getObjects().forEach((obj: any) => {
//         if (obj !== canvas.backgroundImage) canvas.remove(obj);
//       });

//       const objects = savedDesign?.canvas_data?.objects || [];

//       if (objects.length > 0) {
//         // Clone saved design safely
//         const fixedCanvasData = { ...savedDesign.canvas_data };

//         // ✅ Remove backgroundImage to avoid blob reload issue
//         if (fixedCanvasData.backgroundImage?.src?.startsWith("blob:")) {
//             delete fixedCanvasData.backgroundImage;
//           }

//           fixedCanvasData.objects = fixedCanvasData.objects.map((obj: any) => {
//             if (obj.type === "image" && obj.src?.startsWith("blob:")) {
//               obj.src = obj.savedImageUrl || productImage;
//             }
//             return obj;
//         });

        

//         // Load saved design (without blob background)
//         canvas.loadFromJSON(fixedCanvasData, async () => {
//           await loadBackgroundImage(productImage); // restore real product background
//           canvas.renderAll();
//           console.log("✅ Design loaded successfully (background replaced)");
//         });
//       } else {
//         // No saved objects, just load background
//         await loadBackgroundImage(productImage);
//       }
//     } catch (error) {
//       console.error("❌ Error loading saved design:", error);
//       canvas.clear();
//       await loadBackgroundImage(productImage);
//     }
//   };

//   loadSavedDesign();
// }, [
//   isCanvasReady,
//   productId,
//   selectedVariation,
//   currentDesignArea,
//   loadDesign,
//   productImage,
// ]);

// Listen for design store changes
// Listen for design store changes
 useEffect(() => {
  if (!fabricCanvasRef.current || !isCanvasReady || !designJson) return;

  const canvas = fabricCanvasRef.current;

  // ✅ FIX: Safe renderCanvas function that checks canvas state before rendering
  // Prevents "Cannot read properties of undefined (reading 'clearRect')" errors
  const renderCanvas = () => {
    try {
      if (canvas && !canvas.disposed && canvas.getWidth && canvas.getWidth() > 0) {
        canvas.renderAll();
      }
    } catch (error) {
      console.error('❌ Error rendering canvas:', error);
    }
  };

  const activeObject = canvas.getActiveObject();

  const loadImage = (url: string, callback: (img: FabricImage) => void) => {
    const imagePromise = FabricImage.fromURL(url, { crossOrigin: 'anonymous' });
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Image loading timeout')), 10000)
    );

    Promise.race([imagePromise, timeoutPromise])
      .then(callback)
      .catch((error) => {
        console.error('Error loading image:', error);
        alert('Failed to load image. Please try again.');
      });
  };

  switch (designJson.type) {
    case 'text':
      if (!designJson.content) return;
      const text = new FabricText(designJson.content, {
        left: canvas.getWidth() / 2,
        top: canvas.getHeight() / 2,
        originX: 'center',
        originY: 'center',
        fontSize: designJson.style?.fontSize || 40,
        fill: designJson.style?.color || '#000000',
        fontFamily: 'Arial',
        editable: true,
      });
      canvas.add(text);
      canvas.setActiveObject(text);
      renderCanvas();
      break;

    case 'image':
      if (!designJson.content) return;
      const originalImageUrl = designJson.content; // Store original URL

      // ✅ DEBUG: Log image being added
      console.log('🎨 Adding image with URL:', originalImageUrl?.substring(0, 50) + '...');

      loadImage(designJson.content, (img: FabricImage) => {
        // ✅ FIX: Set standard properties first
        img.set({
          left: canvas.getWidth() / 2,
          top: canvas.getHeight() / 2,
          originX: 'center',
          originY: 'center',
          scaleX: 0.5,
          scaleY: 0.5,
        });

        // ✅ CRITICAL FIX: Assign custom property directly (not via .set())
        // Fabric.js v6 requires direct assignment for custom properties to serialize
        (img as any).savedImageUrl = originalImageUrl;

        // ✅ DEBUG: Confirm savedImageUrl stored
        console.log('✅ savedImageUrl stored:', originalImageUrl?.substring(0, 50) + '...');

        canvas.add(img);
        canvas.setActiveObject(img);
        renderCanvas();
      });
      break;

    case 'clear':
      canvas.getObjects().forEach((obj) => {
        if (obj !== canvas.backgroundImage) canvas.remove(obj);
      });
      renderCanvas();

      // ✅ FIX: Immediately save the cleared state to prevent old design from reappearing
      // when switching areas. Without this, the debounced auto-save (2 seconds) might not
      // fire before area switch, causing the old design to reload.
      if (productId && productImage) {
        const clearedCanvasData = canvas.toJSON(['savedImageUrl']);
        if (clearedCanvasData.backgroundImage?.src?.startsWith("blob:")) {
          delete clearedCanvasData.backgroundImage;
        }
        autoSaveDesign(clearedCanvasData, productImage);
        setLastCanvasState(JSON.stringify(clearedCanvasData));
      }
      break;

    case 'format':
      // ✅ FIX: Check for all text types (text, textbox, i-text, etc.)
      if (!activeObject || !activeObject.type?.toLowerCase().includes('text')) return;
      const textObj = activeObject as FabricText;
      switch (designJson.format) {
        case 'bold': textObj.set('fontWeight', textObj.fontWeight === 'bold' ? 'normal' : 'bold'); break;
        case 'italic': textObj.set('fontStyle', textObj.fontStyle === 'italic' ? 'normal' : 'italic'); break;
        case 'underline': textObj.set('underline', !textObj.underline); break;
        case 'alignLeft': textObj.set('textAlign', 'left'); break;
        case 'alignCenter': textObj.set('textAlign', 'center'); break;
        case 'alignRight': textObj.set('textAlign', 'right'); break;
      }
      renderCanvas();
      break;

    case 'position':
      if (!activeObject) return;
      const cw = canvas.getWidth();
      const ch = canvas.getHeight();
      switch (designJson.position) {
        case 'left': activeObject.set({ left: 100, originX: 'left' }); break;
        case 'center': activeObject.set({ left: cw / 2, originX: 'center' }); break;
        case 'right': activeObject.set({ left: cw - 100, originX: 'right' }); break;
        case 'top': activeObject.set({ top: 100, originY: 'top' }); break;
        case 'middle': activeObject.set({ top: ch / 2, originY: 'center' }); break;
        case 'bottom': activeObject.set({ top: ch - 100, originY: 'bottom' }); break;
      }
      activeObject.setCoords();
      canvas.setActiveObject(activeObject);
      renderCanvas();
      break;

    case 'textColor':
      // ✅ FIX: Check for all text types (text, textbox, i-text, etc.)
      if (!activeObject || !activeObject.type?.toLowerCase().includes('text') || !designJson.color) return;
      (activeObject as FabricText).set('fill', designJson.color);
      renderCanvas();
      break;

    case 'fontFamily':
      // ✅ FIX: Check for all text types (text, textbox, i-text, etc.)
      if (!activeObject || !activeObject.type?.toLowerCase().includes('text') || !designJson.fontFamily) return;
      (activeObject as FabricText).set('fontFamily', designJson.fontFamily);
      // ✅ FIX: Force object coordinate update after font change
      activeObject.setCoords();
      canvas.setActiveObject(activeObject);
      renderCanvas();
      break;

    case 'fontSize':
      // ✅ FIX: Check for all text types (text, textbox, i-text, etc.)
      if (!activeObject || !activeObject.type?.toLowerCase().includes('text') || !designJson.fontSize) return;
      (activeObject as FabricText).set('fontSize', designJson.fontSize);
      // ✅ FIX: Force object coordinate update after font size change
      activeObject.setCoords();
      canvas.setActiveObject(activeObject);
      renderCanvas();
      break;

    case 'delete':
      if (!activeObject) return;
      canvas.remove(activeObject);
      canvas.discardActiveObject();
      setSelectedObject(null);
      renderCanvas();
      break;

    case 'duplicate':
      if (!activeObject) return;
      activeObject.clone().then((cloned: any) => {
        cloned.set({ left: cloned.left + 20, top: cloned.top + 20 });
        canvas.add(cloned);
        canvas.setActiveObject(cloned);
        renderCanvas();
      });
      break;

    case 'bringToFront':
      if (!activeObject) return;
      canvas.bringObjectToFront(activeObject);
      activeObject.set('visible', false);
      renderCanvas();
      activeObject.set('visible', true);
      canvas.setActiveObject(activeObject);
      renderCanvas();
      break;

    case 'bringForward':
      if (!activeObject) return;
      canvas.bringObjectForward(activeObject);
      activeObject.set('visible', false);
      renderCanvas();
      activeObject.set('visible', true);
      canvas.setActiveObject(activeObject);
      renderCanvas();
      break;

    case 'sendBackward':
      if (!activeObject) return;
      canvas.sendObjectBackwards(activeObject);
      activeObject.set('visible', false);
      renderCanvas();
      activeObject.set('visible', true);
      canvas.setActiveObject(activeObject);
      renderCanvas();
      break;

    case 'sendToBack':
      if (!activeObject) return;
      canvas.sendObjectToBack(activeObject);
      activeObject.set('visible', false);
      renderCanvas();
      activeObject.set('visible', true);
      canvas.setActiveObject(activeObject);
      renderCanvas();
      break;

    case 'imageAdjust':
      if (!activeObject || activeObject.type !== 'image' || !designJson.property) return;
      const imgObj = activeObject as FabricImage;
      imgObj.filters = imgObj.filters || [];

      switch (designJson.property) {
        case 'hue':
          imgObj.filters = imgObj.filters.filter(f => f.type !== 'HueRotation');
          if (designJson.value !== 0) imgObj.filters.push(new filters.HueRotation({ rotation: (designJson.value * Math.PI) / 180 }));
          break;
        case 'saturation':
          imgObj.filters = imgObj.filters.filter(f => f.type !== 'Saturation');
          if (designJson.value !== 100) imgObj.filters.push(new filters.Saturation({ saturation: (designJson.value - 100) / 100 }));
          break;
        case 'brightness':
          imgObj.filters = imgObj.filters.filter(f => f.type !== 'Brightness');
          if (designJson.value !== 100) imgObj.filters.push(new filters.Brightness({ brightness: (designJson.value - 100) / 100 }));
          break;
        case 'opacity':
          imgObj.set('opacity', designJson.value / 100);
          break;
      }
      imgObj.applyFilters();
      renderCanvas();
      break;

    // Add any other custom actions like imageAction here if needed
  }
}, [designJson, isCanvasReady]);

  // Auto-save canvas changes per view (text, images, etc.)
// Auto-save canvas changes with debouncing
// useEffect(() => {
//   if (!fabricCanvasRef.current || !isCanvasReady || !productId || !productImage) return;

//   const canvas = fabricCanvasRef.current;
//   let saveTimeoutRef: NodeJS.Timeout | null = null;
//   let isBackgroundLoaded = false;

//   // Load product image as background
//   const loadBackgroundImage = async () => {
//     try {
//       await new Promise<void>((resolve, reject) => {
//         fabric.Image.fromURL(
//           productImage,
//           (img) => {
//             if (!img) return reject('Failed to load product image');
//             img.selectable = false;
//             canvas.setBackgroundImage(
//               img,
//               canvas.renderAll.bind(canvas),
//               { crossOrigin: 'anonymous' }
//             );
//             isBackgroundLoaded = true;
//             console.log('🖼 Product image loaded as background');
//             resolve();
//           }
//         );
//       });
//     } catch (error) {
//       console.error('❌ Error loading product image:', error);
//     }
//   };

//   // Save function
//   const saveCanvasData = () => {
//     if (!isBackgroundLoaded) return; // do not save before background is ready
//     try {
//       const canvasData = canvas.toJSON();
//       if (canvasData.objects && canvasData.objects.length > 0) {
//         autoSaveDesign(canvasData, productImage);
//         console.log('✅ Auto-saved canvas');
//         setLastCanvasState(JSON.stringify(canvasData)); // keep your last state updated
//         setLastSaveTime(Date.now());
//       }
//     } catch (error) {
//       console.error('❌ Error auto-saving canvas:', error);
//     }
//   };

//   // Debounced save
//   const debouncedSave = () => {
//     if (saveTimeoutRef) clearTimeout(saveTimeoutRef);
//     saveTimeoutRef = setTimeout(saveCanvasData, 2000); // 2 sec debounce
//   };

//   const handleCanvasChange = () => {
//     console.log('🖌 Canvas changed, scheduling auto-save...');
//     debouncedSave();
//   };

//   // Attach listeners
//   canvas.on('object:added', handleCanvasChange);
//   canvas.on('object:modified', handleCanvasChange);
//   canvas.on('object:removed', handleCanvasChange);
//   canvas.on('text:changed', handleCanvasChange);

//   // Load the background image initially
//   loadBackgroundImage();

//   // Cleanup on unmount
//   return () => {
//     if (saveTimeoutRef) clearTimeout(saveTimeoutRef);
//     canvas.off('object:added', handleCanvasChange);
//     canvas.off('object:modified', handleCanvasChange);
//     canvas.off('object:removed', handleCanvasChange);
//     canvas.off('text:changed', handleCanvasChange);
//     console.log('🗑 Auto-save listeners removed');
//   };
// }, [isCanvasReady, productImage, autoSaveDesign, productId]);
// ✅ REMOVED: Duplicate background image loading useEffect
// Background is already loaded in the design loading useEffect above (lines 196-323)
// This was causing duplicate product images in the canvas

// async function generatePreview(canvasData, baseImageUrl, options) {
//   // 1. Load base image
//   const baseImg = await loadImage(baseImageUrl);

//   // 2. Initialize offscreen Fabric canvas
//   const offscreenCanvas = new fabric.Canvas(null, { width: baseImg.width, height: baseImg.height });

//   // 3. Load canvasData (design elements)
//   if (canvasData) {
//     offscreenCanvas.loadFromJSON(canvasData);
//   }

//   // 4. Add base image as background
//   offscreenCanvas.setBackgroundImage(baseImg, offscreenCanvas.renderAll.bind(offscreenCanvas));

//   // 5. Render and export
//   return offscreenCanvas.toDataURL({ format: 'png', multiplier: options.multiplier || 1, quality: options.quality || 1 });
// }



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
      // ✅ FIX: Safe renderAll with disposal check
      if (!canvas.disposed) {
        canvas.renderAll();
      }

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
