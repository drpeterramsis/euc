export function adjustColor(color: string, amount: number): string {
  if (!color) return '#000000';
  const c = color.replace('#', '');
  const r = Math.max(0, Math.min(255, parseInt(c.substring(0, 2), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(c.substring(2, 4), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(c.substring(4, 6), 16) + amount));
  return `#${(1 << 24) + (r << 16) + (g << 8) + b}`.toString().slice(1);
}

export function hexToRgba(hex: string, alpha: number): string {
  if (!hex) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(0,0,0,${alpha})`;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
