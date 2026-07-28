import { useQuery } from "@tanstack/react-query";
import { supabase, EMPRESA_ID, supabaseConfigured } from "@/lib/supabase";

interface OverviewData {
  latestDate: string | null;
  prevDate: string | null;
  totalVendasHoje: number;
  totalVendasOntem: number;
  totalComprasHoje: number;
  totalComprasOntem: number;
  saldoCaixaHoje: number;
  saldoCaixaOntem: number;
  contasReceber: number;
  contasReceberAnterior: number;
}

async function fetchOverview(): Promise<OverviewData> {
  // Descobrir a data mais recente disponível em vendas_por_pdv
  const { data: latestRow, error: latestErr } = await supabase
    .from("vendas_por_pdv")
    .select("data")
    .eq("empresa_id", EMPRESA_ID)
    .order("data", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latestErr) throw latestErr;

  const latestDate = latestRow?.data ?? null;
  if (!latestDate) {
    return {
      latestDate: null,
      prevDate: null,
      totalVendasHoje: 0,
      totalVendasOntem: 0,
      totalComprasHoje: 0,
      totalComprasOntem: 0,
      saldoCaixaHoje: 0,
      saldoCaixaOntem: 0,
      contasReceber: 0,
      contasReceberAnterior: 0,
    };
  }

  const prev = new Date(latestDate + "T00:00:00");
  prev.setDate(prev.getDate() - 1);
  const prevDate = prev.toISOString().slice(0, 10);

  const [vendasHoje, vendasOntem, comprasHoje, comprasOntem, caixaHoje, caixaOntem, crAtual] =
    await Promise.all([
      supabase
        .from("vendas_por_pdv")
        .select("total_venda")
        .eq("empresa_id", EMPRESA_ID)
        .eq("data", latestDate),
      supabase
        .from("vendas_por_pdv")
        .select("total_venda")
        .eq("empresa_id", EMPRESA_ID)
        .eq("data", prevDate),
      supabase
        .from("compras_analitico")
        .select("valor_total")
        .eq("empresa_id", EMPRESA_ID)
        .eq("data", latestDate),
      supabase
        .from("compras_analitico")
        .select("valor_total")
        .eq("empresa_id", EMPRESA_ID)
        .eq("data", prevDate),
      supabase
        .from("conferencia_caixa")
        .select("saldo, tipo_linha")
        .eq("empresa_id", EMPRESA_ID)
        .eq("data", latestDate)
        .eq("tipo_linha", "saldo"),
      supabase
        .from("conferencia_caixa")
        .select("saldo, tipo_linha")
        .eq("empresa_id", EMPRESA_ID)
        .eq("data", prevDate)
        .eq("tipo_linha", "saldo"),
      supabase
        .from("contas_a_receber")
        .select("saldo_devedor, data_referencia")
        .eq("empresa_id", EMPRESA_ID)
        .order("data_referencia", { ascending: false })
        .limit(5000),
    ]);

  const sum = (rows: { [k: string]: any }[] | null | undefined, key: string) =>
    (rows ?? []).reduce((acc, r) => acc + Number(r[key] ?? 0), 0);

  // contas a receber: pegar a data_referencia mais recente
  const crRows = crAtual.data ?? [];
  const crLatest = crRows.length ? crRows[0].data_referencia : null;
  const crCurrent = crRows.filter((r) => r.data_referencia === crLatest);
  const crPrevGrouped = crRows.filter((r) => r.data_referencia !== crLatest);
  const crPrevDate = crPrevGrouped.length ? crPrevGrouped[0].data_referencia : null;
  const crPrev = crPrevGrouped.filter((r) => r.data_referencia === crPrevDate);

  return {
    latestDate,
    prevDate,
    totalVendasHoje: sum(vendasHoje.data, "total_venda"),
    totalVendasOntem: sum(vendasOntem.data, "total_venda"),
    totalComprasHoje: sum(comprasHoje.data, "valor_total"),
    totalComprasOntem: sum(comprasOntem.data, "valor_total"),
    saldoCaixaHoje: sum(caixaHoje.data, "saldo"),
    saldoCaixaOntem: sum(caixaOntem.data, "saldo"),
    contasReceber: sum(crCurrent, "saldo_devedor"),
    contasReceberAnterior: sum(crPrev, "saldo_devedor"),
  };
}

export function useOverview() {
  return useQuery({
    queryKey: ["overview"],
    queryFn: fetchOverview,
    enabled: supabaseConfigured,
    staleTime: 60_000,
  });
}
