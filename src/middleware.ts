import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Mantiene viva la sesión de Supabase en el panel de administración
export async function middleware(req: NextRequest) {
  const res = NextResponse.next({ request: req });
  const sb = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (list) => list.forEach(({ name, value, options }) => res.cookies.set(name, value, options)),
    },
  });
  await sb.auth.getUser();
  return res;
}

export const config = { matcher: ["/admin/:path*", "/api/admin/:path*"] };
