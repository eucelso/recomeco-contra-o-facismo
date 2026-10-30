import type { NextConfig } from "next";

const dev = process.env.NODE_ENV !== "production";

// Política de conteúdo: só o próprio site e o Supabase (API, login e arquivos). 'unsafe-inline' em scripts/estilos
// é exigência do Next sem nonce; mesmo assim a política bloqueia scripts e conexões de qualquer outro domínio.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "media-src 'self'",
  `connect-src 'self' https://*.supabase.co wss://*.supabase.co${dev ? " ws://localhost:* http://localhost:*" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
].join("; ");

const noStore = { key: "Cache-Control", value: "no-store, max-age=0" };

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
      // Páginas com o dossiê ou dados pessoais: nada de cache em navegador, proxy ou CDN.
      { source: "/painel/dossie/:path*", headers: [noStore] },
      { source: "/dossie/:path*", headers: [noStore] },
      { source: "/advogado/dossies/:path*", headers: [noStore] },
      { source: "/privacidade/:path*", headers: [noStore] },
    ];
  },
};

export default nextConfig;
