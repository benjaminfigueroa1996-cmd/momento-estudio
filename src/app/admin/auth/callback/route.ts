import { NextResponse } from "next/server";
import { supabaseUser } from "@/lib/admin";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  if (code) await (await supabaseUser()).auth.exchangeCodeForSession(code);
  return NextResponse.redirect(new URL("/admin", url.origin));
}
