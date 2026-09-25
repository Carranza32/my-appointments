import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const ROOT_DOMAIN = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000").replace(/['"]/g, "");

const SYSTEM_DOMAINS = [
  `www.${ROOT_DOMAIN}`,
  ROOT_DOMAIN,
  "localhost:3000",
  "localhost",
];

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);

  if (
    response.status === 301 ||
    response.status === 302 ||
    response.status === 307 ||
    response.status === 308
  ) {
    return response;
  }

  const hostname = request.headers.get("host") || "";

  // Si es el dominio principal → dejar pasar (landing, login, dashboard, admin)
  if (SYSTEM_DOMAINS.some((d) => hostname === d || hostname.startsWith(d))) {
    return response;
  }

  // Extraer subdominio: "clinica-garcia.miapp.com" → "clinica-garcia"
  // En localhost: "clinica-garcia.localhost:3000" → "clinica-garcia"
  let subdomain: string | null = null;

  if (hostname.endsWith(`.${ROOT_DOMAIN}`)) {
    subdomain = hostname.replace(`.${ROOT_DOMAIN}`, "");
  } else if (hostname.includes(".localhost")) {
    subdomain = hostname.split(".localhost")[0];
  } else {
    const parts = hostname.split(".");
    if (parts.length > 1) {
      subdomain = parts[0];
    }
  }

  if (!subdomain) {
    return response;
  }

  // Rewrite: clinica-garcia.miapp.com/dr-carlos
  //       → /_tenant/clinica-garcia/dr-carlos (ruta interna)
  const path = request.nextUrl.pathname;
  const url = request.nextUrl.clone();
  url.pathname = `/_tenant/${subdomain}${path}`;

  return NextResponse.rewrite(url, { headers: response.headers });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
