# Informe de pruebas

Estado al 1 de noviembre de 2026: **ninguna prueba ejecutada todavía**. El código se escribió sin acceso a internet; se verificó solo la sintaxis de todos los archivos TypeScript y la coherencia de tipos con módulos simulados. Cada fila se completa al ejecutar la prueba en el entorno de pruebas.

## Criterios de aceptación del brief

| # | Prueba | Cómo se cubre | Automática | Resultado |
| --- | --- | --- | --- | --- |
| 1 | Foto solo a pantalla: aparece en pantalla, no en el álbum, los anfitriones la ven y descargan | Vista `album_items`; `/api/live`; archivo de anfitriones lee `media` completo | pgTAP `01_reglas` | Pendiente |
| 2 | Foto solo al álbum: invitados la ven y descargan, no va a pantalla | Vista `screen_items` exige destino `screen` | pgTAP | Pendiente |
| 3 | Ambos destinos sin duplicar el original | Un registro `media`, dos `media_destinations` | pgTAP | Pendiente |
| 4 | Foto con mensaje en pantalla, disponible para anfitriones | `messages` + diseño "Foto con mensaje" | Manual | Pendiente |
| 5 | Intervención en iPad: original intacto + versión intervenida | Nueva fila `media` + `media_versions` | Manual en iPad | Pendiente |
| 6 | Lote del fotógrafo al álbum y a anfitriones | Destino `album` automático, sin moderación | Manual | Pendiente |
| 7 | Anfitriones ven todo, cualquier destino | `/api/anfitriones/[slug]/media` | Manual | Pendiente |
| 8 | Descarga completa con mensajes | ZIP en flujo + `indice.csv` | Manual | Pendiente |
| 9 | Foto sale de pantalla al vencer y sigue en el archivo | `screen_expires_at`; nada se borra | pgTAP | Pendiente |
| 10 | Un evento no accede a otro | Filtro `event_id` en cada ruta; sesión con `ev` firmado | pgTAP + manual | Pendiente |

## Verificación automática
Cada push a `main` ejecuta `.github/workflows/verificar.yml`: compilación, tipos y pruebas pgTAP. Registrar aquí el resultado de la primera ejecución.

## Pruebas adicionales
- Carga: `scripts/carga.k6.js` con 400 invitados virtuales durante 5 minutos. Ejecutar desde varias máquinas o subir temporalmente los límites, porque todas las solicitudes saldrán de pocas IPs.
- Apple Pencil: precisión, presión, latencia, rechazo de palma, borrador y exportación en los 2 iPads.
- Recuperación: cortar el wifi con la pantalla y un iPad funcionando durante 2 minutos.
- Operador: el enlace de operador no da acceso a `/api/anfitriones` ni a `/api/admin`; retirar una foto la saca de la pantalla y sigue en el archivo.
- Anfitriones: aprobar desde su panel publica la foto; con `hosts_can_moderate` desactivado, la ruta responde 403.
- Seguridad: intentos de código de anfitrión (bloqueo a los 5), archivo que no es imagen renombrado como .jpg, acceso a `/api/admin` sin sesión.
