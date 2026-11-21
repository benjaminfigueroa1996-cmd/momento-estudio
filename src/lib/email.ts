import "server-only";

// Correos de Momento Estudio: siempre en español, con logo y colores de la marca.
// HTML compatible con clientes de correo (tablas y estilos en línea; Georgia como serif segura).
const C = { carbon: "#242321", marfil: "#F7F3ED", blanco: "#FFFEFC", champagne: "#B79A70", piedra: "#8C8780", beige: "#E8DFD3" };

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function brandedEmail(opts: { preheader?: string; title: string; paragraphs: string[]; rows?: [string, string][]; cta?: { label: string; url: string }; footnote?: string }) {
  const rows = (opts.rows ?? [])
    .filter(([, v]) => v)
    .map(([k, v]) => `<tr><td style="padding:10px 0;border-bottom:1px solid ${C.beige};font:13px Arial,sans-serif;color:${C.piedra};width:38%;vertical-align:top">${esc(k)}</td><td style="padding:10px 0;border-bottom:1px solid ${C.beige};font:15px Arial,sans-serif;color:${C.carbon}">${esc(v).replace(/\n/g, "<br>")}</td></tr>`)
    .join("");
  const cta = opts.cta
    ? `<tr><td style="padding:28px 0 4px"><a href="${opts.cta.url}" style="display:inline-block;background:${C.carbon};color:${C.blanco};font:600 15px Arial,sans-serif;text-decoration:none;padding:14px 30px;border-radius:999px">${esc(opts.cta.label)}</a></td></tr>`
    : "";
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(opts.title)}</title></head>
<body style="margin:0;padding:0;background:${C.marfil}">
<span style="display:none;max-height:0;overflow:hidden">${esc(opts.preheader ?? opts.title)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.marfil}"><tr><td align="center" style="padding:40px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
  <tr><td style="padding:0 0 24px;text-align:center">
    <div style="font:400 30px Georgia,'Times New Roman',serif;color:${C.carbon};letter-spacing:.01em">Momento Estudio</div>
    <div style="width:48px;height:2px;background:${C.champagne};margin:12px auto 0"></div>
  </td></tr>
  <tr><td style="background:${C.blanco};border-radius:20px;padding:40px 36px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="font:400 28px Georgia,'Times New Roman',serif;color:${C.carbon};line-height:1.2;padding-bottom:16px">${esc(opts.title)}</td></tr>
      ${opts.paragraphs.map((p) => `<tr><td style="font:15px/1.6 Arial,sans-serif;color:${C.carbon};padding-bottom:12px">${p}</td></tr>`).join("")}
      ${rows ? `<tr><td style="padding-top:8px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table></td></tr>` : ""}
      ${cta}
      ${opts.footnote ? `<tr><td style="font:13px/1.5 Arial,sans-serif;color:${C.piedra};padding-top:24px">${opts.footnote}</td></tr>` : ""}
    </table>
  </td></tr>
  <tr><td style="text-align:center;padding:24px 8px 0;font:12px/1.6 Arial,sans-serif;color:${C.piedra}">Momento Estudio · Cada momento cuenta</td></tr>
</table></td></tr></table></body></html>`;
}

export async function sendEmail(to: string[], subject: string, html: string, text: string, replyTo?: string) {
  const key = process.env.RESEND_API_KEY, from = process.env.COMMERCIAL_EMAIL;
  if (!key || !from) return false;
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: `Momento Estudio <${from}>`, to, subject, html, text, ...(replyTo ? { reply_to: replyTo } : {}) }),
  }).catch(() => null);
  return !!r?.ok;
}
