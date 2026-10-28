import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// Fontes auto-hospedadas (sem requisição ao Google: melhor para privacidade e para builds offline)
const display = localFont({ src: "./fonts/anton-latin-400.woff2", weight: "400", variable: "--font-display", display: "swap" });
const sans = localFont({ src: "./fonts/archivo-latin-wght.woff2", weight: "100 900", variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Recomeço — Seu voto é seu. Seu trabalho também.", template: "%s · Recomeço" },
  description:
    "Conectamos trabalhadores perseguidos por causa do voto a empresas que contratam sem discriminação. Gratuito, sigiloso e com orientação sobre seus direitos.",
  openGraph: { locale: "pt_BR", type: "website", siteName: "Recomeço" },
};

export const viewport: Viewport = {
  themeColor: "#F2E8D5",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${sans.variable}`}>
      <body>
        <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:bg-accent focus:p-3 focus:font-black">
          Pular para o conteúdo
        </a>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
