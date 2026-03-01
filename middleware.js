import { NextResponse } from "next/server";
import { verifyStaffToken } from "@/lib/security/jwt";
import { shouldUseSecureCookies } from "@/lib/security/auth";

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
