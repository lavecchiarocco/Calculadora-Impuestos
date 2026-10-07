import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { CalculoResponse, RegimenResultado, TributoDetalle } from '@/types/api';
import { formatearUSD, formatearARS, formatearPorcentaje, formatearNumero } from '@/utils/format';

interface PDFGenerationOptions {
  resultado: CalculoResponse;
  moneda: 'USD' | 'ARS';
  escenario: 'conservador' | 'minimo';
  sensibilidadDolar: number;
}

function getMonedaSimbolo(moneda: 'USD' | 'ARS'): string {
  return moneda === 'USD' ? 'USD' : 'ARS';
}

function formatearMoneda(valor: number, moneda: 'USD' | 'ARS'): string {
  return moneda === 'USD' ? formatearUSD(valor) : formatearARS(valor);
}

function formatearMonto(
  usd: number,
  ars: number,
  moneda: 'USD' | 'ARS',
  factor: number = 1
): string {
  return moneda === 'USD' ? formatearUSD(usd) : formatearARS(ars * factor);
}

export function generarPDF(opciones: PDFGenerationOptions): jsPDF {
  const { resultado, moneda, escenario, sensibilidadDolar } = opciones;
  const factor = 1 + sensibilidadDolar / 100;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = margin;

  // Helper para agregar texto
  const agregarTexto = (texto: string, x: number, yPos: number, opciones?: { fontSize?: number; fontStyle?: string; color?: [number, number, number] }) => {
    doc.setFontSize(opciones?.fontSize ?? 10);
    doc.setFont('helvetica', opciones?.fontStyle ?? 'normal');
    if (opciones?.color) doc.setTextColor(...opciones.color);
    else doc.setTextColor(51, 51, 51);
    doc.text(texto, x, yPos);
  };

  // Helper para agregar título de sección
  const agregarSeccion = (titulo: string, yPos: number): number => {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 138); // blue-800
    doc.text(titulo, margin, yPos);
    doc.setDrawColor(30, 58, 138);
    doc.setLineWidth(0.3);
    doc.line(margin, yPos + 1, pageWidth - margin, yPos + 1);
    return yPos + 8;
  };

  // ===== ENCABEZADO =====
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138);
  doc.text('Cotización de Importación - TotalImport', margin, y);
  y += 8;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  const fecha = new Date().toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text(`Generado: ${fecha}`, margin, y);
  doc.text(`Escenario: ${escenario === 'conservador' ? 'Conservador (alícuotas máximas)' : 'Mínimo (alícuotas mínimas)'}`, pageWidth - margin, y, { align: 'right' });
  y += 6;

  if (sensibilidadDolar > 0) {
    doc.text(`Sensibilidad dólar: +${sensibilidadDolar}%`, pageWidth - margin, y, { align: 'right' });
    y += 5;
  }

  y += 4;

  // ===== DATOS DE ENTRADA =====
  y = agregarSeccion('1. Datos de la cotización', y);

  const datos = resultado.datos_entrada;
  const cifMoneda = moneda === 'USD' ? resultado.cif_usd : resultado.cif_ars;
  const fobMoneda = moneda === 'USD' ? datos.precio_producto_usd : datos.precio_producto_usd * datos.tipo_cambio_ars_usd;
  const envioMoneda = moneda === 'USD' ? datos.costo_envio_usd : datos.costo_envio_usd * datos.tipo_cambio_ars_usd;
  const seguroMoneda = moneda === 'USD' ? datos.seguro_usd : datos.seguro_usd * datos.tipo_cambio_ars_usd;

  const filasEntrada = [
    ['Precio FOB', formatearMoneda(fobMoneda, moneda)],
    ['Costo de envío', formatearMoneda(envioMoneda, moneda)],
    ['Seguro', formatearMoneda(seguroMoneda, moneda)],
    ['Base CIF', formatearMoneda(cifMoneda, moneda)],
    ['Cantidad de productos', formatearNumero(datos.cantidad_productos)],
    ['Máx. productos idénticos', formatearNumero(datos.max_unidades_misma_especie)],
    ['NCM', datos.ncm || 'No especificado (usa máximo 35%)'],
    ['Derecho importación %', datos.derecho_importacion_pct ? `${datos.derecho_importacion_pct}%` : 'Automático por NCM'],
    ['Impuestos internos %', `${datos.impuestos_internos_pct}%`],
    ['Tipo de cambio (ARS/USD)', formatearNumero(datos.tipo_cambio_ars_usd)],
    ['Envíos usados este año', formatearNumero(datos.envios_usados_este_anio)],
    ['Envío incluye impuestos (DDP)', datos.envio_incluye_impuestos_ddp ? 'Sí' : 'No'],
    ['Requiere organismo externo', datos.requiere_organismo_externo ? 'Sí' : 'No'],
    ['Algún bulto > 50 kg', datos.algun_bulto_supera_50kg ? 'Sí' : 'No'],
  ];

  autoTable(doc, {
    startY: y,
    head: [['Concepto', 'Valor']],
    body: filasEntrada,
    theme: 'striped',
    headStyles: { fillColor: [30, 58, 138], textColor: 255, fontSize: 9, fontStyle: 'bold' },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: margin, right: margin },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 80 }, 1: { cellWidth: 'auto' } },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // ===== RESUMEN POR RÉGIMEN =====
  y = agregarSeccion('2. Resumen por régimen', y);

  const filasResumen = resultado.regímenes.map((r) => {
    const esc = escenario === 'conservador' ? r.escenario_conservador : r.escenario_minimo;
    if (!esc) return [r.regimen_nombre, 'No elegible', '—', '—', '—'];

    const esMasBarato = r.regimen_id === resultado.regimen_mas_barato_elegible;
    const costoTotal = formatearMonto(esc.costo_total_puesto_pais_usd, esc.costo_total_puesto_pais_ars, moneda, factor);
    const impuestos = formatearMonto(esc.total_impuestos_usd, esc.total_impuestos_ars, moneda, factor);
    const pctCif = formatearPorcentaje(esc.pct_sobre_cif);
    const costoUnidad = esc.costo_por_unidad_usd != null
      ? formatearMonto(esc.costo_por_unidad_usd, esc.costo_por_unidad_ars ?? 0, moneda, factor)
      : '—';

    return [
      r.regimen_nombre + (esMasBarato ? ' ★' : ''),
      r.elegibilidad.elegible === true ? 'Elegible' : r.elegibilidad.elegible === false ? 'No elegible' : 'Con advertencias',
      costoTotal,
      impuestos,
      pctCif,
      costoUnidad,
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [['Régimen', 'Elegibilidad', 'Costo total', 'Impuestos', '% CIF', 'Costo/unidad']],
    body: filasResumen,
    theme: 'striped',
    headStyles: { fillColor: [30, 58, 138], textColor: 255, fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: margin, right: margin },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 55 },
      1: { cellWidth: 28 },
      2: { cellWidth: 28, halign: 'right' },
      3: { cellWidth: 28, halign: 'right' },
      4: { cellWidth: 20, halign: 'right' },
      5: { cellWidth: 28, halign: 'right' },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // ===== DETALLE DE IMPUESTOS POR RÉGIMEN =====
  for (const regimen of resultado.regímenes) {
    const esc = escenario === 'conservador' ? regimen.escenario_conservador : regimen.escenario_minimo;
    if (!esc || esc.tributos.length === 0) continue;

    // Salto de página si no hay espacio
    if (y > 250) {
      doc.addPage();
      y = margin;
    }

    y = agregarSeccion(`3. Detalle: ${regimen.regimen_nombre}`, y);

    // Estado de elegibilidad
    const elegibilidadTexto =
      regimen.elegibilidad.elegible === true
        ? '✓ Elegible'
        : regimen.elegibilidad.elegible === false
        ? '✗ No elegible'
        : '⚠ Elegible con advertencias';

    agregarTexto(elegibilidadTexto, margin, y, { fontSize: 9, fontStyle: 'bold' });
    y += 5;

    if (regimen.elegibilidad.motivos.length > 0) {
      agregarTexto('Motivos:', margin, y, { fontSize: 8, fontStyle: 'bold' });
      y += 4;
      regimen.elegibilidad.motivos.forEach((m) => {
        agregarTexto(`• ${m}`, margin + 4, y, { fontSize: 8, color: [185, 28, 28] });
        y += 4;
      });
    }
    if (regimen.elegibilidad.advertencias.length > 0) {
      agregarTexto('Advertencias:', margin, y, { fontSize: 8, fontStyle: 'bold' });
      y += 4;
      regimen.elegibilidad.advertencias.forEach((a) => {
        agregarTexto(`• ${a}`, margin + 4, y, { fontSize: 8, color: [180, 83, 9] });
        y += 4;
      });
    }
    y += 3;

    // Tabla de tributos
    const filasTributos = esc.tributos.map((t: TributoDetalle) => {
      const alicuota = t.alicuota_pct > 0 ? formatearPorcentaje(t.alicuota_pct) : '—';
      const base = formatearUSD(t.base_usd);
      const importe = moneda === 'USD' ? formatearUSD(t.monto_usd) : formatearARS(t.monto_ars * factor);
      const tipo = t.tipo === 'impuesto' ? 'Impuesto' : t.tipo === 'cargo' ? 'Cargo' : 'Informativo';
      const notas: string[] = [];
      if (t.a_confirmar) notas.push('A confirmar');
      if (t.es_estimado_maximo) notas.push('Máx. estimado');
      if (t.rango_min_pct != null && t.rango_max_pct != null && t.rango_min_pct !== t.rango_max_pct) {
        notas.push(`Rango: ${formatearPorcentaje(t.rango_min_pct)}–${formatearPorcentaje(t.rango_max_pct)}`);
      }
      return [t.nombre, base, alicuota, importe, tipo, notas.join('; ') || '—'];
    });

    // Filas de totales
    filasTributos.push([
      'TOTAL IMPUESTOS',
      '',
      '',
      formatearMonto(esc.total_impuestos_usd, esc.total_impuestos_ars, moneda, factor),
      '',
      '',
    ]);
    if ((esc.total_cargos_usd ?? 0) > 0) {
      filasTributos.push([
        'TOTAL CARGOS OPERATIVOS',
        '',
        '',
        formatearMonto(esc.total_cargos_usd ?? 0, esc.total_cargos_ars ?? 0, moneda, factor),
        '',
        '',
      ]);
    }
    filasTributos.push([
      'COSTO TOTAL PUERTO PAÍS',
      '',
      '',
      formatearMonto(esc.costo_total_puesto_pais_usd, esc.costo_total_puesto_pais_ars, moneda, factor),
      '',
      '',
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Tributo', 'Base (USD)', 'Alícuota', `Importe (${getMonedaSimbolo(moneda)})`, 'Tipo', 'Notas']],
      body: filasTributos,
      theme: 'striped',
      headStyles: { fillColor: [30, 58, 138], textColor: 255, fontSize: 7, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: margin, right: margin },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 45 },
        1: { cellWidth: 22, halign: 'right' },
        2: { cellWidth: 18, halign: 'center' },
        3: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
        4: { cellWidth: 18, halign: 'center' },
        5: { cellWidth: 'auto', fontStyle: 'italic', fontSize: 6 },
      },
      didParseCell: (hook) => {
        if (hook.row.index >= filasTributos.length - 3) {
          hook.cell.styles.fontStyle = 'bold';
          hook.cell.styles.fillColor = [240, 240, 240];
        }
      },
    });

    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ===== PIE DE PÁGINA =====
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `TotalImport - Calculadora de Impuestos de Importación | Página ${i} de ${totalPages}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'center' }
    );
    doc.text(
      'Estimación orientativa. No constituye asesoramiento profesional. Verifique con su despachante/courier.',
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 4,
      { align: 'center' }
    );
  }

  return doc;
}

export function descargarPDF(opciones: PDFGenerationOptions): void {
  const doc = generarPDF(opciones);
  const fecha = new Date().toISOString().split('T')[0];
  const nombreArchivo = `cotizacion-importacion-${fecha}.pdf`;
  doc.save(nombreArchivo);
}