import { useQuery } from "@tanstack/react-query";
import { supabase, EMPRESA_ID, supabaseConfigured } from "@/lib/supabase";
import { fetchAllPages } from "@/lib/queries/paginate";

export interface ProdutoRow {
  codigo_produto: string;
  produto: string;
  classe_nome: string;
  qtde_vendida: number;
  vlr_total_vendas: number;
  preco_medio_venda: number;
  qtde_comprada: number;
  vlr_total_compras: number;
  preco_medio_compra: number;
  margemValor: number;
  margemPercentual: number | null;
}

export interface ProdutosData {
  rows: ProdutoRow[];
  totalQtdeVendida: number;
  totalValorVendido: number;
  totalValorComprado: number;
  maisVendido: ProdutoRow | null;
}

async function fetchProdutos(from: string, to: string): Promise<ProdutosData> {
  const data = await fetchAllPages<{
    codigo_produto: string | null;
    produto: string | null;
    classe_nome: string | null;
    qtde_vendida: number | null;
    vlr_total_vendas: number | null;
    qtde_comprada: number | null;
    vlr_total_compras: number | null;
  }>((a, b) =>
    supabase
      .from("compras_vendas_classe")
      .select(
        "codigo_produto, produto, classe_nome, qtde_vendida, vlr_total_vendas, qtde_comprada, vlr_total_compras",
      )
      .eq("empresa_id", EMPRESA_ID)
      .gte("data", from)
      .lte("data", to)
      .order("id", { ascending: true })
      .range(a, b),
  );

  const map = new Map<string, ProdutoRow>();

  for (const r of data) {
    const cod = r.codigo_produto ?? "—";
    let cur = map.get(cod);
    if (!cur) {
      cur = {
        codigo_produto: cod,
        produto: r.produto ?? "—",
        classe_nome: r.classe_nome ?? "—",
        qtde_vendida: 0,
        vlr_total_vendas: 0,
        preco_medio_venda: 0,
        qtde_comprada: 0,
        vlr_total_compras: 0,
        preco_medio_compra: 0,
        margemValor: 0,
        margemPercentual: null,
      };
      map.set(cod, cur);
    }
    cur.qtde_vendida += Number(r.qtde_vendida ?? 0);
    cur.vlr_total_vendas += Number(r.vlr_total_vendas ?? 0);
    cur.qtde_comprada += Number(r.qtde_comprada ?? 0);
    cur.vlr_total_compras += Number(r.vlr_total_compras ?? 0);
  }

  let totalQtdeVendida = 0;
  let totalValorVendido = 0;
  let totalValorComprado = 0;
  let maisVendido: ProdutoRow | null = null;

  const rows = [...map.values()];
  for (const r of rows) {
    r.preco_medio_venda = r.qtde_vendida > 0 ? r.vlr_total_vendas / r.qtde_vendida : 0;
    r.preco_medio_compra = r.qtde_comprada > 0 ? r.vlr_total_compras / r.qtde_comprada : 0;
    r.margemValor = r.vlr_total_vendas - r.vlr_total_compras;
    r.margemPercentual =
      r.qtde_comprada > 0 && r.vlr_total_vendas > 0 ? (r.margemValor / r.vlr_total_vendas) * 100 : null;
    totalQtdeVendida += r.qtde_vendida;
    totalValorVendido += r.vlr_total_vendas;
    totalValorComprado += r.vlr_total_compras;
    if (!maisVendido || r.qtde_vendida > maisVendido.qtde_vendida) maisVendido = r;
  }

  rows.sort((a, b) => b.vlr_total_vendas - a.vlr_total_vendas);

  return { rows, totalQtdeVendida, totalValorVendido, totalValorComprado, maisVendido };
}

export function useProdutos(from: string, to: string) {
  return useQuery({
    queryKey: ["produtos", from, to],
    queryFn: () => fetchProdutos(from, to),
    enabled: supabaseConfigured && Boolean(from && to),
    staleTime: 60_000,
  });
}
