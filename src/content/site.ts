// Textos del sitio. Sin clientes, cifras ni testimonios inventados.

// Fotografías demostrativas: agrega archivos en /public/demo y declara aquí su ruta y descripción.
// Mientras la lista esté vacía, el sitio muestra marcos vacíos rotulados.
export const demoPhotos: { src: string; alt: string }[] = [];

export const steps = [
  { title: "Escanean el QR", body: "Cada mesa tiene un código del evento. Los invitados lo abren con la cámara del teléfono, sin descargar nada ni crear cuentas." },
  { title: "Eligen dónde compartir", body: "Cada foto puede ir a la pantalla del evento, al álbum compartido o a ambos. Si va a la pantalla, pueden sumar un mensaje." },
  { title: "Se vive en pantalla", body: "Las fotos y dedicatorias aparecen en el proyector durante la celebración, con la moderación que ustedes elijan." },
  { title: "Queda todo guardado", body: "Ustedes reciben un archivo privado con todas las fotos, los mensajes y el trabajo del fotógrafo, listo para descargar." },
];

export const services = [
  { id: "pantalla", title: "Pantalla en vivo", body: "Fotos y mensajes de los invitados proyectados durante el evento, con diseños sobrios, tiempos configurables y control desde un panel. Las fotos que solo van a la pantalla no se publican en el álbum." },
  { id: "album", title: "Álbum compartido", body: "Un álbum digital del evento donde los invitados ven y descargan las fotos que eligieron compartir, junto a las del fotógrafo." },
  { id: "fotografo", title: "Fotografía profesional en el mismo lugar", body: "El fotógrafo oficial entrega su trabajo directamente al álbum del evento. No hay que reunir enlaces ni carpetas por separado." },
  { id: "ipad", title: "Estación con iPad y Apple Pencil", body: "Una mesa donde los invitados eligen una foto y la intervienen a mano: dedicatorias, firmas y dibujos. La foto original siempre se conserva." },
  { id: "archivo", title: "Archivo privado para los anfitriones", body: "Todas las fotos y mensajes, incluidas las que solo pasaron por la pantalla, ordenadas en carpetas y descargables cuando quieran." },
];

export const faqs = [
  { q: "¿Los invitados tienen que descargar una aplicación?", a: "No. Escanean el código QR y se abre una página en el navegador del teléfono." },
  { q: "¿Qué pasa con una foto que solo enviaron a la pantalla?", a: "Se proyecta durante un tiempo y luego sale de la rotación. No aparece en el álbum de invitados, pero queda guardada en el archivo privado de los anfitriones." },
  { q: "¿Podemos revisar las fotos antes de que aparezcan?", a: "Sí. Cada evento puede publicar de inmediato o esperar aprobación, por separado para la pantalla y para el álbum." },
  { q: "¿Quién puede ver el álbum?", a: "Las personas que tienen el enlace o el QR del evento, mientras el álbum esté habilitado. Ustedes deciden cuándo se cierra." },
  { q: "¿Qué hace el fotógrafo profesional?", a: "Sube sus fotos con un enlace privado. Entran al álbum y al archivo de los anfitriones; no se proyectan en la pantalla." },
  { q: "¿Por cuánto tiempo se guardan las fotos?", a: "El plazo se acuerda al cotizar y se informa antes de cualquier eliminación. Ustedes pueden descargar todo en un archivo ZIP." },
  { q: "¿Momento Estudio usa nuestras fotos para publicidad?", a: "No. Las fotos se usan solo para el servicio de su evento. Cualquier otro uso requiere su autorización expresa y por separado." },
  { q: "¿Cómo se contrata?", a: "Escríbenos con los datos del evento y te enviamos una cotización a medida." },
];
