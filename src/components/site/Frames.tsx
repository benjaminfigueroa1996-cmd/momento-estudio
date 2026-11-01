import { demoPhotos } from "@/content/site";

// Muestra fotos demostrativas reales cuando existan; mientras tanto, marcos vacíos rotulados.
export default function Frames({ labels, className = "" }: { labels: string[]; className?: string }) {
  return (
    <div className={className}>
      {labels.map((label, i) => {
        const photo = demoPhotos[i];
        return (
          <figure key={label} className="relative overflow-hidden bg-beige">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo.src} alt={photo.alt} className="h-full w-full object-cover" />
            ) : (
              <figcaption className="absolute bottom-3 left-4 text-[12px] text-piedra">{label}</figcaption>
            )}
          </figure>
        );
      })}
    </div>
  );
}
