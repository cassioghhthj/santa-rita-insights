import { useQuery } from "@tanstack/react-query";
import { supabase, EMPRESA_ID, supabaseConfigured } from "@/lib/supabase";

export interface ComprasData {
  series: { data: string; total: number }[];
  byClasse: { classe: string; total: number }[];
  topFornecedores: { fornecedor: string; total: number; notas: number }[];
  totalPeriodo: number;
  numCompras: number;
  ticketMedio: number;
}

async function fetchCompras(from: string, to: string): Promise<ComprasData> {
  const { data, error } = await supabase
    .from("compras_analitico")
    .select("data, classe_nome, fornecedor_nome, compra_id, valor_total")
    .eq("empresa_id", EMPRESA_ID)
    .gte("data", from)
    .lte("data", to);

  if (error) throw error;

  const seriesMap = new Map<string, number>();
  const classeMap = new Map<string, number>();
  const fornMap = new Map<string, { total: number; notas: Set<string> }>();
  const comprasSet = new Set<string>();
  let totalPeriodo = 0;

  for (const r of data ?? []) {
    const v = Number(r.valor_total ?? 0);
    totalPeriodo += v;
    if (r.data) seriesMap.set(r.data, (seriesMap.get(r.data) ?? 0) + v);
    const classe = r.classe_nome ?? "—";
    classeMap.set(classe, (classeMap.get(classe) ?? 0) + v);
    const forn = r.fornecedor_nome ?? "—";
    const cur = fornMap.get(forn) ?? { total: 0, notas: new Set<string>() };
    cur.total += v;
    if (r.compra_id) cur.notas.add(r.compra_id);
    fornMap.set(forn, cur);
    if (r.compra_id) comprasSet.add(r.compra_id);
  }

  const series = [...seriesMap.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([data, total]) => ({ data, total }));
  const byClasse = [...classeMap.entries()]
    .map(([classe, total]) => ({ classe, total }))
    .sort((a, b) => b.total - a.total);
  const topFornecedores = [...fornMap.entries()]
    .map(([fornecedor, v]) => ({ fornecedor, total: v.total, notas: v.notas.size }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 20);

  const numCompras = comprasSet.size;
  return {
    series,
    byClasse,
    topFornecedores,
    totalPeriodo,
    numCompras,
    ticketMedio: numCompras ? totalPeriodo / numCompras : 0,
  };
}

export function useCompras(from: string, to: string) {
  return useQuery({
    queryKey: ["compras", from, to],
    queryFn: () => fetchCompras(from, to),
    enabled: supabaseConfigured && Boolean(from && to),
    staleTime: 60_000,
  });
}
