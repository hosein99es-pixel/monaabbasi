// Text colour for a label sitting on an accent colour: ink or white, whichever reads better (WCAG contrast).
const lum = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const INK = '#15120E';
export const onColor = (hex: string) => {
  const l = lum(hex);
  return (l + 0.05) / (lum(INK) + 0.05) >= 1.05 / (l + 0.05) ? INK : '#FFFFFF';
};
