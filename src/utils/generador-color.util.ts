import * as THREE from "three";

// Color ramp: deep-indigo → violet → hot-pink → orange
// Maps intensity 0.0 → 1.0 across four perceptually distinct stops.
interface Stop { at: number; r: number; g: number; b: number }

const STOPS: Stop[] = [
  { at: 0.00, r: 49,  g: 46,  b: 129 }, // #312e81 deep indigo
  { at: 0.33, r: 124, g: 58,  b: 237 }, // #7c3aed violet
  { at: 0.67, r: 236, g: 72,  b: 153 }, // #ec4899 hot-pink
  { at: 1.00, r: 249, g: 115, b: 22  }, // #f97316 orange
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

export function intensidadAColorTHREE(intensidad: number): THREE.Color {
  return new THREE.Color(intensidadAColor(intensidad));
}

// Backwards-compatible alias used by pre-existing imports
export const interpolarColor = (valor: number, min: number, max: number): string => {
  const norm = max === min ? 0 : (valor - min) / (max - min);
  return intensidadAColor(norm);
};
