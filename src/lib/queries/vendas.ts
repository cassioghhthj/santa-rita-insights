import { useQuery } from "@tanstack/react-query";
import { supabase, EMPRESA_ID, supabaseConfigured } from "@/lib/supabase";
import { fetchAllPages } from "@/lib/queries/paginate";

export interface VendasData {
  series: { data: string; total: number }[];
  byPagamento: { forma: string; total: number }[];
  byPdv: { pdv: number; total: number; descontos: number }[];
  topProdutos: { codigo: string; produto: string; total: number }[];
  totalPeriodo: number;
}

async function fetchVendas(from: string, to: string): Promise<VendasData> {
  const [pdvRows, pagRows, prodRows] = await Promise.all([
    fetchAllPages<{
      data: string;
      pdv: number;
      total_venda: number | null;
      desconto_concedido: number | null;
    }>((a, b) =>
      supabase
        .from("vendas_por_pdv")
        .select("data, pdv, total_venda, desconto_concedido")
        .eq("empresa_id", EMPRESA_ID)
        .gte("data", from)
        .lte("data", to)
        .order("id", { ascending: true })
        .range(a, b),
    ),
    fetchAllPages<{ data: string; forma_pagamento: string | null; valor_vendido: number | null }>(
      (a, b) =>
        supabase
          .from("vendas_por_forma_pagamento")
          .select("data, forma_pagamento, valor_vendido")
          .eq("empresa_id", EMPRESA_ID)
          .gte("data", from)
          .lte("data", to)
          .order("id", { ascending: true })
          .range(a, b),
    ),
    fetchAllPages<{
      codigo_produto: string | null;
      produto: string | null;
      total_vendido: number | null;
      data: string;
    }>((a, b) =>
      supabase
        .from("vendas_por_produto")
        .select("codigo_produto, produto, total_vendido, data")
        .eq("empresa_id", EMPRESA_ID)
        .gte("data", from)
        .lte("data", to)
        .order("id", { ascending: true })
        .range(a, b),
    ),
  ]);

  const pdvRes = { data: pdvRows };
  const pagRes = { data: pagRows };
  const prodRes = { data: prodRows };


  const seriesMap = new Map<string, number>();
  const pdvMap = new Map<number, { total: number; descontos: number }>();
  for (const r of pdvRes.data ?? []) {
    const v = Number(r.total_venda ?? 0);
    seriesMap.set(r.data, (seriesMap.get(r.data) ?? 0) + v);
    const cur = pdvMap.get(r.pdv) ?? { total: 0, descontos: 0 };
    cur.total += v;
    cur.descontos += Number(r.desconto_concedido ?? 0);
    pdvMap.set(r.pdv, cur);
  }
  const series = [...seriesMap.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([data, total]) => ({ data, total }));
  const byPdv = [...pdvMap.entries()]
    .map(([pdv, v]) => ({ pdv, ...v }))
    .sort((a, b) => b.total - a.total);

  const pagMap = new Map<string, number>();
  for (const r of pagRes.data ?? []) {
    pagMap.set(
      r.forma_pagamento ?? "—",
      (pagMap.get(r.forma_pagamento ?? "—") ?? 0) + Number(r.valor_vendido ?? 0),
    );
  }
  const byPagamento = [...pagMap.entries()]
    .map(([forma, total]) => ({ forma, total }))
    .sort((a, b) => b.total - a.total);

  const prodMap = new Map<string, { produto: string; total: number }>();
  for (const r of prodRes.data ?? []) {
    const key = r.codigo_produto ?? r.produto ?? "—";
    const cur = prodMap.get(key) ?? { produto: r.produto ?? "—", total: 0 };
    cur.total += Number(r.total_vendido ?? 0);
    prodMap.set(key, cur);
  }
  const topProdutos = [...prodMap.entries()]
    .map(([codigo, v]) => ({ codigo, ...v }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 20);

  return {
    series,
    byPagamento,
    byPdv,
    topProdutos,
    totalPeriodo: series.reduce((a, r) => a + r.total, 0),
  };
}

export function useVendas(from: string, to: string) {
  return useQuery({
    queryKey: ["vendas", from, to],
    queryFn: () => fetchVendas(from, to),
    enabled: supabaseConfigured && Boolean(from && to),
    staleTime: 60_000,
  });
}
