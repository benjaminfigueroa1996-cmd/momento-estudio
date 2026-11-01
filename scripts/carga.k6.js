// Prueba de carga con k6 (https://k6.io): simula invitados compartiendo fotos a la vez.
// Uso: k6 run -e BASE=https://staging.momentoestudio.cl -e SLUG=evento-prueba -e IMG=./foto.jpg scripts/carga.k6.js
// Ejecutar SOLO contra un evento de prueba en un entorno de pruebas.
import http from "k6/http";
import { check, sleep } from "k6";

const img = open(__ENV.IMG, "b");
export const options = {
  scenarios: {
    invitados: { executor: "ramping-vus", startVUs: 0, stages: [{ duration: "2m", target: 400 }, { duration: "5m", target: 400 }, { duration: "1m", target: 0 }] },
    pantalla: { executor: "constant-vus", vus: 3, duration: "8m", exec: "pantalla" },
  },
  thresholds: { http_req_failed: ["rate<0.02"], "http_req_duration{api:uploads}": ["p(95)<1500"] },
};

export default function () {
  const base = __ENV.BASE, slug = __ENV.SLUG;
  const jar = http.cookieJar();
  const r = http.post(`${base}/api/e/${slug}/uploads`, JSON.stringify({ files: [{ type: "image/jpeg", size: img.byteLength }] }),
    { headers: { "Content-Type": "application/json" }, tags: { api: "uploads" }, jar });
  if (!check(r, { "uploads 200": (x) => x.status === 200 })) return sleep(5);
  const t = r.json("tickets")[0];
  check(http.put(t.original, img, { headers: { "Content-Type": "image/jpeg" } }), { "put 200": (x) => x.status === 200 });
  http.put(t.display, img, { headers: { "Content-Type": "image/jpeg" } });
  http.put(t.thumb, img, { headers: { "Content-Type": "image/jpeg" } });
  const c = http.post(`${base}/api/e/${slug}/complete`, JSON.stringify({ mediaId: t.mediaId, destinations: Math.random() < 0.5 ? ["album"] : ["screen", "album"] }),
    { headers: { "Content-Type": "application/json" }, tags: { api: "complete" }, jar });
  check(c, { "complete 200": (x) => x.status === 200 });
  sleep(30 + Math.random() * 60); // un invitado comparte cada 30 a 90 segundos
}

export function pantalla() {
  http.get(`${__ENV.BASE}/api/live/${__ENV.SLUG}?k=${encodeURIComponent(__ENV.SCREEN_KEY ?? "")}`, { tags: { api: "live" } });
  sleep(4);
}
