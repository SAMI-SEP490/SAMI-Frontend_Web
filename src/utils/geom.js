// src/utils/geom.js

export function pointInPolygon(pt, poly) {
  if (!poly || poly.length < 3) return true;
  const { x, y } = pt;
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x,
      yi = poly[i].y;
    const xj = poly[j].x,
      yj = poly[j].y;
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-9) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function clampToPolygon(pt, poly, step = 0.1) {
  if (pointInPolygon(pt, poly)) return pt;
  const cx = poly.reduce((s, p) => s + p.x, 0) / poly.length;
  const cy = poly.reduce((s, p) => s + p.y, 0) / poly.length;
  let x = pt.x,
    y = pt.y;
  for (let k = 0; k < 40; k++) {
    x = x + (cx - x) * step;
    y = y + (cy - y) * step;
    if (pointInPolygon({ x, y }, poly)) break;
  }
  return { x, y };
}
