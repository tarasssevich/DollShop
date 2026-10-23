import { adminProxy } from "./proxy";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/admin")) {
    return adminProxy(req);
  }
}

export const config = {
  matcher: ["/admin/:path*"],
};
