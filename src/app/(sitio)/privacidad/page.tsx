export const metadata = { title: "Privacidad" };

// BORRADOR: debe revisarlo un abogado antes del primer evento real (Ley 19.628 y Ley 21.719).
export default function Privacy() {
  return (
    <main className="mx-auto max-w-2xl px-6 pt-12 text-[16px] leading-relaxed">
      <h1 className="text-[52px] leading-tight">Privacidad</h1>
      <p className="mt-4 text-[13px] text-piedra">Versión borrador, pendiente de revisión legal.</p>
      <h2 className="mt-10 text-[28px]">Quién trata los datos</h2>
      <p className="mt-3">Momento Estudio ([razón social y RUT por completar]) presta el servicio por encargo de los anfitriones de cada evento.</p>
      <h2 className="mt-10 text-[28px]">Qué datos recibimos</h2>
      <p className="mt-3">Las fotografías y mensajes que compartes en un evento, la hora de envío y un identificador anónimo de tu sesión. No pedimos tu nombre ni tu correo para compartir fotos. Para limitar abusos guardamos una versión cifrada (no reversible) de tu dirección IP.</p>
      <h2 className="mt-10 text-[28px]">Para qué los usamos</h2>
      <p className="mt-3">Solo para el servicio del evento: mostrar las fotos en la pantalla y en el álbum según el destino que elijas, y entregarlas a los anfitriones. No usamos fotos ni mensajes con fines publicitarios sin una autorización expresa y separada.</p>
      <h2 className="mt-10 text-[28px]">Quién puede verlas</h2>
      <p className="mt-3">Las fotos enviadas a la pantalla se proyectan en el evento y quedan en el archivo privado de los anfitriones. Las enviadas al álbum las ven quienes tengan el enlace del evento mientras el álbum esté habilitado. Los anfitriones acceden a todas.</p>
      <h2 className="mt-10 text-[28px]">Cuánto tiempo las guardamos</h2>
      <p className="mt-3">Durante el plazo acordado con los anfitriones. Antes de cualquier eliminación definitiva se les informa.</p>
      <h2 className="mt-10 text-[28px]">Tus derechos</h2>
      <p className="mt-3">Puedes pedir acceso, rectificación o eliminación de una foto o mensaje tuyo escribiendo a [correo de privacidad por completar].</p>
    </main>
  );
}
