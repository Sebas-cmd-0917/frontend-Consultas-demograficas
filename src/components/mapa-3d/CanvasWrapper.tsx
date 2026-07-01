"use client";

import { useMemo } from "react";
import { geoMercator, geoPath } from "d3-geo";
import type { FeatureCollection, Feature, GeoJsonProperties, Geometry } from "geojson";
import type { RegionDemografica } from "@/types/demografia.types";
import { useFetchDemografia } from "@/hooks/useFetchDemografia";
import { useDatosDemograficos } from "@/hooks/useDatosDemograficos";
import { extractCodigoDane, extractNombre } from "@/utils/geojson-to-shape.util";
import { intensidadAColor } from "@/utils/generador-color.util";

const W = 700;
const H = 900;

// ─── Inner SVG map ────────────────────────────────────────────────────────────

function MapaSvg({
  geoJSON,
  regiones,
}: {
  geoJSON: FeatureCollection;
  regiones: RegionDemografica[];
}) {
  const setHover = useDatosDemograficos((s) => s.setHover);
  const setSeleccionado = useDatosDemograficos((s) => s.setSeleccionado);
  const departamentoHover = useDatosDemograficos((s) => s.departamentoHover);
  const departamentoSeleccionado = useDatosDemograficos((s) => s.departamentoSeleccionado);

  const regionesMap = useMemo(() => {
    const m = new Map<string, RegionDemografica>();
    regiones.forEach((r) => { if (r.codigoDane) m.set(r.codigoDane, r); });
    return m;
  }, [regiones]);

  const pathGen = useMemo(() => {
    const proj = geoMercator().fitSize([W, H], geoJSON);
    return geoPath(proj);
  }, [geoJSON]);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-full"
      style={{ display: "block" }}
    >
      {geoJSON.features.map((feature: Feature<Geometry, GeoJsonProperties>, idx) => {
        const props = feature.properties as Record<string, unknown> | null;
        const code = extractCodigoDane(props) ?? `dep-${idx}`;
        const region = regionesMap.get(code);
        const intensidad = region?.intensidad ?? 0;
        const isHovered = departamentoHover === code;
        const isSelected = departamentoSeleccionado === code;
        const d = pathGen(feature as Parameters<typeof pathGen>[0]);
        if (!d) return null;

        return (
          <path
            key={code}
            d={d}
            fill={intensidadAColor(intensidad)}
            stroke={isSelected ? "#ffffff" : isHovered ? "#cbd5e1" : "#0a0818"}
            strokeWidth={isSelected ? 1.5 : isHovered ? 1 : 0.4}
            opacity={isHovered && !isSelected ? 0.88 : 1}
            style={{
              cursor: "pointer",
              transition: "stroke 0.12s, stroke-width 0.12s, opacity 0.12s",
              filter: isSelected ? "brightness(1.25) drop-shadow(0 0 4px rgba(255,255,255,0.3))" : undefined,
            }}
            onMouseEnter={() => { setHover(code); }}
            onMouseLeave={() => { setHover(null); }}
            onClick={() => { setSeleccionado(code); }}
          />
        );
      })}
    </svg>
  );
}

// ─── Tooltip overlay ──────────────────────────────────────────────────────────

function DeptoTooltip() {
  const departamentoHover = useDatosDemograficos((s) => s.departamentoHover);
  const departamentoSeleccionado = useDatosDemograficos((s) => s.departamentoSeleccionado);
  const regiones = useDatosDemograficos((s) => s.regiones);
  const geoJSON = useDatosDemograficos((s) => s.geoJSON);

  const activeCodigo = departamentoSeleccionado ?? departamentoHover;
  if (!activeCodigo || !geoJSON) return null;

  const region = regiones.find((r) => r.codigoDane === activeCodigo);
  const feature = geoJSON.features.find(
    (f) => extractCodigoDane(f.properties as Record<string, unknown> | null) === activeCodigo
  );
  const nombre = feature
    ? extractNombre(feature.properties as Record<string, unknown> | null)
    : activeCodigo;

  const isSelected = departamentoSeleccionado === activeCodigo;

  return (
    <div className="absolute bottom-6 left-6 pointer-events-none z-10">
      <div
        className="bg-gray-900/92 backdrop-blur-md text-white px-4 py-3 rounded-2xl
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

            {(region.totalEmpleados ?? region.empleados) != null && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Empleados</span>
                <span className="font-mono font-semibold">
                  {(region.totalEmpleados ?? region.empleados ?? 0).toLocaleString("es-CO")}
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
      </div>
    </div>
  );
}

// ─── Public component ──────────────────────────────────────────────────────────

export default function CanvasWrapper() {
  const { cargando, error, geoJSON, regiones } = useFetchDemografia();

  if (cargando || (!geoJSON && !error)) return <LoadingScreen />;
  if (error) return <ErrorScreen message={error} />;
  if (!geoJSON || geoJSON.features.length === 0) {
    return <ErrorScreen message="El GeoJSON no contiene features válidas." />;
  }

  return (
    <div className="w-full h-full relative bg-gray-900 flex items-center justify-center overflow-hidden">
      <MapaSvg geoJSON={geoJSON} regiones={regiones} />
      <DeptoTooltip />
    </div>
  );
}
