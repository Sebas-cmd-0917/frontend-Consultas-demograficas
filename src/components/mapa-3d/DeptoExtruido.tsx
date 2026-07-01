"use client";

import { useRef, useMemo, useEffect, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type { Feature, Polygon, MultiPolygon } from "geojson";
import { featureToShapes, type ProjectFn } from "@/utils/geojson-to-shape.util";
import { intensidadAColorTHREE } from "@/utils/generador-color.util";
import { useDatosDemograficos } from "@/hooks/useDatosDemograficos";

const MAX_EXTRUSION = 4;    // reduced: less tall, more map-like
const MIN_EXTRUSION = 0.08; // flat departments still visible

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
  nombre: _nombre,
  project,
}: Props) {
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const emissiveTarget = useRef(0);

  const departamentoHover = useDatosDemograficos((s) => s.departamentoHover);
  const departamentoSeleccionado = useDatosDemograficos((s) => s.departamentoSeleccionado);
  const setHover = useDatosDemograficos((s) => s.setHover);
  const setSeleccionado = useDatosDemograficos((s) => s.setSeleccionado);

  const isHovered = departamentoHover === codigoDane;
  const isSelected = departamentoSeleccionado === codigoDane;

  const baseColor = useMemo(() => intensidadAColorTHREE(intensidad), [intensidad]);

  // Compute shapes + extruded geometry together so outlines can reuse shapes
  const { geometry, outlineGeos } = useMemo(() => {
    const shapes = featureToShapes(feature, project);
    if (shapes.length === 0) return { geometry: null, outlineGeos: [] };

    const d = MIN_EXTRUSION + intensidad * MAX_EXTRUSION;
    const extruded = new THREE.ExtrudeGeometry(shapes, {
      depth: d,
      bevelEnabled: false,
      steps: 1,
    });

    // One outline BufferGeometry per shape (top-face border at z = depth + small offset)
    const outlines = shapes.map((shape) => {
      const pts = shape.getPoints(10);
      const arr = new Float32Array(pts.flatMap((p) => [p.x, p.y, d + 0.06]));
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(arr, 3));
      return geo;
    });

    return { geometry: extruded, outlineGeos: outlines };
  }, [feature, intensidad, project]);

  useEffect(
    () => () => {
      geometry?.dispose();
      outlineGeos.forEach((g) => g.dispose());
    },
    [geometry, outlineGeos]
  );

  useEffect(() => {
    emissiveTarget.current = isSelected ? 0.6 : isHovered ? 0.32 : 0;
  }, [isHovered, isSelected]);

  useFrame(() => {
    const mat = materialRef.current;
    if (!mat) return;
    mat.emissiveIntensity = THREE.MathUtils.lerp(
      mat.emissiveIntensity,
      emissiveTarget.current,
      0.12
    );
  });

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
    /**
     * Group carries the rotation so both the extruded mesh and the outline
     * line loops share the same XY→XZ transform:
     *   local-X → world-X  (east–west)
     *   local-Y → world-Z  (north–south)
     *   local-Z → world-Y  (up — extrusion direction)
     */
    <group rotation={[-Math.PI / 2, 0, 0]}>
      <mesh
        geometry={geometry}
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

      {/* Department border outlines drawn at the top face of each shape */}
      {outlineGeos.map((geo, i) => (
        <lineLoop key={i} geometry={geo}>
          <lineBasicMaterial color="#08081a" transparent opacity={0.85} />
        </lineLoop>
      ))}
    </group>
  );
}
