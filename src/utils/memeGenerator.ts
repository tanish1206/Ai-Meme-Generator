import { MemeTemplate } from '../data/memeTemplates';

export interface TextStyleOptions {
  fontScale?: number; // relative to image width; default 1 (base is img.width/15)
  strokeWidth?: number; // default 3
  fillColor?: string; // default 'white'
  strokeColor?: string; // default 'black'
  align?: 'left' | 'center' | 'right'; // default 'center'
  shadow?: boolean; // default false
}

export interface TextPositionOptions {
  // Provide percent-based coordinates within the image (0..1)
  top?: { xPct: number; yPct: number; maxWidthPct?: number };
  bottom?: { xPct: number; yPct: number; maxWidthPct?: number };
}

export const generateMeme = async (
  template: MemeTemplate,
  topText: string,
  bottomText: string,
  style?: TextStyleOptions,
  positions?: TextPositionOptions
): Promise<string> => {
  const { canvas } = await renderMemeToCanvas(template, topText, bottomText, style, positions);
  return canvas.toDataURL('image/png');
};

export const generateMemeBlob = async (
  template: MemeTemplate,
  topText: string,
  bottomText: string,
  style?: TextStyleOptions,
  positions?: TextPositionOptions
): Promise<Blob> => {
  const { canvas } = await renderMemeToCanvas(template, topText, bottomText, style, positions);
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to create blob'));
    }, 'image/png', 0.92);
  });
};

// New: Generate using an arbitrary image source (File or URL string)
export const generateMemeFromSource = async (
  source: File | string,
  topText: string,
  bottomText: string,
  style?: TextStyleOptions,
  positions?: TextPositionOptions
): Promise<string> => {
  const { canvas } = await renderFromSourceToCanvas(source, topText, bottomText, style, positions);
  return canvas.toDataURL('image/png');
};

export const generateMemeBlobFromSource = async (
  source: File | string,
  topText: string,
  bottomText: string,
  style?: TextStyleOptions,
  positions?: TextPositionOptions
): Promise<Blob> => {
  const { canvas } = await renderFromSourceToCanvas(source, topText, bottomText, style, positions);
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to create blob'));
    }, 'image/png', 0.92);
  });
};

// Export as 1080x1920 story format
export const generateStoryFromSource = async (
  source: File | string,
  topText: string,
  bottomText: string,
  style?: TextStyleOptions
): Promise<Blob> => {
  const targetW = 1080;
  const targetH = 1920;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No 2D context');
  canvas.width = targetW;
  canvas.height = targetH;

  const img = new Image();
  img.crossOrigin = 'anonymous';

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to load image'));
    if (typeof source === 'string') img.src = source; else img.src = URL.createObjectURL(source);
  });

  // background fill
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, targetW, targetH);

  // contain fit
  const scale = Math.min(targetW / img.width, targetH / img.height);
  const drawW = Math.floor(img.width * scale);
  const drawH = Math.floor(img.height * scale);
  const dx = Math.floor((targetW - drawW) / 2);
  const dy = Math.floor((targetH - drawH) / 2);
  ctx.drawImage(img, dx, dy, drawW, drawH);

  const opts: Required<TextStyleOptions> = {
    fontScale: style?.fontScale ?? 1.2, // slightly larger for story
    strokeWidth: style?.strokeWidth ?? 3,
    fillColor: style?.fillColor ?? 'white',
    strokeColor: style?.strokeColor ?? 'black',
    align: style?.align ?? 'center',
    shadow: style?.shadow ?? true
  };

  ctx.fillStyle = opts.fillColor;
  ctx.strokeStyle = opts.strokeColor;
  ctx.lineWidth = opts.strokeWidth;
  ctx.textAlign = opts.align as CanvasTextAlign;
  ctx.textBaseline = 'top';

  const baseFont = Math.floor(targetW / 15);
  const fontSize = Math.max(12, Math.floor(baseFont * opts.fontScale));
  ctx.font = `bold ${fontSize}px Impact, Arial Black, sans-serif`;

  const centerX = Math.floor(targetW / 2);
  const marginX = Math.floor(targetW * 0.05);
  const maxWidth = Math.floor(targetW * 0.9);

  const drawLines = (text: string, x: number, y: number) => {
    const lines = wrapText(ctx, text.toUpperCase(), maxWidth);
    lines.forEach((line, index) => {
      const yy = y + index * fontSize * 1.2;
      const xx = opts.align === 'left' ? marginX : opts.align === 'right' ? targetW - marginX : x;
      if (opts.shadow) {
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.strokeText(line, xx, yy);
        ctx.fillText(line, xx, yy);
        ctx.restore();
      } else {
        ctx.strokeText(line, xx, yy);
        ctx.fillText(line, xx, yy);
      }
    });
  };

  if (topText) drawLines(topText, centerX, Math.floor(targetH * 0.05));
  if (bottomText) drawLines(bottomText, centerX, Math.floor(targetH * 0.8));

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob); else reject(new Error('Failed to create story blob'));
    }, 'image/png', 0.92);
  });
};

const renderMemeToCanvas = async (
  template: MemeTemplate,
  topText: string,
  bottomText: string,
  style?: TextStyleOptions,
  positions?: TextPositionOptions
): Promise<{ canvas: HTMLCanvasElement }> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return reject(new Error('No 2D context'));

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);

      const opts: Required<TextStyleOptions> = {
        fontScale: style?.fontScale ?? 1,
        strokeWidth: style?.strokeWidth ?? 3,
        fillColor: style?.fillColor ?? 'white',
        strokeColor: style?.strokeColor ?? 'black',
        align: style?.align ?? 'center',
        shadow: style?.shadow ?? false
      };

      ctx.fillStyle = opts.fillColor;
      ctx.strokeStyle = opts.strokeColor;
      ctx.lineWidth = opts.strokeWidth;
      ctx.textAlign = opts.align as CanvasTextAlign;
      ctx.textBaseline = 'top';

      const baseFont = Math.floor(img.width / 15);
      const fontSize = Math.max(10, Math.floor(baseFont * opts.fontScale));
      ctx.font = `bold ${fontSize}px Impact, Arial Black, sans-serif`;

      if (topText) {
        const topX = positions?.top ? positions.top.xPct * img.width : template.topText.x;
        const topY = positions?.top ? positions.top.yPct * img.height : template.topText.y;
        const maxWidth = positions?.top?.maxWidthPct ? positions.top.maxWidthPct * img.width : template.topText.maxWidth;
        const lines = wrapText(ctx, topText.toUpperCase(), maxWidth);
        lines.forEach((line, index) => {
          const y = topY + (index * fontSize * 1.2);
          if (opts.shadow) {
            ctx.save();
            ctx.shadowColor = 'rgba(0,0,0,0.6)';
            ctx.shadowBlur = 6;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            ctx.strokeText(line, topX, y);
            ctx.fillText(line, topX, y);
            ctx.restore();
          } else {
            ctx.strokeText(line, topX, y);
            ctx.fillText(line, topX, y);
          }
        });
      }

      if (bottomText) {
        const botX = positions?.bottom ? positions.bottom.xPct * img.width : template.bottomText.x;
        const botY = positions?.bottom ? positions.bottom.yPct * img.height : template.bottomText.y;
        const maxWidth = positions?.bottom?.maxWidthPct ? positions.bottom.maxWidthPct * img.width : template.bottomText.maxWidth;
        const lines = wrapText(ctx, bottomText.toUpperCase(), maxWidth);
        lines.forEach((line, index) => {
          const y = botY + (index * fontSize * 1.2);
          if (opts.shadow) {
            ctx.save();
            ctx.shadowColor = 'rgba(0,0,0,0.6)';
            ctx.shadowBlur = 6;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            ctx.strokeText(line, botX, y);
            ctx.fillText(line, botX, y);
            ctx.restore();
          } else {
            ctx.strokeText(line, botX, y);
            ctx.fillText(line, botX, y);
          }
        });
      }

      resolve({ canvas });
    };

    img.onerror = () => reject(new Error('Failed to load template image'));
    img.src = template.imageUrl;
  });
};

const renderFromSourceToCanvas = async (
  source: File | string,
  topText: string,
  bottomText: string,
  style?: TextStyleOptions
): Promise<{ canvas: HTMLCanvasElement }> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return reject(new Error('No 2D context'));

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const opts: Required<TextStyleOptions> = {
        fontScale: style?.fontScale ?? 1,
        strokeWidth: style?.strokeWidth ?? 3,
        fillColor: style?.fillColor ?? 'white',
        strokeColor: style?.strokeColor ?? 'black',
        align: style?.align ?? 'center',
        shadow: style?.shadow ?? false
      };

      ctx.fillStyle = opts.fillColor;
      ctx.strokeStyle = opts.strokeColor;
      ctx.lineWidth = opts.strokeWidth;
      ctx.textAlign = opts.align as CanvasTextAlign;
      ctx.textBaseline = 'top';

      const baseFont = Math.floor(img.width / 15);
      const fontSize = Math.max(10, Math.floor(baseFont * opts.fontScale));
      ctx.font = `bold ${fontSize}px Impact, Arial Black, sans-serif`;

      // Default positions for arbitrary images
      const centerX = img.width / 2;
      const topY = Math.floor(img.height * 0.05);
      const bottomY = Math.floor(img.height * 0.85);
      const maxWidth = Math.floor(img.width * 0.9);

      if (topText) {
        const lines = wrapText(ctx, topText.toUpperCase(), maxWidth);
        lines.forEach((line, index) => {
          const y = topY + (index * fontSize * 1.2);
          const x = opts.align === 'left' ? Math.floor(img.width * 0.05)
                    : opts.align === 'right' ? Math.floor(img.width * 0.95)
                    : centerX;
          if (opts.shadow) {
            ctx.save();
            ctx.shadowColor = 'rgba(0,0,0,0.6)';
            ctx.shadowBlur = 6;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            ctx.strokeText(line, x, y);
            ctx.fillText(line, x, y);
            ctx.restore();
          } else {
            ctx.strokeText(line, x, y);
            ctx.fillText(line, x, y);
          }
        });
      }

      if (bottomText) {
        const lines = wrapText(ctx, bottomText.toUpperCase(), maxWidth);
        lines.forEach((line, index) => {
          const y = bottomY + (index * fontSize * 1.2);
          const x = opts.align === 'left' ? Math.floor(img.width * 0.05)
                    : opts.align === 'right' ? Math.floor(img.width * 0.95)
                    : centerX;
          if (opts.shadow) {
            ctx.save();
            ctx.shadowColor = 'rgba(0,0,0,0.6)';
            ctx.shadowBlur = 6;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            ctx.strokeText(line, x, y);
            ctx.fillText(line, x, y);
            ctx.restore();
          } else {
            ctx.strokeText(line, x, y);
            ctx.fillText(line, x, y);
          }
        });
      }

      resolve({ canvas });
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    if (typeof source === 'string') {
      img.src = source;
    } else {
      const url = URL.createObjectURL(source);
      img.onload = () => {
        // revoke after load
        URL.revokeObjectURL(url);
        // re-run the same logic as above; we need to duplicate to keep revoke timing safe
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        const fontSize = Math.floor(img.width / 15);
        ctx.font = `bold ${fontSize}px Impact, Arial Black, sans-serif`;

        const centerX = img.width / 2;
        const topY = Math.floor(img.height * 0.05);
        const bottomY = Math.floor(img.height * 0.85);
        const maxWidth = Math.floor(img.width * 0.9);

        if (topText) {
          const lines = wrapText(ctx, topText.toUpperCase(), maxWidth);
          lines.forEach((line, index) => {
            const y = topY + (index * fontSize * 1.2);
            ctx.strokeText(line, centerX, y);
            ctx.fillText(line, centerX, y);
          });
        }

        if (bottomText) {
          const lines = wrapText(ctx, bottomText.toUpperCase(), maxWidth);
          lines.forEach((line, index) => {
            const y = bottomY + (index * fontSize * 1.2);
            ctx.strokeText(line, centerX, y);
            ctx.fillText(line, centerX, y);
          });
        }

        resolve({ canvas });
      };
      img.src = url;
    }
  });
};

const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + ' ' + word).width;
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
};
