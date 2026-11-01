export const metadata = { title: "Términos y condiciones" };

// BORRADOR: debe revisarlo un abogado antes del primer evento real.
export default function Terms() {
  return (
    <main className="mx-auto max-w-2xl px-6 pt-12 text-[16px] leading-relaxed">
      <h1 className="text-[52px] leading-tight">Términos y condiciones</h1>
      <p className="mt-4 text-[13px] text-piedra">Versión borrador, pendiente de revisión legal.</p>
      <h2 className="mt-10 text-[28px]">El servicio</h2>
      <p className="mt-3">Momento Estudio ofrece, por contratación directa, herramientas para reunir, proyectar y conservar fotografías de un evento. Las condiciones comerciales de cada evento se fijan en su cotización.</p>
      <h2 className="mt-10 text-[28px]">Uso por invitados</h2>
      <p className="mt-3">Al compartir una foto confirmas que la tomaste o tienes permiso para compartirla, y que no contiene material ofensivo o ilegal. Los anfitriones y Momento Estudio pueden retirar contenido.</p>
      <h2 className="mt-10 text-[28px]">Derechos sobre las fotos</h2>
      <p className="mt-3">Compartir una foto no transfiere sus derechos a Momento Estudio. Se otorga solo el permiso necesario para mostrarla en el evento, en el álbum y entregarla a los anfitriones. Las fotos del fotógrafo profesional se rigen por el acuerdo entre él y los anfitriones.</p>
      <h2 className="mt-10 text-[28px]">Disponibilidad</h2>
      <p className="mt-3">El servicio depende de la conexión a internet del lugar del evento. Trabajamos para recuperar la pantalla y las cargas automáticamente ante cortes.</p>
    </main>
  );
}
