import { Rectangle } from '../types';

/**
 * Crops a bounding box from a rendered PDF page canvas.
 */
export const cropCanvasFromPercentage = (
  originalCanvas: HTMLCanvasElement,
  rectangle: Rectangle
): string => {
  try {
    const { x, y, width: w, height: h } = rectangle;

    // Direct pixel translation from coordinate system
    const pxX = (x / 100) * originalCanvas.width;
    const pxY = (y / 100) * originalCanvas.height;
    const pxW = (w / 100) * originalCanvas.width;
    const pxH = (h / 100) * originalCanvas.height;

    // Create offscreen buffer canvas
    const offscreen = document.createElement('canvas');
    offscreen.width = Math.max(1, pxW);
    offscreen.height = Math.max(1, pxH);

    const ctx = offscreen.getContext('2d');
    if (ctx) {
      // Background clear
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, offscreen.width, offscreen.height);
      
      ctx.drawImage(
        originalCanvas,
        pxX, pxY, pxW || 1, pxH || 1,
        0, 0, pxW || 1, pxH || 1
      );
    }
    return offscreen.toDataURL('image/png');
  } catch (err) {
    console.error('Error cropping snippet from canvas:', err);
    return '';
  }
};

/**
 * Merges multiple image crops vertically into a single consolidated image,
 * matching the GMUNK aesthetic (thin technical borders, micro layout lines).
 */
export const combineCropsIntoSingleImage = (images: string[]): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (images.length === 0) {
      resolve('');
      return;
    }
    if (images.length === 1) {
      resolve(images[0]);
      return;
    }

    const loadedImages: HTMLImageElement[] = [];
    let loadedCount = 0;

    const onImageLoaded = () => {
      loadedCount++;
      if (loadedCount === images.length) {
        // Calculate dynamic dimensions for combined canvas
        let maxWidth = 0;
        let totalHeight = 0;
        const spacing = 16; // space between images
        const borderPadding = 12; // surrounding framing

        loadedImages.forEach((img) => {
          if (img.width > maxWidth) {
            maxWidth = img.width;
          }
          totalHeight += img.height;
        });

        // Add padding & separators
        const finalWidth = maxWidth + borderPadding * 2;
        const finalHeight = totalHeight + (loadedImages.length - 1) * spacing + borderPadding * 2;

        const compositeCanvas = document.createElement('canvas');
        compositeCanvas.width = finalWidth;
        compositeCanvas.height = finalHeight;

        const ctx = compositeCanvas.getContext('2d');
        if (!ctx) {
          resolve(images[0]);
          return;
        }

        // Draw structural GMUNK-like grid background
        ctx.fillStyle = '#fafafa';
        ctx.fillRect(0, 0, finalWidth, finalHeight);

        // Thin outer contour border
        ctx.strokeStyle = '#e4e4e7'; // zinc-200
        ctx.lineWidth = 1;
        ctx.strokeRect(4, 4, finalWidth - 8, finalHeight - 8);

        // Draw each crop chunk
        let currentY = borderPadding;
        loadedImages.forEach((img, idx) => {
          // Draw neat drop card background
          ctx.fillStyle = '#ffffff';
          const cardX = borderPadding;
          const cardY = currentY;
          const cardW = maxWidth;
          const cardH = img.height;

          ctx.fillRect(cardX, cardY, cardW, cardH);
          ctx.strokeStyle = '#d4d4d8'; // zinc-300
          ctx.strokeRect(cardX, cardY, cardW, cardH);

          // Center the crop inside the column if width is smaller
          const offsetX = borderPadding + (maxWidth - img.width) / 2;
          ctx.drawImage(img, offsetX, currentY);

          // Mini technical label indicator in bottom corner of region
          ctx.fillStyle = '#71717a'; // zinc-500
          ctx.font = '9px monospace';
          ctx.fillText(`REGION_CROP_0${idx + 1} [${img.width}x${img.height}]`, cardX + 6, cardY + cardH - 6);

          currentY += img.height + spacing;
        });

        resolve(compositeCanvas.toDataURL('image/png'));
      }
    };

    images.forEach((src) => {
      const img = new Image();
      img.onload = onImageLoaded;
      img.onerror = () => {
        // Fallback or ignore broken image
        loadedCount++;
        if (loadedCount === images.length) {
          onImageLoaded();
        }
      };
      img.src = src;
      loadedImages.push(img);
    });
  });
};

/**
 * Filter text content using layout coordinate geometry.
 * Transforms PDF text positions into viewport space and finds intersections.
 */
export const extractPdfTextInRect = async (
  page: any,
  viewport: any,
  rect: Rectangle
): Promise<string> => {
  try {
    const textContent = await page.getTextContent();
    const items = textContent.items;

    // Viewport page dims
    const viewWidth = viewport.width;
    const viewHeight = viewport.height;

    // Translate percentages to canvas pixels
    const pickX1 = (rect.x / 100) * viewWidth;
    const pickY1 = (rect.y / 100) * viewHeight;
    const pickX2 = pickX1 + (rect.width / 100) * viewWidth;
    const pickY2 = pickY1 + (rect.height / 100) * viewHeight;

    const matchedStrings: { text: string; x: number; y: number }[] = [];

    for (const item of items) {
      if (!item.str || item.str.trim() === '') continue;

      // Transform from PDF page coords to viewport coords
      const tx = window.pdfjsLib.Util.transform(
        viewport.transform,
        item.transform
      );

      // PDF text origins are typically bottom-left of individual lines/segments
      const itemX = tx[4];
      const itemY = tx[5]; // note: y translated via transform respects top-left depending on viewport configuration

      // To make it simple and extremely reliable:
      // Compare bounding coordinates. Viewport transforms translate points safely.
      // pdf.js viewport.transform handles flipY and scaling automatically.
      // Let's check coordinates.
      if (
        itemX >= pickX1 - 10 &&
        itemX <= pickX2 + 10 &&
        itemY >= pickY1 - 15 &&
        itemY <= pickY2 + 15
      ) {
        matchedStrings.push({
          text: item.str,
          x: itemX,
          y: itemY,
        });
      }
    }

    // Sort by vertically (top to bottom), then horizontally (left to right)
    matchedStrings.sort((a, b) => {
      if (Math.abs(a.y - b.y) < 6) {
        return a.x - b.x;
      }
      return a.y - b.y;
    });

    return matchedStrings.map((m) => m.text).join(' ');
  } catch (error) {
    console.error('Error filtering text within bounds:', error);
    return '';
  }
};
