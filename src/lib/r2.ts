import "server-only";
import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "./env";

let s3: S3Client | null = null;
function client() {
  if (!s3) {
    s3 = new S3Client({
      region: "auto",
      endpoint: `https://${env.r2AccountId()}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: env.r2Key(), secretAccessKey: env.r2Secret() },
    });
  }
  return s3;
}

// Subida directa del navegador a R2: el archivo no pasa por el servidor.
export function signPut(key: string, contentType: string, maxBytes: number) {
  return getSignedUrl(
    client(),
    new PutObjectCommand({ Bucket: env.r2Bucket(), Key: key, ContentType: contentType }),
    { expiresIn: 60 * 15, signableHeaders: new Set(["content-type"]) },
  ).then((url) => ({ url, maxBytes }));
}

export function signGet(key: string, opts: { download?: string; seconds?: number } = {}) {
  return getSignedUrl(
    client(),
    new GetObjectCommand({
      Bucket: env.r2Bucket(),
      Key: key,
      ResponseContentDisposition: opts.download ? `attachment; filename="${opts.download}"` : undefined,
    }),
    { expiresIn: opts.seconds ?? 60 * 30 },
  );
}

export async function head(key: string) {
  try {
    const r = await client().send(new HeadObjectCommand({ Bucket: env.r2Bucket(), Key: key }));
    return { bytes: r.ContentLength ?? 0, type: r.ContentType ?? "" };
  } catch {
    return null;
  }
}

export async function firstBytes(key: string, n = 16): Promise<Uint8Array | null> {
  try {
    const r = await client().send(new GetObjectCommand({ Bucket: env.r2Bucket(), Key: key, Range: `bytes=0-${n - 1}` }));
    return new Uint8Array(await r.Body!.transformToByteArray());
  } catch {
    return null;
  }
}

export async function stream(key: string) {
  const r = await client().send(new GetObjectCommand({ Bucket: env.r2Bucket(), Key: key }));
  return r.Body!.transformToWebStream();
}

// Validación real del contenido (no confiar en la extensión ni en el tipo declarado)
export function sniffImage(b: Uint8Array): "image/jpeg" | "image/png" | "image/webp" | "image/heic" | null {
  if (b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  const ascii = (s: number, e: number) => String.fromCharCode(...b.slice(s, e));
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  if (ascii(4, 8) === "ftyp" && ["heic", "heix", "mif1", "msf1", "hevc"].includes(ascii(8, 12))) return "image/heic";
  return null;
}
