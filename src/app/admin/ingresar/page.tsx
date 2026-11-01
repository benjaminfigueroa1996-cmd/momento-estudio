"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: `${location.origin}/admin/auth/callback`, shouldCreateUser: false } });
    if (error) setError("No pudimos enviar el enlace. Revisa el correo.");
    else setSent(true);
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6">
      <p className="text-[13px] text-piedra">Momento Estudio</p>
      <h1 className="mt-2 text-[40px]">Administración</h1>
      {sent ? (
        <p className="mt-8 text-[16px]">Te enviamos un enlace de acceso a {email}. Ábrelo desde este mismo navegador.</p>
      ) : (
        <form onSubmit={submit} className="mt-8">
          <label className="label" htmlFor="email">Correo</label>
          <input id="email" type="email" required className="field" value={email} onChange={(e) => setEmail(e.target.value)} />
          {error && <p className="mt-3 text-[14px] text-[#8a3b2e]">{error}</p>}
          <button className="btn-primary mt-6 w-full">Enviar enlace de acceso</button>
        </form>
      )}
    </main>
  );
}
