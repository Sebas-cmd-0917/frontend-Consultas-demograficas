import CanvasWrapper from "@/components/mapa-3d/CanvasWrapper";
import PanelMeticas from "@/components/ui/PanelMeticas";

export default function Home() {
  return (
    <div className="cl-bg flex flex-col min-h-screen lg:h-screen text-white">

      {/* ── Top header bar ── */}
      <header className="shrink-0 border-b border-white/10 bg-cl-surface/60 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 sm:px-6 h-14">
          {/* Brand */}
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-cl-teal shadow-[0_0_12px_2px_rgba(44,224,182,0.6)]" />
            <span className="text-base font-extrabold tracking-tight text-white lowercase">
              campuslands
            </span>
            <span className="hidden sm:inline text-white/30">·</span>
            <span className="hidden sm:inline text-sm text-cl-muted truncate">
              Análisis Demográfico
            </span>
          </div>

          {/* Tagline (desktop only) */}
          <span className="hidden lg:inline text-[11px] text-cl-muted/70 font-medium tracking-widest uppercase">
            Distribución del talento · Colombia
          </span>
        </div>
      </header>

      {/* ── Main area ── */}
      <div className="flex flex-1 flex-col lg:flex-row lg:overflow-hidden">

        {/* Map */}
        <main className="relative h-[58vh] min-h-[360px] lg:h-auto lg:flex-1 overflow-hidden">
          <CanvasWrapper />
        </main>

        {/* Sidebar panel */}
        <aside
          className="w-full lg:w-80 xl:w-96 shrink-0 border-t lg:border-t-0 lg:border-l
                     border-white/10 bg-cl-surface/40 lg:overflow-y-auto"
        >
          <PanelMeticas />
        </aside>

      </div>
    </div>
  );
}
