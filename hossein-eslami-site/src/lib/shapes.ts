// Material 3 Expressive-style shapes as clip paths (objectBoundingBox units, 0..1).
const wave = (lobes: number, depth: number, pts = 240, rot = 0) => {
  let d = '';
  for (let i = 0; i <= pts; i++) {
    const t = (i / pts) * Math.PI * 2;
    const r = 0.5 - depth + depth * Math.cos(lobes * (t + rot));
    const x = 0.5 + r * Math.cos(t);
    const y = 0.5 + r * Math.sin(t);
    d += `${i ? 'L' : 'M'}${x.toFixed(4)} ${y.toFixed(4)}`;
  }
  return d + 'Z';
};
export const SHAPES = {
  cookie: wave(9, 0.035),
  cookie12: wave(12, 0.028),
  clover: wave(4, 0.09, 240, Math.PI / 4),
  sunny: wave(8, 0.05),
};
export type ShapeName = keyof typeof SHAPES | 'arch' | 'pill' | 'rounded' | 'square' | 'circle' | 'leaf';
