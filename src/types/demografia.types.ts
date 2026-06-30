// ─── Payload shapes as produced by the n8n pipeline ─────────────────────────

export interface MunicipioData {
  municipio: string;
  empleados: number;
  porcentaje: number;
}

export interface RegionDemografica {
  codigoDane: string | null;
  departamento?: string;
  nombre?: string;
  intensidad: number;       // [0, 1] — normalised heat-map weight
  empleados?: number;       // field name used by n8n
  totalEmpleados?: number;  // normalised alias used internally / in mock data
  porcentaje?: number;
  variacion?: number;
  municipios?: MunicipioData[];
  [key: string]: unknown;
}

export interface MetaDemografica {
  totalEmpleados: number;
  totalDepartamentos: number;
  // n8n sends "generadoEn"; the store normalises it to fechaActualizacion
  fechaActualizacion?: string;
  generadoEn?: string;
  fuente?: string;
  registrosInvalidos?: number;
  variacionMensual?: number;
}

export interface RespuestaDemografia {
  meta: MetaDemografica;
  regiones: RegionDemografica[];
}

// ─── Backend API envelope ────────────────────────────────────────────────────

export interface BackendEnvelope<T> {
  success: boolean;
  data: T;
}

export interface DemografiaRecord {
  id: string;
  payload: RespuestaDemografia;
  createdAt: string;
}
