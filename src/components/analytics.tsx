"use client";

import { Analytics, type BeforeSend } from "@vercel/analytics/next";

// Páginas em que só o fato de visitar já diz algo íntimo sobre a pessoa: não entram nas métricas.
const PRIVATE = ["/painel/dossie", "/dossie", "/advogado/dossies", "/privacidade", "/direitos"];

const beforeSend: BeforeSend = (event) => {
  const url = new URL(event.url, "http://x");
  if (PRIVATE.some((p) => url.pathname === p || url.pathname.startsWith(p + "/"))) return null;
  url.search = ""; // ids e códigos na URL também não vão
  return { ...event, url: event.url.startsWith("http") ? url.toString() : url.pathname };
};

export function SiteAnalytics() {
  return <Analytics beforeSend={beforeSend} />;
}
