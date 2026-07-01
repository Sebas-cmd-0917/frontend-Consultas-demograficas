import CanvasWrapper from "@/components/mapa-3d/CanvasWrapper";
import PanelMeticas from "@/components/ui/PanelMeticas";

export default function Home() {
  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-100">

      {/* ── Top header bar ── */}
      <header className="shrink-0 h-13 border-b border-slate-800 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
          <span className="text-sm font-semibold tracking-wide text-slate-100">
            Análisis Demográfico
          </span>
          <span className="text-slate-600 text-sm">·</span>
          <span className="text-sm text-slate-400">Colombia</span>
        </div>
        <span className="text-xs text-slate-600 font-mono tracking-widest uppercase">
          Distribución Geográfica · Cobertura Poblacional
        </span>
      </header>

      {/* ── Main area ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Map */}
        <main className="flex-1 relative overflow-hidden">
          <CanvasWrapper />
        </main>

        {/* Sidebar panel */}
        <aside className="w-80 shrink-0 border-l border-slate-800 bg-slate-900 overflow-y-auto">
          <PanelMeticas />
        </aside>

      </div>
    </div>
  );
}
