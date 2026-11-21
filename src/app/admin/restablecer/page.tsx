"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 10) return setError("Usa al menos 10 caracteres.");
    if (password !== confirm) return setError("Las contraseñas no coinciden.");
    setBusy(true);
    const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { error } = await sb.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      setError(error.message.includes("session") ? "El enlace venció o se abrió en otro navegador. Pide uno nuevo desde «¿Olvidaste tu contraseña?»." : "No pudimos guardar la contraseña. Intenta con otra distinta.");
      return;
    }
    location.href = "/admin";
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6">
      <p className="text-[13px] text-piedra">Momento Estudio</p>
      <h1 className="mt-2 text-[40px]">Contraseña nueva</h1>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <label className="block"><span className="label">Contraseña nueva</span>
          <input type="password" required autoComplete="new-password" className="field" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        <label className="block"><span className="label">Repite la contraseña</span>
          <input type="password" required autoComplete="new-password" className="field" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></label>
        <p className="text-[13px] text-piedra">Mínimo 10 caracteres. Guárdala en el gestor de contraseñas de tu navegador.</p>
        {error && <p className="text-[14px] text-[#8a3b2e]" role="alert">{error}</p>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? "Guardando…" : "Guardar y entrar"}</button>
      </form>
    </main>
  );
}
