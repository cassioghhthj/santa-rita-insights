import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { DreLinha, DreResult } from "@/lib/queries/dre";
import { brl } from "@/lib/format";

const EMPRESA = "Supermercado Santa Rita";

type RGB = [number, number, number];

const GREEN: RGB = [22, 133, 84];
const GREEN_SOFT: RGB = [230, 246, 238];
const RED: RGB = [193, 53, 43];
const RED_SOFT: RGB = [253, 235, 233];
const AMBER: RGB = [176, 112, 20];
const AMBER_SOFT: RGB = [253, 245, 228];
const SLATE: RGB = [51, 65, 85];
const MUTED: RGB = [120, 130, 145];
const LINE: RGB = [225, 229, 236];

function fmtDate(iso: string) {
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

function slug(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function drawKpi(
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
  doc.text(value, x + 6, y + h - 6);
}

function secao(
  doc: jsPDF,
  startY: number,
  titulo: string,
  linhas: DreLinha[],
  total: number,
  color: RGB,
  soft: RGB,
) {
  const body = linhas.length
    ? linhas.map((l) => [l.codigo, l.nome, brl(l.valor)])
    : [["—", "Sem lançamentos no período.", brl(0)]];

  autoTable(doc, {
    startY,
    margin: { left: 14, right: 14 },
    head: [[titulo, "", brl(total)]],
    body,
    theme: "plain",
    styles: { font: "helvetica", fontSize: 8.5, cellPadding: { top: 2, bottom: 2, left: 3, right: 3 } },
    headStyles: {
      fillColor: soft,
      textColor: color,
      fontStyle: "bold",
      fontSize: 10,
      cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
    },
    bodyStyles: { textColor: SLATE },
    alternateRowStyles: { fillColor: [250, 251, 252] },
    columnStyles: {
      0: { cellWidth: 22, textColor: MUTED },
      1: { cellWidth: "auto" },
      2: { cellWidth: 34, halign: "right" },
    },
    didParseCell: (data) => {
      if (data.section === "head" && data.column.index === 2) data.cell.styles.halign = "right";
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const endY = (doc as any).lastAutoTable.finalY as number;
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.3);
  doc.line(14, endY + 1, doc.internal.pageSize.getWidth() - 14, endY + 1);
  return endY + 8;
}

export function gerarDrePdf(
  data: DreResult,
  period: { from: string; to: string; month?: string },
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const periodo = periodoExtenso(period);
  const agora = new Date().toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

  // Cabeçalho
  doc.setFillColor(17, 34, 28);
  doc.rect(0, 0, W, 30, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text(EMPRESA, 14, 13);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(198, 214, 205);
  doc.text("DRE — Demonstrativo de Resultado (Regime de Caixa)", 14, 19.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(periodo, 14, 26);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(198, 214, 205);
  doc.text(`Gerado em ${agora}`, W - 14, 26, { align: "right" });

  // KPIs
  const positivo = data.resultado >= 0;
  const gap = 4;
  const cardW = (W - 28 - gap * 2) / 3;
  let y = 38;
  drawKpi(doc, 14, y, cardW, 22, "Receita do período", brl(data.totalReceita), GREEN, GREEN_SOFT);
  drawKpi(
    doc,
    14 + cardW + gap,
    y,
    cardW,
    22,
    "Despesa do período",
    brl(data.totalDespesa + data.totalRetiradas),
    RED,
    RED_SOFT,
  );
  drawKpi(
    doc,
    14 + (cardW + gap) * 2,
    y,
    cardW,
    22,
    "Margem",
    data.margem != null ? `${data.margem.toFixed(1)}%` : "—",
    SLATE,
    [241, 245, 249],
  );

  y += 26;
  drawKpi(
    doc,
    14,
    y,
    W - 28,
    26,
    "Resultado do período",
    brl(data.resultado),
    positivo ? GREEN : RED,
    positivo ? GREEN_SOFT : RED_SOFT,
    true,
  );

  y += 34;
  y = secao(doc, y, "Receitas", data.receitas, data.totalReceita, GREEN, GREEN_SOFT);
  y = secao(doc, y, "Despesas", data.despesas, data.totalDespesa, RED, RED_SOFT);
  y = secao(
    doc,
    y,
    "Retiradas de Lucro",
    data.retiradas,
    data.totalRetiradas,
    AMBER,
    AMBER_SOFT,
  );

  // Resultado final em destaque
  if (y > H - 40) {
    doc.addPage();
    y = 20;
  }
  doc.setFillColor(...(positivo ? GREEN_SOFT : RED_SOFT));
  doc.roundedRect(14, y, W - 28, 16, 2.5, 2.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...SLATE);
  doc.text("RESULTADO DO PERÍODO", 20, y + 10);
  doc.setFontSize(15);
  doc.setTextColor(...(positivo ? GREEN : RED));
  doc.text(brl(data.resultado), W - 20, y + 10.5, { align: "right" });

  // Rodapé
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
    if (data.naoClassificados > 0) {
      doc.text(
        `${data.naoClassificados} lançamento(s) não classificado(s) não incluído(s) neste demonstrativo.`,
        14,
        H - 7,
      );
    }
  }

  doc.save(`DRE-SantaRita-${slug(periodo)}.pdf`);
}
