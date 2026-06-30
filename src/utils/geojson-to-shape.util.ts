/**
 * Converts GeoJSON polygon features into THREE.Shape objects ready for ExtrudeGeometry.
 *
 * Math approach:
 *  1. A caller-supplied `project([lon, lat])` function handles the d3-geo Mercator
 *     projection and returns [x, y] already in Three.js units, centered at origin.
 *  2. We negate Y here (`-y`) because the Mercator projection uses screen-space Y
 *     (0 = top, increasing downward) while Three.js uses math-space Y
 *     (positive = up).  After this flip, North Colombia has the highest Y value.
 *  3. Outer rings become THREE.Shape; inner rings (holes) become THREE.Path
 *     pushed into `shape.holes[]`.
 *  4. MultiPolygons produce one Shape per polygon sub-array.
 */

import * as THREE from "three";
import type { Feature, Polygon, MultiPolygon, Position } from "geojson";

export type ProjectFn = (coord: [number, number]) => [number, number];

function applyRingToPath(
  ring: Position[],
  project: ProjectFn,
  target: THREE.Shape | THREE.Path
): void {
  if (ring.length < 3) return;
  const [x0, y0] = project([ring[0][0], ring[0][1]]);
  target.moveTo(x0, -y0);
  // Skip last vertex — it repeats the first in closed GeoJSON rings
  for (let i = 1; i < ring.length - 1; i++) {
    const [x, y] = project([ring[i][0], ring[i][1]]);
    target.lineTo(x, -y);
  }
  target.closePath();
}

function polygonRingsToShape(rings: Position[][], project: ProjectFn): THREE.Shape {
  const shape = new THREE.Shape();
  applyRingToPath(rings[0], project, shape);
  for (let i = 1; i < rings.length; i++) {
    const hole = new THREE.Path();
    applyRingToPath(rings[i], project, hole);
    shape.holes.push(hole);
  }
  return shape;
}

export function featureToShapes(
  feature: Feature<Polygon | MultiPolygon>,
  project: ProjectFn
): THREE.Shape[] {
  const geo = feature.geometry;
  if (geo.type === "Polygon") {
    return [polygonRingsToShape(geo.coordinates, project)];
  }
  if (geo.type === "MultiPolygon") {
    return geo.coordinates.map((rings) => polygonRingsToShape(rings, project));
  }
  return [];
}

// ─── Property extraction helpers ────────────────────────────────────────────

const DANE_KEYS = [
  "DPTO_CCDGO",
  "CODIGO_DPTO",
  "cod_depto",
  "codigo_dane",
  "CODIGO",
  "id",
];

const NOMBRE_KEYS = [
  "NOMBRE_DPT",
  "DPTO_CNMBR",
  "NOM_DEPTO",
  "nombre",
  "NOMBRE",
  "name",
];

export function extractCodigoDane(
  props: Record<string, unknown> | null | undefined
): string | null {
  if (!props) return null;
  for (const key of DANE_KEYS) {
    if (props[key] != null) return String(props[key]).padStart(2, "0");
  }
  return null;
}

export function extractNombre(
  props: Record<string, unknown> | null | undefined
): string {
  if (!props) return "Desconocido";
  for (const key of NOMBRE_KEYS) {
    if (props[key]) return String(props[key]);
  }
  return "Departamento";
}
