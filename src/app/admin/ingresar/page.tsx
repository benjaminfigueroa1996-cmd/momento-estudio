"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setError("Correo o contraseña incorrectos.");
      setBusy(false);
      return;
    }
    location.href = "/admin";
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6">
      <p className="text-[13px] text-piedra">Momento Estudio</p>
      <h1 className="mt-2 text-[40px]">Administración</h1>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <label className="block"><span className="label">Correo</span>
          <input type="email" required autoComplete="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label className="block"><span className="label">Contraseña</span>
          <input type="password" required autoComplete="current-password" className="field" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        {error && <p className="text-[14px] text-[#8a3b2e]" role="alert">{error}</p>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? "Entrando…" : "Entrar"}</button>
      </form>
    </main>
  );
}
