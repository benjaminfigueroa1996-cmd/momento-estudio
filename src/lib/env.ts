import "server-only";

function req(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Falta la variable de entorno ${name}. Revisa .env.example.`);
  return v;
}

export const env = {
  supabaseUrl: () => req("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnon: () => req("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseService: () => req("SUPABASE_SERVICE_ROLE_KEY"),
  r2AccountId: () => req("R2_ACCOUNT_ID"),
  r2Key: () => req("R2_ACCESS_KEY_ID"),
  r2Secret: () => req("R2_SECRET_ACCESS_KEY"),
  r2Bucket: () => req("R2_BUCKET"),
  sessionSecret: () => new TextEncoder().encode(req("SESSION_SECRET")),
  ipSalt: () => req("IP_HASH_SALT"),
  siteUrl: () => process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
};
