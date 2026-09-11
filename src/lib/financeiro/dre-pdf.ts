import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { DreLinha, DreResult } from "@/lib/queries/dre";
import { brl } from "@/lib/format";
import {
  AMBER,
  AMBER_SOFT,
  GREEN,
  GREEN_SOFT,
  LINE,
  MUTED,
  RED,
  RED_SOFT,
  SLATE,
  SLATE_SOFT,
  drawFooter,
  drawHeader,
  drawKpi,
  periodoExtenso,
  slug,
  type RGB,
} from "@/lib/pdf/layout";

export { periodoExtenso };

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
    head: [[{ content: titulo, colSpan: 2 }, brl(total)]],
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
      if (data.section === "head" && data.column.index === 0) data.cell.styles.cellWidth = "auto";
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
  provisionadas?: { linhas: { codigo_id: string; codigo: string; nome: string; valor: number }[]; total: number } | null,
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const periodo = periodoExtenso(period);
  const agora = new Date().toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

  let y = drawHeader(
    doc,
    "DRE — Demonstrativo de Resultado (Regime de Caixa)",
    periodo,
    agora,
  );

  // KPIs
  const positivo = data.resultado >= 0;
  const gap = 4;
  const cardW = (W - 28 - gap * 2) / 3;
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
    data.margem != null ? `${data.margem.toFixed(1).replace(".", ",")}%` : "—",
    SLATE,
    SLATE_SOFT,
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
  y = secao(doc, y, "Retiradas de Lucro", data.retiradas, data.totalRetiradas, AMBER, AMBER_SOFT);

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
  y += 24;

  // Despesas provisionadas + resultado real projetado
  if (provisionadas && provisionadas.total > 0) {
    if (y > H - 70) {
      doc.addPage();
      y = 20;
    }
    y = secao(
      doc,
      y,
      "Despesas Provisionadas (Não Pagas)",
      provisionadas.linhas.map((l) => ({
        codigo_id: l.codigo_id,
        codigo: l.codigo,
        nome: l.nome,
        tipo: "despesa",
        credito: 0,
        debito: 0,
        net: 0,
        valor: l.valor,
      })),
      provisionadas.total,
      AMBER,
      AMBER_SOFT,
    );

    const real = data.resultado - provisionadas.total;
    const margemReal = data.totalReceita > 0 ? (real / data.totalReceita) * 100 : null;
    if (y > H - 34) {
      doc.addPage();
      y = 20;
    }
    doc.setDrawColor(...AMBER);
    doc.setLineWidth(0.6);
    doc.setLineDashPattern([1.5, 1.5], 0);
    doc.roundedRect(14, y, W - 28, 24, 2.5, 2.5, "S");
    doc.setLineDashPattern([], 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...SLATE);
    doc.text("RESULTADO DO PERÍODO REAL", 20, y + 9);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...MUTED);
    doc.text("Projeção: considera despesas provisionadas ainda não pagas.", 20, y + 14.5);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(...(real >= 0 ? GREEN : RED));
    doc.text(brl(real), W - 20, y + 10.5, { align: "right" });
    if (margemReal != null) {
      doc.setFontSize(9);
      doc.text(`(${margemReal.toFixed(1).replace(".", ",")}%)`, W - 20, y + 16, { align: "right" });
    }
    y += 30;
  }

  drawFooter(
    doc,
    agora,
    data.naoClassificados > 0
      ? `${data.naoClassificados} lançamento(s) não classificado(s) não incluído(s) neste demonstrativo.`
      : undefined,
  );

  doc.save(`DRE-SantaRita-${slug(periodo)}.pdf`);
}
