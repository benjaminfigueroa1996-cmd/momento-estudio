# App del iPad sin Mac propio

La app se compila en un Mac en la nube de **Codemagic** y llega a los iPads por **TestFlight**. Todo se hace desde el navegador; no necesitas comprar ni arrendar un Mac.

## Costo
- Codemagic: plan gratuito para cuentas personales, 500 minutos de macOS al mes. Cada compilación debería tomar entre 5 y 15 minutos, así que alcanza para decenas de compilaciones mensuales. Si se superan, el minuto adicional cuesta USD 0,095.
- Apple Developer Program: USD 99 al año (ya autorizado).

## Configuración inicial (una sola vez, unos 30 minutos)

1. **Apple Developer** (developer.apple.com, desde el navegador): en Certificates, Identifiers & Profiles > Identifiers, registra el Bundle ID `cl.momentoestudio.estacion` como App ID explícito.
2. **App Store Connect** (appstoreconnect.apple.com):
   1. Mis apps > + > Nueva app. Plataforma iOS, nombre "Momento Estudio Estación", el Bundle ID anterior y un SKU cualquiera. La app nunca se publicará en la tienda; solo se usa para TestFlight.
   2. Copia el **Apple ID** numérico de la app (Información de la app) y reemplaza `APP_ID` en `codemagic.yaml`.
   3. Usuarios y acceso > Integraciones > App Store Connect API: crea una clave con rol **App Manager**. Descarga el archivo `.p8` (solo se puede descargar una vez) y anota el Issuer ID y el Key ID.
3. **GitHub**: sube el repositorio (privado).
4. **Codemagic** (codemagic.io, cuenta personal, no de equipo, para tener los minutos gratis):
   1. Conecta GitHub y agrega el repositorio.
   2. Configuración de equipo > Integraciones > Developer Portal: agrega la clave del paso 2.3 con el nombre exacto `Momento Estudio`.
   3. Code signing identities: genera o sube un certificado de distribución de iOS y deja que Codemagic obtenga el perfil de App Store para el Bundle ID. Codemagic lo hace con la clave de API, sin Mac.
5. Haz un push a `main` con un cambio en `ios/`, o lanza la compilación a mano desde Codemagic. Al terminar, la versión aparece en TestFlight en unos minutos.

## Instalar en los 2 iPads
1. En App Store Connect > TestFlight > Pruebas internas, crea un grupo y agrega tu propio Apple ID.
2. En cada iPad, inicia sesión con ese Apple ID, instala la app **TestFlight** desde la App Store y acepta la invitación.
3. Abre Momento Estudio desde TestFlight y vincúlalo con el código del panel de administración.

## Lo que hay que saber
- **Las versiones de TestFlight vencen a los 90 días.** Antes de cada temporada, o si queda menos de un mes, lanza una compilación nueva desde Codemagic (un clic) y actualiza los iPads. Revisa la fecha de vencimiento antes de cada evento.
- **Corregir errores es más lento que con un Mac**: cada intento compila en la nube (unos 10 minutos) y no hay simulador a mano. Claude Code puede leer el registro de error de Codemagic, corregir y volver a enviar.
- **Si algún día necesitas ver la app en un simulador o depurar en vivo**, la opción puntual es arrendar un Mac remoto por horas (por ejemplo MacinCloud, alrededor de USD 1 por hora). Revisa bien sus condiciones de cobro antes de contratar: hay usuarios que reportan cobros inesperados.
- Antes de compilar para el primer evento, cambia `Config.baseURL` y `Config.operatorPIN` en `ios/MomentoEstacion/Config.swift`.
