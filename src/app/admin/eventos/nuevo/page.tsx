import { requireAdmin } from "@/lib/admin";
import { createEvent } from "@/lib/actions";
import EventForm from "@/components/admin/EventForm";

export default async function NewEvent() {
  await requireAdmin();
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-[44px]">Crear evento</h1>
      <div className="mt-10"><EventForm action={createEvent} submit="Crear evento" /></div>
    </main>
  );
}
