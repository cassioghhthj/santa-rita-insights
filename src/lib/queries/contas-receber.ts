import { useQuery } from "@tanstack/react-query";
import { supabase, EMPRESA_ID, supabaseConfigured } from "@/lib/supabase";

export interface ContasReceberOverview {
  latestDate: string | null;
  saldoTotalAberto: number;
  clientesComSaldo: number;
  totalRecebidoPeriodo: number;
  serieSaldo: { data: string; total: number }[];
  topDevedores: {
    cod_cliente: string;
    nome_cliente: string;
    saldo_devedor: number;
  }[];
  clientesLista: { cod_cliente: string; nome_cliente: string }[];
}

async function fetchOverview(from: string, to: string): Promise<ContasReceberOverview> {
  // latest date_referencia
  const latestRes = await supabase
    .from("contas_a_receber")
    .select("data_referencia")
    .eq("empresa_id", EMPRESA_ID)
    .order("data_referencia", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latestRes.error) throw latestRes.error;
  const latestDate = latestRes.data?.data_referencia ?? null;

  const [snapshotRes, seriesRes, recebRes] = await Promise.all([
    latestDate
      ? supabase
          .from("contas_a_receber")
          .select("cod_cliente, nome_cliente, saldo_devedor")
          .eq("empresa_id", EMPRESA_ID)
          .eq("data_referencia", latestDate)
          .order("saldo_devedor", { ascending: false })
          .limit(1000)
      : Promise.resolve({ data: [], error: null } as const),
    supabase
      .from("contas_a_receber")
      .select("data_referencia, saldo_devedor")
      .eq("empresa_id", EMPRESA_ID)
      .gte("data_referencia", from)
      .lte("data_referencia", to)
      .limit(10000),
    supabase
      .from("contas_recebidas")
      .select("valor_liquidado")
      .eq("empresa_id", EMPRESA_ID)
      .gte("data_liquidacao", from)
      .lte("data_liquidacao", to)
      .limit(10000),
  ]);

  if (snapshotRes.error) throw snapshotRes.error;
  if (seriesRes.error) throw seriesRes.error;
  if (recebRes.error) throw recebRes.error;

  let saldoTotalAberto = 0;
  let clientesComSaldo = 0;
  const clientesMap = new Map<string, string>();
  const topDevedores: ContasReceberOverview["topDevedores"] = [];
  for (const r of snapshotRes.data ?? []) {
    const s = Number(r.saldo_devedor ?? 0);
    saldoTotalAberto += s;
    if (s > 0) clientesComSaldo += 1;
    if (r.cod_cliente) clientesMap.set(r.cod_cliente, r.nome_cliente ?? "—");
    topDevedores.push({
      cod_cliente: r.cod_cliente ?? "",
      nome_cliente: r.nome_cliente ?? "—",
      saldo_devedor: s,
    });
  }
  topDevedores.sort((a, b) => b.saldo_devedor - a.saldo_devedor);

  const serieMap = new Map<string, number>();
  for (const r of seriesRes.data ?? []) {
    if (!r.data_referencia) continue;
    serieMap.set(r.data_referencia, (serieMap.get(r.data_referencia) ?? 0) + Number(r.saldo_devedor ?? 0));
  }
  const serieSaldo = [...serieMap.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([data, total]) => ({ data, total }));

  const totalRecebidoPeriodo = (recebRes.data ?? []).reduce(
    (a, r) => a + Number(r.valor_liquidado ?? 0),
    0,
  );

  const clientesLista = [...clientesMap.entries()]
    .map(([cod_cliente, nome_cliente]) => ({ cod_cliente, nome_cliente }))
    .sort((a, b) => a.nome_cliente.localeCompare(b.nome_cliente));

  return {
    latestDate,
    saldoTotalAberto,
    clientesComSaldo,
    totalRecebidoPeriodo,
    serieSaldo,
    topDevedores: topDevedores.slice(0, 20),
    clientesLista,
  };
}

export function useContasReceberOverview(from: string, to: string) {
  return useQuery({
    queryKey: ["contas-receber-overview", from, to],
    queryFn: () => fetchOverview(from, to),
    enabled: supabaseConfigured && Boolean(from && to),
    staleTime: 60_000,
  });
}

export interface ClienteDetalhe {
  serieSaldo: { data: string; saldo: number }[];
  recebimentos: {
    data_liquidacao: string | null;
    valor_liquidado: number;
    numero_venda: string | null;
  }[];
}

async function fetchCliente(cod: string): Promise<ClienteDetalhe> {
  const [saldoRes, recebRes] = await Promise.all([
    supabase
      .from("contas_a_receber")
      .select("data_referencia, saldo_devedor")
      .eq("empresa_id", EMPRESA_ID)
      .eq("cod_cliente", cod)
      .order("data_referencia", { ascending: true })
      .limit(1000),
    supabase
      .from("contas_recebidas")
      .select("data_liquidacao, valor_liquidado, numero_venda")
      .eq("empresa_id", EMPRESA_ID)
      .eq("cod_cliente", cod)
      .order("data_liquidacao", { ascending: false })
      .limit(500),
  ]);
  if (saldoRes.error) throw saldoRes.error;
  if (recebRes.error) throw recebRes.error;

  return {
    serieSaldo: (saldoRes.data ?? []).map((r) => ({
      data: r.data_referencia,
      saldo: Number(r.saldo_devedor ?? 0),
    })),
    recebimentos: (recebRes.data ?? []).map((r) => ({
      data_liquidacao: r.data_liquidacao,
      valor_liquidado: Number(r.valor_liquidado ?? 0),
      numero_venda: r.numero_venda,
    })),
  };
}

export function useClienteDetalhe(cod: string | null) {
  return useQuery({
    queryKey: ["contas-receber-cliente", cod],
    queryFn: () => fetchCliente(cod!),
    enabled: supabaseConfigured && Boolean(cod),
    staleTime: 60_000,
  });
}
