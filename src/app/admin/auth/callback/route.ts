import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseUser } from "@/lib/admin";

// Vuelta desde los enlaces de correo de Supabase. Si viene de "recuperar contraseña", lleva a crear una nueva.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const jar = await cookies();
  const resetting = jar.get("me_reset")?.value === "1";
  if (!code) return NextResponse.redirect(new URL("/admin/ingresar", url.origin));
  const { error } = await (await supabaseUser()).auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/admin/ingresar?e=enlace", url.origin));
  if (resetting) {
    jar.delete("me_reset");
    return NextResponse.redirect(new URL("/admin/restablecer", url.origin));
  }
  return NextResponse.redirect(new URL("/admin", url.origin));
}
