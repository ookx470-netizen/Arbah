/**
 * Utility to compress a base64 image string using HTML5 Canvas.
 * Resizes the image to fit within maxWidth/maxHeight and lowers the quality.
 */
export function compressBase64Image(
  base64Str: string,
  maxWidth = 400,
  maxHeight = 400,
  quality = 0.6
): Promise<string> {
  return new Promise((resolve) => {
    // If it's not a valid base64 image or not an image at all, return it
    if (!base64Str || !base64Str.startsWith('data:image')) {
      resolve(base64Str);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = base64Str;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        } else {
          resolve(base64Str);
        }
      } catch (e) {
        console.error("Error during image compression:", e);
        resolve(base64Str);
      }
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
}

/**
 * Format 24-hour integer into clean Arabic human-readable string.
 * e.g., 12 -> "12:00 ظهراً", 15 -> "3:00 عصراً", 21 -> "9:00 مساءً", 1 -> "1:00 ليلاً", 0 -> "12:00 منتصف الليل"
 */
export function formatHourToArabic(hour: number): string {
  const h = ((hour % 24) + 24) % 24;
  if (h === 0) return '12:00 منتصف الليل';
  if (h === 12) return '12:00 ظهراً';
  if (h < 12) {
    return `${h}:00 ${h < 5 ? 'ليلاً' : 'صباحاً'}`;
  }
  const pm = h - 12;
  return `${pm}:00 ${pm < 5 ? 'عصراً' : pm < 9 ? 'مساءً' : 'ليلاً'}`;
}

/**
 * Checks if currentHour (0-23) falls within shift start and end.
 * Supports shift crossing midnight (e.g. 21 to 1).
 */
export function isHourInShift(currentHour: number, start: number, end: number): boolean {
  const c = ((currentHour % 24) + 24) % 24;
  const s = ((start % 24) + 24) % 24;
  const e = ((end % 24) + 24) % 24;
  
  if (s === e) return true;
  if (s < e) {
    return c >= s && c < e;
  } else {
    return c >= s || c < e;
  }
}
