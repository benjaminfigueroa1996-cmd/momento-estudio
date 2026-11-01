import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "./env";

export async function supabaseUser() {
  const store = await cookies();
  return createServerClient(env.supabaseUrl(), env.supabaseAnon(), {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => list.forEach(({ name, value, options }) => store.set(name, value, options)),
    },
  });
}

// Exige un administrador autenticado (verificado contra la tabla admins con RLS)
export async function requireAdmin() {
  const sb = await supabaseUser();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/admin/ingresar");
  const { data } = await sb.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!data) redirect("/admin/ingresar?e=sin-permiso");
  return user;
}

export async function isAdminRequest() {
  const sb = await supabaseUser();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await sb.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  return data ? user : null;
}
