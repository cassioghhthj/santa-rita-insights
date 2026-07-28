import { useQuery } from "@tanstack/react-query";
import { supabase, EMPRESA_ID, supabaseConfigured } from "@/lib/supabase";

export interface CaixaData {
  latestDate: string | null;
  saldoConsolidadoLatest: number;
  totalSangriasPeriodo: number;
  totalRecebimentosPeriodo: number;
  serieSaldo: { data: string; total: number }[];
  saldoPorContaLatest: { conta: string; saldo: number }[];
  transacoesLatest: {
    conta: string | null;
    descricao: string | null;
    forma_pagamento: string | null;
    valor_recebido: number;
    valor_pago: number;
  }[];
}

async function fetchCaixa(from: string, to: string): Promise<CaixaData> {
  const { data, error } = await supabase
    .from("conferencia_caixa")
    .select(
      "data, conta, descricao, forma_pagamento, valor_recebido, valor_pago, saldo, tipo_linha",
    )
    .eq("empresa_id", EMPRESA_ID)
    .gte("data", from)
    .lte("data", to)
    .limit(20000);
  if (error) throw error;

  const rows = data ?? [];
  let latestDate: string | null = null;
  for (const r of rows) {
    if (r.data && (!latestDate || r.data > latestDate)) latestDate = r.data;
  }

  const serieMap = new Map<string, number>();
  const contaLatestMap = new Map<string, number>();
  let totalSangrias = 0;
  let totalRecebimentos = 0;
  const transacoesLatest: CaixaData["transacoesLatest"] = [];

  for (const r of rows) {
    const isSaldoAtual = r.tipo_linha === "saldo" && r.descricao === "Saldo Atual";
    if (isSaldoAtual && r.data) {
      serieMap.set(r.data, (serieMap.get(r.data) ?? 0) + Number(r.saldo ?? 0));
      if (r.data === latestDate) {
        const key = r.conta ?? "—";
        contaLatestMap.set(key, (contaLatestMap.get(key) ?? 0) + Number(r.saldo ?? 0));
      }
    }
    if (r.tipo_linha === "transacao") {
      const conta = (r.conta ?? "").toUpperCase();
      if (conta.includes("SANGRIA")) totalSangrias += Number(r.valor_pago ?? 0);
      if (conta.includes("RECEBIMENTO")) totalRecebimentos += Number(r.valor_recebido ?? 0);
      if (r.data === latestDate) {
        transacoesLatest.push({
          conta: r.conta,
          descricao: r.descricao,
          forma_pagamento: r.forma_pagamento,
          valor_recebido: Number(r.valor_recebido ?? 0),
          valor_pago: Number(r.valor_pago ?? 0),
        });
      }
    }
  }

  const serieSaldo = [...serieMap.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([data, total]) => ({ data, total }));
  const saldoPorContaLatest = [...contaLatestMap.entries()]
    .map(([conta, saldo]) => ({ conta, saldo }))
    .sort((a, b) => b.saldo - a.saldo);
  const saldoConsolidadoLatest = saldoPorContaLatest.reduce((a, r) => a + r.saldo, 0);

  return {
    latestDate,
    saldoConsolidadoLatest,
    totalSangriasPeriodo: totalSangrias,
    totalRecebimentosPeriodo: totalRecebimentos,
    serieSaldo,
    saldoPorContaLatest,
    transacoesLatest,
  };
}

export function useCaixa(from: string, to: string) {
  return useQuery({
    queryKey: ["caixa", from, to],
    queryFn: () => fetchCaixa(from, to),
    enabled: supabaseConfigured && Boolean(from && to),
    staleTime: 60_000,
  });
}
