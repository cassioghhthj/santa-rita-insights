import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { VendasData } from "@/lib/queries/vendas";
import { brl } from "@/lib/format";
import {
  GREEN,
  GREEN_SOFT,
  LINE,
  MUTED,
  SLATE,
  SLATE_SOFT,
  drawFooter,
  drawHeader,
  drawKpi,
  periodoExtenso,
  slug,
  type RGB,
} from "@/lib/pdf/layout";

const BLUE: RGB = [30, 90, 150];
const BLUE_SOFT: RGB = [232, 240, 250];

function pctStr(v: number, total: number) {
  if (!total) return "—";
  return `${((v / total) * 100).toFixed(1).replace(".", ",")}%`;
}

function tabela(
  doc: jsPDF,
  startY: number,
  titulo: string,
  head: string[],
  body: (string | number)[][],
  totalLabel: string,
  color: RGB,
  soft: RGB,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columnStyles: any,
) {
  autoTable(doc, {
    startY,
    margin: { left: 14, right: 14 },
    head: [
      [{ content: titulo, colSpan: Math.max(head.length - 1, 1) }, totalLabel],
      head,
    ],
    body: body.length ? body : [["—", "Sem dados no período.", "", ""].slice(0, head.length)],
    theme: "plain",
    styles: {
      font: "helvetica",
      fontSize: 8.5,
      cellPadding: { top: 2, bottom: 2, left: 3, right: 3 },
    },
    headStyles: {
      fillColor: soft,
      textColor: color,
      fontStyle: "bold",
      fontSize: 8.5,
    },
    bodyStyles: { textColor: SLATE },
    alternateRowStyles: { fillColor: [250, 251, 252] },
    columnStyles,
    didParseCell: (data) => {
      if (data.section === "head" && data.row.index === 0) {
        data.cell.styles.fontSize = 10;
        data.cell.styles.overflow = "visible";
        data.cell.styles.cellPadding = { top: 3, bottom: 3, left: 3, right: 3 };
        if (data.column.index === head.length - 1) data.cell.styles.halign = "right";
      }
      if (data.section === "head" && data.row.index === 1) {
        data.cell.styles.textColor = MUTED;
        data.cell.styles.fillColor = [255, 255, 255];
      }
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const endY = (doc as any).lastAutoTable.finalY as number;
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.3);
  doc.line(14, endY + 1, doc.internal.pageSize.getWidth() - 14, endY + 1);
  return endY + 8;
}

export function gerarVendasPdf(
  data: VendasData,
  period: { from: string; to: string; month?: string },
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const periodo = periodoExtenso(period);
  const agora = new Date().toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

  let y = drawHeader(doc, "Vendas — Relatório do período", periodo, agora);

  const dias = data.series.length;
  const ticket = dias ? data.totalPeriodo / dias : 0;
  const bestDay = data.series.reduce<{ data: string; total: number } | null>(
    (best, r) => (!best || r.total > best.total ? r : best),
    null,
  );

  const gap = 4;
  const cardW = (W - 28 - gap * 2) / 3;
  drawKpi(
    doc,
    14,
    y,
    cardW,
    24,
    "Total no período",
    brl(data.totalPeriodo),
    GREEN,
    GREEN_SOFT,
    false,
    `${dias} dia(s) com venda`,
  );
  drawKpi(
    doc,
    14 + cardW + gap,
    y,
    cardW,
    24,
    "Ticket médio diário",
    brl(ticket),
    BLUE,
    BLUE_SOFT,
    false,
    "média por dia",
  );
  drawKpi(
    doc,
    14 + (cardW + gap) * 2,
    y,
    cardW,
    24,
    "Melhor dia",
    brl(bestDay?.total ?? 0),
    SLATE,
    SLATE_SOFT,
    false,
    bestDay ? new Date(bestDay.data + "T00:00:00").toLocaleDateString("pt-BR") : "—",
  );
  y += 32;

  const totalPag = data.byPagamento.reduce((a, r) => a + r.total, 0);
  y = tabela(
    doc,
    y,
    "Por forma de pagamento",
    ["Forma de pagamento", "Valor", "% do total"],
    [...data.byPagamento]
      .sort((a, b) => b.total - a.total)
      .map((r) => [r.forma, brl(r.total), pctStr(r.total, totalPag)]),
    brl(totalPag),
    GREEN,
    GREEN_SOFT,
    {
      0: { cellWidth: "auto" },
      1: { cellWidth: 38, halign: "right" },
      2: { cellWidth: 30, halign: "right" },
    },
  );

  const totalPdv = data.byPdv.reduce((a, r) => a + r.total, 0);
  if (y > H - 50) {
    doc.addPage();
    y = 20;
  }
  y = tabela(
    doc,
    y,
    "Por PDV",
    ["PDV", "Valor", "% do total"],
    [...data.byPdv]
      .sort((a, b) => b.total - a.total)
      .map((r) => [`PDV ${r.pdv}`, brl(r.total), pctStr(r.total, totalPdv)]),
    brl(totalPdv),
    BLUE,
    BLUE_SOFT,
    {
      0: { cellWidth: "auto" },
      1: { cellWidth: 38, halign: "right" },
      2: { cellWidth: 30, halign: "right" },
    },
  );

  const top = data.topProdutos.slice(0, 15);
  if (top.length) {
    if (y > H - 110) {
      doc.addPage();
      y = 20;
    }
    y = tabela(
      doc,
      y,
      "Top 15 produtos",
      ["Código", "Produto", "Total vendido"],
      top.map((r) => [r.codigo, r.produto, brl(r.total)]),
      brl(top.reduce((a, r) => a + r.total, 0)),
      SLATE,
      SLATE_SOFT,
      {
        0: { cellWidth: 26, textColor: MUTED },
        1: { cellWidth: "auto" },
        2: { cellWidth: 38, halign: "right" },
      },
    );
  }

  drawFooter(doc, agora);
  doc.save(`Vendas-SantaRita-${slug(periodo)}.pdf`);
  return doc;
}
