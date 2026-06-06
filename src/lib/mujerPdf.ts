import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { differenceInYears } from "date-fns";
import type { Mujer } from "@/lib/mujeresStore";
import { formatDate } from "@/lib/utils";

const PRIMARY: [number, number, number] = [147, 51, 234]; // purple-600
const LIGHT: [number, number, number] = [243, 232, 255]; // purple-100
const TEXT: [number, number, number] = [40, 40, 40];
const MUTED: [number, number, number] = [110, 110, 110];

const origenLabel = (o?: string) =>
  o === "trabajo-campo" ? "Trabajo de Campo" : o === "derivacion" ? "Derivación" : "Centro de Día";

const calcEdad = (fecha?: string) => {
  if (!fecha) return null;
  try {
    return differenceInYears(new Date(), new Date(fecha));
  } catch {
    return null;
  }
};

const val = (v?: string | number | null) => {
  if (v === null || v === undefined || v === "") return "—";
  return String(v);
};

const validarArrayBufferPdf = (buffer: ArrayBuffer) => {
  if (!(buffer instanceof ArrayBuffer) || buffer.byteLength === 0) {
    throw new Error("El PDF generado está vacío");
  }
  const head = new Uint8Array(buffer.slice(0, 5));
  const sig = String.fromCharCode(...head);
  if (!sig.startsWith("%PDF")) {
    throw new Error("El archivo generado no es un PDF válido");
  }
};

export const descargarPdfGenerado = (doc: jsPDF, filename: string) => {
  const buffer = doc.output("arraybuffer");
  validarArrayBufferPdf(buffer);

  const blob = new Blob([buffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  link.style.position = "fixed";
  link.style.left = "-9999px";
  link.style.top = "0";

  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);

  return { filename, bytes: buffer.byteLength };
};

export function generarFichaMujerPDF(mujer: Mujer) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 40;
  let y = 0;

  // Header
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, pageWidth, 90, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  const nombreCompleto = `${mujer.nombre || mujer.apodo || ""} ${mujer.apellido || ""}`.trim() || "Participante";
  doc.text(nombreCompleto, marginX, 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Ficha de Participante  •  ${origenLabel(mujer.origenRegistro)}`, marginX, 60);
  const edad = calcEdad(mujer.fechaNacimiento);
  doc.text(
    `Generado: ${formatDate(new Date().toISOString().split("T")[0])}${edad !== null ? `  •  ${edad} años` : ""}`,
    marginX,
    76
  );

  y = 110;
  doc.setTextColor(...TEXT);

  const section = (titulo: string) => {
    if (y > pageHeight - 80) {
      doc.addPage();
      y = 50;
    }
    doc.setFillColor(...LIGHT);
    doc.rect(marginX, y, pageWidth - marginX * 2, 22, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...PRIMARY);
    doc.text(titulo, marginX + 10, y + 15);
    y += 30;
    doc.setTextColor(...TEXT);
  };

  const tabla = (rows: [string, string][]) => {
    autoTable(doc, {
      startY: y,
      theme: "plain",
      margin: { left: marginX, right: marginX },
      styles: { fontSize: 10, cellPadding: 4, textColor: TEXT },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 160, textColor: MUTED },
        1: { cellWidth: "auto" },
      },
      body: rows.map(([k, v]) => [k, v]),
    });
    // @ts-ignore
    y = (doc as any).lastAutoTable.finalY + 14;
  };

  // Datos personales
  section("Datos Personales");
  tabla([
    ["Nombre", val(mujer.nombre)],
    ["Apellido", val(mujer.apellido)],
    ["Apodo", val(mujer.apodo)],
    ["Fecha de nacimiento", mujer.fechaNacimiento ? formatDate(mujer.fechaNacimiento) : "—"],
    ["Edad", edad !== null ? `${edad} años` : "—"],
    ["Nacionalidad", val(mujer.nacionalidad)],
    ["Alfabetizada", mujer.alfabetizada ? "Sí" : "No"],
    ["Descripción / Rasgos", val(mujer.descripcionRasgos)],
  ]);

  // Contacto
  section("Contacto");
  tabla([
    ["Teléfono", val(mujer.telefono)],
    ["Email", val(mujer.email)],
    ["Dirección", val(mujer.direccion)],
    ["Parada / Zona", val(mujer.paradaZona)],
    ["Persona de contacto / referencia", val(mujer.personaContactoReferencia)],
  ]);

  // Documentación y residencia
  section("Documentación y Residencia");
  tabla([
    ["Tiene documentación", mujer.tieneDocumentacion ? "Sí" : "No"],
    ["Tipo de documentación", val(mujer.tipoDocumentacion)],
    ["Tipo de residencia", val(mujer.tipoResidencia)],
  ]);

  // Situación social
  section("Situación Social");
  tabla([
    ["Tipo de vivienda", val(mujer.viviendaTipo)],
    ["Contrato de vivienda", val(mujer.viviendaContrato)],
    ["Ayuda habitacional", val(mujer.ayudaHabitacional)],
    ["Cobertura de salud", val(mujer.coberturaSalud)],
    ["Aporte previsional", val(mujer.aportePrevisional)],
  ]);

  // Hijos a cargo
  section("Hijos a Cargo");
  if (mujer.hijosACargo && mujer.hijosDetalle && mujer.hijosDetalle.length > 0) {
    autoTable(doc, {
      startY: y,
      margin: { left: marginX, right: marginX },
      headStyles: { fillColor: PRIMARY, textColor: 255 },
      styles: { fontSize: 10, cellPadding: 5 },
      head: [["#", "Nombre", "Fecha de nacimiento", "Edad", "CUIL"]],
      body: mujer.hijosDetalle.map((h, i) => {
        const e = calcEdad(h.fechaNacimiento);
        return [
          String(i + 1),
          val(h.nombre),
          h.fechaNacimiento ? formatDate(h.fechaNacimiento) : "—",
          e !== null ? `${e}` : "—",
          val(h.cuil),
        ];
      }),
    });
    // @ts-ignore
    y = (doc as any).lastAutoTable.finalY + 8;
    doc.setFontSize(10);
    doc.setTextColor(...MUTED);
    doc.text(`Total de hijos a cargo: ${mujer.hijosDetalle.length}`, marginX, y);
    y += 16;
    doc.setTextColor(...TEXT);
  } else {
    doc.setFontSize(10);
    doc.setTextColor(...MUTED);
    doc.text(mujer.hijosACargo ? "Sí, sin detalle cargado." : "No tiene hijos a cargo.", marginX, y);
    y += 16;
    doc.setTextColor(...TEXT);
  }

  // Historia / observaciones
  const longText = (label: string, text?: string) => {
    if (!text) return;
    section(label);
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(text, pageWidth - marginX * 2);
    if (y + lines.length * 13 > pageHeight - 60) {
      doc.addPage();
      y = 50;
    }
    doc.text(lines, marginX, y);
    y += lines.length * 13 + 10;
  };

  longText("Observaciones de la historia", mujer.observacionesHistoria);
  longText("Observaciones generales", mujer.observaciones);

  // Primer contacto
  if (mujer.fechaPrimerContacto || mujer.fechaRegistro) {
    section("Registro");
    tabla([
      ["Fecha de primer contacto", mujer.fechaPrimerContacto ? formatDate(mujer.fechaPrimerContacto) : "—"],
      ["Fecha de registro", mujer.fechaRegistro ? formatDate(mujer.fechaRegistro) : "—"],
      ["Origen del registro", origenLabel(mujer.origenRegistro)],
    ]);
  }

  // Acompañamientos
  section("Acompañamientos");
  const acomps = (mujer.acompanamientos || []).slice().sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
  if (acomps.length === 0) {
    doc.setFontSize(10);
    doc.setTextColor(...MUTED);
    doc.text("Sin acompañamientos registrados.", marginX, y);
    y += 16;
    doc.setTextColor(...TEXT);
  } else {
    autoTable(doc, {
      startY: y,
      margin: { left: marginX, right: marginX },
      headStyles: { fillColor: PRIMARY, textColor: 255 },
      styles: { fontSize: 10, cellPadding: 5, valign: "top" },
      columnStyles: {
        0: { cellWidth: 75 },
        1: { cellWidth: 140 },
        2: { cellWidth: "auto" },
      },
      head: [["Fecha", "Equipo", "Notas"]],
      body: acomps.map((a) => [
        a.fecha ? formatDate(a.fecha) : "—",
        (a.equipo || []).join(", ") || "—",
        a.notas || "—",
      ]),
    });
    // @ts-ignore
    y = (doc as any).lastAutoTable.finalY + 8;
    doc.setFontSize(10);
    doc.setTextColor(...MUTED);
    doc.text(`Total de acompañamientos: ${acomps.length}`, marginX, y);
    doc.setTextColor(...TEXT);
  }

  // Footer páginas
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(
      `Ficha de ${nombreCompleto}  •  Página ${i} de ${total}`,
      pageWidth / 2,
      pageHeight - 20,
      { align: "center" }
    );
  }

  const slug = nombreCompleto.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "participante";
  const filename = `ficha-${slug}.pdf`;
  return { doc, filename };
}
