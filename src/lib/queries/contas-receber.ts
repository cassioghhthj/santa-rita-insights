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

// ---------------------------------------------------------------------------
// Vendas a prazo × baixas (contas_recebidas)
// ---------------------------------------------------------------------------

const PAGE = 1000;

async function fetchAllPages<T>(
  build: (fromIdx: number, toIdx: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
  maxRows = 60000,
): Promise<T[]> {
  const out: T[] = [];
  for (let start = 0; start < maxRows; start += PAGE) {
    const { data, error } = await build(start, start + PAGE - 1);
    if (error) throw error;
    const rows = data ?? [];
    out.push(...rows);
    if (rows.length < PAGE) break;
  }
  return out;
}

export interface VendaPrazoAgg {
  venda_doc: string;
  cod_cliente: string;
  nome_cliente: string;
  data_compra: string | null;
  valor_liquido: number;
}

export interface BaixaRow {
  numero_venda: string;
  data_liquidacao: string | null;
  valor_liquidado: number;
  cod_cliente: string | null;
}

async function fetchVendasPrazoAgg(cod?: string): Promise<VendaPrazoAgg[]> {
  const rows = await fetchAllPages<{
    venda_doc: string | null;
    cod_cliente: string | null;
    nome_cliente: string | null;
    data_compra: string | null;
    data: string;
    valor_liquido: number | null;
  }>((a, b) => {
    let q = supabase
      .from("vendas_a_prazo")
      .select("venda_doc, cod_cliente, nome_cliente, data_compra, data, valor_liquido")
      .eq("empresa_id", EMPRESA_ID);
    if (cod) q = q.eq("cod_cliente", cod);
    return q.order("data", { ascending: true }).range(a, b);
  });

  // DISTINCT venda_doc — snapshot diário repete a mesma venda.
  const map = new Map<string, VendaPrazoAgg>();
  for (const r of rows) {
    if (!r.venda_doc) continue;
    const compra = r.data_compra ?? r.data ?? null;
    const cur = map.get(r.venda_doc);
    if (!cur) {
      map.set(r.venda_doc, {
        venda_doc: r.venda_doc,
        cod_cliente: r.cod_cliente ?? "",
        nome_cliente: r.nome_cliente ?? "—",
        data_compra: compra,
        valor_liquido: Number(r.valor_liquido ?? 0),
      });
    } else if (compra && (!cur.data_compra || compra < cur.data_compra)) {
      cur.data_compra = compra;
    }
  }
  return [...map.values()];
}

async function fetchBaixas(cod?: string): Promise<BaixaRow[]> {
  const rows = await fetchAllPages<{
    numero_venda: string | null;
    data_liquidacao: string | null;
    valor_liquidado: number | null;
    cod_cliente: string | null;
  }>((a, b) => {
    let q = supabase
      .from("contas_recebidas")
      .select("numero_venda, data_liquidacao, valor_liquidado, cod_cliente")
      .eq("empresa_id", EMPRESA_ID);
    if (cod) q = q.eq("cod_cliente", cod);
    return q.order("data_liquidacao", { ascending: true }).range(a, b);
  });
  return rows
    .filter((r) => r.numero_venda)
    .map((r) => ({
      numero_venda: String(r.numero_venda),
      data_liquidacao: r.data_liquidacao,
      valor_liquidado: Number(r.valor_liquidado ?? 0),
      cod_cliente: r.cod_cliente,
    }));
}

export const LANCAMENTO_MANUAL = "Lançamento Manual";

function daysBetween(a: string, b: string) {
  const d = (new Date(b + "T00:00:00").getTime() - new Date(a + "T00:00:00").getTime()) / 86400000;
  return Math.round(d);
}

export type StatusVenda = "pago" | "parcial" | "aberto";

export interface VendaTimelineItem {
  venda_doc: string;
  data_compra: string | null;
  valor_liquido: number;
  baixas: { data_liquidacao: string | null; valor_liquidado: number }[];
  totalLiquidado: number;
  status: StatusVenda;
  diasAtePagamento: number | null;
}

export interface CarteiraResumo {
  vendasAbertasQtd: number;
  valorAberto: number;
  prazoMedioDias: number | null;
  amostraQuitadas: number;
  ticketMedio: number;
  totalVendas: number;
}

function buildTimeline(vendas: VendaPrazoAgg[], baixas: BaixaRow[]): VendaTimelineItem[] {
  const byDoc = new Map<string, BaixaRow[]>();
  for (const b of baixas) {
    if (b.numero_venda === LANCAMENTO_MANUAL) continue;
    const list = byDoc.get(b.numero_venda) ?? [];
    list.push(b);
    byDoc.set(b.numero_venda, list);
  }

  return vendas.map((v) => {
    const bs = (byDoc.get(v.venda_doc) ?? []).sort((a, b) =>
      (a.data_liquidacao ?? "") < (b.data_liquidacao ?? "") ? -1 : 1,
    );
    const totalLiquidado = bs.reduce((a, b) => a + b.valor_liquidado, 0);
    const status: StatusVenda =
      bs.length === 0 ? "aberto" : totalLiquidado + 0.01 >= v.valor_liquido ? "pago" : "parcial";
    const ultima = bs.length ? bs[bs.length - 1].data_liquidacao : null;
    const diasAtePagamento =
      v.data_compra && ultima ? Math.max(0, daysBetween(v.data_compra, ultima)) : null;
    return {
      venda_doc: v.venda_doc,
      data_compra: v.data_compra,
      valor_liquido: v.valor_liquido,
      baixas: bs.map((b) => ({
        data_liquidacao: b.data_liquidacao,
        valor_liquidado: b.valor_liquidado,
      })),
      totalLiquidado,
      status,
      diasAtePagamento,
    };
  });
}

function resumo(items: VendaTimelineItem[]): CarteiraResumo {
  const abertas = items.filter((i) => i.status !== "pago");
  const quitadas = items.filter((i) => i.status === "pago" && i.diasAtePagamento !== null);
  const prazoMedioDias = quitadas.length
    ? quitadas.reduce((a, i) => a + (i.diasAtePagamento ?? 0), 0) / quitadas.length
    : null;
  return {
    vendasAbertasQtd: abertas.length,
    valorAberto: abertas.reduce((a, i) => a + (i.valor_liquido - i.totalLiquidado), 0),
    prazoMedioDias,
    amostraQuitadas: quitadas.length,
    ticketMedio: items.length
      ? items.reduce((a, i) => a + i.valor_liquido, 0) / items.length
      : 0,
    totalVendas: items.length,
  };
}

export function useCarteiraPrazo() {
  return useQuery({
    queryKey: ["carteira-prazo"],
    queryFn: async (): Promise<CarteiraResumo> => {
      const [vendas, baixas] = await Promise.all([fetchVendasPrazoAgg(), fetchBaixas()]);
      return resumo(buildTimeline(vendas, baixas));
    },
    enabled: supabaseConfigured,
    staleTime: 300_000,
  });
}

export function useClienteTimeline(cod: string | null) {
  return useQuery({
    queryKey: ["cliente-timeline", cod],
    queryFn: async (): Promise<VendaTimelineItem[]> => {
      const [vendas, baixas] = await Promise.all([
        fetchVendasPrazoAgg(cod!),
        fetchBaixas(cod!),
      ]);
      return buildTimeline(vendas, baixas).sort((a, b) =>
        (a.data_compra ?? "") < (b.data_compra ?? "") ? 1 : -1,
      );
    },
    enabled: supabaseConfigured && Boolean(cod),
    staleTime: 60_000,
  });
}
