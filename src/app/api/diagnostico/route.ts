import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export const dynamic = "force-dynamic";

// Diagnóstico temporal: prueba las claves de R2 sin mostrarlas. Borrar después.
export async function GET() {
  const id = (process.env.R2_ACCOUNT_ID ?? "").trim();
  const key = (process.env.R2_ACCESS_KEY_ID ?? "").trim();
  const secret = (process.env.R2_SECRET_ACCESS_KEY ?? "").trim();
  const out: Record<string, unknown> = {
    largoAccountId: id.length,
    largoAccessKey: key.length,
    largoSecret: secret.length,
    bucket: process.env.R2_BUCKET,
  };
  try {
    const s3 = new S3Client({
      region: "auto",
      endpoint: `https://${id}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: key, secretAccessKey: secret },
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    });
    await s3.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET, Key: "diagnostico/prueba.txt", Body: "ok", ContentType: "text/plain" }));
    out.escritura = "ok";
  } catch (e) {
    const err = e as { name?: string; message?: string };
    out.escritura = `${err.name}: ${err.message}`;
  }
  return Response.json(out);
}
