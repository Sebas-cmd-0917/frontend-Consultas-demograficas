"use client";

import { BarChart3, Users, MapPin, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { useDatosDemograficos } from "@/hooks/useDatosDemograficos";
import { extractCodigoDane, extractNombre } from "@/utils/geojson-to-shape.util";
import { intensidadAColor } from "@/utils/generador-color.util";

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

function ColorLegend() {
  return (
    <section className="space-y-2">
      <h2 className="text-xs uppercase text-gray-500 tracking-wider">Escala de intensidad</h2>
      <div
        className="h-3 rounded-full"
        style={{
          background:
            "linear-gradient(to right, #312e81, #7c3aed, #ec4899, #f97316)",
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
  const cargando = useDatosDemograficos((s) => s.cargando);

  const deptoInfo = (() => {
    if (!departamentoSeleccionado) return null;
    const region = regiones.find((r) => r.codigoDane === departamentoSeleccionado);
    const feature = geoJSON?.features.find(
      (f) =>
        extractCodigoDane(f.properties as Record<string, unknown> | null) ===
        departamentoSeleccionado
    );
    const nombre = feature
      ? extractNombre(feature.properties as Record<string, unknown> | null)
      : departamentoSeleccionado;
    return { region, nombre };
  })();

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* ── Header ── */}
      <header className="flex items-center gap-3 border-b border-gray-700 pb-4 shrink-0">
        <BarChart3 className="w-6 h-6 text-violet-400" />
        <div>
          <h1 className="text-lg font-bold leading-tight">Métricas Demográficas</h1>
          <p className="text-xs text-gray-500">Colombia · Vista departamental</p>
        </div>
      </header>

      {cargando && (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <div className="w-4 h-4 border border-violet-500 border-t-transparent rounded-full animate-spin" />
          Cargando datos…
        </div>
      )}

      {/* ── National totals ── */}
      {meta && (
        <section className="space-y-3 shrink-0">
          <h2 className="text-xs uppercase text-gray-500 tracking-wider font-semibold">
            Nacional
          </h2>

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

          {meta.fechaActualizacion && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                Actualizado:{" "}
                {new Date(meta.fechaActualizacion).toLocaleDateString("es-CO", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          )}
        </section>
      )}

      {/* ── Selected department ── */}
      <section className="space-y-3 flex-1 min-h-0">
        <h2 className="text-xs uppercase text-gray-500 tracking-wider font-semibold">
          Departamento seleccionado
        </h2>

        {deptoInfo ? (
          <div
            className="bg-gray-700/40 rounded-xl p-4 border space-y-4 transition-all duration-300"
            style={{
              borderColor: deptoInfo.region
                ? intensidadAColor(deptoInfo.region.intensidad) + "55"
                : "rgba(107,114,128,0.4)",
            }}
          >
            <div>
              <p className="font-semibold text-lg leading-tight">{deptoInfo.nombre}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Código DANE: {departamentoSeleccionado}
              </p>
            </div>

            {deptoInfo.region && (
              <>
                <IntensityBar intensidad={deptoInfo.region.intensidad} />

                {deptoInfo.region.totalEmpleados != null && (
                  <div className="flex items-end justify-between">
                    <span className="text-sm text-gray-400">Empleados registrados</span>
                    <span className="text-2xl font-bold font-mono">
                      {deptoInfo.region.totalEmpleados.toLocaleString("es-CO")}
                    </span>
                  </div>
                )}

                {deptoInfo.region.variacion != null && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Variación</span>
                    <span
                      className={
                        deptoInfo.region.variacion >= 0
                          ? "text-emerald-400 font-semibold"
                          : "text-red-400 font-semibold"
                      }
                    >
                      {deptoInfo.region.variacion > 0 ? "+" : ""}
                      {deptoInfo.region.variacion.toFixed(1)} %
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="bg-gray-700/20 rounded-xl p-4 border border-dashed border-gray-700 text-center">
            <p className="text-sm text-gray-500">
              Haz clic en un departamento del mapa para explorar sus datos.
            </p>
          </div>
        )}
      </section>

      {/* ── Legend ── */}
      <div className="shrink-0">
        <ColorLegend />
      </div>
    </div>
  );
}
