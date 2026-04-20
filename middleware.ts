import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * ルートは `app/page.tsx` の `/` のみ。`/map` 等は既定で 404 になるため `/` へ寄せる。
 * `/api/*`・`/_next/*`・拡張子付き（`favicon.ico` 等）はそのまま通す。
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/") return NextResponse.next();
  if (pathname.startsWith("/api")) return NextResponse.next();
  if (pathname.startsWith("/_next")) return NextResponse.next();
  if (/\.[a-zA-Z0-9]{1,8}$/.test(pathname)) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/:path*"],
};
