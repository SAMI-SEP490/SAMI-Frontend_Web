// src/utils/units.js
export function createUnitHelpers(pxPerMeter = 80) {
  const setPxPerMeter = (v) => (pxPerMeter = Math.max(1, Number(v) || 80));
  const m2px = (m) => (Number(m) || 0) * pxPerMeter;
  const px2m = (px) => (Number(px) || 0) / pxPerMeter;
  return { m2px, px2m, get pxPerMeter() { return pxPerMeter; }, setPxPerMeter };
}