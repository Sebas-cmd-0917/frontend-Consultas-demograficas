"use client";

/**
 * CanvasWrapper — root of the 3-D visualisation.
 *
 * Responsibility split:
 *   CanvasWrapper  → data orchestration, loading/error states, HTML overlays
 *   MapScene       → pure Three.js scene (must stay inside <Canvas>)
 *   DeptoTooltip   → HTML card anchored bottom-left, reacts to hover/selection
 *
 * Coordinate math (d3-geo → Three.js):
 *   buildProjection() creates a geoMercator projection fitted to the GeoJSON
 *   bounding box.  It returns a ProjectFn that maps [lon, lat] → [x, y] in
 *   Three.js units (centred at origin, ≈ ±40 units for Colombia).
 *   DeptoExtruido then rotates each mesh -90° around X so the XY shape lies
 *   flat and extrusions point up (world Y).
 */

import { useMemo, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { geoMercator } from "d3-geo";
import type { FeatureCollection, Feature, Polygon, MultiPolygon } from "geojson";
import type { RegionDemografica } from "@/types/demografia.types";
import { useFetchDemografia } from "@/hooks/useFetchDemografia";
import { useDatosDemograficos } from "@/hooks/useDatosDemograficos";
import {
  extractCodigoDane,
  extractNombre,
  type ProjectFn,
} from "@/utils/geojson-to-shape.util";
import { intensidadAColor } from "@/utils/generador-color.util";
import DeptoExtruido from "./DeptoExtruido";
import ControlesCamara from "./ControlesCamara";

// Virtual canvas size for d3 projection (pixels before Three.js scale-down)
const PROJ_SIZE = 800;
const UNIT_SCALE = 0.1; // 800px → 80 Three.js units

function buildProjection(geoJSON: FeatureCollection): ProjectFn {
  const proj = geoMercator().fitSize([PROJ_SIZE, PROJ_SIZE], geoJSON);
  return ([lon, lat]: [number, number]): [number, number] => {
    const [px, py] = proj([lon, lat]) ?? [0, 0];
    return [
      (px - PROJ_SIZE / 2) * UNIT_SCALE,
      (py - PROJ_SIZE / 2) * UNIT_SCALE,
    ];
  };
}

// ─── Inner scene (must be a child of <Canvas>) ────────────────────────────────

function MapScene({
  geoJSON,
  regiones,
}: {
  geoJSON: FeatureCollection;
  regiones: RegionDemografica[];
}) {
  const project = useMemo(() => buildProjection(geoJSON), [geoJSON]);

  const regionesMap = useMemo(() => {
    const m = new Map<string, RegionDemografica>();
    regiones.forEach((r) => { if (r.codigoDane) m.set(r.codigoDane, r); });
    return m;
  }, [regiones]);

  const features = useMemo(
    () =>
      geoJSON.features.filter(
        (f): f is Feature<Polygon | MultiPolygon> =>
          f.geometry?.type === "Polygon" || f.geometry?.type === "MultiPolygon"
      ),
    [geoJSON]
  );

  return (
    <>
      {/* Key light — overhead, slightly warm */}
      <directionalLight position={[20, 80, 10]} intensity={1.6} castShadow />
      {/* Fill light — soft side fill */}
      <directionalLight position={[-30, 40, -20]} intensity={0.5} color="#8090ff" />
      {/* Ambient — strong enough so low-intensity departments stay readable */}
      <ambientLight intensity={0.7} />

      {features.map((feature, idx) => {
        const props = feature.properties as Record<string, unknown> | null;
        const codigoDane = extractCodigoDane(props) ?? `dep-${idx}`;
        const nombre = extractNombre(props);
        const region = regionesMap.get(codigoDane);
        const intensidad = region?.intensidad ?? 0;

        return (
          <DeptoExtruido
            key={codigoDane}
            feature={feature}
            intensidad={intensidad}
            codigoDane={codigoDane}
            nombre={nombre}
            project={project}
          />
        );
      })}

      <ControlesCamara />
    </>
  );
}

// ─── Tooltip HTML overlay ──────────────────────────────────────────────────────

function DeptoTooltip() {
  const departamentoHover = useDatosDemograficos((s) => s.departamentoHover);
  const departamentoSeleccionado = useDatosDemograficos((s) => s.departamentoSeleccionado);
  const regiones = useDatosDemograficos((s) => s.regiones);
  const geoJSON = useDatosDemograficos((s) => s.geoJSON);

  const activeCodigo = departamentoSeleccionado ?? departamentoHover;
  if (!activeCodigo || !geoJSON) return null;

  const region = regiones.find((r) => r.codigoDane === activeCodigo);
  const feature = geoJSON.features.find(
    (f) =>
      extractCodigoDane(f.properties as Record<string, unknown> | null) === activeCodigo
  );
  const nombre = feature
    ? extractNombre(feature.properties as Record<string, unknown> | null)
    : activeCodigo;

  const isSelected = departamentoSeleccionado === activeCodigo;

  return (
    <div className="absolute bottom-6 left-6 pointer-events-none">
      <div
        className="bg-gray-900/90 backdrop-blur-md text-white px-4 py-3 rounded-2xl
                   shadow-2xl border min-w-[220px] transition-all duration-200"
        style={{
          borderColor: region
            ? intensidadAColor(region.intensidad) + "66"
            : "rgba(107,114,128,0.4)",
        }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">
          {isSelected ? "Seleccionado" : "Hover"}
        </p>
        <p className="font-bold text-base leading-tight">{nombre}</p>
        <p className="text-xs text-gray-500 mt-0.5">DANE: {activeCodigo}</p>

        {region && (
          <div className="mt-3 pt-2 border-t border-gray-700 space-y-2">
            {/* Intensity bar */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">Intensidad laboral</span>
                <span
                  className="font-mono font-semibold"
                  style={{ color: intensidadAColor(region.intensidad) }}
                >
                  {(region.intensidad * 100).toFixed(1)} %
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-gray-700 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${region.intensidad * 100}%`,
                    backgroundColor: intensidadAColor(region.intensidad),
                  }}
                />
              </div>
            </div>

            {region.totalEmpleados != null && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Empleados</span>
                <span className="font-mono font-semibold">
                  {region.totalEmpleados.toLocaleString("es-CO")}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {isSelected && (
        <p className="text-center text-[10px] text-gray-500 mt-1">
          Clic para deseleccionar
        </p>
      )}
    </div>
  );
}

// ─── Loading / Error screens ───────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-14 h-14 rounded-full border-2 border-violet-500 border-t-transparent animate-spin mx-auto" />
        <p className="text-gray-400 text-sm">Cargando datos geográficos…</p>
      </div>
    </div>
  );
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-center max-w-sm space-y-2">
        <p className="text-red-400 text-lg font-semibold">Error al cargar el mapa</p>
        <p className="text-gray-500 text-sm">{message}</p>
        <p className="text-gray-600 text-xs mt-4">
          Asegúrate de que{" "}
          <code className="text-gray-400">/public/assets/colombia-departamentos.geojson</code>{" "}
          existe y tiene features válidas.
        </p>
      </div>
    </div>
  );
}

// ─── Public component ──────────────────────────────────────────────────────────

export default function CanvasWrapper() {
  const { cargando, error, geoJSON, regiones } = useFetchDemografia();

  // Show loading while data is being fetched OR before the first effect has fired (geoJSON still null)
  if (cargando || (!geoJSON && !error)) return <LoadingScreen />;
  if (error) return <ErrorScreen message={error} />;
  if (!geoJSON || geoJSON.features.length === 0) {
    return <ErrorScreen message="El GeoJSON no contiene features válidas." />;
  }

  return (
    <div className="w-full h-full relative">
      <Canvas
        camera={{ position: [0, 75, 18], fov: 40 }}
        shadows
        gl={{ antialias: true, alpha: false }}
        style={{ background: "#0f0f1a" }}
      >
        <Suspense fallback={null}>
          <MapScene geoJSON={geoJSON} regiones={regiones} />
        </Suspense>
      </Canvas>

      {/* HTML elements overlay (rendered outside the WebGL context) */}
      <DeptoTooltip />

      {/* Subtle vignette to frame the canvas */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.55) 100%)",
        }}
      />
    </div>
  );
}
