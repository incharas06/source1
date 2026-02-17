import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const LOCALES = ["en", "kn", "hi"] as const;

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // allow next internals + public assets
    if (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/favicon.ico") ||
        pathname.startsWith("/assets")
    ) {
        return NextResponse.next();
    }

    // If path already has locale like /en/..., do nothing
    const first = pathname.split("/")[1];
    if (LOCALES.includes(first as any)) {
        return NextResponse.next();
    }

    // Redirect non-locale paths to /en
    const url = req.nextUrl.clone();
    url.pathname = `/en${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
}

export const config = {
    matcher: ["/((?!api).*)"],
};
