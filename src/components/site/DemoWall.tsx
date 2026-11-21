// Ilustración del producto: el muro de polaroids en una pantalla, en movimiento continuo.
// Usa luces de fiesta abstractas (no son fotos de personas reales).
type Item = { kind: "p"; img: number; ratio: "4/5" | "5/4" | "1/1"; cap?: string; r: number } | { kind: "m"; text: string; side: "l" | "r"; tone: string };

const COLS: Item[][] = [
  [
    { kind: "p", img: 1, ratio: "4/5", cap: "¡Que viva el amor!", r: -3 },
    { kind: "m", text: "¡Felicidades Fran y Benja! 💛", side: "l", tone: "#B79A70" },
    { kind: "p", img: 4, ratio: "1/1", r: 2 },
    { kind: "p", img: 7, ratio: "5/4", cap: "¡A bailar!", r: -1.5 },
  ],
  [
    { kind: "p", img: 2, ratio: "5/4", r: 2.5 },
    { kind: "p", img: 5, ratio: "4/5", cap: "Los queremos mucho", r: -2 },
    { kind: "m", text: "Brindamos por ustedes desde la mesa 7 🥂", side: "r", tone: "#8FA08C" },
    { kind: "p", img: 8, ratio: "1/1", r: 3 },
  ],
  [
    { kind: "m", text: "¡Qué fiesta más linda!", side: "r", tone: "#C9A99A" },
    { kind: "p", img: 3, ratio: "1/1", cap: "Por muchos años", r: -2.5 },
    { kind: "p", img: 6, ratio: "4/5", r: 1.5 },
    { kind: "m", text: "¡Vivan los novios!", side: "l", tone: "#A7967F" },
  ],
];

function Card({ it }: { it: Item }) {
  if (it.kind === "m") {
    const left = it.side === "l";
    return (
      <div className={`flex items-end gap-[6%] ${left ? "" : "flex-row-reverse"}`}>
        <span className="flex aspect-square w-[16%] shrink-0 items-center justify-center rounded-full" style={{ background: it.tone }}>
          <svg viewBox="0 0 24 24" className="w-[60%]" fill="#FFFEFC"><circle cx="12" cy="8.5" r="4.2" /><path d="M3.8 21c.9-4.4 4.2-6.8 8.2-6.8s7.3 2.4 8.2 6.8z" /></svg>
        </span>
        <p className={`rounded-[0.9em] px-[0.8em] py-[0.55em] text-[clamp(8px,1.05vw,13px)] leading-snug text-carbon shadow-lg ${left ? "rounded-bl-[0.2em] bg-blanco" : "rounded-br-[0.2em] bg-[#EFE4D2]"}`}>{it.text}</p>
      </div>
    );
  }
  return (
    <figure className="bg-[#FBF8F2] p-[5%] pb-0 shadow-[0_10px_24px_rgba(0,0,0,0.45)]" style={{ transform: `rotate(${it.r}deg)` }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/ilustraciones/luz-${it.img}.jpg`} alt="" loading="lazy" className="block w-full object-cover" style={{ aspectRatio: it.ratio }} />
      <figcaption className="flex min-h-[1.9em] items-center justify-center py-[0.25em] text-center font-hand text-[clamp(10px,1.35vw,17px)] leading-none text-[#2b2a27]">{it.cap}</figcaption>
    </figure>
  );
}

export default function DemoWall({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-[14px] border-[6px] border-[#141312] bg-carbon shadow-[0_40px_80px_rgba(0,0,0,0.35)] ${className}`}>
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_115%,rgba(183,154,112,0.34),transparent_60%)]" />
      <div className="relative flex h-full">
        <div className="relative grid flex-1 grid-cols-3 gap-[3%] overflow-hidden px-[3%] [mask-image:linear-gradient(transparent,black_10%,black_90%,transparent)]">
          {COLS.map((col, c) => (
            <div key={c} className="relative">
              <div className="flex flex-col gap-[14%] pt-[6%] animate-[rise_26s_linear_infinite] motion-reduce:animate-none" style={{ animationDelay: `${-c * 7}s` }}>
                {[...col, ...col].map((it, i) => <Card key={i} it={it} />)}
              </div>
            </div>
          ))}
        </div>
        <div className="flex w-[22%] flex-col justify-between py-[4%] pr-[3%] text-marfil">
          <div>
            <p className="font-serif text-[clamp(9px,1.4vw,18px)] uppercase leading-tight tracking-[0.08em]">Francisca &amp; Benjamín</p>
            <p className="mt-1 text-[clamp(6px,0.6vw,9px)] tracking-[0.3em] text-marfil/70">25 · 10 · 2026</p>
            <p className="mt-1 text-[clamp(6px,0.6vw,9px)] uppercase tracking-[0.25em] text-champagne">¡Que siga la fiesta!</p>
          </div>
          <div className="rounded-[8%] bg-blanco p-[8%]">
            <svg viewBox="0 0 29 29" className="w-full" shapeRendering="crispEdges">{QR}</svg>
          </div>
          <p className="font-serif text-[clamp(6px,0.65vw,10px)] text-marfil/50">Momento Estudio</p>
        </div>
      </div>
      <style>{`@keyframes rise{from{transform:translateY(0)}to{transform:translateY(-50%)}}`}</style>
    </div>
  );
}

// QR decorativo (no escaneable), dibujado en código
const QR = (() => {
  const cells: React.ReactElement[] = [];
  let seed = 7;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  const finder = (x: number, y: number) => [
    <rect key={`f${x}${y}a`} x={x} y={y} width={7} height={7} fill="#242321" />,
    <rect key={`f${x}${y}b`} x={x + 1} y={y + 1} width={5} height={5} fill="#FFFEFC" />,
    <rect key={`f${x}${y}c`} x={x + 2} y={y + 2} width={3} height={3} fill="#242321" />,
  ];
  for (let i = 0; i < 29; i++)
    for (let j = 0; j < 29; j++) {
      const inF = (i < 8 && j < 8) || (i < 8 && j > 20) || (i > 20 && j < 8);
      if (!inF && rnd() < 0.47) cells.push(<rect key={`${i}-${j}`} x={i} y={j} width={1} height={1} fill="#242321" />);
    }
  return [...cells, ...finder(0, 0), ...finder(22, 0), ...finder(0, 22)];
})();
