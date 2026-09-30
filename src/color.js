import { LETTER_TEXT } from './config.js';

const channel = (value) => {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

export function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => channel(parseInt(hex.slice(i, i + 2), 16)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const contrast = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

export function readableTextOn(hex) {
  const bg = luminance(hex);
  const dark = contrast(bg, luminance(LETTER_TEXT.onLight));
  const light = contrast(bg, luminance(LETTER_TEXT.onDark));
  return dark >= light ? LETTER_TEXT.onLight : LETTER_TEXT.onDark;
}
