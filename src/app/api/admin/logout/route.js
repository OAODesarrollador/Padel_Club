import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set("staff_token", "", { httpOnly: true, path: "/", expires: new Date(0) });
  return response;
}

export async function GET(request) {
  const response = NextResponse.redirect(new URL("/admin/login", request.url));
  response.cookies.set("staff_token", "", { httpOnly: true, path: "/", expires: new Date(0) });
  return response;
}
