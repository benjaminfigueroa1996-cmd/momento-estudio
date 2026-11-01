"use client";

export type Prepared = {
  file: File;
  type: string;
  display: Blob | null; // 2048 px, JPEG
  thumb: Blob | null;   // 480 px, JPEG
  width?: number;
  height?: number;
  preview: string;      // URL local para la vista previa
};

async function resize(bitmap: ImageBitmap, max: number, quality: number) {
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale), h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, w, h);
  return new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", quality));
}

/** Genera versiones livianas en el teléfono para que la pantalla y el álbum carguen rápido. */
export async function prepare(file: File): Promise<Prepared> {
  const type = file.type || (file.name.toLowerCase().endsWith(".heic") ? "image/heic" : "");
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    const [display, thumb] = await Promise.all([resize(bmp, 2048, 0.86), resize(bmp, 480, 0.8)]);
    const out = { file, type, display, thumb, width: bmp.width, height: bmp.height, preview: URL.createObjectURL(thumb ?? file) };
    bmp.close();
    return out;
  } catch {
    // Formato que el navegador no puede dibujar (p. ej. HEIC fuera de Safari): se sube solo el original
    return { file, type, display: null, thumb: null, preview: URL.createObjectURL(file) };
  }
}

export async function sha256(file: Blob) {
  const buf = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** PUT a una URL firmada con progreso y reintentos con espera creciente. */
export function put(url: string, body: Blob, type: string, onProgress?: (p: number) => void, tries = 4): Promise<void> {
  return new Promise((resolve, reject) => {
    const attempt = (n: number) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", url);
      xhr.setRequestHeader("Content-Type", type);
      xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(e.loaded / e.total);
      const retry = () => (n < tries ? setTimeout(() => attempt(n + 1), 800 * 2 ** n) : reject(new Error("Sin conexión estable. Reintenta.")));
      xhr.onload = () => (xhr.status < 300 ? resolve() : retry());
      xhr.onerror = retry;
      xhr.send(body);
    };
    attempt(0);
  });
}

export async function postJSON<T>(url: string, data: unknown): Promise<T> {
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error ?? "Algo falló. Intenta de nuevo.");
  return j as T;
}
