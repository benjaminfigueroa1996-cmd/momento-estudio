"use client";

import { useState } from "react";
import { postJSON } from "@/lib/client/image";

export default function HostLogin({ slug, name }: { slug: string; name: string }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await postJSON(`/api/anfitriones/${slug}/ingresar`, { code });
      location.reload();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6">
      <p className="text-[13px] text-piedra">Archivo privado</p>
      <h1 className="mt-2 text-[40px] leading-tight">{name}</h1>
      <form onSubmit={submit} className="mt-10">
        <label htmlFor="code" className="label">Código de acceso</label>
        <input id="code" className="field font-medium uppercase tracking-[0.12em]" autoComplete="one-time-code" autoCapitalize="characters"
          placeholder="XXXX-XXXX-XXXX" value={code} onChange={(e) => setCode(e.target.value)} />
        {error && <p className="mt-3 text-[14px] text-[#8a3b2e]" role="alert">{error}</p>}
        <button className="btn-primary mt-6 w-full" disabled={busy || code.length < 8}>{busy ? "Verificando…" : "Entrar"}</button>
      </form>
      <p className="mt-8 text-[13px] leading-relaxed text-piedra">El código te lo entregó Momento Estudio. Si lo perdiste, pídenos uno nuevo; el anterior dejará de funcionar.</p>
    </main>
  );
}
