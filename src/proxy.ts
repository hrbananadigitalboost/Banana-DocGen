import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";

// Next.js 16 renamed `middleware` -> `proxy`. This only handles the
// redirect-to-login UX; every server action/route handler must still do its
// own auth+RBAC check (proxy matchers can silently miss routes on refactors).
// "/print" sengaja publik: hanya dikunjungi Puppeteer internal (lihat
// renderSuratPdf.ts), dilindungi oleh token acak sekali-pakai berumur pendek
// di renderCache.ts, bukan oleh session cookie.
const PUBLIC_PATH_PREFIXES = ["/login", "/verify", "/api/auth", "/print"];

export default auth((req) => {
  const { nextUrl } = req;
  const isPublic = PUBLIC_PATH_PREFIXES.some((p) => nextUrl.pathname.startsWith(p));

  if (!req.auth && !isPublic) {
    // Rute API dapat 401 JSON, bukan redirect ke halaman login HTML -
    // pemanggil non-browser (fetch, dsb) butuh status code yang jelas.
    if (nextUrl.pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|assets).*)"],
};
