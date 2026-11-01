import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Instrument_Sans } from "next/font/google";
import "./globals.css";

// Tipografías con licencia SIL Open Font License (uso comercial permitido)
const serif = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-serif", display: "swap" });
const sans = Instrument_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Momento Estudio", template: "%s · Momento Estudio" },
  description: "Fotografías de invitados y del fotógrafo en un solo lugar: pantalla en vivo durante tu evento y un álbum privado para siempre.",
};

export const viewport: Viewport = { themeColor: "#F7F3ED", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CL" className={`${serif.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
