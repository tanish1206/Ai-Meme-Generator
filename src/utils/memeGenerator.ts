import { MemeTemplate } from '../data/memeTemplates';

export const generateMeme = async (
  template: MemeTemplate,
  topText: string,
  bottomText: string
): Promise<string> => {
  const { canvas } = await renderMemeToCanvas(template, topText, bottomText);
  return canvas.toDataURL('image/png');
};

export const generateMemeBlob = async (
  template: MemeTemplate,
  topText: string,
  bottomText: string
): Promise<Blob> => {
  const { canvas } = await renderMemeToCanvas(template, topText, bottomText);
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to create blob'));
    }, 'image/png', 0.92);
  });
};

const renderMemeToCanvas = async (
  template: MemeTemplate,
  topText: string,
  bottomText: string
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

      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 3;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      const fontSize = Math.floor(img.width / 15);
      ctx.font = `bold ${fontSize}px Impact, Arial Black, sans-serif`;

      if (topText) {
        const lines = wrapText(ctx, topText.toUpperCase(), template.topText.maxWidth);
        lines.forEach((line, index) => {
          const y = template.topText.y + (index * fontSize * 1.2);
          ctx.strokeText(line, template.topText.x, y);
          ctx.fillText(line, template.topText.x, y);
        });
      }

      if (bottomText) {
        const lines = wrapText(ctx, bottomText.toUpperCase(), template.bottomText.maxWidth);
        lines.forEach((line, index) => {
          const y = template.bottomText.y + (index * fontSize * 1.2);
          ctx.strokeText(line, template.bottomText.x, y);
          ctx.fillText(line, template.bottomText.x, y);
        });
      }

      resolve({ canvas });
    };

    img.onerror = () => reject(new Error('Failed to load template image'));
    img.src = template.imageUrl;
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
