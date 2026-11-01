"use client";

export default function DestinationCard({
  title, detail, selected, onToggle, icon,
}: { title: string; detail: string; selected: boolean; onToggle: () => void; icon: React.ReactNode }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      onClick={onToggle}
      className={`relative flex w-full items-start gap-4 rounded-2xl border p-5 text-left transition-all duration-200 ease-suave active:scale-[0.99] ${
        selected ? "border-carbon bg-blanco shadow-[0_1px_0_#24232110]" : "border-carbon/10 bg-blanco/60"
      }`}
    >
      <span className="mt-0.5 text-champagne">{icon}</span>
      <span className="flex-1">
        <span className="block text-[17px] font-medium">{title}</span>
        <span className="mt-1 block text-[14px] leading-snug text-piedra">{detail}</span>
      </span>
      <span
        aria-hidden
        className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
          selected ? "border-carbon bg-carbon text-blanco" : "border-carbon/25"
        }`}
      >
        {selected && (
          <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2.5 6.2l2.3 2.3 4.7-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        )}
      </span>
    </button>
  );
}

export const ScreenIcon = () => (
  <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="3" y="5" width="20" height="13" rx="2" /><path d="M9 22h8M13 18v4" /></svg>
);
export const AlbumIcon = () => (
  <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="4" y="4" width="18" height="18" rx="2.5" /><path d="M4 17l5-5 4 4 3-3 6 6" /><circle cx="16.5" cy="9" r="1.6" /></svg>
);
