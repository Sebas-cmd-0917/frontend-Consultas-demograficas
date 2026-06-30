"use client";

import { useEffect } from "react";
import { useDatosDemograficos } from "./useDatosDemograficos";

/**
 * Triggers the one-shot data load (GeoJSON + API) on mount.
 * Returns reactive slices for loading/error UI without exposing the whole store.
 */
export function useFetchDemografia() {
  const cargarDatos = useDatosDemograficos((s) => s.cargarDatos);
  const cargando = useDatosDemograficos((s) => s.cargando);
  const error = useDatosDemograficos((s) => s.error);
  const geoJSON = useDatosDemograficos((s) => s.geoJSON);
  const regiones = useDatosDemograficos((s) => s.regiones);
  const meta = useDatosDemograficos((s) => s.meta);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  return { cargando, error, geoJSON, regiones, meta };
}
