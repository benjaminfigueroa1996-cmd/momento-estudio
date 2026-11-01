# Momento Estudio

Plataforma para matrimonios y eventos: QR de invitados, pantalla en vivo, álbum compartido, carga del fotógrafo, estación iPad con Apple Pencil y archivo privado de los anfitriones.

## Estado

Versión 0.1. El código está completo para todos los flujos del brief, pero **todavía no se ha instalado, compilado ni probado contra servicios reales** (se escribió en un entorno sin acceso a internet). La sintaxis de los 78 archivos TypeScript está verificada; falta `npm install`, `npm run build`, aplicar las migraciones y ejecutar `docs/pruebas.md`. Ver `docs/pendientes.md`.

## Estructura

| Ruta | Qué es |
| --- | --- |
| `src/app/(sitio)` | Sitio comercial: inicio, cómo funciona, servicios, preguntas, contacto, privacidad, términos |
| `src/app/e/[slug]` | Página del QR para invitados y álbum compartido |
| `src/app/live/[slug]` | Pantalla en vivo (1920 × 1080, se adapta) |
| `src/app/anfitriones/[slug]` | Acceso privado y archivo completo de los anfitriones |
| `src/app/fotografo/[token]` | Carga por lotes del fotógrafo |
| `src/app/admin` | Panel de administración |
| `src/app/api` | API del servidor (todas las validaciones de acceso viven aquí) |
| `src/lib/media.ts` | Núcleo: cargas, destinos, moderación |
| `supabase/migrations` | Esquema, vistas y Row Level Security |
| `supabase/tests` | Pruebas pgTAP de las reglas pantalla/álbum y aislamiento |
| `ios/` | App nativa del iPad (SwiftUI + PencilKit) |
| `scripts/carga.k6.js` | Prueba de carga con 400 invitados simulados |

## Puesta en marcha

1. **Requisitos**: Node.js 20 o superior, [Supabase CLI](https://supabase.com/docs/guides/cli), una cuenta de Cloudflare y, para el iPad, un Mac con Xcode 16 o superior.
2. `npm install`
3. **Supabase**: crea el proyecto, luego `supabase link --project-ref <ref>` y `npm run db:push`. Ejecuta `npm run db:test` para las pruebas de reglas.
4. **Primer administrador**: en Supabase > Authentication crea tu usuario con tu correo; luego en el editor SQL: `insert into admins(user_id) select id from auth.users where email = 'tu@correo.cl';`
5. **Cloudflare R2**: crea un bucket privado `momento-estudio` y un token de API con permiso de lectura y escritura sobre ese bucket. Configura CORS del bucket:
   ```json
   [{ "AllowedOrigins": ["https://momentoestudio.cl", "http://localhost:3000"], "AllowedMethods": ["PUT", "GET"], "AllowedHeaders": ["content-type"], "MaxAgeSeconds": 3600 }]
   ```
6. Copia `.env.example` a `.env.local` y completa las variables. Genera secretos con `openssl rand -base64 48`.
7. `npm run dev` y abre http://localhost:3000/admin/ingresar.

## Despliegue

1. Sube el repositorio a GitHub (privado) e impórtalo en Vercel.
2. Carga las mismas variables de entorno en Vercel (Production) más `CRON_SECRET`.
3. Configura el dominio y `NEXT_PUBLIC_SITE_URL`.
4. En Supabase > Authentication > URL Configuration agrega `https://<dominio>/admin/auth/callback`.

## App iPad

No necesitas un Mac: la app se compila en Codemagic y se instala por TestFlight. Pasos completos en `docs/app-ipad-sin-mac.md`. Antes de compilar, cambia `Config.baseURL` y `Config.operatorPIN` en `ios/MomentoEstacion/Config.swift`.
