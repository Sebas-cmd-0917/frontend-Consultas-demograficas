import { create } from "zustand";
import type { FeatureCollection } from "geojson";
import type {
  MetaDemografica,
  RegionDemografica,
  BackendEnvelope,
  DemografiaRecord,
} from "@/types/demografia.types";
import { apiClient } from "@/services/api.client";
import { extractCodigoDane } from "@/utils/geojson-to-shape.util";

// ─── Mock data fallback (when API is not reachable) ──────────────────────────

function generarMockRegiones(geoJSON: FeatureCollection): RegionDemografica[] {
  return geoJSON.features
    .filter((f) => f.properties)
    .map((f, i) => {
      const props = f.properties as Record<string, unknown>;
      const codigoDane = extractCodigoDane(props) ?? String(i + 1).padStart(2, "0");
      // Deterministic "random" via sine so SSR and client match
      const intensidad = (Math.sin(i * 1.7 + 0.3) + 1) / 2;
      return {
        codigoDane,
        intensidad,
        totalEmpleados: Math.floor(intensidad * 600_000),
      };
    });
}

// ─── Store shape ─────────────────────────────────────────────────────────────

interface DemografiaStore {
  meta: MetaDemografica | null;
  regiones: RegionDemografica[];
  geoJSON: FeatureCollection | null;
  cargando: boolean;
  error: string | null;
  /** DANE code of the department under the cursor (null = none) */
  departamentoHover: string | null;
  /** DANE code of the department the user clicked (null = none) */
  departamentoSeleccionado: string | null;

  cargarDatos: () => Promise<void>;
  setHover: (codigo: string | null) => void;
  setSeleccionado: (codigo: string | null) => void;
}

export const useDatosDemograficos = create<DemografiaStore>((set, get) => ({
  meta: null,
  regiones: [],
  geoJSON: null,
  cargando: false,
  error: null,
  departamentoHover: null,
  departamentoSeleccionado: null,

  cargarDatos: async () => {
    // Idempotent: skip if already loading or data is present
    if (get().cargando || get().geoJSON) return;
    set({ cargando: true, error: null });

    // Step 1: always load GeoJSON (required — cannot continue without it)
    let geoJSON: FeatureCollection;
    try {
      const res = await fetch("/assets/colombia-departamentos.geojson");
      if (!res.ok) throw new Error(`GeoJSON HTTP ${res.status}`);
      geoJSON = await res.json();
      if (!geoJSON.features?.length) throw new Error("GeoJSON sin features");
    } catch (err) {
      set({
        error: `Error cargando mapa: ${err instanceof Error ? err.message : err}`,
        cargando: false,
      });
      return;
    }

    // Step 2: fetch API data; fall back to mock when unavailable
    try {
      // Backend returns: { success, data: { id, payload: { meta, regiones }, createdAt } }
      const apiRes = await apiClient.get<BackendEnvelope<DemografiaRecord>>("/demografia/latest");
      const { meta: rawMeta, regiones: rawRegiones } = apiRes.data.data.payload;

      // Normalise field names that differ between n8n output and frontend contracts
      const meta: MetaDemografica = {
        ...rawMeta,
        fechaActualizacion: rawMeta.fechaActualizacion ?? rawMeta.generadoEn,
      };
      const regiones: RegionDemografica[] = rawRegiones.map((r) => ({
        ...r,
        totalEmpleados: r.totalEmpleados ?? r.empleados,
      }));

      set({ geoJSON, meta, regiones, cargando: false });
    } catch {
      // API not reachable — generate deterministic mock data so the map still renders
      const mockRegiones = generarMockRegiones(geoJSON);
      set({
        geoJSON,
        regiones: mockRegiones,
        meta: {
          totalEmpleados: mockRegiones.reduce((s, r) => s + (r.totalEmpleados ?? 0), 0),
          totalDepartamentos: mockRegiones.length,
          fechaActualizacion: new Date().toISOString(),
          variacionMensual: 2.3,
        },
        cargando: false,
        // Don't surface an error — mock data is intentional dev fallback
        error: null,
      });
    }
  },

  setHover: (codigo) => set({ departamentoHover: codigo }),

  setSeleccionado: (codigo) =>
    set((state) => ({
      departamentoSeleccionado: state.departamentoSeleccionado === codigo ? null : codigo,
    })),
}));
