// Small statistics helpers. The floor on standard deviation is load-bearing:
// with only days of history a very consistent senior has near-zero variance,
// and without a floor any tiny change would look like an enormous deviation.

export function mean(xs) {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

export function median(xs) {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function std(xs, floor = 0) {
  if (xs.length < 2) return floor;
  const m = mean(xs);
  const v = mean(xs.map(x => (x - m) ** 2));
  return Math.max(Math.sqrt(v), floor);
}

// Theil-Sen slope: the median of all pairwise slopes. Robust to the noise
// of self-reported daily data; one weird day cannot flip the trend the way
// it can with least squares. Returns 0 when underdetermined.
export function theilSenSlope(points) {
  const n = points.length;
  if (n < 2) return 0;
  const slopes = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dx = points[j].x - points[i].x;
      if (dx !== 0) slopes.push((points[j].y - points[i].y) / dx);
    }
  }
  return slopes.length ? median(slopes) : 0;
}

// Least-squares slope of y over x. Returns 0 when underdetermined.
export function linregSlope(points) {
  const n = points.length;
  if (n < 2) return 0;
  const mx = mean(points.map(p => p.x));
  const my = mean(points.map(p => p.y));
  let num = 0, den = 0;
  for (const p of points) {
    num += (p.x - mx) * (p.y - my);
    den += (p.x - mx) ** 2;
  }
  return den === 0 ? 0 : num / den;
}

export const clamp01 = x => Math.max(0, Math.min(1, x));
export const round1 = x => Math.round(x * 10) / 10;
