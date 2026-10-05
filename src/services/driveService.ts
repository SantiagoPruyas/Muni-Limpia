import { IncidentReport, ZoneLocation } from '../types';

export interface DriveExportResult {
  success: boolean;
  fileId?: string;
  fileName?: string;
  fileUrl?: string;
  message: string;
}

export async function exportReportToGoogleDrive(report: IncidentReport): Promise<DriveExportResult> {
  const content = `=====================================================
MUNICIPALIDAD DE LA CIUDAD DE CORRIENTES
SECRETARÍA DE AMBIENTE Y DESARROLLO SUSTENTABLE
COMPROBANTE DE REPORTE CIUDADANO
=====================================================

Código de Ticket: ${report.code}
Fecha de Emisión: ${report.createdAt}
Estado Actual: ${report.statusLabel}

DATOS DEL REPORTE:
- Motivo: ${report.categoryLabel}
- Título: ${report.title}
- Dirección: ${report.address}
- Barrio: ${report.neighborhood}
- Descripción: ${report.description}
- Estimado de Resolución: ${report.estimatedResolution || 'En proceso de asignación'}

Este documento ha sido generado automáticamente por la aplicación oficial Muni Limpia Corrientes y respaldado en tu unidad de Google Drive.
=====================================================`;

  // Simulate cloud API latency and generate formatted document
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Also create a local download blob for convenience
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const filename = `MuniLimpia_Reporte_${report.code}.txt`;
  
  return {
    success: true,
    fileId: `drive_doc_${Date.now()}_${report.code}`,
    fileName: filename,
    fileUrl: `https://drive.google.com/drive/my-drive?q=${encodeURIComponent(report.code)}`,
    message: `Reporte #${report.code} sincronizado con éxito en tu Google Drive.`,
  };
}

export async function exportScheduleToGoogleDrive(zone: ZoneLocation): Promise<DriveExportResult> {
  const content = `=====================================================
MUNICIPALIDAD DE LA CIUDAD DE CORRIENTES
CRONOGRAMA OFICIAL DE RECOLECCIÓN
=====================================================

Zona / Ubicación: ${zone.name} (${zone.subtitle})
Barrio: ${zone.neighborhood}
Tipo de Servicio: ${zone.type}
Frecuencia: ${zone.frequency}
Horario / Ventana: ${zone.timeWindow}
Turno: ${zone.shift}
Unidad Asignada: ${zone.truckNumber || 'Servicio General'}
Conductor / Responsable: ${zone.truckDriver || 'Dirección de Recolección'}

RECOMENDACIONES PARA EL VECINO:
1. Sacar las bolsas 15 a 30 minutos antes de la ventana horaria (${zone.timeWindow}).
2. Asegurar que las bolsas estén correctamente anudadas.
3. Para materiales reciclables, entregarlos limpios y secos en los Puntos Verdes.
4. Para ramas y escombros, solicitar el servicio especial a la Línea 147.

=====================================================
Generado por Muni Limpia Corrientes - Backup en Google Drive`;

  await new Promise((resolve) => setTimeout(resolve, 750));

  const filename = `MuniLimpia_Horarios_${zone.id}.txt`;

  return {
    success: true,
    fileId: `drive_sched_${Date.now()}_${zone.id}`,
    fileName: filename,
    fileUrl: `https://drive.google.com/drive/my-drive?q=${encodeURIComponent(zone.name)}`,
    message: `Cronograma de "${zone.name}" guardado exitosamente en Google Drive.`,
  };
}
