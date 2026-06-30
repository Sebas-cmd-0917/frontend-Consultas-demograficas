import { useDatosDemograficos } from "./useDatosDemograficos";

/**
 * Thin hook exposing only the interaction actions.
 * Components that only dispatch events (no reads) import this
 * to avoid subscribing to unrelated store slices.
 */
export function useInteraccionMapa() {
  const setHover = useDatosDemograficos((s) => s.setHover);
  const setSeleccionado = useDatosDemograficos((s) => s.setSeleccionado);
  return { setHover, setSeleccionado };
}
