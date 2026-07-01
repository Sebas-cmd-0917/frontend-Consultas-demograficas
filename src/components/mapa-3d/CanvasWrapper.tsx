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

// ─── SVG Choropleth ───────────────────────────────────────────────────────────

function MapaSvg({
  geoJSON,
  regiones,
}: {
  geoJSON: FeatureCollection;
  regiones: RegionDemografica[];
}) {
  const setHover       = useDatosDemograficos((s) => s.setHover);
  const setSeleccionado = useDatosDemograficos((s) => s.setSeleccionado);
  const hover          = useDatosDemograficos((s) => s.departamentoHover);
  const selected       = useDatosDemograficos((s) => s.departamentoSeleccionado);

  const regionesMap = useMemo(() => {
    const m = new Map<string, RegionDemografica>();
    regiones.forEach((r) => { if (r.codigoDane) m.set(r.codigoDane, r); });
    return m;
  }, [regiones]);

  const pathGen = useMemo(() => {
    // Use a manually-specified bbox for Colombia instead of geoBounds(),
    // which returns world bounds when the GeoJSON winding order is not
    // spherically correct (d3-geo interprets those rings as world-covering).
    const colombiaBbox = {
      type: "Feature" as const,
      properties: null,
      geometry: {
        type: "Polygon" as const,
        coordinates: [[
          [-81.74, -4.24],
          [-66.85, -4.24],
          [-66.85, 13.38],
          [-81.74, 13.38],
          [-81.74, -4.24],
        ]],
      },
    };
    const proj = geoMercator().fitSize([W, H], colombiaBbox as never);
    return geoPath(proj);
  }, [geoJSON]);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" style={{ display: "block" }}>
      {geoJSON.features.map((feature: Feature<Geometry, GeoJsonProperties>, idx) => {
        const props      = feature.properties as Record<string, unknown> | null;
        const code       = extractCodigoDane(props) ?? `dep-${idx}`;
        const region     = regionesMap.get(code);
        const intensidad = region?.intensidad ?? 0;
        const isHovered  = hover === code;
        const isSelected = selected === code;
        const d          = pathGen(feature as Parameters<typeof pathGen>[0]);
        if (!d) return null;

        return (
          <path
            key={code}
            d={d}
            fill={intensidadAColor(intensidad)}
            stroke={isSelected ? "#f1f5f9" : isHovered ? "#94a3b8" : "#0f172a"}
            strokeWidth={isSelected ? 1.2 : isHovered ? 0.8 : 0.35}
            opacity={isHovered && !isSelected ? 0.85 : 1}
            style={{ cursor: "pointer" }}
            onMouseEnter={() => setHover(code)}
            onMouseLeave={() => setHover(null)}
            onClick={() => setSeleccionado(code)}
          />
        );
      })}
    </svg>
  );
}

// ─── Hover / Selection tooltip ────────────────────────────────────────────────

function DeptoTooltip() {
  const hover    = useDatosDemograficos((s) => s.departamentoHover);
  const selected = useDatosDemograficos((s) => s.departamentoSeleccionado);
  const regiones = useDatosDemograficos((s) => s.regiones);
  const geoJSON  = useDatosDemograficos((s) => s.geoJSON);

  const codigo = selected ?? hover;
  if (!codigo || !geoJSON) return null;

  const region  = regiones.find((r) => r.codigoDane === codigo);
  const feature = geoJSON.features.find(
    (f) => extractCodigoDane(f.properties as Record<string, unknown> | null) === codigo
  );
  const nombre     = feature ? extractNombre(feature.properties as Record<string, unknown> | null) : codigo;
  const isSelected = selected === codigo;
  const emp        = region?.totalEmpleados ?? region?.empleados;

  return (
    <div className="absolute bottom-6 left-6 pointer-events-none z-10">
      <div
        className="bg-slate-900 border text-slate-100 px-4 py-3 rounded-xl shadow-2xl min-w-[200px]"
        style={{ borderColor: region ? intensidadAColor(region.intensidad) + "55" : "#334155" }}
      >
        <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-0.5 font-medium">
          {isSelected ? "Seleccionado" : "Departamento"}
        </p>
        <p className="font-semibold text-sm leading-snug text-slate-100">{nombre}</p>
        <p className="text-[10px] text-slate-500 mt-0.5 font-mono">DANE {codigo}</p>

        {region && (
          <div className="mt-2.5 pt-2.5 border-t border-slate-800 space-y-2">
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-400">Cobertura</span>
                <span className="font-semibold" style={{ color: intensidadAColor(region.intensidad) }}>
                  {(region.intensidad * 100).toFixed(1)}%
                </span>
              </div>
              <div className="h-1 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${region.intensidad * 100}%`, backgroundColor: intensidadAColor(region.intensidad) }}
                />
              </div>
            </div>

            {emp != null && (
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Empleados</span>
                <span className="font-semibold text-slate-200 font-mono">{emp.toLocaleString("es-CO")}</span>
              </div>
            )}
          </div>
        )}
      </div>
      {isSelected && (
        <p className="text-center text-[9px] text-slate-600 mt-1">clic para deseleccionar</p>
      )}
    </div>
  );
}

// ─── Map legend ───────────────────────────────────────────────────────────────

function Leyenda() {
  const STOPS = [
    { label: "Sin datos",  color: intensidadAColor(0) },
    { label: "Baja",       color: intensidadAColor(0.25) },
    { label: "Media",      color: intensidadAColor(0.55) },
    { label: "Alta",       color: intensidadAColor(0.8) },
    { label: "Máxima",     color: intensidadAColor(1) },
  ];

  return (
    <div className="absolute bottom-6 right-6 z-10 pointer-events-none">
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3 min-w-[180px]">
        <p className="text-[9px] uppercase tracking-widest text-slate-500 font-medium mb-2.5">
          Densidad poblacional
        </p>

        {/* Gradient bar */}
        <div
          className="h-2 rounded-full mb-1.5"
          style={{ background: "linear-gradient(to right, #312e81, #7c3aed, #ec4899, #f97316)" }}
        />
        <div className="flex justify-between text-[9px] text-slate-500 mb-3">
          <span>Baja</span>
          <span>Alta</span>
        </div>

        {/* Discrete stops */}
        <div className="space-y-1.5">
          {STOPS.map((s) => (
            <div key={s.label} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: s.color }} />
              <span className="text-[10px] text-slate-400">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Map title overlay ────────────────────────────────────────────────────────

function MapaTitulo() {
  return (
    <div className="absolute top-5 left-6 z-10 pointer-events-none">
      <p className="text-[9px] uppercase tracking-widest text-slate-500 font-medium mb-0.5">
        República de Colombia
      </p>
      <p className="text-[11px] text-slate-400">
        Distribución geográfica · Vista departamental
      </p>
    </div>
  );
}

// ─── Loading / Error ──────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-slate-950">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mx-auto" />
        <p className="text-slate-500 text-xs tracking-wide">Cargando datos geográficos…</p>
      </div>
    </div>
  );
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-slate-950">
      <div className="text-center max-w-sm space-y-2 px-6">
        <p className="text-red-400 text-sm font-semibold">Error al cargar el mapa</p>
        <p className="text-slate-500 text-xs">{message}</p>
      </div>
    </div>
  );
}

// ─── Public component ─────────────────────────────────────────────────────────

export default function CanvasWrapper() {
  const { cargando, error, geoJSON, regiones } = useFetchDemografia();

  if (cargando || (!geoJSON && !error)) return <LoadingScreen />;
  if (error)  return <ErrorScreen message={error} />;
  if (!geoJSON || geoJSON.features.length === 0)
    return <ErrorScreen message="El GeoJSON no contiene features válidas." />;

  return (
    <div className="w-full h-full relative bg-slate-950 flex items-center justify-center overflow-hidden">
      <MapaSvg geoJSON={geoJSON} regiones={regiones} />
      <MapaTitulo />
      <DeptoTooltip />
      <Leyenda />
    </div>
  );
}
