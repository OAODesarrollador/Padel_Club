import { NextResponse } from "next/server";
import { shouldUseSecureCookies } from "@/lib/security/auth";

export async function POST(request) {
  const response = NextResponse.json({ ok: true });
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

export async function GET(request) {
  const response = NextResponse.redirect(new URL("/admin/login", request.url));
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
