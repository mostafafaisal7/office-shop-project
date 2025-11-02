/**
 * SVG Export Utility for Fabric.js Canvas
 *
 * This utility provides methods to export Fabric.js canvas to SVG format
 * for print-ready designs.
 */

import { Canvas } from 'fabric';

export class SVGExporter {
  /**
   * Generate SVG string from Fabric.js canvas
   */
  static generateSVG(canvas: Canvas, options?: {
    width?: number;
    height?: number;
    viewBox?: { x: number; y: number; width: number; height: number };
  }): string {
    try {
      const width = options?.width || canvas.width || 800;
      const height = options?.height || canvas.height || 600;
      const svgString = canvas.toSVG({
        suppressPreamble: false,
        width: String(width),
        height: String(height),
        viewBox: options?.viewBox ? {
          x: options.viewBox.x,
          y: options.viewBox.y,
          width: options.viewBox.width,
          height: options.viewBox.height
        } : undefined
      });

      return svgString;
    } catch (error) {
      console.error('Failed to generate SVG from canvas:', error);
      throw new Error('SVG generation failed');
    }
  }

  /**
   * Generate SVG with custom metadata for print specifications
   */
  static generateSVGWithMetadata(canvas: Canvas, metadata?: {
    designArea?: string;
    productId?: string;
    variationId?: number;
    createdAt?: string;
  }): string {
    const svg = this.generateSVG(canvas);

    if (metadata) {
      const metadataComment = `<!--
Design Metadata:
- Design Area: ${metadata.designArea || 'N/A'}
- Product ID: ${metadata.productId || 'N/A'}
- Variation ID: ${metadata.variationId || 'N/A'}
- Created At: ${metadata.createdAt || new Date().toISOString()}
-->`;

      return svg.replace('<svg', `${metadataComment}\n<svg`);
    }

    return svg;
  }

  /**
   * Extract text elements from canvas for easy reference
   */
  static extractTextElements(canvas: Canvas): Array<{
    type: string;
    text: string;
    fontFamily?: string;
    fontSize?: number;
    fill?: string;
    left?: number;
    top?: number;
  }> {
    const textElements: Array<any> = [];
    const objects = canvas.getObjects();

    objects.forEach((obj: any) => {
      if (obj.type === 'text' || obj.type === 'i-text' || obj.type === 'textbox') {
        textElements.push({
          type: obj.type,
          text: obj.text || '',
          fontFamily: obj.fontFamily,
          fontSize: obj.fontSize,
          fill: obj.fill,
          left: obj.left,
          top: obj.top
        });
      }
    });

    return textElements;
  }

  /**
   * Download SVG as a file
   */
  static downloadSVG(svgString: string, filename: string = 'design.svg'): void {
    try {
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download SVG:', error);
      throw new Error('SVG download failed');
    }
  }
}

export function generateCanvasSVG(canvas: Canvas | null): string | undefined {
  if (!canvas) {
    console.warn('Canvas not available for SVG generation');
    return undefined;
  }

  try {
    return SVGExporter.generateSVG(canvas);
  } catch (error) {
    console.error('Error generating SVG:', error);
    return undefined;
  }
}

export function generateCanvasSVGWithMetadata(
  canvas: Canvas | null,
  metadata?: {
    designArea?: string;
    productId?: string;
    variationId?: number;
    createdAt?: string;
  }
): string | undefined {
  if (!canvas) {
    console.warn('Canvas not available for SVG generation');
    return undefined;
  }

  try {
    return SVGExporter.generateSVGWithMetadata(canvas, metadata);
  } catch (error) {
    console.error('Error generating SVG with metadata:', error);
    return undefined;
  }
}

export function extractCanvasTextElements(canvas: Canvas | null) {
  if (!canvas) {
    console.warn('Canvas not available for text extraction');
    return [];
  }

  try {
    return SVGExporter.extractTextElements(canvas);
  } catch (error) {
    console.error('Error extracting text elements:', error);
    return [];
  }
}
