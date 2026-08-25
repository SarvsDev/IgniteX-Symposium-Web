/**
 * Compress payment screenshots before sending them to a Vercel API route.
 * The registration request contains the image as a data URL, so keeping the
 * final payload small is important for serverless request limits.
 */
export function compressImageFile(
  file: File,
  maxWidth = 1000,
  maxHeight = 1000,
  quality = 0.6,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to parse image file.'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.max(1, Math.round(width * ratio));
          height = Math.max(1, Math.round(height * ratio));
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not prepare image for upload.'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', quality);

        // Keep the data URL comfortably below Vercel's serverless request limit.
        if (compressed.length > 2_000_000) {
          const smaller = canvas.toDataURL('image/jpeg', Math.max(0.4, quality - 0.15));
          if (smaller.length > 2_000_000) {
            const tinyCanvas = document.createElement('canvas');
            const ratio = Math.min(800 / width, 800 / height);
            tinyCanvas.width = Math.max(1, Math.round(width * ratio));
            tinyCanvas.height = Math.max(1, Math.round(height * ratio));
            const tinyCtx = tinyCanvas.getContext('2d');
            if (!tinyCtx) {
              reject(new Error('Payment screenshot could not be compressed enough.'));
              return;
            }
            tinyCtx.drawImage(img, 0, 0, tinyCanvas.width, tinyCanvas.height);
            const tiny = tinyCanvas.toDataURL('image/jpeg', 0.45);
            if (tiny.length > 2_000_000) {
              reject(new Error('Payment screenshot is too large after compression. Please use a smaller screenshot.'));
              return;
            }
            resolve(tiny);
            return;
          }
          resolve(smaller);
          return;
        }

        resolve(compressed);
      };
      img.src = String(event.target?.result || '');
    };
    reader.readAsDataURL(file);
  });
}
