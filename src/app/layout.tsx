import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "../styles/globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Campuslands · Análisis Demográfico",
  description: "Distribución geográfica del talento Campuslands por departamento en Colombia",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${poppins.variable} h-full`}>
      {/* Fixed viewport on desktop; the page scrolls on mobile */}
      <body className="min-h-full lg:h-full lg:overflow-hidden">{children}</body>
    </html>
  );
}
