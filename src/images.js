import { OUTPUT_IMAGE_TYPE, PASSTHROUGH_IMAGE_TYPES } from './config.js';

export function readAsDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export const isImageFile = (file) => Boolean(file?.type?.startsWith('image/'));

export async function resizeImage(file, maxPx, quality) {
  if (PASSTHROUGH_IMAGE_TYPES.includes(file.type)) return readAsDataUrl(file);
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxPx / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = new OffscreenCanvas(width, height);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await canvas.convertToBlob({ type: OUTPUT_IMAGE_TYPE, quality });
  return readAsDataUrl(blob);
}

export function clipboardImage(event) {
  const item = [...(event.clipboardData?.items ?? [])].find((i) => i.kind === 'file' && i.type.startsWith('image/'));
  return item?.getAsFile() ?? null;
}
