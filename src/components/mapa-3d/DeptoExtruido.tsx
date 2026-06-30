"use client";

/**
 * DeptoExtruido — One extruded 3-D mesh per Colombian department.
 *
 * Pipeline per feature:
 *   GeoJSON rings  →  featureToShapes()  →  THREE.ExtrudeGeometry
 *   → mesh.rotation.x = -π/2  (lay the XY shape flat in world-space XZ)
 *   → extrusion along world-Y (up)
 *
 * Hover/selection glow is animated via useFrame lerping emissiveIntensity,
 * so it never causes a React re-render.
 */

import { useRef, useMemo, useEffect, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type { Feature, Polygon, MultiPolygon } from "geojson";
import { featureToShapes, type ProjectFn } from "@/utils/geojson-to-shape.util";
import { intensidadAColorTHREE } from "@/utils/generador-color.util";
import { useDatosDemograficos } from "@/hooks/useDatosDemograficos";

const MAX_EXTRUSION = 10; // Three.js units for intensity = 1.0
const MIN_EXTRUSION = 0.3; // Flat departments still have a visible sliver

interface Props {
  feature: Feature<Polygon | MultiPolygon>;
  intensidad: number;
  codigoDane: string;
  nombre: string;
  project: ProjectFn;
}

export default function DeptoExtruido({
  feature,
  intensidad,
  codigoDane,
  nombre: _nombre, // consumed by parent for tooltip; declared to keep prop API clear
  project,
}: Props) {
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  // Mutable target for the glow animation — never triggers React renders
  const emissiveTarget = useRef(0);

  const departamentoHover = useDatosDemograficos((s) => s.departamentoHover);
  const departamentoSeleccionado = useDatosDemograficos((s) => s.departamentoSeleccionado);
  const setHover = useDatosDemograficos((s) => s.setHover);
  const setSeleccionado = useDatosDemograficos((s) => s.setSeleccionado);

  const isHovered = departamentoHover === codigoDane;
  const isSelected = departamentoSeleccionado === codigoDane;

  const baseColor = useMemo(() => intensidadAColorTHREE(intensidad), [intensidad]);

  // ── Geometry ────────────────────────────────────────────────────────────────
  const geometry = useMemo(() => {
    const shapes = featureToShapes(feature, project);
    if (shapes.length === 0) return null;
    const depth = MIN_EXTRUSION + intensidad * MAX_EXTRUSION;
    return new THREE.ExtrudeGeometry(shapes, {
      depth,
      bevelEnabled: false,
      steps: 1,
    });
  }, [feature, intensidad, project]);

  // Dispose GPU memory when geometry changes or component unmounts
  useEffect(
    () => () => {
      geometry?.dispose();
    },
    [geometry]
  );

  // ── Glow target update ──────────────────────────────────────────────────────
  useEffect(() => {
    emissiveTarget.current = isSelected ? 0.6 : isHovered ? 0.32 : 0;
  }, [isHovered, isSelected]);

  // ── Smooth glow animation (runs every frame, zero GC pressure) ───────────
  useFrame(() => {
    const mat = materialRef.current;
    if (!mat) return;
    mat.emissiveIntensity = THREE.MathUtils.lerp(
      mat.emissiveIntensity,
      emissiveTarget.current,
      0.12 // ~8-frame ease
    );
  });

  // ── Pointer handlers ────────────────────────────────────────────────────────
  const onPointerOver = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      setHover(codigoDane);
      document.body.style.cursor = "pointer";
    },
    [codigoDane, setHover]
  );

  const onPointerOut = useCallback(() => {
    setHover(null);
    document.body.style.cursor = "default";
  }, [setHover]);

  const onClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      setSeleccionado(codigoDane);
    },
    [codigoDane, setSeleccionado]
  );

  if (!geometry) return null;

  return (
    <mesh
      geometry={geometry}
      /**
       * Rotation: the ExtrudeGeometry lives in the XY plane (depth along Z).
       * Rotating -π/2 around X maps:
       *   mesh-X → world-X  (east–west)
       *   mesh-Y → world-Z  (north–south, flipped for screen→world)
       *   mesh-Z → world-Y  (extrusion goes UP — visible from above)
       */
      rotation={[-Math.PI / 2, 0, 0]}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      onClick={onClick}
    >
      <meshStandardMaterial
        ref={materialRef}
        color={baseColor}
        emissive={baseColor}
        emissiveIntensity={0}
        roughness={0.45}
        metalness={0.18}
      />
    </mesh>
  );
}
