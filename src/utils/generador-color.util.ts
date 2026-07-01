// Color ramp (Campuslands brand): muted blue → royal blue → teal → bright mint
// Maps intensity 0.0 → 1.0 across four perceptually distinct stops.
interface Stop { at: number; r: number; g: number; b: number }

const STOPS: Stop[] = [
  { at: 0.00, r: 52,  g: 57,  b: 126 }, // #34397e muted blue (low / no data)
  { at: 0.33, r: 47,  g: 102, b: 196 }, // #2f66c4 royal blue
  { at: 0.66, r: 23,  g: 179, b: 168 }, // #17b3a8 teal
  { at: 1.00, r: 70,  g: 232, b: 191 }, // #46e8bf bright mint (high)
];

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function intensidadAColor(intensidad: number): string {
  const t = Math.max(0, Math.min(1, intensidad));
  let i = 0;
  while (i < STOPS.length - 2 && STOPS[i + 1].at <= t) i++;
  const s = STOPS[i];
  const e = STOPS[i + 1];
  const lt = (t - s.at) / (e.at - s.at);
  const ch = (a: number, b: number) => Math.round(lerp(a, b, lt)).toString(16).padStart(2, "0");
  return `#${ch(s.r, e.r)}${ch(s.g, e.g)}${ch(s.b, e.b)}`;
}
