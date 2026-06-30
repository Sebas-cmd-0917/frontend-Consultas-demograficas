import CanvasWrapper from "@/components/mapa-3d/CanvasWrapper";
import PanelMeticas from "@/components/ui/PanelMeticas";

export default function Home() {
  return (
    <main className="flex h-screen w-screen overflow-hidden bg-gray-900 text-white">
      {/* Contenedor del Mapa 3D */}
      <div className="flex-1 relative">
        <CanvasWrapper />
      </div>

      {/* Panel Lateral de Métricas */}
      <aside className="w-96 bg-gray-800 p-6 shadow-2xl z-10 overflow-y-auto">
        <PanelMeticas />
      </aside>
    </main>
  );
}
