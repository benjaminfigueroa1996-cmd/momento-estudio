"use client";

import { useEffect, useState } from "react";

// Ilustración: un teléfono que muestra los 3 pasos del invitado, en bucle.
const STEPS = ["Escanea el QR", "Toma o elige tu foto", "Envíala a la fiesta"];

export default function PhoneMock({ className = "" }: { className?: string }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep((s) => (s + 1) % 3), 2600);
    return () => clearInterval(t);
  }, []);
  return (
    <div className={`relative mx-auto aspect-[9/19] w-full max-w-[290px] rounded-[44px] border-[10px] border-[#141312] bg-marfil shadow-[0_40px_80px_rgba(0,0,0,0.25)] ${className}`}>
      <div className="absolute left-1/2 top-2 h-5 w-20 -translate-x-1/2 rounded-full bg-[#141312]" />
      <div className="flex h-full flex-col overflow-hidden rounded-[34px] px-5 pb-5 pt-12">
        <p className="text-[10px] text-piedra">Momento Estudio</p>
        <p className="mt-1 font-serif text-[24px] leading-tight">Francisca &amp; Benjamín</p>

        <div className="relative mt-5 flex-1">
          {/* Paso 1: QR */}
          <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-700 ease-suave ${step === 0 ? "opacity-100" : "pointer-events-none -translate-y-3 opacity-0"}`}>
            <div className="relative rounded-2xl bg-blanco p-4 shadow-md">
              <div className="grid grid-cols-7 gap-[3px]">
                {Array.from({ length: 49 }, (_, i) => <span key={i} className={`h-3 w-3 rounded-[2px] ${[0,1,2,4,5,6,7,13,14,16,20,21,22,24,27,28,34,35,36,38,41,42,43,44,46,48].includes(i) ? "bg-carbon" : "bg-transparent"}`} />)}
              </div>
              <span className="absolute inset-x-3 top-1/2 h-0.5 animate-pulse bg-champagne" />
            </div>
            <p className="mt-4 text-[13px] text-carbon/70">Sin descargar nada</p>
          </div>
          {/* Paso 2: foto */}
          <div className={`absolute inset-0 flex flex-col transition-all duration-700 ease-suave ${step === 1 ? "opacity-100" : "pointer-events-none translate-y-3 opacity-0"}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/ilustraciones/luz-1.jpg" alt="" className="aspect-[4/5] w-full rounded-xl object-cover" />
            <div className="mt-3 space-y-2">
              <div className="rounded-xl border border-carbon bg-blanco px-3 py-2 text-[12px]">✓ Pantalla del evento</div>
              <div className="rounded-xl border border-carbon bg-blanco px-3 py-2 text-[12px]">✓ Álbum compartido</div>
            </div>
          </div>
          {/* Paso 3: enviado */}
          <div className={`absolute inset-0 flex flex-col items-center justify-center text-center transition-all duration-700 ease-suave ${step === 2 ? "opacity-100" : "pointer-events-none translate-y-3 opacity-0"}`}>
            <span className="flex h-14 w-14 items-center justify-center rounded-full border border-champagne text-champagne">
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
            </span>
            <p className="mt-4 font-serif text-[22px]">¡Recibimos tu foto!</p>
            <p className="mt-1 text-[12px] text-carbon/70">Mírala en la pantalla de la fiesta</p>
          </div>
        </div>

        <div className="mt-4 flex justify-center gap-1.5">
          {STEPS.map((s, i) => <span key={s} className={`h-1.5 rounded-full transition-all duration-500 ${i === step ? "w-6 bg-carbon" : "w-1.5 bg-carbon/25"}`} />)}
        </div>
        <p className="mt-2 text-center text-[13px] font-medium">{STEPS[step]}</p>
      </div>
    </div>
  );
}
