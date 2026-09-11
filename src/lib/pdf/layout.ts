import type jsPDF from "jspdf";

export const EMPRESA = "Supermercado Santa Rita";

export type RGB = [number, number, number];

export const GREEN: RGB = [22, 133, 84];
export const GREEN_SOFT: RGB = [230, 246, 238];
export const RED: RGB = [193, 53, 43];
export const RED_SOFT: RGB = [253, 235, 233];
export const AMBER: RGB = [176, 112, 20];
export const AMBER_SOFT: RGB = [253, 245, 228];
export const SLATE: RGB = [51, 65, 85];
export const SLATE_SOFT: RGB = [241, 245, 249];
export const MUTED: RGB = [120, 130, 145];
export const LINE: RGB = [225, 229, 236];

export function fmtDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR");
}

export function periodoExtenso(period: { from: string; to: string; month?: string }) {
  if (period.month) {
    const [y, m] = period.month.split("-").map(Number);
    const label = new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }
  return `${fmtDate(period.from)} a ${fmtDate(period.to)}`;
}

export function slug(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function drawKpi(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value: string,
  color: RGB,
  soft: RGB,
  big = false,
  sub?: string,
) {
  doc.setFillColor(...soft);
  doc.roundedRect(x, y, w, h, 2.5, 2.5, "F");
  doc.setFillColor(...color);
  doc.roundedRect(x, y, 2, h, 1, 1, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  doc.text(label.toUpperCase(), x + 6, y + 7);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(big ? 16 : 13);
  doc.setTextColor(...color);
  doc.text(value, x + 6, y + h - (sub ? 10 : 6));

  if (sub) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(sub, x + 6, y + h - 4);
  }
}

/** Dark header band. Returns the Y coordinate where content can start. */
export function drawHeader(doc: jsPDF, subtitulo: string, periodo: string, agora: string) {
  const W = doc.internal.pageSize.getWidth();
  doc.setFillColor(17, 34, 28);
  doc.rect(0, 0, W, 30, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text(EMPRESA, 14, 13);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(198, 214, 205);
  doc.text(subtitulo, 14, 19.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(periodo, 14, 26);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(198, 214, 205);
  doc.text(`Gerado em ${agora}`, W - 14, 26, { align: "right" });
  return 38;
}

export function drawFooter(doc: jsPDF, agora: string, nota?: string) {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.3);
    doc.line(14, H - 16, W - 14, H - 16);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(`Gerado por Santa Rita Insights em ${agora}`, 14, H - 11);
    doc.text(`Página ${i} de ${pages}`, W - 14, H - 11, { align: "right" });
    if (nota) doc.text(nota, 14, H - 7);
  }
}
