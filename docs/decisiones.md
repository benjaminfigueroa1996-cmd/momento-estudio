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

## Pantalla en vivo con composición automática
La pantalla detecta su proporción (horizontal, vertical, cuadrada o ultrapanorámica) y arma escenas con una, dos, tres o cuatro fotos y mensajes, eligiendo entre varias composiciones según el contenido disponible. Lo nuevo siempre tiene prioridad; si no hay nada nuevo, se muestra lo que hace más tiempo no aparece. El nombre de los anfitriones, la fecha, la frase, el QR del evento y la firma de Momento Estudio quedan fijos en una franja lateral (pantallas anchas) o inferior (verticales y cuadradas). Si no hay contenido, se muestra una pantalla de espera con un QR grande.

## Mensajes sin foto
Los invitados pueden enviar solo un mensaje. Se guarda en `messages` sin `media_id`, con su propia moderación y tiempo en pantalla, y aparece en el archivo de los anfitriones y en el ZIP (`Mensajes/mensajes_sin_foto.csv`).

## Muro de polaroids (identidad principal de la pantalla)
Es el modo automático de la pantalla. Cada foto entra como una instantánea con marco crema, ligeramente inclinada, con efecto de revelado, en posiciones de collage (dos filas en pantallas anchas, tres en verticales). Los mensajes de la foto van manuscritos en el marco (letra Caveat, licencia SIL OFL); los mensajes sin foto aparecen como tarjetas con cinta de papel.

**Reproducción única:** al entrar una foto o un mensaje al muro, la pantalla lo registra en la base (`screen_played_at`). La API solo entrega lo no proyectado, más lo proyectado hace menos del tiempo de permanencia (para reconstruir el muro si se recarga la pantalla). Nada vuelve a reproducirse. Cada elemento permanece unas 7 veces el intervalo entre fotos (mínimo 45 s) o hasta que lo reemplaza una foto nueva; cuando no queda contenido, aparece la pantalla de espera.
