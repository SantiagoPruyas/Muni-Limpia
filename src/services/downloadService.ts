import { IncidentReport, ZoneLocation } from '../types';

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const rows = (fields: [string, string][]) =>
  fields.map(([label, value]) => `<tr><th>${label}</th><td>${escapeHtml(value)}</td></tr>`).join('');

/** Arma un .html imprimible (UTF-8) y lo descarga con <a download>. Devuelve el nombre del archivo. */
function downloadHtml(fileName: string, title: string, body: string): string {
  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<style>
  body { font-family: system-ui, sans-serif; color: #0f172a; max-width: 720px; margin: 32px auto; padding: 0 16px; }
  h1 { font-size: 22px; margin: 4px 0 16px; }
  .org { font-size: 13px; color: #475569; margin: 0; }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th, td { text-align: left; padding: 8px 0; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
  th { width: 38%; color: #475569; font-weight: 600; }
  .note { font-size: 12px; color: #475569; margin-top: 24px; }
  @media print { body { margin: 0; } }
</style>
</head>
<body>
<p class="org">Municipalidad de la Ciudad de Corrientes · Muni Limpia</p>
${body}
<p class="note">Los reclamos y datos se procesan bajo la Ordenanza de Gestión Integral de Residuos Sólidos Urbanos (GIRSU).<br>Prototipo de demostración: los datos son ficticios.</p>
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
  return fileName;
}

export function downloadReceipt(report: IncidentReport): string {
  const createdAt = new Date(report.createdAt).toLocaleString('es-AR', { dateStyle: 'long', timeStyle: 'short' });
  return downloadHtml(
    `MuniLimpia_Reclamo_${report.code}.html`,
    `Comprobante de reclamo ${report.code}`,
    `<h1>Comprobante de reclamo #${escapeHtml(report.code)}</h1>
<table>${rows([
      ['Fecha', createdAt],
      ['Estado', report.statusLabel],
      ['Categoría', report.categoryLabel],
      ['Título', report.title],
      ['Dirección', report.address],
      ['Barrio', report.neighborhood],
      ['Descripción', report.description],
      ['Resolución estimada', report.estimatedResolution || 'En proceso de asignación'],
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
