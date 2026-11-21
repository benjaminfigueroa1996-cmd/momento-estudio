"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

const client = () => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function AdminLogin() {
  const [mode, setMode] = useState<"login" | "olvide" | "enviado">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await client().auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setError("Correo o contraseña incorrectos.");
      setBusy(false);
      return;
    }
    location.href = "/admin";
  }

  async function recover(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    // Marca este navegador: al volver desde el correo, el acceso lleva a crear la contraseña nueva
    document.cookie = "me_reset=1; path=/; max-age=3600; samesite=lax; secure";
    const { error } = await client().auth.resetPasswordForEmail(email.trim(), { redirectTo: `${location.origin}/admin/auth/callback` });
    setBusy(false);
    if (error) {
      setError(error.status === 429 ? "Ya pediste varios correos seguidos. Espera unos minutos y vuelve a intentar." : "No pudimos enviar el correo. Revisa la dirección.");
      return;
    }
    setMode("enviado");
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6">
      <p className="text-[13px] text-piedra">Momento Estudio</p>
      <h1 className="mt-2 text-[40px]">{mode === "login" ? "Administración" : "Recuperar contraseña"}</h1>

      {mode === "login" && (
        <form onSubmit={login} className="mt-8 space-y-4">
          <label className="block"><span className="label">Correo</span>
            <input type="email" required autoComplete="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <label className="block"><span className="label">Contraseña</span>
            <input type="password" required autoComplete="current-password" className="field" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
          {error && <p className="text-[14px] text-[#8a3b2e]" role="alert">{error}</p>}
          <button className="btn-primary w-full" disabled={busy}>{busy ? "Entrando…" : "Entrar"}</button>
          <button type="button" className="block w-full pt-2 text-center text-[14px] text-carbon/70 underline underline-offset-4" onClick={() => { setError(null); setMode("olvide"); }}>
            ¿Olvidaste tu contraseña?
          </button>
        </form>
      )}

      {mode === "olvide" && (
        <form onSubmit={recover} className="mt-8 space-y-4">
          <p className="text-[15px] text-carbon/75">Escribe tu correo y te enviaremos un enlace para crear una contraseña nueva.</p>
          <label className="block"><span className="label">Correo</span>
            <input type="email" required autoComplete="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          {error && <p className="text-[14px] text-[#8a3b2e]" role="alert">{error}</p>}
          <button className="btn-primary w-full" disabled={busy}>{busy ? "Enviando…" : "Enviar enlace"}</button>
          <button type="button" className="block w-full pt-2 text-center text-[14px] text-carbon/70 underline underline-offset-4" onClick={() => setMode("login")}>Volver</button>
        </form>
      )}

      {mode === "enviado" && (
        <div className="mt-8 space-y-4 text-[15px] leading-relaxed">
          <p>Te enviamos un enlace a <strong>{email}</strong>. Si no aparece, revisa Spam o Promociones.</p>
          <p className="rounded-xl bg-marfil px-4 py-3 text-carbon/80">Ábrelo <strong>en este mismo navegador</strong>. Si se abre en otro, copia el enlace del correo (clic derecho &gt; Copiar dirección del enlace) y pégalo aquí.</p>
          <button className="btn-quiet w-full" onClick={() => setMode("login")}>Volver a ingresar</button>
        </div>
      )}
    </main>
  );
}
