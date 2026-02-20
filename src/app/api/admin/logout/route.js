import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set("staff_token", "", { httpOnly: true, path: "/", expires: new Date(0) });
  return response;
}
