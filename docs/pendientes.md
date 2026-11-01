# Pendientes y dependencias

## Necesito de ti
- [ ] Cuentas creadas a tu nombre: Supabase, Cloudflare, Vercel, GitHub y Apple Developer Program.
- [ ] Dominio definitivo (por ejemplo momentoestudio.cl) y correo comercial.
- [ ] Cuenta personal en Codemagic y clave de API de App Store Connect (ver `docs/app-ipad-sin-mac.md`).
- [ ] Fotografías demostrativas propias para el sitio (`public/demo` y `src/content/site.ts`).
- [ ] Razón social, RUT y correo de privacidad para los textos legales; revisión de un abogado.
- [ ] Aprobación del procedimiento de eliminación definitiva al vencer la retención.

## Por hacer en el código
- [ ] Instalar, compilar y corregir lo que aparezca en la primera compilación.
- [ ] Ejecutar todas las pruebas de `docs/pruebas.md` y registrar resultados.
- [ ] Versiones livianas en el servidor para HEIC subidos desde navegadores que no lo leen.
- [ ] Colores por evento en la página del QR (la portada ya está).
- [ ] Medir el ZIP con un evento grande; si supera el tiempo máximo, moverlo a un Cloudflare Worker.
- [ ] Copias de seguridad: activar PITR o respaldo diario en Supabase y versionado del bucket.
- [ ] Reemplazar el ícono provisorio de la app iPad por el definitivo de la marca.
- [ ] Monitoreo de errores (por ejemplo, el registro de Vercel y alertas por correo).

## Hecho en la segunda pasada
- Verificación automática en GitHub (`.github/workflows/verificar.yml`): compila Next.js, revisa tipos y ejecuta las pruebas de reglas en una base Supabase temporal en cada cambio. Es la primera compilación real del proyecto: revisa su resultado al subir el repositorio.
- Moderación desde el panel de anfitriones, activable por evento.
- Operador de pantalla con enlace propio.
- Portada por evento en la página del QR.
- App iPad compilable sin Mac (Codemagic + TestFlight).
