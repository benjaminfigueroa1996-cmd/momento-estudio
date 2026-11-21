"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * Foto del sitio desde public/fotos/NN.jpg, optimizada automáticamente (AVIF/WebP, tamaño según pantalla,
 * carga diferida fuera de pantalla). Ver docs/fotos-del-sitio.md para qué foto va en cada número.
 */
export default function Photo({
  n, alt, className = "", priority = false, sizes = "(max-width: 768px) 100vw, 50vw", position = "center", optional = false,
}: { n: number; alt: string; className?: string; priority?: boolean; sizes?: string; position?: string; optional?: boolean }) {
  const [ok, setOk] = useState(true);
  // "optional": si la foto aún no existe, no se muestra nada (sin bloques vacíos)
  if (optional && !ok) return null;
  return (
    <div className={`${/\b(absolute|fixed)\b/.test(className) ? "" : "relative"} overflow-hidden bg-[linear-gradient(135deg,#E8DFD3,#d4c5b0)] ${className}`}>
      {ok && (
        <Image
          src={`/fotos/${String(n).padStart(2, "0")}.jpg`}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          quality={82}
          onError={() => setOk(false)}
          className="object-cover"
          style={{ objectPosition: position }}
        />
      )}
    </div>
  );
}
