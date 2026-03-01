import { NextResponse } from "next/server";
import { verifyStaffToken } from "./src/lib/security/jwt";

function shouldUseSecureCookies(request) {
  const forwarded = request?.headers?.get?.("x-forwarded-proto");
  if (forwarded) return forwarded.split(",")[0].trim() === "https";
  try {
    return new URL(request?.url || "").protocol === "https:";
  } catch {
    return false;
  }
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/admin")) return NextResponse.next();
  if (pathname.startsWith("/admin/login")) return NextResponse.next();

  const token = request.cookies.get("staff_token")?.value;
  if (!token) {
    const url = new URL("/admin/login", request.url);
    return NextResponse.redirect(url);
  }
  try {
    await verifyStaffToken(token);
    return NextResponse.next();
  } catch {
    const url = new URL("/admin/login", request.url);
    const response = NextResponse.redirect(url);
    const secureCookie = shouldUseSecureCookies(request);
    response.cookies.set("staff_token", "", {
      httpOnly: true,
      secure: secureCookie,
      sameSite: "lax",
      path: "/",
      expires: new Date(0)
    });
    return response;
  }
}

export const config = {
  matcher: ["/admin/:path*"]
};
