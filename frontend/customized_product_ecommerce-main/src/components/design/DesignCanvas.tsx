'use client';

import { useEffect, useRef, useState } from 'react';
import { useDesignStore } from '@/store/designStore';

// Dynamic import for fabric.js to avoid SSR issues
let fabric: any = null;
let Canvas: any = null;
let FabricImage: any = null;
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
  onCanvasReady?: (canvas: any) => void;
}

const DesignCanvas = ({ productImage, onCanvasReady }: DesignCanvasProps) => {
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
  useEffect(() => {
    const initializeFabric = async () => {
      await loadFabric();
      setFabricLoaded(true);
    };
    
    initializeFabric();
  }, []);

  useEffect(() => {
    if (!canvasRef.current || !fabricLoaded) return;

    // Initialize Fabric.js canvas
    const canvas = new Canvas(canvasRef.current, {
      width: 600,
      height: 600,
      backgroundColor: '#f3f4f6',
    });

    fabricCanvasRef.current = canvas;

    // Ensure canvas is fully initialized before calling ready callback
    const initializeCanvas = () => {
      try {
        // Check if canvas is properly initialized by testing basic properties without calling methods that might fail
        if (canvas && canvas.width && canvas.height && canvas.width > 0 && canvas.height > 0) {
          // Additional check to ensure canvas is truly ready
          try {
            // Test if we can safely call basic canvas methods
            const testWidth = canvas.getWidth();
            const testHeight = canvas.getHeight();
            
            if (testWidth > 0 && testHeight > 0) {
              setIsCanvasReady(true);
              
              // Call the onCanvasReady callback if provided
              if (onCanvasReady) {
                console.log('DesignCanvas: Canvas fully initialized, calling onCanvasReady');
                onCanvasReady(canvas);
              }
              return; // Successfully initialized
            }
          } catch (methodError) {
            console.log('Canvas methods not ready yet, retrying...');
          }
        }
        
        // Retry after a short delay if canvas is not ready
        console.log('DesignCanvas: Canvas not ready, retrying...');
        setTimeout(initializeCanvas, 100);
        
      } catch (error) {
        console.error('Error checking canvas initialization:', error);
        // Retry after a longer delay on error
        setTimeout(initializeCanvas, 200);
      }
    };

    // Start initialization process with a longer initial delay
    setTimeout(initializeCanvas, 100);

    // Add selection event listeners
    canvas.on('selection:created', (e: any) => {
      setSelectedObject(e.selected?.[0] || null);
    });

    canvas.on('selection:updated', (e: any) => {
      setSelectedObject(e.selected?.[0] || null);
    });

    canvas.on('selection:cleared', () => {
      setSelectedObject(null);
    });

    // Add double-click event listener for text editing
    canvas.on('mouse:dblclick', (e: any) => {
      try {
        const target = e.target;
        if (target && target.type === 'text') {
          const textObj = target as any;
          
          // Create a temporary textarea element for multi-line text editing
          const textarea = document.createElement('textarea');
          textarea.value = textObj.text || '';
          textarea.style.position = 'absolute';
          textarea.style.fontSize = `${(textObj.fontSize || 40).toString()}px`;
          textarea.style.fontFamily = (textObj.fontFamily as string) || 'Arial';
          textarea.style.color = textObj.fill as string || '#000000';
          textarea.style.background = 'white';
          textarea.style.border = '2px solid #007bff';
          textarea.style.outline = 'none';
          textarea.style.zIndex = '1000';
          textarea.style.minWidth = '200px';
          textarea.style.height = '60px';
          textarea.style.minHeight = '60px';
          textarea.style.maxHeight = 'none';
          textarea.style.padding = '2px 4px';
          textarea.style.borderRadius = '4px';
          textarea.style.resize = 'vertical';
          textarea.style.lineHeight = '1.2';
          textarea.style.overflow = 'auto';
          textarea.style.fontWeight = (textObj.fontWeight as string) || 'normal';
          textarea.style.fontStyle = (textObj.fontStyle as string) || 'normal';
          textarea.style.textDecoration = textObj.underline ? 'underline' : 'none';
          
          // Position the textarea relative to the canvas
          const canvasElement = canvas.getElement();
          const canvasRect = canvasElement.getBoundingClientRect();
          textarea.style.left = `${canvasRect.left + (textObj.left || 0) - 100}px`;
          textarea.style.top = `${canvasRect.top + (textObj.top || 0) - 30}px`;
          
          document.body.appendChild(textarea);
          textarea.focus();
          textarea.select();
          
          // Handle input completion
          const handleInputComplete = () => {
            try {
              const newText = textarea.value.trim();
              if (newText) {
                textObj.set('text', newText);
                canvas.renderAll();
              }
              if (document.body.contains(textarea)) {
                document.body.removeChild(textarea);
              }
            } catch (error) {
              console.error('Error updating text:', error);
              if (document.body.contains(textarea)) {
                document.body.removeChild(textarea);
              }
            }
          };
          
          // Handle keyboard events
          textarea.addEventListener('keydown', (event) => {
            // Allow Enter for new lines, use Ctrl+Enter or Escape to finish editing
            if (event.key === 'Escape' || (event.key === 'Enter' && event.ctrlKey)) {
              event.preventDefault();
              handleInputComplete();
            }
          });
          
          textarea.addEventListener('blur', handleInputComplete);
        }
      } catch (error) {
        console.error('Error in double-click handler:', error);
      }
    });

    // Load product image as background if available
    if (productImage) {
      console.log('DesignCanvas: Loading product image:', productImage);
      FabricImage.fromURL(productImage, { crossOrigin: 'anonymous' as const }).then((img: any) => {
        console.log('DesignCanvas: Product image loaded successfully');
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

        canvas.backgroundImage = img;
        canvas.renderAll();
        console.log('DesignCanvas: Product image set as background');
      }).catch((error: any) => {
        console.error('Error loading product image:', error);
        // Fallback: try loading without crossOrigin
        FabricImage.fromURL(productImage).then((img: any) => {
          console.log('DesignCanvas: Product image loaded with fallback method');
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

          canvas.backgroundImage = img;
          canvas.renderAll();
          console.log('DesignCanvas: Product image set as background with fallback');
        }).catch((fallbackError: any) => {
          console.error('Error loading product image (fallback):', fallbackError);
          // Set a placeholder background or show error
          canvas.backgroundColor = '#f3f4f6';
          canvas.renderAll();
          console.log('DesignCanvas: Set fallback background color');
        });
      });
    } else {
      console.log('DesignCanvas: No product image provided, using default background');
      canvas.backgroundColor = '#f3f4f6';
      canvas.renderAll();
    }

    // Cleanup function
    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
      canvas.dispose();
      fabricCanvasRef.current = null;
      setIsCanvasReady(false);
    };
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
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      // Set new timeout
      saveTimeoutRef.current = setTimeout(() => {
        saveIfChanged();
      }, 2000); // Wait 2 seconds after last change before saving
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
    const initialCanvasState = JSON.stringify(canvas.toJSON());
    setLastCanvasState(initialCanvasState);

    return () => {
      // Clear timeouts
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      // Remove event listeners
      canvas.off('object:added', handleCanvasChange);
      canvas.off('object:removed', handleCanvasChange);
      canvas.off('object:modified', handleCanvasChange);
      canvas.off('text:changed', handleCanvasChange);
    };
  }, [isCanvasReady, productId, autoSaveDesign, productImage, lastCanvasState]);

  // Load saved design when component mounts or design area changes
  useEffect(() => {
    if (!fabricCanvasRef.current || !isCanvasReady || !productId) return;

    const canvas = fabricCanvasRef.current;
    // Use the actual variation ID if available, otherwise fall back to string-based ID
    const variationId = selectedVariation?.variationId 
      ? selectedVariation.variationId.toString()
      : selectedVariation?.size || selectedVariation?.color || 'default';
    
    console.log('DesignCanvas: Loading design with variation ID:', variationId, 'from selectedVariation:', selectedVariation);
    
    // Try to load saved design
    const loadSavedDesign = async () => {
      try {
        const savedDesign = await loadDesign(productId, variationId, currentDesignArea);
        
        if (savedDesign && savedDesign.canvas_data && savedDesign.canvas_data.objects.length > 0) {
          console.log('Loading saved design:', savedDesign);
          
          // Clear current canvas objects (except background)
          const objects = canvas.getObjects();
          objects.forEach((obj: any) => {
            if (obj !== canvas.backgroundImage) {
              canvas.remove(obj);
            }
          });

          // Use direct fabric.js loadFromJSON to load saved design
          try {
            canvas.loadFromJSON(savedDesign.canvas_data, () => {
              try {
                // Restore background image after loading
                if (productImage) {
                  FabricImage.fromURL(productImage, { crossOrigin: 'anonymous' as const }).then((img: any) => {
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

                    canvas.backgroundImage = img;
                    canvas.renderAll();
                  }).catch((error: any) => {
                    console.error('Error loading background image:', error);
                    // Fallback without crossOrigin
                    FabricImage.fromURL(productImage).then((img: any) => {
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

                      canvas.backgroundImage = img;
                      canvas.renderAll();
                    }).catch((fallbackError: any) => {
                      console.error('Error loading background image (fallback):', fallbackError);
                    });
                  });
                }
                canvas.renderAll();
                console.log('Design loaded successfully');
              } catch (renderError) {
                console.error('Error in loadFromJSON callback:', renderError);
              }
            });
          } catch (loadError) {
            console.error('Error loading saved design:', loadError);
            try {
              canvas.clear();
              canvas.renderAll();
            } catch (clearError) {
              console.error('Error clearing canvas after failed load:', clearError);
            }
          }
        }
      } catch (error) {
        console.error('Error loading saved design:', error);
      }
    };
    
    loadSavedDesign();
  }, [isCanvasReady, productId, selectedVariation, currentDesignArea, loadDesign, productImage]);

  // Listen for design store changes
  useEffect(() => {
    if (!fabricCanvasRef.current || !isCanvasReady || !designJson) return;

    const canvas = fabricCanvasRef.current;

    // Handle different design actions
    if (designJson.type === 'text' && designJson.content) {
      // Add text to canvas
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
      canvas.renderAll();
    } else if (designJson.type === 'image' && designJson.content) {
      // Add image to canvas
      // For user-uploaded images (blob URLs), we don't need crossOrigin
      const isUserUpload = designJson.content.startsWith('blob:');
      const imageOptions = isUserUpload ? undefined : { crossOrigin: 'anonymous' as const };
      
      FabricImage.fromURL(designJson.content, imageOptions).then((img: any) => {
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
      }).catch((error) => {
        console.error('Error loading image:', error);
        // Fallback without crossOrigin for external images
        if (!isUserUpload) {
          FabricImage.fromURL(designJson.content).then((img: FabricImage) => {
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
          }).catch((fallbackError) => {
            console.error('Error loading image (fallback):', fallbackError);
          });
        }
      });
    } else if (designJson.type === 'clear') {
      // Clear all objects except background
      const objects = canvas.getObjects();
      objects.forEach((obj: any) => {
        if (obj !== canvas.backgroundImage) {
          canvas.remove(obj);
        }
      });
      canvas.renderAll();
    } else if (designJson.type === 'format' && designJson.format) {
      // Handle text formatting
      const activeObject = canvas.getActiveObject();
      if (activeObject && activeObject.type === 'text') {
        const textObj = activeObject as FabricText;
        
        switch (designJson.format) {
          case 'bold':
            textObj.set('fontWeight', textObj.fontWeight === 'bold' ? 'normal' : 'bold');
            break;
          case 'italic':
            textObj.set('fontStyle', textObj.fontStyle === 'italic' ? 'normal' : 'italic');
            break;
          case 'underline':
            textObj.set('underline', !textObj.underline);
            break;
          case 'alignLeft':
            textObj.set('textAlign', 'left');
            break;
          case 'alignCenter':
            textObj.set('textAlign', 'center');
            break;
          case 'alignRight':
            textObj.set('textAlign', 'right');
            break;
        }
        canvas.renderAll();
      }
    } else if (designJson.type === 'position' && designJson.position) {
      // Handle text positioning
      const activeObject = canvas.getActiveObject();
      if (activeObject) {
        const canvasWidth = canvas.getWidth();
        const canvasHeight = canvas.getHeight();
        
        switch (designJson.position) {
          case 'left':
            activeObject.set({ left: 100, originX: 'left' });
            break;
          case 'center':
            activeObject.set({ left: canvasWidth / 2, originX: 'center' });
            break;
          case 'right':
            activeObject.set({ left: canvasWidth - 100, originX: 'right' });
            break;
          case 'top':
            activeObject.set({ top: 100, originY: 'top' });
            break;
          case 'middle':
            activeObject.set({ top: canvasHeight / 2, originY: 'center' });
            break;
          case 'bottom':
            activeObject.set({ top: canvasHeight - 100, originY: 'bottom' });
            break;
        }
        
        // Update object coordinates and refresh selection controls
        activeObject.setCoords();
        canvas.setActiveObject(activeObject);
        canvas.renderAll();
        canvas.requestRenderAll();
      }
    } else if (designJson.type === 'textColor' && designJson.color) {
      // Handle text color change
      const activeObject = canvas.getActiveObject();
      if (activeObject && activeObject.type === 'text') {
        const textObj = activeObject as FabricText;
        textObj.set('fill', designJson.color);
        canvas.renderAll();
      }
    } else if (designJson.type === 'fontFamily' && designJson.fontFamily) {
      // Handle font family change
      const activeObject = canvas.getActiveObject();
      if (activeObject && activeObject.type === 'text') {
        const textObj = activeObject as FabricText;
        textObj.set('fontFamily', designJson.fontFamily);
        canvas.renderAll();
      }
    } else if (designJson.type === 'fontSize' && designJson.fontSize) {
      // Handle font size change
      const activeObject = canvas.getActiveObject();
      if (activeObject && activeObject.type === 'text') {
        const textObj = activeObject as FabricText;
        textObj.set('fontSize', designJson.fontSize);
        canvas.renderAll();
      }
    } else if (designJson.type === 'delete') {
      // Handle delete action
      const activeObject = canvas.getActiveObject();
      if (activeObject) {
        canvas.remove(activeObject);
        canvas.discardActiveObject();
        setSelectedObject(null);
        canvas.renderAll();
      }
    } else if (designJson.type === 'duplicate') {
      // Handle duplicate action
      const activeObject = canvas.getActiveObject();
      if (activeObject) {
        activeObject.clone().then((cloned: any) => {
          cloned.set({
            left: cloned.left + 20,
            top: cloned.top + 20,
          });
          canvas.add(cloned);
          canvas.setActiveObject(cloned);
          canvas.renderAll();
        });
      }
    } else if (designJson.type === 'bringToFront') {
      // Handle bring to front action
      const activeObject = canvas.getActiveObject();
      if (activeObject) {
        canvas.bringObjectToFront(activeObject);
        // Force immediate re-render by toggling visibility
        activeObject.set('visible', false);
        canvas.renderAll();
        activeObject.set('visible', true);
        canvas.renderAll();
        canvas.setActiveObject(activeObject);
      }
    } else if (designJson.type === 'bringForward') {
      // Handle bring forward action
      const activeObject = canvas.getActiveObject();
      if (activeObject) {
        canvas.bringObjectForward(activeObject);
        // Force immediate re-render by toggling visibility
        activeObject.set('visible', false);
        canvas.renderAll();
        activeObject.set('visible', true);
        canvas.renderAll();
        canvas.setActiveObject(activeObject);
      }
    } else if (designJson.type === 'sendBackward') {
      // Handle send backward action
      const activeObject = canvas.getActiveObject();
      if (activeObject) {
        canvas.sendObjectBackwards(activeObject);
        // Force immediate re-render by toggling visibility
        activeObject.set('visible', false);
        canvas.renderAll();
        activeObject.set('visible', true);
        canvas.renderAll();
        canvas.setActiveObject(activeObject);
      }
    } else if (designJson.type === 'sendToBack') {
      // Handle send to back action
      const activeObject = canvas.getActiveObject();
      if (activeObject) {
        canvas.sendObjectToBack(activeObject);
        // Force immediate re-render by toggling visibility
        activeObject.set('visible', false);
        canvas.renderAll();
        activeObject.set('visible', true);
        canvas.renderAll();
        canvas.setActiveObject(activeObject);
      }
    } else if (designJson.type === 'imageAction' && designJson.action) {
      // Handle image actions
      const activeObject = canvas.getActiveObject();
      if (activeObject && activeObject.type === 'image') {
        switch (designJson.action) {
          case 'replace':
            // Create a file input to replace the image
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                  const imageUrl = event.target?.result as string;
                  
                  // Validate the data URL
                  if (!imageUrl || !imageUrl.startsWith('data:image/')) {
                    console.error('Invalid image data URL');
                    alert('Failed to load image. Please try again.');
                    return;
                  }
                  
                  // Create image loading promise with timeout
                  const imageLoadPromise = FabricImage.fromURL(imageUrl, {
                    crossOrigin: 'anonymous'
                  });
                  
                  // Add timeout to prevent hanging
                  const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Image loading timeout')), 10000); // 10 second timeout
                  });
                  
                  Promise.race([imageLoadPromise, timeoutPromise]).then((newImg: FabricImage) => {
                    // Copy properties from old image
                    newImg.set({
                      left: activeObject.left,
                      top: activeObject.top,
                      scaleX: activeObject.scaleX,
                      scaleY: activeObject.scaleY,
                      angle: activeObject.angle,
                      originX: activeObject.originX,
                      originY: activeObject.originY,
                    });
                    
                    canvas.remove(activeObject);
                    canvas.add(newImg);
                    canvas.setActiveObject(newImg);
                    canvas.renderAll();
                  }).catch((error) => {
                    console.error('Error loading replacement image:', error);
                    if (error.message === 'Image loading timeout') {
                      alert('Image loading timed out. Please try again with a smaller image.');
                    } else {
                      alert('Failed to load replacement image. Please try again.');
                    }
                  });
                };
                reader.readAsDataURL(file);
              }
            };
            input.click();
            break;
          case 'crop':
            // Enable crop mode for the selected image
            try {
              const imgObj = activeObject as FabricImage;
              
              // Create crop overlay rectangle
              const cropRect = new Rect({
                left: imgObj.left! - (imgObj.getScaledWidth() / 4),
                top: imgObj.top! - (imgObj.getScaledHeight() / 4),
                width: imgObj.getScaledWidth() / 2,
                height: imgObj.getScaledHeight() / 2,
                fill: 'transparent',
                stroke: '#007bff',
                strokeWidth: 2,
                strokeDashArray: [5, 5],
                selectable: true,
                evented: true,
                hasControls: true,
                hasBorders: true,
                lockRotation: true,
                cornerColor: '#007bff',
                cornerSize: 8,
                transparentCorners: false,
                cornerStyle: 'rect',
              });
              
              // Add crop rectangle to canvas
              canvas.add(cropRect);
              canvas.setActiveObject(cropRect);
              canvas.renderAll();
              
              // Store reference to original image and crop rect
              (cropRect as any).originalImage = imgObj;
              (cropRect as any).isCropRect = true;
              
              // Make original image non-selectable during crop
              imgObj.set({
                selectable: false,
                evented: false,
              });
              
              // Add crop confirmation buttons
              const confirmCrop = () => {
                try {
                  // Get crop dimensions relative to the image
                  const imgBounds = imgObj.getBoundingRect();
                  const cropBounds = cropRect.getBoundingRect();
                  
                  // Calculate crop area relative to original image
                  const scaleX = imgObj.scaleX || 1;
                  const scaleY = imgObj.scaleY || 1;
                  
                  const cropX = Math.max(0, (cropBounds.left - imgBounds.left) / scaleX);
                  const cropY = Math.max(0, (cropBounds.top - imgBounds.top) / scaleY);
                  const cropWidth = Math.min(cropBounds.width / scaleX, (imgObj.width || 0) - cropX);
                  const cropHeight = Math.min(cropBounds.height / scaleY, (imgObj.height || 0) - cropY);
                  
                  // Create temporary canvas for cropping
                  const tempCanvas = document.createElement('canvas');
                  const tempCtx = tempCanvas.getContext('2d');
                  if (!tempCtx) return;
                  
                  tempCanvas.width = cropWidth;
                  tempCanvas.height = cropHeight;
                  
                  // Get original image element
                  const imgElement = (imgObj as any)._element;
                  if (!imgElement) return;
                  
                  // Draw cropped portion
                  tempCtx.drawImage(
                    imgElement,
                    cropX, cropY, cropWidth, cropHeight,
                    0, 0, cropWidth, cropHeight
                  );
                  
                  // Convert to data URL with error handling
                  let croppedImageUrl: string;
                  try {
                    croppedImageUrl = tempCanvas.toDataURL('image/png', 0.9); // Add compression
                  } catch (error) {
                    console.error('Error creating data URL:', error);
                    alert('Failed to process cropped image. Please try again.');
                    cancelCrop();
                    return;
                  }
                  
                  // Validate data URL
                  if (!croppedImageUrl || croppedImageUrl.length < 100) {
                    console.error('Invalid data URL generated');
                    alert('Failed to process cropped image. Please try again.');
                    cancelCrop();
                    return;
                  }
                  
                  // Create new fabric image with cropped content with timeout
                  const imageLoadPromise = FabricImage.fromURL(croppedImageUrl, {
                    crossOrigin: 'anonymous'
                  });
                  
                  // Add timeout to prevent hanging
                  const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Image loading timeout')), 10000); // 10 second timeout
                  });
                  
                  Promise.race([imageLoadPromise, timeoutPromise]).then((newImg: FabricImage) => {
                    newImg.set({
                      left: cropBounds.left + cropBounds.width / 2,
                      top: cropBounds.top + cropBounds.height / 2,
                      originX: 'center',
                      originY: 'center',
                      scaleX: scaleX,
                      scaleY: scaleY,
                    });
                    
                    // Remove original image and crop rectangle
                    canvas.remove(imgObj);
                    canvas.remove(cropRect);
                    
                    // Add cropped image
                    canvas.add(newImg);
                    canvas.setActiveObject(newImg);
                    canvas.renderAll();
                    
                    // Clean up event listeners
                    document.removeEventListener('keydown', handleCropKeydown);
                  }).catch((error) => {
                    console.error('Error loading cropped image:', error);
                    if (error.message === 'Image loading timeout') {
                      alert('Image loading timed out. Please try again with a smaller image.');
                    } else {
                      alert('Failed to load cropped image. Please try again.');
                    }
                    cancelCrop();
                  });
                  
                } catch (error) {
                  console.error('Error cropping image:', error);
                  cancelCrop();
                }
              };
              
              const cancelCrop = () => {
                // Restore original image selectability
                imgObj.set({
                  selectable: true,
                  evented: true,
                });
                
                // Remove crop rectangle
                canvas.remove(cropRect);
                canvas.setActiveObject(imgObj);
                canvas.renderAll();
                
                // Clean up event listeners
                document.removeEventListener('keydown', handleCropKeydown);
              };
              
              // Handle keyboard shortcuts for crop
              const handleCropKeydown = (e: KeyboardEvent) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  confirmCrop();
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  cancelCrop();
                }
              };
              
              // Add keyboard event listener
              document.addEventListener('keydown', handleCropKeydown);
              
              // Show instructions
              console.log('Crop mode activated. Adjust the blue rectangle and press Enter to crop or Escape to cancel.');
              
              // Optional: Show toast notification
              const toast = document.createElement('div');
              toast.innerHTML = 'Crop mode: Adjust the blue rectangle, then press Enter to crop or Escape to cancel';
              toast.style.position = 'fixed';
              toast.style.top = '20px';
              toast.style.right = '20px';
              toast.style.background = '#007bff';
              toast.style.color = 'white';
              toast.style.padding = '10px 15px';
              toast.style.borderRadius = '5px';
              toast.style.zIndex = '10000';
              toast.style.fontSize = '14px';
              toast.style.maxWidth = '300px';
              document.body.appendChild(toast);
              
              // Remove toast after 5 seconds
              setTimeout(() => {
                if (document.body.contains(toast)) {
                  document.body.removeChild(toast);
                }
              }, 5000);
              
            } catch (error) {
              console.error('Error enabling crop mode:', error);
              alert('Failed to enable crop mode. Please try again.');
            }
            break;
          case 'removeBg':
            // Remove background from the selected image
            try {
              // Get the current image element
              const imgElement = (activeObject as any)._element;
              if (!imgElement) break;
              
              // Create a temporary canvas for processing
              const tempCanvas = document.createElement('canvas');
              const tempCtx = tempCanvas.getContext('2d');
              if (!tempCtx) break;
              
              // Set canvas size to match image
              tempCanvas.width = imgElement.naturalWidth || imgElement.width;
              tempCanvas.height = imgElement.naturalHeight || imgElement.height;
              
              // Draw the image to the temporary canvas
              tempCtx.drawImage(imgElement, 0, 0);
              
              // Get image data
              const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
              const data = imageData.data;
              
              // Simple background removal algorithm
              // This removes pixels that are similar to the corner pixels (assumed to be background)
              const cornerPixel = {
                r: data[0],
                g: data[1],
                b: data[2]
              };
              
              const threshold = 30; // Adjust this value for sensitivity
              
              for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                
                // Calculate color difference from corner pixel
                const diff = Math.sqrt(
                  Math.pow(r - cornerPixel.r, 2) +
                  Math.pow(g - cornerPixel.g, 2) +
                  Math.pow(b - cornerPixel.b, 2)
                );
                
                // If pixel is similar to background, make it transparent
                if (diff < threshold) {
                  data[i + 3] = 0; // Set alpha to 0 (transparent)
                }
              }
              
              // Put the modified image data back
              tempCtx.putImageData(imageData, 0, 0);
              
              // Convert canvas to data URL with error handling
              let processedImageUrl: string;
              try {
                processedImageUrl = tempCanvas.toDataURL('image/png', 0.9); // Add compression
              } catch (error) {
                console.error('Error creating processed image data URL:', error);
                alert('Failed to process image. Please try again.');
                return;
              }
              
              // Validate data URL
              if (!processedImageUrl || processedImageUrl.length < 100) {
                console.error('Invalid processed image data URL generated');
                alert('Failed to process image. Please try again.');
                return;
              }
              
              // Create new fabric image with background removed with timeout
              const imageLoadPromise = FabricImage.fromURL(processedImageUrl, {
                crossOrigin: 'anonymous'
              });
              
              // Add timeout to prevent hanging
              const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Image loading timeout')), 10000); // 10 second timeout
              });
              
              Promise.race([imageLoadPromise, timeoutPromise]).then((newImg: FabricImage) => {
                // Copy properties from old image
                newImg.set({
                  left: activeObject.left,
                  top: activeObject.top,
                  scaleX: activeObject.scaleX,
                  scaleY: activeObject.scaleY,
                  angle: activeObject.angle,
                  originX: activeObject.originX,
                  originY: activeObject.originY,
                });
                
                canvas.remove(activeObject);
                canvas.add(newImg);
                canvas.setActiveObject(newImg);
                canvas.renderAll();
              }).catch((error) => {
                console.error('Error loading processed image:', error);
                if (error.message === 'Image loading timeout') {
                  alert('Image loading timed out. Please try again with a smaller image.');
                } else {
                  alert('Failed to load processed image. Please try again.');
                }
              });
              
            } catch (error) {
              console.error('Error removing background:', error);
              alert('Failed to remove background. Please try again.');
            }
            break;
          case 'sharpen':
            // Apply sharpen filter to the selected image
            try {
              const imgObj = activeObject as FabricImage;
              
              // Apply sharpen filter
              imgObj.filters = imgObj.filters || [];
              
              // Remove existing sharpen filter
              imgObj.filters = imgObj.filters.filter((filter: any) => filter.type !== 'Convolute');
              
              // Create sharpen convolution matrix
              const sharpenFilter = new filters.Convolute({
                matrix: [
                  0, -1, 0,
                  -1, 5, -1,
                  0, -1, 0
                ]
              });
              
              imgObj.filters.push(sharpenFilter);
              imgObj.applyFilters();
              canvas.renderAll();
              
            } catch (error) {
              console.error('Error sharpening image:', error);
              alert('Failed to sharpen image. Please try again.');
            }
            break;
        }
      }
    } else if (designJson.type === 'imageAdjust' && designJson.property && designJson.value !== undefined) {
      // Handle image adjustments
      const activeObject = canvas.getActiveObject();
      if (activeObject && activeObject.type === 'image') {
        const imgObj = activeObject as FabricImage;
        
        switch (designJson.property) {
          case 'hue':
            // Apply hue filter
            imgObj.filters = imgObj.filters || [];
            // Remove existing hue filter
            imgObj.filters = imgObj.filters.filter((filter: any) => filter.type !== 'HueRotation');
            if (designJson.value !== 0) {
              // Add new hue filter (Fabric.js uses radians)
              const hueFilter = new filters.HueRotation({
                rotation: (designJson.value * Math.PI) / 180
              });
              imgObj.filters.push(hueFilter);
            }
            imgObj.applyFilters();
            canvas.renderAll();
            break;
          case 'saturation':
            // Apply saturation filter
            imgObj.filters = imgObj.filters || [];
            // Remove existing saturation filter
            imgObj.filters = imgObj.filters.filter((filter: any) => filter.type !== 'Saturation');
            if (designJson.value !== 100) {
              const saturationFilter = new filters.Saturation({
                saturation: (designJson.value - 100) / 100
              });
              imgObj.filters.push(saturationFilter);
            }
            imgObj.applyFilters();
            canvas.renderAll();
            break;
          case 'brightness':
            // Apply brightness filter
            imgObj.filters = imgObj.filters || [];
            // Remove existing brightness filter
            imgObj.filters = imgObj.filters.filter((filter: any) => filter.type !== 'Brightness');
            if (designJson.value !== 100) {
              const brightnessFilter = new filters.Brightness({
                brightness: (designJson.value - 100) / 100
              });
              imgObj.filters.push(brightnessFilter);
            }
            imgObj.applyFilters();
            canvas.renderAll();
            break;
          case 'opacity':
            // Apply opacity directly to the object
            imgObj.set('opacity', designJson.value / 100);
            canvas.renderAll();
            break;
        }
      }
    }
  }, [designJson, isCanvasReady]);

  return (
    <div className="flex justify-center bg-white rounded-lg shadow-lg overflow-hidden p-4">
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="border border-gray-200 rounded-lg"
        />
        
        {/* Design area indicator overlay */}
        <div className="absolute inset-8 pointer-events-none border-2 border-dashed border-gray-400 rounded" />
      </div>
    </div>
  );
};

export default DesignCanvas;
