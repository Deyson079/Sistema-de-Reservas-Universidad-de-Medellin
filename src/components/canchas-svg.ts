// Ilustraciones de canchas en duotono rojo (reemplazan fotografías hasta tener fotos reales)
const L = "#F8CDCF";
const wrap = (body: string, bg = "#7A1C20") =>
  `<svg viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="100%" height="100%" fill="${bg}"/>${body}</svg>`;

function futbol() {
  let s = "";
  for (let i = 0; i < 8; i++) s += `<rect x="${20 + i * 70}" y="20" width="70" height="360" fill="${i % 2 ? "#A3242B" : "#972128"}"/>`;
  return wrap(s + `<g fill="none" stroke="${L}" stroke-width="3"><rect x="20" y="20" width="560" height="360"/><line x1="300" y1="20" x2="300" y2="380"/><circle cx="300" cy="200" r="50"/><rect x="20" y="105" width="88" height="190"/><rect x="20" y="158" width="32" height="84"/><path d="M108 162 A48 48 0 0 1 108 238"/><rect x="492" y="105" width="88" height="190"/><rect x="548" y="158" width="32" height="84"/><path d="M492 162 A48 48 0 0 0 492 238"/></g><circle cx="300" cy="200" r="4" fill="${L}"/><rect x="6" y="176" width="14" height="48" fill="none" stroke="${L}" stroke-width="2"/><rect x="580" y="176" width="14" height="48" fill="none" stroke="${L}" stroke-width="2"/>`);
}
function baloncesto() {
  let planks = "";
  for (let y = 34; y < 380; y += 14) planks += `<line x1="20" y1="${y}" x2="580" y2="${y}" stroke="#9A2329" stroke-width="1"/>`;
  return wrap(`<rect x="20" y="20" width="560" height="360" fill="#A8262C"/>${planks}<rect x="20" y="140" width="130" height="120" fill="#86202A"/><rect x="450" y="140" width="130" height="120" fill="#86202A"/><circle cx="300" cy="200" r="38" fill="#86202A"/><g fill="none" stroke="${L}" stroke-width="3"><rect x="20" y="20" width="560" height="360"/><line x1="300" y1="20" x2="300" y2="380"/><circle cx="300" cy="200" r="38"/><rect x="20" y="140" width="130" height="120"/><rect x="450" y="140" width="130" height="120"/><circle cx="150" cy="200" r="40"/><circle cx="450" cy="200" r="40"/><path d="M20 44 H80 A172 172 0 0 1 80 356 H20"/><path d="M580 44 H520 A172 172 0 0 0 520 356 H580"/></g><circle cx="46" cy="200" r="8" fill="none" stroke="${L}" stroke-width="2.5"/><circle cx="554" cy="200" r="8" fill="none" stroke="${L}" stroke-width="2.5"/>`);
}
function voleibol() {
  let net = "";
  for (let y = 58; y < 344; y += 8) net += `<line x1="292" y1="${y}" x2="308" y2="${y}"/>`;
  return wrap(`<rect width="600" height="400" fill="#8A1F25"/><rect x="40" y="70" width="520" height="260" fill="#A8262C"/><g fill="none" stroke="${L}" stroke-width="3"><rect x="40" y="70" width="520" height="260"/><line x1="213" y1="70" x2="213" y2="330"/><line x1="387" y1="70" x2="387" y2="330"/></g><rect x="296" y="52" width="8" height="296" fill="#4E1013" opacity=".45" transform="translate(10 8)"/><line x1="300" y1="50" x2="300" y2="350" stroke="${L}" stroke-width="6"/><g stroke="${L}" stroke-width="1" opacity=".6">${net}</g><circle cx="300" cy="50" r="6" fill="${L}"/><circle cx="300" cy="350" r="6" fill="${L}"/>`);
}
function placa() {
  const Y = "#F3D941";
  return wrap(`<rect width="600" height="400" fill="#7E1D22"/><rect x="40" y="60" width="520" height="280" fill="#A3242A"/><g fill="none" stroke="${Y}" stroke-width="2.5" opacity=".75"><rect x="40" y="150" width="96" height="100"/><rect x="464" y="150" width="96" height="100"/><path d="M40 76 H70 A150 150 0 0 1 70 324 H40"/><path d="M560 76 H530 A150 150 0 0 0 530 324 H560"/></g><g fill="none" stroke="${L}" stroke-width="3"><rect x="40" y="60" width="520" height="280"/><line x1="300" y1="60" x2="300" y2="340"/><circle cx="300" cy="200" r="40"/><path d="M40 120 A80 80 0 0 1 120 200 A80 80 0 0 1 40 280"/><path d="M560 120 A80 80 0 0 0 480 200 A80 80 0 0 0 560 280"/></g><rect x="28" y="180" width="12" height="40" fill="none" stroke="${L}" stroke-width="2"/><rect x="560" y="180" width="12" height="40" fill="none" stroke="${L}" stroke-width="2"/>`);
}

export const CANCHAS_SVG: Record<string, () => string> = { futbol, baloncesto, voleibol, placa };
export const svgCancha = (tipo: string) => (CANCHAS_SVG[tipo] ?? placa)();
