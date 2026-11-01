// Organización de objetos en R2: un original por archivo, versiones derivadas al lado.
export function keysFor(eventId: string, mediaId: string, ext: string) {
  const base = `events/${eventId}/media/${mediaId}`;
  return {
    original: `${base}/original.${ext}`,
    display: `${base}/display.jpg`,
    thumb: `${base}/thumb.jpg`,
  };
}

export function extFor(type: string) {
  return ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/heic": "heic", "image/heif": "heic" } as Record<string, string>)[type] ?? "bin";
}
