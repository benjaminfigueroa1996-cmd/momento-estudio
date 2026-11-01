# Decisiones técnicas

Registro de decisiones del proyecto. Fecha de inicio: 1 de noviembre de 2026.

## Plataforma propia en vez de LumaBooth, LumaShare o Kululu
Ninguna cumple la regla pantalla/álbum/archivo, ninguna documenta una API de integración y LumaShare no permite dibujar sobre fotos. Detalle y fuentes en el informe de la Fase 1.

## Un archivo, varios destinos
`media` es el archivo físico (un original en R2). `media_destinations` guarda uno o dos destinos con su propia moderación. El álbum de invitados solo lee la vista `album_items`, que exige destino `album` aprobado; por construcción una foto solo de pantalla no puede aparecer allí.

## Acceso sin cuentas para invitados, anfitriones, fotógrafo e iPads
Solo los administradores usan Supabase Auth. El resto entra por rutas del servidor que validan su credencial y filtran siempre por `event_id`:

- Invitados: cookie anónima; límite de fotos por invitado.
- Anfitriones: código de 12 caracteres (≈60 bits) guardado con scrypt, 5 intentos cada 15 minutos, sesión firmada de 12 h, revocable y con vencimiento.
- Fotógrafo: enlace con token de 32 bytes guardado como SHA-256, revocable.
- iPad: código de vinculación de 8 caracteres (15 min, un uso) canjeado por un token de 32 bytes guardado en el Keychain.

Con RLS activado y sin políticas para `anon`, la clave pública de Supabase no puede leer nada.

## Subida directa a R2 con URL firmada
El archivo no pasa por el servidor: menos costo y sin límites de tamaño de las funciones. Al confirmar, el servidor revisa en R2 el tamaño real y los primeros bytes (JPEG, PNG, WebP, HEIC); si no es una imagen, se marca como fallida.

## Versiones livianas generadas en el teléfono
El navegador crea una versión de 2048 px y una miniatura de 480 px antes de subir. Evita pagar procesamiento de imágenes en el servidor. Si el navegador no puede leer el formato (HEIC fuera de Safari), se usa el original. **Pendiente**: un proceso en el servidor que genere versiones livianas para esos casos.

## Pantalla por consultas cada 4 s en vez de tiempo real
Más simple, sin conexiones abiertas que vigilar y con recuperación automática: si se corta internet, la pantalla sigue mostrando lo último que tenía y se pone al día sola. Con 1 a 3 pantallas por evento el costo es mínimo. Por eso no se usa Supabase Realtime por ahora.

## Duración en pantalla
`screen_slide_seconds` es cuánto se ve cada foto; `screen_ttl_minutes` es cuánto tiempo sigue en la rotación desde que se aprueba. Al vencer sale de la pantalla y sigue intacta en el archivo de los anfitriones.

## ZIP en flujo
El ZIP se arma mientras se descarga, leyendo de R2, sin guardar copias. Una foto con pantalla y álbum aparece una sola vez (en `Album_Compartido`) y el archivo `Mensajes/indice.csv` indica sus destinos y mensajes. **Riesgo**: las funciones de Vercel tienen un tiempo máximo; con eventos de decenas de GB conviene mover el ZIP a un Cloudflare Worker o generar ZIP por carpeta. Medir en las pruebas.

## Retención
Ninguna tarea elimina archivos. La tarea horaria solo informa eventos con retención vencida en el registro de auditoría. La eliminación definitiva queda pendiente de tu aprobación del procedimiento.

## Límite de solicitudes
Se cuenta por IP anonimizada. Como en un salón muchos invitados comparten la IP del wifi, los límites de carga son altos (600 por minuto por evento e IP) y el control real es el máximo de fotos por invitado.

## Tipografías
Cormorant Garamond (títulos) e Instrument Sans (interfaz), ambas con licencia SIL Open Font License, uso comercial permitido.

## Operador de pantalla con enlace, no con cuenta
Igual que el fotógrafo: un enlace revocable con token de 32 bytes. Solo puede pausar, cambiar diseño, mostrar el QR, destacar y retirar fotos de la pantalla; retirar no borra el original. La tabla `event_access` queda sin uso.

## Moderación por anfitriones
Activada por defecto (`hosts_can_moderate`). Los anfitriones aprueban o rechazan desde su panel; cada acción queda en `moderation` y en el registro de auditoría con su acceso.

## Verificación continua
Como el código se escribió sin poder compilarlo, cada cambio se compila y prueba en GitHub Actions. Ningún cambio debería llegar a producción si esa verificación falla.
