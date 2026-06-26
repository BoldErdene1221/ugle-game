import { NextResponse } from "next/server";
import { createAdminToken, setAdminCookie } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const password = String(body?.password ?? "");

  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Нууц үг буруу байна." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  setAdminCookie(response, createAdminToken());
  return response;
}
