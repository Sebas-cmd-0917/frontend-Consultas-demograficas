// Property extraction helpers for Colombian department GeoJSON features

const DANE_KEYS = [
  "DPTO_CCDGO",
  "CODIGO_DPTO",
  "cod_depto",
  "codigo_dane",
  "CODIGO",
  "id",
];

const NOMBRE_KEYS = [
  "NOMBRE_DPT",
  "DPTO_CNMBR",
  "NOM_DEPTO",
  "nombre",
  "NOMBRE",
  "name",
];

export function extractCodigoDane(
  props: Record<string, unknown> | null | undefined
): string | null {
  if (!props) return null;
  for (const key of DANE_KEYS) {
    if (props[key] != null) return String(props[key]).padStart(2, "0");
  }
  return null;
}

export function extractNombre(
  props: Record<string, unknown> | null | undefined
): string {
  if (!props) return "Desconocido";
  for (const key of NOMBRE_KEYS) {
    if (props[key]) return String(props[key]);
  }
  return "Departamento";
}
