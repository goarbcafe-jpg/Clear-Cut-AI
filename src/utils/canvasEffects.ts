import { BackgroundConfig, EffectsConfig, ExportConfig } from '../types';
import { loadImage } from './aiSegmentation';

export const STUDIO_BACKDROPS = [
  {
    id: 'studio-minimal-gray',
    name: 'Minimalist Gray',
    thumbnail: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?auto=format&fit=crop&w=300&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?auto=format&fit=crop&w=1600&q=85',
  },
  {
    id: 'studio-warm-wood',
    name: 'Warm Oak Desk',
    thumbnail: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=300&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1600&q=85',
  },
  {
    id: 'studio-neon-cyber',
    name: 'Neon Cyberpunk',
    thumbnail: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=300&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1600&q=85',
  },
  {
    id: 'studio-lush-nature',
    name: 'Lush Botanical',
    thumbnail: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=300&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=1600&q=85',
  },
  {
    id: 'studio-modern-loft',
    name: 'Modern Loft Office',
    thumbnail: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=300&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=85',
  },
  {
    id: 'studio-clean-gradient',
    name: 'Soft Sunrise Mesh',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=85',
  },
];

export const GRADIENT_PRESETS = [
  { name: 'Cosmic Violet', value: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)' },
  { name: 'Sunset Glow', value: 'linear-gradient(135deg, #f97316 0%, #f43f5e 50%, #8b5cf6 100%)' },
  { name: 'Emerald Wave', value: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)' },
  { name: 'Midnight Deep', value: 'linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%)' },
  { name: 'Soft Studio Cream', value: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' },
  { name: 'Warm Peach', value: 'linear-gradient(135deg, #fed7aa 0%, #f472b6 100%)' },
];

export const SOLID_COLOR_PRESETS = [
  '#ffffff', // Clean e-commerce white
  '#f8fafc', // Soft off-white
  '#0f172a', // Deep slate
  '#18181b', // Studio black
  '#38bdf8', // Passport / ID blue
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#06b6d4', // Cyan
  '#3b82f6', // Brand Blue
  '#6366f1', // Indigo
  '#a855f7', // Purple
  '#ec4899', // Pink
];

// One-Click Use-Case Pro Presets
export interface ProPreset {
  id: string;
  name: string;
  category: string;
  icon: string;
  bgConfig: Partial<BackgroundConfig>;
  effects: Partial<EffectsConfig>;
  description: string;
}

export const PRO_PRESETS: ProPreset[] = [
  {
    id: 'clean-transparent',
    name: 'Pure Cutout (No Outline)',
    category: 'Essential',
    icon: '✨',
    bgConfig: { type: 'transparent' },
    effects: {
      outline: { enabled: false, width: 0, color: '#ffffff' },
      shadow: { enabled: false, type: 'drop', blur: 0, offsetX: 0, offsetY: 0, opacity: 0, color: '#000000' },
      edgeChoke: 1.5,
    },
    description: 'Clean transparent PNG with defringed edges, no outline',
  },
  {
    id: 'amazon-white',
    name: 'Amazon / Shopify White',
    category: 'E-commerce',
    icon: '🛒',
    bgConfig: { type: 'solid', color: '#ffffff' },
    effects: {
      outline: { enabled: false, width: 0, color: '#ffffff' },
      shadow: { enabled: true, type: 'contact', blur: 16, offsetX: 0, offsetY: 8, opacity: 0.35, color: '#0f172a' },
      edgeChoke: 1.5,
    },
    description: 'Pure 255,255,255 white with realistic ground contact shadow',
  },
  {
    id: 'passport-official',
    name: 'Passport / Official ID',
    category: 'ID & Document',
    icon: '🪪',
    bgConfig: { type: 'solid', color: '#38bdf8' },
    effects: {
      outline: { enabled: false, width: 0, color: '#ffffff' },
      shadow: { enabled: false, type: 'drop', blur: 0, offsetX: 0, offsetY: 0, opacity: 0, color: '#000000' },
      edgeChoke: 1.0,
    },
    description: 'Official biometric light blue backdrop with centered portrait crop',
  },
  {
    id: 'profile-avatar',
    name: 'Modern Social Avatar',
    category: 'Avatar',
    icon: '👤',
    bgConfig: { type: 'gradient', gradient: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)' },
    effects: {
      outline: { enabled: false, width: 0, color: '#ffffff' },
      shadow: { enabled: true, type: 'drop', blur: 24, offsetX: 0, offsetY: 12, opacity: 0.4, color: '#000000' },
      edgeChoke: 1.0,
    },
    description: 'Vibrant cosmic gradient backdrop for Twitter, LinkedIn & Discord',
  },
  {
    id: 'studio-desk',
    name: 'Warm Oak Studio',
    category: 'Lifestyle',
    icon: '📸',
    bgConfig: { type: 'studio', backdropUrl: STUDIO_BACKDROPS[1].fullUrl },
    effects: {
      outline: { enabled: false, width: 0, color: '#ffffff' },
      shadow: { enabled: true, type: 'contact', blur: 20, offsetX: 0, offsetY: 10, opacity: 0.45, color: '#000000' },
      edgeChoke: 1.0,
    },
    description: 'Warm lifestyle oak desk backdrop with realistic contact shadow',
  },
  {
    id: 'youtube-sticker',
    name: 'YouTube Thumbnail Sticker',
    category: 'Content',
    icon: '🎬',
    bgConfig: { type: 'solid', color: '#0f172a' },
    effects: {
      outline: { enabled: true, width: 8, color: '#ffffff' },
      shadow: { enabled: true, type: 'drop', blur: 30, offsetX: 0, offsetY: 15, opacity: 0.6, color: '#000000' },
      edgeChoke: 0,
    },
    description: 'Bold white sticker outline that pops on YouTube thumbnails',
  },
];

/**
 * Composite cutout onto chosen background & apply creative effects
 */
export async function renderCompositedCanvas(
  cutoutSrc: string,
  originalSrc: string,
  bgConfig: BackgroundConfig,
  effects: EffectsConfig,
  exportConfig?: ExportConfig
): Promise<HTMLCanvasElement> {
  let cutoutImg = await loadImage(cutoutSrc);
  let origWidth = cutoutImg.naturalWidth || cutoutImg.width;
  let origHeight = cutoutImg.naturalHeight || cutoutImg.height;

  // 1. Defringe / Edge Choke Filter (Removes residual background outline/halo)
  if (effects.edgeChoke && effects.edgeChoke > 0) {
    const defringedCanvas = applyEdgeChoke(cutoutImg, effects.edgeChoke);
    cutoutImg = await loadImage(defringedCanvas.toDataURL('image/png'));
  }

  // 2. Color & Lighting Adjustments (Brightness, Contrast, Saturation)
  if (
    effects.colorAdjustments &&
    (effects.colorAdjustments.brightness !== 1 ||
      effects.colorAdjustments.contrast !== 1 ||
      effects.colorAdjustments.saturation !== 1)
  ) {
    const adjustedCanvas = applyColorAdjustments(cutoutImg, effects.colorAdjustments);
    cutoutImg = await loadImage(adjustedCanvas.toDataURL('image/png'));
  }

  // Calculate target canvas dimensions based on preset or scaling
  let targetWidth = origWidth;
  let targetHeight = origHeight;

  if (exportConfig) {
    if (exportConfig.dimensionPreset === 'instagram-post') {
      targetWidth = 1080;
      targetHeight = 1080;
    } else if (exportConfig.dimensionPreset === 'instagram-story') {
      targetWidth = 1080;
      targetHeight = 1920;
    } else if (exportConfig.dimensionPreset === 'youtube-thumb') {
      targetWidth = 1280;
      targetHeight = 720;
    } else if (exportConfig.dimensionPreset === 'square') {
      const maxDim = Math.max(origWidth, origHeight);
      targetWidth = maxDim;
      targetHeight = maxDim;
    } else if (exportConfig.dimensionPreset === 'passport') {
      targetWidth = 600;
      targetHeight = 750; // Standard 2x2.5 or 35x45mm passport ratio
    } else {
      targetWidth = Math.round(origWidth * (exportConfig.scale || 1));
      targetHeight = Math.round(origHeight * (exportConfig.scale || 1));
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to create canvas context');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 3. Render Background
  if (bgConfig.type === 'transparent') {
    // Canvas is transparent by default
  } else if (bgConfig.type === 'solid') {
    ctx.fillStyle = bgConfig.color;
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  } else if (bgConfig.type === 'gradient') {
    const grad = ctx.createLinearGradient(0, 0, targetWidth, targetHeight);
    if (bgConfig.gradient.includes('#f97316')) {
      grad.addColorStop(0, '#f97316');
      grad.addColorStop(0.5, '#f43f5e');
      grad.addColorStop(1, '#8b5cf6');
    } else if (bgConfig.gradient.includes('#10b981')) {
      grad.addColorStop(0, '#10b981');
      grad.addColorStop(1, '#06b6d4');
    } else if (bgConfig.gradient.includes('#0f172a')) {
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(1, '#1e1b4b');
    } else if (bgConfig.gradient.includes('#f8fafc')) {
      grad.addColorStop(0, '#f8fafc');
      grad.addColorStop(1, '#e2e8f0');
    } else if (bgConfig.gradient.includes('#fed7aa')) {
      grad.addColorStop(0, '#fed7aa');
      grad.addColorStop(1, '#f472b6');
    } else {
      grad.addColorStop(0, '#6366f1');
      grad.addColorStop(0.5, '#a855f7');
      grad.addColorStop(1, '#ec4899');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  } else if (bgConfig.type === 'studio' && bgConfig.backdropUrl) {
    try {
      const bgImg = await loadImage(bgConfig.backdropUrl);
      drawImageCover(ctx, bgImg, 0, 0, targetWidth, targetHeight);
    } catch {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, targetWidth, targetHeight);
    }
  } else if (bgConfig.type === 'custom' && bgConfig.backdropUrl) {
    try {
      const bgImg = await loadImage(bgConfig.backdropUrl);
      drawImageCover(ctx, bgImg, 0, 0, targetWidth, targetHeight);
    } catch {
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, 0, targetWidth, targetHeight);
    }
  } else if (bgConfig.type === 'blur') {
    try {
      const origImg = await loadImage(originalSrc);
      ctx.save();
      ctx.filter = `blur(${bgConfig.blurAmount || 18}px)`;
      ctx.drawImage(origImg, -20, -20, targetWidth + 40, targetHeight + 40);
      ctx.restore();
    } catch {
      ctx.fillStyle = '#64748b';
      ctx.fillRect(0, 0, targetWidth, targetHeight);
    }
  }

  // Calculate subject positioning (center inside target canvas)
  const scaleRatio = Math.min(targetWidth / origWidth, targetHeight / origHeight);
  const renderWidth = Math.round(origWidth * scaleRatio);
  const renderHeight = Math.round(origHeight * scaleRatio);
  const renderX = Math.round((targetWidth - renderWidth) / 2);
  const renderY = Math.round((targetHeight - renderHeight) / 2);

  // 4. Render Reflection Floor (if enabled)
  if (effects.reflection?.enabled) {
    renderFloorReflection(
      ctx,
      cutoutImg,
      renderX,
      renderY,
      renderWidth,
      renderHeight,
      effects.reflection.opacity || 0.25,
      effects.reflection.distance || 0
    );
  }

  // 5. Render Shadows (Drop / Contact / Cast)
  if (effects.shadow.enabled) {
    if (effects.shadow.type === 'contact') {
      renderContactShadow(
        ctx,
        renderX,
        renderY,
        renderWidth,
        renderHeight,
        effects.shadow.blur,
        effects.shadow.opacity,
        effects.shadow.color
      );
    } else if (effects.shadow.type === 'cast') {
      renderCastShadow(
        ctx,
        cutoutImg,
        renderX,
        renderY,
        renderWidth,
        renderHeight,
        effects.shadow.blur,
        effects.shadow.opacity,
        effects.shadow.color
      );
    } else {
      // Standard Drop shadow
      ctx.save();
      ctx.shadowColor = effects.shadow.color || 'rgba(0,0,0,0.45)';
      ctx.shadowBlur = effects.shadow.blur || 20;
      ctx.shadowOffsetX = effects.shadow.offsetX || 0;
      ctx.shadowOffsetY = effects.shadow.offsetY || 15;
      ctx.drawImage(cutoutImg, renderX, renderY, renderWidth, renderHeight);
      ctx.restore();
    }
  }

  // 6. Render Sticker Outline (ONLY if explicitly enabled!)
  if (effects.outline && effects.outline.enabled && effects.outline.width > 0) {
    renderOutline(
      ctx,
      cutoutImg,
      renderX,
      renderY,
      renderWidth,
      renderHeight,
      effects.outline.width,
      effects.outline.color
    );
  }

  // 7. Render Primary Cutout Subject (Clean, pristine, no unwanted borders)
  ctx.drawImage(cutoutImg, renderX, renderY, renderWidth, renderHeight);

  // 8. Auto-Crop to tight subject bounds if requested
  if (effects.autoCropPadding && effects.autoCropPadding > 0) {
    return cropCanvasToSubject(canvas, effects.autoCropPadding);
  }

  return canvas;
}

/**
 * Defringe & Edge Choke: contracts alpha mask by N pixels to eliminate any residual background outline/halo
 */
function applyEdgeChoke(img: HTMLImageElement, chokePixels: number): HTMLCanvasElement {
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.drawImage(img, 0, 0, w, h);
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  // Extract alpha channel
  const alpha = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    alpha[i] = data[i * 4 + 3];
  }

  const radius = Math.max(1, Math.round(chokePixels));
  const eroded = new Uint8Array(w * h);

  // Minimum filter (erosion) on alpha
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let minVal = 255;
      for (let dy = -radius; dy <= radius; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= h) {
          minVal = 0;
          break;
        }
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= w) {
            minVal = 0;
            break;
          }
          if (dx * dx + dy * dy <= radius * radius) {
            const v = alpha[ny * w + nx];
            if (v < minVal) minVal = v;
          }
        }
      }
      eroded[y * w + x] = minVal;
    }
  }

  // Write eroded alpha back
  for (let i = 0; i < w * h; i++) {
    data[i * 4 + 3] = eroded[i];
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

/**
 * Color and Lighting Adjustments
 */
function applyColorAdjustments(
  img: HTMLImageElement,
  adj: { brightness: number; contrast: number; saturation: number }
): HTMLCanvasElement {
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.filter = `brightness(${adj.brightness}) contrast(${adj.contrast}) saturate(${adj.saturation})`;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas;
}

/**
 * Realistic Ground Contact Shadow (Anchored at the base of the subject)
 */
function renderContactShadow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  blur: number,
  opacity: number,
  color: string
) {
  ctx.save();
  const shadowY = y + h - Math.min(20, h * 0.05);
  const shadowWidth = w * 0.82;
  const shadowHeight = Math.max(12, h * 0.08);

  ctx.beginPath();
  ctx.ellipse(x + w / 2, shadowY, shadowWidth / 2, shadowHeight / 2, 0, 0, Math.PI * 2);
  ctx.fillStyle = color || 'rgba(0,0,0,0.6)';
  ctx.globalAlpha = opacity || 0.4;
  ctx.filter = `blur(${Math.max(4, blur || 14)}px)`;
  ctx.fill();
  ctx.restore();
}

/**
 * 3D Perspective Cast Shadow
 */
function renderCastShadow(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  blur: number,
  opacity: number,
  color: string
) {
  ctx.save();
  ctx.translate(x, y + h);
  ctx.transform(1, 0, -0.4, 0.35, 0, 0); // perspective skew onto floor
  ctx.filter = `blur(${blur || 18}px)`;
  ctx.globalAlpha = opacity || 0.35;

  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = w;
  shadowCanvas.height = h;
  const sctx = shadowCanvas.getContext('2d');
  if (sctx) {
    sctx.drawImage(img, 0, 0, w, h);
    sctx.globalCompositeOperation = 'source-in';
    sctx.fillStyle = color || 'rgba(0,0,0,0.7)';
    sctx.fillRect(0, 0, w, h);
    ctx.drawImage(shadowCanvas, 0, -h, w, h);
  }
  ctx.restore();
}

/**
 * Luxury Floor Mirror Reflection
 */
function renderFloorReflection(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  opacity: number,
  distance: number
) {
  ctx.save();
  ctx.translate(0, y + h * 2 + distance);
  ctx.scale(1, -1);
  ctx.globalAlpha = opacity;
  ctx.drawImage(img, x, y, w, h);

  // Gradient fade-out mask on reflection
  ctx.globalCompositeOperation = 'destination-out';
  const grad = ctx.createLinearGradient(0, y, 0, y + h);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(0.6, 'rgba(0,0,0,0.8)');
  grad.addColorStop(1, 'rgba(0,0,0,1)');
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

/**
 * Crop canvas directly to subject bounding box with padding
 */
function cropCanvasToSubject(sourceCanvas: HTMLCanvasElement, paddingPct: number): HTMLCanvasElement {
  const ctx = sourceCanvas.getContext('2d');
  if (!ctx) return sourceCanvas;
  const w = sourceCanvas.width;
  const h = sourceCanvas.height;
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  let minX = w, minY = h, maxX = 0, maxY = 0;
  let hasPixel = false;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const alpha = data[(y * w + x) * 4 + 3];
      if (alpha > 15) {
        hasPixel = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (!hasPixel) return sourceCanvas;

  const padX = Math.round((maxX - minX) * (paddingPct / 100));
  const padY = Math.round((maxY - minY) * (paddingPct / 100));

  const cropX = Math.max(0, minX - padX);
  const cropY = Math.max(0, minY - padY);
  const cropW = Math.min(w - cropX, maxX - minX + padX * 2);
  const cropH = Math.min(h - cropY, maxY - minY + padY * 2);

  const croppedCanvas = document.createElement('canvas');
  croppedCanvas.width = cropW;
  croppedCanvas.height = cropH;
  const cctx = croppedCanvas.getContext('2d');
  if (cctx) {
    cctx.drawImage(sourceCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
  }
  return croppedCanvas;
}

/**
 * Draw image with CSS 'cover' aspect fitting
 */
function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const targetRatio = w / h;
  let sWidth = img.naturalWidth;
  let sHeight = img.naturalHeight;
  let sx = 0;
  let sy = 0;

  if (imgRatio > targetRatio) {
    sWidth = img.naturalHeight * targetRatio;
    sx = (img.naturalWidth - sWidth) / 2;
  } else {
    sHeight = img.naturalWidth / targetRatio;
    sy = (img.naturalHeight - sHeight) / 2;
  }

  ctx.drawImage(img, sx, sy, sWidth, sHeight, x, y, w, h);
}

/**
 * Draw outline/border around cutout using multi-angle shadow dilation
 */
function renderOutline(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  strokeWidth: number,
  strokeColor: string
) {
  const steps = 16;
  const radius = strokeWidth;

  const offscreen = document.createElement('canvas');
  offscreen.width = w + radius * 4;
  offscreen.height = h + radius * 4;
  const octx = offscreen.getContext('2d');
  if (!octx) return;

  const ox = radius * 2;
  const oy = radius * 2;

  for (let i = 0; i < steps; i++) {
    const angle = (i * 2 * Math.PI) / steps;
    const dx = Math.cos(angle) * radius;
    const dy = Math.sin(angle) * radius;
    octx.drawImage(img, ox + dx, oy + dy, w, h);
  }

  octx.globalCompositeOperation = 'source-in';
  octx.fillStyle = strokeColor;
  octx.fillRect(0, 0, offscreen.width, offscreen.height);

  ctx.drawImage(offscreen, x - ox, y - oy);
}

/**
 * Export canvas to chosen format and initiate download
 */
export async function exportCanvasImage(
  canvas: HTMLCanvasElement,
  filename: string,
  config: ExportConfig
): Promise<{ dataUrl: string; blob: Blob }> {
  let mimeType = 'image/png';

  if (config.format === 'webp') {
    mimeType = 'image/webp';
  } else if (config.format === 'jpeg') {
    mimeType = 'image/jpeg';
  } else if (config.format === 'svg') {
    const dataUrl = canvas.toDataURL('image/png');
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}">
      <image width="${canvas.width}" height="${canvas.height}" href="${dataUrl}" />
    </svg>`;
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    return { dataUrl: url, blob };
  }

  const quality = config.quality || 0.95;
  const dataUrl = canvas.toDataURL(mimeType, quality);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('Failed to create image blob'));
      },
      mimeType,
      quality
    );
  });

  return { dataUrl, blob };
}

export function triggerDownload(url: string, filename: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Detect tight subject bounding box to trim excess transparent space
 * Returns normalized coordinates (percentages 0-100)
 */
/**
 * Detect tight subject bounding box to trim excess transparent space
 * Supports optional targetRatio to preserve exact aspect ratio while trimming
 * Returns normalized coordinates (percentages 0-100)
 */
export async function detectSubjectBounds(
  cutoutSrc: string,
  paddingPct: number = 5,
  targetRatio?: number
): Promise<{ x: number; y: number; width: number; height: number }> {
  const img = await loadImage(cutoutSrc);
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return { x: 5, y: 5, width: 90, height: 90 };

  ctx.drawImage(img, 0, 0, w, h);
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  let minX = w, minY = h, maxX = 0, maxY = 0;
  let found = false;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const alpha = data[(y * w + x) * 4 + 3];
      if (alpha > 15) {
        found = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (!found) return { x: 10, y: 10, width: 80, height: 80 };

  const subjectW = maxX - minX;
  const subjectH = maxY - minY;
  const padX = Math.round(subjectW * (paddingPct / 100));
  const padY = Math.round(subjectH * (paddingPct / 100));

  let boxW = subjectW + padX * 2;
  let boxH = subjectH + padY * 2;
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  // Maintain exact aspect ratio if requested
  if (targetRatio && targetRatio > 0) {
    const curRatio = boxW / boxH;
    if (curRatio < targetRatio) {
      boxW = boxH * targetRatio;
      if (boxW > w) {
        boxW = w;
        boxH = boxW / targetRatio;
      }
    } else {
      boxH = boxW / targetRatio;
      if (boxH > h) {
        boxH = h;
        boxW = boxH * targetRatio;
      }
    }
  }

  const finalX = Math.max(0, Math.min(w - boxW, Math.round(centerX - boxW / 2)));
  const finalY = Math.max(0, Math.min(h - boxH, Math.round(centerY - boxH / 2)));
  const finalW = Math.min(w - finalX, Math.round(boxW));
  const finalH = Math.min(h - finalY, Math.round(boxH));

  return {
    x: Number(((finalX / w) * 100).toFixed(2)),
    y: Number(((finalY / h) * 100).toFixed(2)),
    width: Number(((finalW / w) * 100).toFixed(2)),
    height: Number(((finalH / h) * 100).toFixed(2)),
  };
}

/**
 * Crops an image URL using normalized percentage coordinates (0-100%)
 * Preserves high-fidelity resolution and exact pixel aspect ratio
 */
export async function cropImage(
  src: string,
  cropPct: { x: number; y: number; width: number; height: number }
): Promise<{ dataUrl: string; width: number; height: number; aspectRatio: number }> {
  const img = await loadImage(src);
  const origW = img.naturalWidth || img.width;
  const origH = img.naturalHeight || img.height;

  // Exact pixel integer boundaries to prevent subpixel anti-aliasing distortion
  const sx = Math.max(0, Math.min(origW - 1, Math.round((cropPct.x / 100) * origW)));
  const sy = Math.max(0, Math.min(origH - 1, Math.round((cropPct.y / 100) * origH)));
  const sw = Math.min(origW - sx, Math.max(4, Math.round((cropPct.width / 100) * origW)));
  const sh = Math.min(origH - sy, Math.max(4, Math.round((cropPct.height / 100) * origH)));

  const canvas = document.createElement('canvas');
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No 2d context for cropping');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
  return {
    dataUrl: canvas.toDataURL('image/png'),
    width: sw,
    height: sh,
    aspectRatio: Number((sw / sh).toFixed(4)),
  };
}
