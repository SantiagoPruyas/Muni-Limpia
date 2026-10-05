import { IncidentReport, ZoneLocation } from '../types';
import { TIME_ZONE } from '../data/schedule';

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const rows = (fields: [string, string][]) =>
  fields.map(([label, value]) => `<tr><th>${label}</th><td>${escapeHtml(value)}</td></tr>`).join('');

// Los logos de public/brand/ se leen recién al descargar (no suman al JS inicial) y van inline
// para que el archivo los muestre sin red. Si no cargan, el documento sale sin logos.
const fetchSvg = (file: string) =>
  fetch(`/brand/${file}.svg`)
    .then((r) => r.text())
    .then((text) => (text.trimStart().startsWith('<svg') ? text : ''))
    .catch(() => '');

// Sin id: los dos archivos repiten Capa_1-2 / Capa_2.
const inlineSvg = (svg: string, className: string, label: string) =>
  svg
    .replace(/\s(id|data-name)="[^"]*"/g, '')
    .replace('<svg ', `<svg class="${className}" role="img" aria-label="${label}" `);

/**
 * Arma un .html imprimible (UTF-8, A4) con los logos oficiales y lo descarga con <a download>.
 * Devuelve el nombre del archivo en el acto; la descarga sale cuando terminan de cargar los logos.
 */
function downloadHtml(fileName: string, title: string, body: string): string {
  Promise.all([fetchSvg('municipalidad-h-color'), fetchSvg('muni-limpia-h')]).then(([municipalidadSvg, muniLimpiaSvg]) =>
    saveHtml(fileName, title, body, municipalidadSvg, muniLimpiaSvg)
  );
  return fileName;
}

function saveHtml(fileName: string, title: string, body: string, municipalidadSvg: string, muniLimpiaSvg: string) {
  const issuedAt = new Date().toLocaleString('es-AR', { dateStyle: 'long', timeStyle: 'short', timeZone: TIME_ZONE });
  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
  /* Valores de los tokens de src/index.css: el documento es standalone y no ve las variables de la app. */
  :root { --brand-500: #18a03a; --brand-600: #0d7a2b; --surface: #f2f9f3; --ink: #0f172a; --ink-body: #1e293b; --ink-muted: #475569; --line: #e2e8f0; }
  @page { size: A4; margin: 16mm; }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--surface); color: var(--ink-body); font: 14px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  .toolbar { max-width: 760px; margin: 24px auto 0; text-align: right; }
  .toolbar button { font: inherit; font-weight: 600; color: #fff; background: var(--brand-600); border: 0; border-radius: 12px; padding: 12px 18px; cursor: pointer; }
  .sheet { max-width: 760px; margin: 16px auto 32px; background: #fff; padding: 40px 48px; border-radius: 16px; box-shadow: 0 10px 30px -12px rgba(15, 23, 42, 0.12); }
  .head { display: flex; align-items: center; justify-content: space-between; gap: 24px; padding-bottom: 20px; border-bottom: 3px solid var(--brand-500); }
  .logo-muni { display: block; width: 200px; height: auto; }
  .head-meta { margin: 0; text-align: right; font-size: 12px; color: var(--ink-muted); }
  h1 { margin: 28px 0 4px; font-size: 20px; line-height: 1.3; color: var(--ink); }
  .code { margin: 0; font: 700 28px/1.2 ui-monospace, Consolas, "Courier New", monospace; color: var(--brand-600); }
  table { width: 100%; margin-top: 24px; border-collapse: collapse; }
  th, td { padding: 10px 0; text-align: left; vertical-align: top; border-bottom: 1px solid var(--line); }
  th { width: 34%; padding-right: 16px; font-weight: 600; color: var(--ink-muted); }
  td { color: var(--ink); }
  .note { margin: 24px 0 0; font-size: 12px; color: var(--ink-muted); }
  .foot { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-top: 32px; padding-top: 16px; border-top: 1px solid var(--line); font-size: 12px; color: var(--ink-muted); }
  .logo-app { display: block; width: auto; height: 24px; }
  @media (max-width: 600px) {
    .sheet { margin: 16px 0 0; padding: 24px 16px; border-radius: 0; }
    .toolbar { padding: 0 16px; }
    .head { flex-direction: column; align-items: flex-start; }
    .head-meta { text-align: left; }
  }
  @media print {
    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { background: #fff; }
    .toolbar { display: none; }
    .sheet { max-width: none; margin: 0; padding: 0; border-radius: 0; box-shadow: none; }
    table, .foot { break-inside: avoid; }
  }
</style>
</head>
<body>
<div class="toolbar"><button type="button" onclick="window.print()">Imprimir o guardar como PDF</button></div>
<main class="sheet">
<header class="head">
${inlineSvg(municipalidadSvg, 'logo-muni', 'Municipalidad de la Ciudad de Corrientes')}
<p class="head-meta">Muni Limpia<br>Emitido el ${escapeHtml(issuedAt)}</p>
</header>
${body}
<p class="note">Los reclamos y datos se procesan bajo la Ordenanza de Gestión Integral de Residuos Sólidos Urbanos (GIRSU).<br>Prototipo de demostración: los datos son ficticios.</p>
<footer class="foot">
${inlineSvg(muniLimpiaSvg, 'logo-app', 'Muni Limpia')}
<span>Recolección, horarios y reclamos</span>
</footer>
</main>
</body>
</html>`;

  const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadReceipt(report: IncidentReport): string {
  const createdAt = new Date(report.createdAt).toLocaleString('es-AR', { dateStyle: 'long', timeStyle: 'short' });
  return downloadHtml(
    `MuniLimpia_Reclamo_${report.code}.html`,
    `Comprobante de reclamo ${report.code}`,
    `<h1>Comprobante de reclamo</h1>
<p class="code">${escapeHtml(report.code)}</p>
<table>${rows([
      ['Fecha del reclamo', createdAt],
      ['Estado', report.statusLabel],
      ['Categoría', report.categoryLabel],
      ['Título', report.title],
      ['Dirección', report.address],
      ['Barrio', report.neighborhood],
      ['Descripción', report.description],
      ['Resolución estimada', report.estimatedResolution || 'En proceso de asignación'],
      ['Foto adjunta', report.photoUrl ? 'Sí' : 'No'],
    ])}</table>`
  );
}

export function downloadSchedule(zone: ZoneLocation): string {
  return downloadHtml(
    `MuniLimpia_Horario_${zone.id}.html`,
    `Horario de recolección · ${zone.name}`,
    `<h1>Horario de recolección · ${escapeHtml(zone.name)}</h1>
<table>${rows([
      ['Barrio', zone.neighborhood],
      ['Servicio', zone.type],
      ['Días', zone.frequency],
      ['Horario', zone.timeWindow],
      ['Turno', zone.shift],
      ['Unidad', zone.truckNumber || 'Servicio general'],
    ])}</table>
<p class="note">Sacá las bolsas entre 15 y 30 minutos antes del horario, bien cerradas. Llevá los reciclables limpios y secos a un Punto Verde. Para ramas y escombros, pedí el retiro especial a la Línea 147.</p>`
  );
}
