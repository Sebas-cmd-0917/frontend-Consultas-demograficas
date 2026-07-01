import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../styles/globals.css";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "Análisis Demográfico · Colombia",
  description: "Visualización geográfica de distribución poblacional y cobertura laboral por departamento",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <body className={`${inter.className} h-full overflow-hidden`}>{children}</body>
    </html>
  );
}
