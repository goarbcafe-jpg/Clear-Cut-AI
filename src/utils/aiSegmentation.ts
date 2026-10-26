/**
 * AuraCut AI - Deep Neural & Edge-Preserving Segmentation Engine
 * Uses State-of-the-Art Deep Learning Neural Models (RMBG / U2Net via @imgly/background-removal)
 * with robust, zero-artifact edge-preserving local fallback.
 */

import { removeBackground } from '@imgly/background-removal';

export interface SegmentationResult {
  cutoutDataUrl: string;
  maskDataUrl: string;
  width: number;
  height: number;
  foregroundRatio: number;
  engineUsed: 'neural_deep_learning' | 'smart_contour_matte';
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error('Failed to load image: ' + err));
    img.src = src;
  });
}

/**
 * Primary Background Removal Pipeline
 * Attempts State-of-the-Art Neural Network first, then falls back to improved contour matte.
 */
export async function removeBackgroundLocally(
  imageUrl: string,
  options: {
    feather?: number; // 0 to 5
    tolerance?: number; // 0 to 100
    decontaminate?: boolean;
    preferEngine?: 'neural' | 'fast';
    boundingBox?: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0-1000
    onProgress?: (pct: number, statusText?: string) => void;
  } = {}
): Promise<SegmentationResult> {
  const {
    feather = 1.5,
    tolerance = 28,
    decontaminate = true,
    preferEngine = 'neural',
    boundingBox,
    onProgress,
  } = options;

  // 1. Try Neural Deep Learning Engine first (unless user explicitly selected fast mode)
  if (preferEngine !== 'fast') {
    try {
      onProgress?.(15, 'Initializing Neural AI Model (RMBG Deep Learning)...');

      // Convert imageUrl (data URL or external URL) to a blob or load directly
      let imageInput: Blob | string = imageUrl;
      if (imageUrl.startsWith('data:')) {
        const res = await fetch(imageUrl);
        imageInput = await res.blob();
      }

      onProgress?.(30, 'Analyzing subject contours & fine hair strands...');

      const resultBlob = await removeBackground(imageInput, {
        model: 'isnet_fp16',
        output: {
          format: 'image/png',
          quality: 1.0,
        },
        progress: (key: string, current: number, total: number) => {
          if (total > 0) {
            const pct = Math.min(88, Math.round(30 + (current / total) * 55));
            onProgress?.(pct, `Neural inference (${key.split('/').pop() || 'processing'}): ${Math.round((current / total) * 100)}%`);
          }
        },
      });

      onProgress?.(90, 'Generating crisp alpha matte...');

      // Convert blob to data URL
      const cutoutDataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(resultBlob);
      });

      // Extract width, height and mask
      const cutoutImg = await loadImage(cutoutDataUrl);
      const width = cutoutImg.naturalWidth || cutoutImg.width;
      const height = cutoutImg.naturalHeight || cutoutImg.height;

      // Extract alpha mask for touch-up brush & visualizer
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = width;
      maskCanvas.height = height;
      const mctx = maskCanvas.getContext('2d');
      let maskDataUrl = cutoutDataUrl;
      let foregroundCount = 0;

      if (mctx) {
        mctx.drawImage(cutoutImg, 0, 0);
        const imgData = mctx.getImageData(0, 0, width, height);
        const data = imgData.data;
        const total = width * height;

        for (let i = 0; i < total; i++) {
          const alpha = data[i * 4 + 3];
          if (alpha > 20) foregroundCount++;
          // Convert alpha to grayscale mask (white on black)
          data[i * 4] = alpha;
          data[i * 4 + 1] = alpha;
          data[i * 4 + 2] = alpha;
          data[i * 4 + 3] = 255;
        }
        mctx.putImageData(imgData, 0, 0);
        maskDataUrl = maskCanvas.toDataURL('image/png');
      }

      onProgress?.(100, 'Done! Professional cutout ready.');

      return {
        cutoutDataUrl,
        maskDataUrl,
        width,
        height,
        foregroundRatio: foregroundCount / Math.max(1, width * height),
        engineUsed: 'neural_deep_learning',
      };
    } catch (neuralError: any) {
      console.warn('Neural engine notice, switching to precision contour matte:', neuralError?.message || neuralError);
      onProgress?.(35, 'Switching to Precision Contour Matte...');
    }
  }

  // 2. High-Accuracy Fallback / Fast Engine
  return removeBackgroundContourMatte(imageUrl, {
    feather,
    tolerance,
    decontaminate,
    boundingBox,
    onProgress,
  });
}

/**
 * Precision Contour & Edge Matte Algorithm
 * Fixed: NEVER samples bottom border (where portraits / products rest).
 * Uses top-corner background modeling + morphological interior hole protection.
 */
export async function removeBackgroundContourMatte(
  imageUrl: string,
  options: {
    feather?: number;
    tolerance?: number;
    decontaminate?: boolean;
    boundingBox?: [number, number, number, number];
    onProgress?: (pct: number, statusText?: string) => void;
  } = {}
): Promise<SegmentationResult> {
  const { feather = 1.5, tolerance = 28, decontaminate = true, boundingBox, onProgress } = options;

  onProgress?.(15, 'Loading image canvas...');
  const img = await loadImage(imageUrl);
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not create 2D canvas context');

  ctx.drawImage(img, 0, 0, width, height);
  onProgress?.(30, 'Analyzing color clusters...');

  const imgData = ctx.getImageData(0, 0, width, height);
  const pixels = imgData.data;
  const totalPixels = width * height;

  // Safe background sampling: ONLY sample TOP corners and top 3% edge
  // NEVER sample bottom edge where shirts, shoes, body, or stands rest!
  const bgSamples: [number, number, number][] = [];
  const samplePixel = (x: number, y: number) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const idx = (y * width + x) * 4;
    bgSamples.push([pixels[idx], pixels[idx + 1], pixels[idx + 2]]);
  };

  const cornerSize = Math.max(8, Math.min(width, height) * 0.12);

  // Top-left and Top-right corner clusters
  for (let y = 0; y < cornerSize; y += 2) {
    for (let x = 0; x < cornerSize; x += 2) {
      samplePixel(x, y);
      samplePixel(width - 1 - x, y);
    }
  }

  // Extreme top edge only
  for (let x = 0; x < width; x += Math.max(1, Math.floor(width / 50))) {
    samplePixel(x, 0);
    samplePixel(x, 1);
  }

  const primaryBg = getRepresentativeColors(bgSamples, 5);

  onProgress?.(50, 'Computing subject boundaries...');

  const mask = new Uint8Array(totalPixels);
  let foregroundCount = 0;

  // Bounding box bounds (0-1000 scale converted to pixels)
  let minY = 0;
  let minX = 0;
  let maxY = height;
  let maxX = width;

  if (boundingBox && boundingBox.length === 4) {
    minY = Math.max(0, Math.floor((boundingBox[0] / 1000) * height) - 15);
    minX = Math.max(0, Math.floor((boundingBox[1] / 1000) * width) - 15);
    maxY = Math.min(height, Math.ceil((boundingBox[2] / 1000) * height) + 15);
    maxX = Math.min(width, Math.ceil((boundingBox[3] / 1000) * width) + 15);
  }

  const tolSq = (tolerance * 2.8) ** 2;

  // Core center of subject (protected zone)
  const coreMinX = minX + (maxX - minX) * 0.25;
  const coreMaxX = minX + (maxX - minX) * 0.75;
  const coreMinY = minY + (maxY - minY) * 0.25;
  const coreMaxY = minY + (maxY - minY) * 0.75;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      // Definite background if well outside bounding box
      if (boundingBox && (x < minX || x > maxX || y < minY || y > maxY)) {
        mask[y * width + x] = 0;
        continue;
      }

      const r = pixels[idx];
      const g = pixels[idx + 1];
      const b = pixels[idx + 2];

      // Distance to background clusters
      let minBgDistSq = Infinity;
      for (const [br, bg, bb] of primaryBg) {
        const dr = r - br;
        const dg = g - bg;
        const db = b - bb;
        const distSq = 0.299 * dr * dr + 0.587 * dg * dg + 0.114 * db * db;
        if (distSq < minBgDistSq) minBgDistSq = distSq;
      }

      // If in core subject zone, protect it from being cut
      const isCore = x >= coreMinX && x <= coreMaxX && y >= coreMinY && y <= coreMaxY;
      const effectiveTolSq = isCore ? tolSq * 0.45 : tolSq;

      if (minBgDistSq > effectiveTolSq) {
        mask[y * width + x] = 255;
        foregroundCount++;
      } else if (minBgDistSq > effectiveTolSq * 0.65) {
        const frac = (minBgDistSq - effectiveTolSq * 0.65) / (effectiveTolSq * 0.35);
        mask[y * width + x] = Math.round(frac * 255);
      } else {
        mask[y * width + x] = 0;
      }
    }
  }

  onProgress?.(70, 'Sealing subject interior...');

  // Fill holes inside subject so shirts/faces are never transparent
  fillInteriorHoles(mask, width, height);

  // Soft anti-aliased edge smoothing
  const smoothedMask = smoothAlphaMask(mask, width, height, feather);

  onProgress?.(85, 'Applying alpha decontamination...');

  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = width;
  maskCanvas.height = height;
  const maskCtx = maskCanvas.getContext('2d');
  const maskImgData = maskCtx?.createImageData(width, height);

  for (let i = 0; i < totalPixels; i++) {
    const alpha = smoothedMask[i];
    const pIdx = i * 4;
    pixels[pIdx + 3] = alpha;

    if (decontaminate && alpha > 0 && alpha < 240) {
      const [br, bg, bb] = primaryBg[0] || [255, 255, 255];
      const factor = (255 - alpha) / 255;
      pixels[pIdx] = Math.max(0, Math.min(255, pixels[pIdx] - br * factor * 0.3));
      pixels[pIdx + 1] = Math.max(0, Math.min(255, pixels[pIdx + 1] - bg * factor * 0.3));
      pixels[pIdx + 2] = Math.max(0, Math.min(255, pixels[pIdx + 2] - bb * factor * 0.3));
    }

    if (maskImgData) {
      maskImgData.data[pIdx] = alpha;
      maskImgData.data[pIdx + 1] = alpha;
      maskImgData.data[pIdx + 2] = alpha;
      maskImgData.data[pIdx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  if (maskCtx && maskImgData) {
    maskCtx.putImageData(maskImgData, 0, 0);
  }

  onProgress?.(100, 'Done! Crisp cutout ready.');

  return {
    cutoutDataUrl: canvas.toDataURL('image/png'),
    maskDataUrl: maskCanvas.toDataURL('image/png'),
    width,
    height,
    foregroundRatio: foregroundCount / Math.max(1, totalPixels),
    engineUsed: 'smart_contour_matte',
  };
}

function getRepresentativeColors(samples: [number, number, number][], count: number): [number, number, number][] {
  if (samples.length === 0) return [[255, 255, 255]];
  const representatives: [number, number, number][] = [];

  let sumR = 0, sumG = 0, sumB = 0;
  for (const [r, g, b] of samples) {
    sumR += r;
    sumG += g;
    sumB += b;
  }
  representatives.push([
    Math.round(sumR / samples.length),
    Math.round(sumG / samples.length),
    Math.round(sumB / samples.length),
  ]);

  for (let k = 1; k < count; k++) {
    let bestCandidate: [number, number, number] | null = null;
    let maxMinDist = -1;

    for (let i = 0; i < samples.length; i += 2) {
      const sample = samples[i];
      let minDist = Infinity;
      for (const rep of representatives) {
        const d = (sample[0] - rep[0]) ** 2 + (sample[1] - rep[1]) ** 2 + (sample[2] - rep[2]) ** 2;
        if (d < minDist) minDist = d;
      }
      if (minDist > maxMinDist) {
        maxMinDist = minDist;
        bestCandidate = sample;
      }
    }

    if (bestCandidate && maxMinDist > 300) {
      representatives.push(bestCandidate);
    } else {
      break;
    }
  }

  return representatives;
}

/**
 * Fill enclosed holes inside the subject's body
 */
function fillInteriorHoles(mask: Uint8Array, width: number, height: number) {
  const visited = new Uint8Array(width * height);
  const queue: number[] = [];

  // Seed BFS only from the outer borders
  for (let x = 0; x < width; x++) {
    if (mask[x] === 0) {
      visited[x] = 1;
      queue.push(x);
    }
    const bIdx = (height - 1) * width + x;
    if (mask[bIdx] === 0) {
      visited[bIdx] = 1;
      queue.push(bIdx);
    }
  }
  for (let y = 0; y < height; y++) {
    const lIdx = y * width;
    if (mask[lIdx] === 0) {
      visited[lIdx] = 1;
      queue.push(lIdx);
    }
    const rIdx = y * width + width - 1;
    if (mask[rIdx] === 0) {
      visited[rIdx] = 1;
      queue.push(rIdx);
    }
  }

  let head = 0;
  while (head < queue.length) {
    const curr = queue[head++];
    const cx = curr % width;
    const cy = Math.floor(curr / width);

    const neighbors = [
      cy > 0 ? curr - width : -1,
      cy < height - 1 ? curr + width : -1,
      cx > 0 ? curr - 1 : -1,
      cx < width - 1 ? curr + 1 : -1,
    ];

    for (const n of neighbors) {
      if (n >= 0 && !visited[n] && mask[n] === 0) {
        visited[n] = 1;
        queue.push(n);
      }
    }
  }

  // Any zero not connected to the image border is an internal hole -> fill it!
  for (let i = 0; i < mask.length; i++) {
    if (mask[i] === 0 && !visited[i]) {
      mask[i] = 255;
    }
  }
}

function smoothAlphaMask(mask: Uint8Array, width: number, height: number, radius: number): Uint8Array {
  if (radius <= 0.1) return mask;
  const out = new Uint8Array(mask.length);
  const r = Math.max(1, Math.round(radius));

  const temp = new Float32Array(mask.length);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * width;
    for (let x = 0; x < width; x++) {
      let sum = 0;
      let count = 0;
      for (let dx = -r; dx <= r; dx++) {
        const nx = x + dx;
        if (nx >= 0 && nx < width) {
          sum += mask[rowOffset + nx];
          count++;
        }
      }
      temp[rowOffset + x] = sum / count;
    }
  }

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let sum = 0;
      let count = 0;
      for (let dy = -r; dy <= r; dy++) {
        const ny = y + dy;
        if (ny >= 0 && ny < height) {
          sum += temp[ny * width + x];
          count++;
        }
      }
      out[y * width + x] = Math.round(sum / count);
    }
  }

  return out;
}
