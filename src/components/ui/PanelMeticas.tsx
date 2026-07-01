"use client";

import { Users, MapPin, Calendar, Building2, ChevronLeft } from "lucide-react";
import { useDatosDemograficos } from "@/hooks/useDatosDemograficos";
import { extractCodigoDane, extractNombre } from "@/utils/geojson-to-shape.util";
import { intensidadAColor } from "@/utils/generador-color.util";
import type { MunicipioData } from "@/types/demografia.types";

// ─── Atoms ─────────────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[9px] uppercase tracking-widest text-cl-muted font-semibold">{children}</p>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="bg-cl-card/60 border border-white/10 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-3.5 h-3.5 text-cl-teal shrink-0" />
        <span className="text-[10px] uppercase tracking-widest text-cl-muted font-semibold">{label}</span>
      </div>
      <p className="text-2xl font-extrabold font-mono text-white leading-none">{value}</p>
    </div>
  );
}

function CoverageBar({ intensidad }: { intensidad: number }) {
  const color = intensidadAColor(intensidad);
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-baseline">
        <span className="text-[10px] uppercase tracking-widest text-cl-muted font-semibold">Cobertura</span>
        <span className="text-sm font-bold font-mono" style={{ color }}>
          {(intensidad * 100).toFixed(1)}%
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${intensidad * 100}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function MunicipioRow({ mun, max }: { mun: MunicipioData; max: number }) {
  const pct = max > 0 ? (mun.empleados / max) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-xs text-white/90 truncate mr-2">{mun.municipio}</span>
        <span className="text-[11px] font-mono text-cl-muted shrink-0">{mun.empleados.toLocaleString("es-CO")}</span>
      </div>
      <div className="h-0.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: intensidadAColor(pct / 100) }}
        />
      </div>
    </div>
  );
}

// ─── Main panel ────────────────────────────────────────────────────────────────

export default function PanelMeticas() {
  const meta            = useDatosDemograficos((s) => s.meta);
  const geoJSON         = useDatosDemograficos((s) => s.geoJSON);
  const regiones        = useDatosDemograficos((s) => s.regiones);
  const selected        = useDatosDemograficos((s) => s.departamentoSeleccionado);
  const setSeleccionado = useDatosDemograficos((s) => s.setSeleccionado);
  const cargando        = useDatosDemograficos((s) => s.cargando);

  const nombrePorDane = (() => {
    if (!geoJSON) return new Map<string, string>();
    const m = new Map<string, string>();
    geoJSON.features.forEach((f) => {
      const code = extractCodigoDane(f.properties as Record<string, unknown> | null);
      if (code) m.set(code, extractNombre(f.properties as Record<string, unknown> | null));
    });
    return m;
  })();

  const deptoInfo = (() => {
    if (!selected) return null;
    const region = regiones.find((r) => r.codigoDane === selected);
    const nombre = nombrePorDane.get(selected) ?? selected;
    return { region, nombre };
  })();

  const regionesSorted = [...regiones]
    .filter((r) => r.codigoDane)
    .sort((a, b) => (b.totalEmpleados ?? b.empleados ?? 0) - (a.totalEmpleados ?? a.empleados ?? 0));

  const fecha = meta?.fechaActualizacion ?? meta?.generadoEn;

  return (
    <div className="flex flex-col h-full">

      {/* ── Sidebar header ── */}
      <div className="shrink-0 px-5 py-5 border-b border-white/10">
        <SectionLabel>Panel de métricas</SectionLabel>
        <h1 className="text-lg font-extrabold text-white mt-1 leading-snug">
          Distribución del talento
        </h1>
        <p className="text-xs text-cl-muted mt-0.5">Campuslands · Datos por departamento</p>
      </div>

      {/* ── Spinner ── */}
      {cargando && (
        <div className="shrink-0 flex items-center gap-2 px-5 py-3 text-xs text-cl-muted">
          <div className="w-3.5 h-3.5 border border-cl-teal border-t-transparent rounded-full animate-spin" />
          Cargando datos…
        </div>
      )}

      {/* ── Scrollable content ── */}
      <div className="flex-1 lg:overflow-y-auto px-5 py-5 space-y-6">

        {/* ── National stats ── */}
        {meta && (
          <section className="space-y-3">
            <SectionLabel>Nacional</SectionLabel>

            <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
              <StatCard
                label="Total empleados"
                value={meta.totalEmpleados.toLocaleString("es-CO")}
                icon={Users}
              />
              <StatCard
                label="Departamentos activos"
                value={String(meta.totalDepartamentos)}
                icon={MapPin}
              />
            </div>

            {fecha && (
              <div className="flex items-center gap-2 text-[11px] text-cl-muted">
                <Calendar className="w-3 h-3 shrink-0" />
                <span>
                  {new Date(fecha).toLocaleDateString("es-CO", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}
          </section>
        )}

        {/* ── Department list ── */}
        {!selected && regionesSorted.length > 0 && (
          <section className="space-y-2">
            <SectionLabel>Departamentos con cobertura</SectionLabel>
            <div className="space-y-1.5">
              {regionesSorted.map((r) => {
                const nombre = r.codigoDane
                  ? (nombrePorDane.get(r.codigoDane) ?? r.departamento ?? r.codigoDane)
                  : (r.departamento ?? "—");
                const emp = r.totalEmpleados ?? r.empleados ?? 0;

                return (
                  <button
                    key={r.codigoDane}
                    onClick={() => r.codigoDane && setSeleccionado(r.codigoDane)}
                    className="w-full text-left px-3 py-2.5 rounded-xl bg-cl-card/40 hover:bg-cl-card
                               border border-white/10 hover:border-cl-teal/40 transition-all duration-150 group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-white/90 group-hover:text-white transition-colors truncate mr-2">
                        {nombre}
                      </span>
                      <span className="text-[11px] font-mono text-cl-muted shrink-0">
                        {emp.toLocaleString("es-CO")}
                      </span>
                    </div>
                    <div className="h-0.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(r.intensidad ?? 0) * 100}%`,
                          backgroundColor: intensidadAColor(r.intensidad ?? 0),
                        }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Empty state ── */}
        {!selected && regionesSorted.length === 0 && !cargando && (
          <div className="rounded-2xl border border-dashed border-white/20 p-6 text-center">
            <p className="text-xs text-cl-muted">
              Sin datos disponibles. Toca un departamento del mapa para explorar.
            </p>
          </div>
        )}

        {/* ── Selected department ── */}
        {selected && (
          <section className="space-y-4">

            {/* Back button + label */}
            <div className="flex items-center justify-between">
              <SectionLabel>Departamento</SectionLabel>
              <button
                onClick={() => setSeleccionado(selected)}
                className="flex items-center gap-1 text-[11px] text-cl-muted hover:text-cl-teal transition-colors"
              >
                <ChevronLeft className="w-3 h-3" />
                Volver
              </button>
            </div>

            {/* Department card */}
            <div
              className="rounded-2xl border bg-cl-card/60 p-4 space-y-4"
              style={{
                borderColor: deptoInfo?.region
                  ? intensidadAColor(deptoInfo.region.intensidad) + "55"
                  : "rgba(255,255,255,0.12)",
              }}
            >
              <div>
                <p className="font-bold text-white leading-snug">{deptoInfo?.nombre}</p>
                <p className="text-[10px] font-mono text-cl-muted/70 mt-0.5">DANE {selected}</p>
              </div>

              {deptoInfo?.region && (
                <>
                  <CoverageBar intensidad={deptoInfo.region.intensidad} />

                  {(deptoInfo.region.totalEmpleados ?? deptoInfo.region.empleados) != null && (
                    <div className="pt-3 border-t border-white/10">
                      <p className="text-[10px] uppercase tracking-widest text-cl-muted font-semibold mb-1">
                        Empleados registrados
                      </p>
                      <p className="text-2xl font-extrabold font-mono text-white">
                        {(deptoInfo.region.totalEmpleados ?? deptoInfo.region.empleados ?? 0).toLocaleString("es-CO")}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Municipalities */}
            {deptoInfo?.region?.municipios && deptoInfo.region.municipios.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-cl-card/30 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-cl-teal" />
                  <SectionLabel>Municipios ({deptoInfo.region.municipios.length})</SectionLabel>
                </div>
                <div className="space-y-3">
                  {deptoInfo.region.municipios.map((m) => (
                    <MunicipioRow
                      key={m.municipio}
                      mun={m}
                      max={deptoInfo.region!.municipios![0].empleados}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* No data placeholder */}
            {!deptoInfo?.region && (
              <div className="rounded-2xl border border-dashed border-white/20 p-5 text-center">
                <p className="text-xs text-cl-muted">Sin datos para este departamento.</p>
              </div>
            )}
          </section>
        )}

      </div>

      {/* ── Footer: data source ── */}
      {meta?.fuente && (
        <div className="shrink-0 px-5 py-3 border-t border-white/10">
          <p className="text-[9px] text-cl-muted/60 leading-relaxed">{meta.fuente}</p>
        </div>
      )}
    </div>
  );
}
