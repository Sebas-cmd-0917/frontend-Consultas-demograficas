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

// Brand ramp gradient used by the legend bar
const RAMP_CSS =
  "linear-gradient(to right, #34397e, #2f66c4, #17b3a8, #46e8bf)";

// ─── SVG Choropleth ───────────────────────────────────────────────────────────

function MapaSvg({
  geoJSON,
  regiones,
}: {
  geoJSON: FeatureCollection;
  regiones: RegionDemografica[];
}) {
  const setHover        = useDatosDemograficos((s) => s.setHover);
  const setSeleccionado = useDatosDemograficos((s) => s.setSeleccionado);
  const hover           = useDatosDemograficos((s) => s.departamentoHover);
  const selected        = useDatosDemograficos((s) => s.departamentoSeleccionado);

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
            stroke={isSelected ? "#57f2cf" : isHovered ? "#2ce0b6" : "#101253"}
            strokeWidth={isSelected ? 1.6 : isHovered ? 1 : 0.4}
            opacity={isHovered && !isSelected ? 0.9 : 1}
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
    <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 pointer-events-none z-10">
      <div
        className="bg-cl-navy/90 backdrop-blur-sm border text-white px-4 py-3 rounded-2xl shadow-2xl min-w-[190px]"
        style={{ borderColor: region ? intensidadAColor(region.intensidad) + "66" : "rgba(255,255,255,0.15)" }}
      >
        <p className="text-[9px] uppercase tracking-widest text-cl-muted mb-0.5 font-semibold">
          {isSelected ? "Seleccionado" : "Departamento"}
        </p>
        <p className="font-bold text-sm leading-snug text-white">{nombre}</p>
        <p className="text-[10px] text-cl-muted/70 mt-0.5 font-mono">DANE {codigo}</p>

        {region && (
          <div className="mt-2.5 pt-2.5 border-t border-white/10 space-y-2">
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-cl-muted">Cobertura</span>
                <span className="font-bold" style={{ color: intensidadAColor(region.intensidad) }}>
                  {(region.intensidad * 100).toFixed(1)}%
                </span>
              </div>
              <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${region.intensidad * 100}%`, backgroundColor: intensidadAColor(region.intensidad) }}
                />
              </div>
            </div>

            {emp != null && (
              <div className="flex justify-between text-[11px]">
                <span className="text-cl-muted">Empleados</span>
                <span className="font-bold text-white font-mono">{emp.toLocaleString("es-CO")}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Map legend ───────────────────────────────────────────────────────────────

function Leyenda() {
  const STOPS = [
    { label: "Sin datos", color: intensidadAColor(0) },
    { label: "Baja",      color: intensidadAColor(0.25) },
    { label: "Media",     color: intensidadAColor(0.55) },
    { label: "Alta",      color: intensidadAColor(0.8) },
    { label: "Máxima",    color: intensidadAColor(1) },
  ];

  return (
    <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-10 pointer-events-none">
      <div className="bg-cl-navy/85 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3 min-w-[168px]">
        <p className="text-[9px] uppercase tracking-widest text-cl-muted font-semibold mb-2.5">
          Densidad de empleados
        </p>

        {/* Gradient bar */}
        <div className="h-2 rounded-full mb-1.5" style={{ background: RAMP_CSS }} />
        <div className="flex justify-between text-[9px] text-cl-muted/70 mb-3">
          <span>Baja</span>
          <span>Alta</span>
        </div>

        {/* Discrete stops — hidden on very small screens to save space */}
        <div className="hidden sm:block space-y-1.5">
          {STOPS.map((s) => (
            <div key={s.label} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: s.color }} />
              <span className="text-[10px] text-cl-muted">{s.label}</span>
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
    <div className="absolute top-4 left-4 sm:top-5 sm:left-6 z-10 pointer-events-none">
      <p className="text-[9px] uppercase tracking-widest text-cl-teal font-semibold mb-0.5">
        República de Colombia
      </p>
      <p className="text-[11px] text-cl-muted">
        Distribución del talento · Vista departamental
      </p>
    </div>
  );
}

// ─── Loading / Error ──────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-cl-navy">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 rounded-full border-2 border-cl-teal border-t-transparent animate-spin mx-auto" />
        <p className="text-cl-muted text-xs tracking-wide">Cargando datos geográficos…</p>
      </div>
    </div>
  );
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-cl-navy">
      <div className="text-center max-w-sm space-y-2 px-6">
        <p className="text-red-300 text-sm font-bold">Error al cargar el mapa</p>
        <p className="text-cl-muted text-xs">{message}</p>
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
    <div className="w-full h-full relative bg-cl-navy flex items-center justify-center overflow-hidden">
      <MapaSvg geoJSON={geoJSON} regiones={regiones} />
      <MapaTitulo />
      <DeptoTooltip />
      <Leyenda />
    </div>
  );
}
