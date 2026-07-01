"use client";

import { BarChart3, Users, MapPin, TrendingUp, TrendingDown, Calendar, Building2 } from "lucide-react";
import { useDatosDemograficos } from "@/hooks/useDatosDemograficos";
import { extractCodigoDane, extractNombre } from "@/utils/geojson-to-shape.util";
import { intensidadAColor } from "@/utils/generador-color.util";
import type { MunicipioData } from "@/types/demografia.types";

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  iconClass = "text-violet-400",
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  iconClass?: string;
}) {
  return (
    <div className="bg-gray-700/40 rounded-xl p-4 border border-gray-700/60">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${iconClass}`} />
        <span className="text-xs text-gray-400 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-bold font-mono">{value}</p>
    </div>
  );
}

function IntensityBar({ intensidad }: { intensidad: number }) {
  const color = intensidadAColor(intensidad);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-400">Intensidad laboral</span>
        <span className="font-mono font-semibold" style={{ color }}>
          {(intensidad * 100).toFixed(1)} %
        </span>
      </div>
      <div className="h-2 rounded-full bg-gray-700 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${intensidad * 100}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function MunicipioRow({ mun, maxEmpleados }: { mun: MunicipioData; maxEmpleados: number }) {
  const pct = maxEmpleados > 0 ? (mun.empleados / maxEmpleados) * 100 : 0;
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-xs">
        <span className="text-gray-300 truncate mr-2">{mun.municipio}</span>
        <span className="text-gray-400 font-mono shrink-0">{mun.empleados}</span>
      </div>
      <div className="h-1 rounded-full bg-gray-700/60 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: intensidadAColor(pct / 100) }}
        />
      </div>
    </div>
  );
}

function ColorLegend() {
  return (
    <section className="space-y-2">
      <h2 className="text-xs uppercase text-gray-500 tracking-wider">Escala de intensidad</h2>
      <div
        className="h-3 rounded-full"
        style={{
          background: "linear-gradient(to right, #312e81, #7c3aed, #ec4899, #f97316)",
        }}
      />
      <div className="flex justify-between text-xs text-gray-500">
        <span>Baja</span>
        <span>Media</span>
        <span>Alta</span>
      </div>
    </section>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function PanelMeticas() {
  const meta = useDatosDemograficos((s) => s.meta);
  const geoJSON = useDatosDemograficos((s) => s.geoJSON);
  const regiones = useDatosDemograficos((s) => s.regiones);
  const departamentoSeleccionado = useDatosDemograficos((s) => s.departamentoSeleccionado);
  const setSeleccionado = useDatosDemograficos((s) => s.setSeleccionado);
  const cargando = useDatosDemograficos((s) => s.cargando);

  // Build name lookup from GeoJSON features
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
    if (!departamentoSeleccionado) return null;
    const region = regiones.find((r) => r.codigoDane === departamentoSeleccionado);
    const nombre = nombrePorDane.get(departamentoSeleccionado) ?? departamentoSeleccionado;
    return { region, nombre };
  })();

  // Departments sorted by employee count desc (navigation list)
  const regionesSorted = [...regiones]
    .filter((r) => r.codigoDane)
    .sort((a, b) => (b.totalEmpleados ?? b.empleados ?? 0) - (a.totalEmpleados ?? a.empleados ?? 0));

  return (
    <div className="flex flex-col gap-5 h-full">
      {/* ── Header ── */}
      <header className="flex items-center gap-3 border-b border-gray-700 pb-4 shrink-0">
        <BarChart3 className="w-6 h-6 text-violet-400" />
        <div>
          <h1 className="text-lg font-bold leading-tight">Métricas Demográficas</h1>
          <p className="text-xs text-gray-500">Colombia · Vista departamental</p>
        </div>
      </header>

      {cargando && (
        <div className="flex items-center gap-2 text-sm text-gray-400 shrink-0">
          <div className="w-4 h-4 border border-violet-500 border-t-transparent rounded-full animate-spin" />
          Cargando datos…
        </div>
      )}

      {/* ── National totals ── */}
      {meta && (
        <section className="space-y-3 shrink-0">
          <h2 className="text-xs uppercase text-gray-500 tracking-wider font-semibold">Nacional</h2>

          <StatCard
            label="Total empleados"
            value={meta.totalEmpleados.toLocaleString("es-CO")}
            icon={Users}
            iconClass="text-violet-400"
          />

          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Departamentos"
              value={String(meta.totalDepartamentos)}
              icon={MapPin}
              iconClass="text-blue-400"
            />
            {meta.variacionMensual != null && (
              <StatCard
                label="Var. mensual"
                value={`${meta.variacionMensual > 0 ? "+" : ""}${meta.variacionMensual.toFixed(1)} %`}
                icon={meta.variacionMensual >= 0 ? TrendingUp : TrendingDown}
                iconClass={meta.variacionMensual >= 0 ? "text-emerald-400" : "text-red-400"}
              />
            )}
          </div>

          {(meta.fechaActualizacion ?? meta.generadoEn) && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                Actualizado:{" "}
                {new Date(
                  meta.fechaActualizacion ?? meta.generadoEn ?? ""
                ).toLocaleDateString("es-CO", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          )}
        </section>
      )}

      {/* ── Department navigation list (visible when nothing selected) ── */}
      {!departamentoSeleccionado && regionesSorted.length > 0 && (
        <section className="space-y-2 flex-1 min-h-0 flex flex-col">
          <h2 className="text-xs uppercase text-gray-500 tracking-wider font-semibold shrink-0">
            Departamentos con cobertura
          </h2>
          <div className="overflow-y-auto space-y-1.5 pr-1 flex-1">
            {regionesSorted.map((r) => {
              const nombre = r.codigoDane
                ? (nombrePorDane.get(r.codigoDane) ?? r.departamento ?? r.codigoDane)
                : (r.departamento ?? "—");
              const emp = r.totalEmpleados ?? r.empleados ?? 0;
              return (
                <button
                  key={r.codigoDane}
                  onClick={() => r.codigoDane && setSeleccionado(r.codigoDane)}
                  className="w-full text-left px-3 py-2 rounded-lg bg-gray-700/30 hover:bg-gray-700/60
                             border border-gray-700/50 hover:border-gray-600 transition-all duration-150 group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium group-hover:text-white transition-colors">
                      {nombre}
                    </span>
                    <span className="text-xs font-mono text-gray-400">
                      {emp.toLocaleString("es-CO")}
                    </span>
                  </div>
                  <div className="h-1 rounded-full bg-gray-700 overflow-hidden">
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

      {/* ── Selected department detail ── */}
      {departamentoSeleccionado && (
        <section className="space-y-3 flex-1 min-h-0 flex flex-col">
          <div className="flex items-center justify-between shrink-0">
            <h2 className="text-xs uppercase text-gray-500 tracking-wider font-semibold">
              Departamento seleccionado
            </h2>
            <button
              onClick={() => setSeleccionado(departamentoSeleccionado)}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              ← Volver
            </button>
          </div>

          <div className="overflow-y-auto flex-1 space-y-3 pr-1">
            {/* Department header card */}
            <div
              className="bg-gray-700/40 rounded-xl p-4 border transition-all duration-300"
              style={{
                borderColor: deptoInfo?.region
                  ? intensidadAColor(deptoInfo.region.intensidad) + "55"
                  : "rgba(107,114,128,0.4)",
              }}
            >
              <p className="font-semibold text-lg leading-tight">{deptoInfo?.nombre}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Código DANE: {departamentoSeleccionado}
              </p>

              {deptoInfo?.region && (
                <div className="mt-3 space-y-3">
                  <IntensityBar intensidad={deptoInfo.region.intensidad} />
                  {(deptoInfo.region.totalEmpleados ?? deptoInfo.region.empleados) != null && (
                    <div className="flex items-end justify-between">
                      <span className="text-sm text-gray-400">Empleados registrados</span>
                      <span className="text-2xl font-bold font-mono">
                        {(
                          deptoInfo.region.totalEmpleados ??
                          deptoInfo.region.empleados ??
                          0
                        ).toLocaleString("es-CO")}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Municipalities breakdown */}
            {deptoInfo?.region?.municipios && deptoInfo.region.municipios.length > 0 && (
              <div className="bg-gray-700/20 rounded-xl p-4 border border-gray-700/40 space-y-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-blue-400" />
                  <h3 className="text-xs uppercase text-gray-500 tracking-wider font-semibold">
                    Municipios ({deptoInfo.region.municipios.length})
                  </h3>
                </div>
                <div className="space-y-2.5">
                  {deptoInfo.region.municipios.map((m) => (
                    <MunicipioRow
                      key={m.municipio}
                      mun={m}
                      maxEmpleados={deptoInfo.region!.municipios![0].empleados}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* No data for selected department */}
            {!deptoInfo?.region && (
              <div className="bg-gray-700/20 rounded-xl p-4 border border-dashed border-gray-700 text-center">
                <p className="text-sm text-gray-500">Sin datos para este departamento.</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Hint when no data and nothing selected */}
      {!departamentoSeleccionado && regionesSorted.length === 0 && !cargando && (
        <div className="bg-gray-700/20 rounded-xl p-4 border border-dashed border-gray-700 text-center flex-1">
          <p className="text-sm text-gray-500">
            Haz clic en un departamento del mapa para explorar sus datos.
          </p>
        </div>
      )}

      {/* ── Legend ── */}
      <div className="shrink-0">
        <ColorLegend />
      </div>
    </div>
  );
}
