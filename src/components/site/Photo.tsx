"use client";

import { useState } from "react";

/**
 * Foto del sitio. Busca /demo/NN.jpg; si todavía no existe, muestra un fondo cálido
 * en vez de una imagen rota. Para cambiar las fotos basta reemplazar los archivos en public/demo.
 */
export default function Photo({ n, alt, className = "", priority = false }: { n: number; alt: string; className?: string; priority?: boolean }) {
  const [ok, setOk] = useState(true);
  const src = `/demo/${String(n).padStart(2, "0")}.jpg`;
  return (
    <div className={`relative overflow-hidden bg-[linear-gradient(135deg,#E8DFD3,#d8cbb8)] ${className}`}>
      {ok && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          onError={() => setOk(false)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
    </div>
  );
}
