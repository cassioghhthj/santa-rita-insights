import { useQuery } from "@tanstack/react-query";
import { supabase, EMPRESA_ID, supabaseConfigured } from "@/lib/supabase";

export interface EstoqueSaldoRow {
  codigo_produto: string;
  produto: string;
  classe_nome: string;
  ultima_data: string;
  saldo_acumulado: number;
}

export interface EstoqueMovRow {
  data: string;
  qtde_comprada: number;
  qtde_vendida: number;
  saldo_dia: number;
  saldo_acumulado: number;
}

function normalizeSaldo(rows: Record<string, unknown>[]): EstoqueSaldoRow[] {
  return rows.map((r) => ({
    codigo_produto: String(r.codigo_produto ?? "—"),
    produto: String(r.produto ?? "—"),
    classe_nome: String(r.classe_nome ?? "—"),
    ultima_data: String(r.ultima_data ?? ""),
    saldo_acumulado: Number(r.saldo_acumulado ?? 0),
  }));
}

async function fetchAlertas() {
  const cols = "codigo_produto, produto, classe_nome, ultima_data, saldo_acumulado";
  const base = () =>
    supabase.from("vw_estoque_saldo_atual").select(cols).eq("empresa_id", EMPRESA_ID);

  const [falta, excesso] = await Promise.all([
    base().order("saldo_acumulado", { ascending: true }).limit(10),
    base().order("saldo_acumulado", { ascending: false }).limit(10),
  ]);
  if (falta.error) throw falta.error;
  if (excesso.error) throw excesso.error;

  return {
    falta: normalizeSaldo((falta.data ?? []) as Record<string, unknown>[]),
    excesso: normalizeSaldo((excesso.data ?? []) as Record<string, unknown>[]),
  };
}

export function useEstoqueAlertas() {
  return useQuery({
    queryKey: ["estoque-alertas"],
    queryFn: fetchAlertas,
    enabled: supabaseConfigured,
    staleTime: 60_000,
  });
}

async function fetchMovimentacao(codigo: string): Promise<EstoqueMovRow[]> {
  const { data, error } = await supabase
    .from("vw_estoque_movimentacao")
    .select("data, qtde_comprada, qtde_vendida, saldo_dia, saldo_acumulado")
    .eq("empresa_id", EMPRESA_ID)
    .eq("codigo_produto", codigo)
    .order("data", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
    data: String(r.data ?? ""),
    qtde_comprada: Number(r.qtde_comprada ?? 0),
    qtde_vendida: Number(r.qtde_vendida ?? 0),
    saldo_dia: Number(r.saldo_dia ?? 0),
    saldo_acumulado: Number(r.saldo_acumulado ?? 0),
  }));
}

export function useEstoqueMovimentacao(codigo: string | null) {
  return useQuery({
    queryKey: ["estoque-mov", codigo],
    queryFn: () => fetchMovimentacao(codigo as string),
    enabled: supabaseConfigured && Boolean(codigo),
    staleTime: 60_000,
  });
}

async function fetchListaProdutos(): Promise<EstoqueSaldoRow[]> {
  const { data, error } = await supabase
    .from("vw_estoque_saldo_atual")
    .select("codigo_produto, produto, classe_nome, ultima_data, saldo_acumulado")
    .eq("empresa_id", EMPRESA_ID)
    .order("produto", { ascending: true })
    .limit(5000);
  if (error) throw error;
  return normalizeSaldo((data ?? []) as Record<string, unknown>[]);
}

export function useEstoqueProdutos() {
  return useQuery({
    queryKey: ["estoque-produtos"],
    queryFn: fetchListaProdutos,
    enabled: supabaseConfigured,
    staleTime: 300_000,
  });
}
