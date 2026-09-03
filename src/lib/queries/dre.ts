import { useQuery } from "@tanstack/react-query";
import { supabase, EMPRESA_ID, supabaseConfigured } from "@/lib/supabase";
import { fetchAllPages } from "./paginate";

export interface DreLinha {
  codigo_id: string;
  codigo: string;
  nome: string;
  tipo: string;
  credito: number;
  debito: number;
  net: number;
  valor: number;
}

export interface DreMes {
  mes: string;
  label: string;
  receita: number;
  despesa: number;
}

export interface DreResult {
  receitas: DreLinha[];
  despesas: DreLinha[];
  retiradas: DreLinha[];
  totalReceita: number;
  totalDespesa: number;
  totalRetiradas: number;
  resultado: number;
  margem: number | null;
  naoClassificados: number;
  porMes: DreMes[];
}

interface LancRow {
  codigo_id: string | null;
  data: string;
  valor: number;
  tipo: "credito" | "debito";
}

interface PlanoRow {
  id: string;
  codigo: string;
  nome: string;
  tipo: string;
  entra_no_dre: boolean;
}

export function useDre(period: { from: string; to: string } | null) {
  return useQuery({
    queryKey: ["fin-dre", period?.from, period?.to],
    enabled: supabaseConfigured && Boolean(period),
    staleTime: 30_000,
    queryFn: async (): Promise<DreResult> => {
      const p = period!;
      const [lancs, planoRes] = await Promise.all([
        fetchAllPages<LancRow>((a, b) =>
          supabase
            .from("lancamentos_financeiros")
            .select("codigo_id, data, valor, tipo")
            .eq("empresa_id", EMPRESA_ID)
            .gte("data", p.from)
            .lte("data", p.to)
            .order("data", { ascending: true })
            .range(a, b),
        ),
        supabase
          .from("plano_contas_financeiro")
          .select("id, codigo, nome, tipo, entra_no_dre")
          .eq("empresa_id", EMPRESA_ID),
      ]);
      if (planoRes.error) throw planoRes.error;
      const plano = new Map(
        ((planoRes.data ?? []) as PlanoRow[]).map((r) => [r.id, r]),
      );

      const acc = new Map<string, DreLinha>();
      const meses = new Map<string, DreMes>();
      let naoClassificados = 0;

      for (const l of lancs) {
        if (!l.codigo_id) {
          naoClassificados++;
          continue;
        }
        const pc = plano.get(l.codigo_id);
        if (!pc || !pc.entra_no_dre) continue;

        let linha = acc.get(l.codigo_id);
        if (!linha) {
          linha = {
            codigo_id: l.codigo_id,
            codigo: pc.codigo,
            nome: pc.nome,
            tipo: pc.tipo,
            credito: 0,
            debito: 0,
            net: 0,
            valor: 0,
          };
          acc.set(l.codigo_id, linha);
        }
        const v = Number(l.valor ?? 0);
        if (l.tipo === "credito") linha.credito += v;
        else linha.debito += v;

        const mes = l.data.slice(0, 7);
        let m = meses.get(mes);
        if (!m) {
          const [y, mm] = mes.split("-").map(Number);
          const label = new Date(Date.UTC(y, mm - 1, 1)).toLocaleDateString("pt-BR", {
            month: "short",
            year: "2-digit",
            timeZone: "UTC",
          });
          m = { mes, label, receita: 0, despesa: 0 };
          meses.set(mes, m);
        }
        const signed = l.tipo === "credito" ? v : -v;
        if (pc.tipo === "receita") m.receita += signed;
        else if (pc.tipo === "despesa" || pc.tipo === "retirada_lucros") m.despesa += -signed;
      }

      const linhas = [...acc.values()].map((l) => {
        l.net = l.credito - l.debito;
        l.valor = l.tipo === "receita" ? l.net : Math.abs(l.net);
        return l;
      });
      const sortByValor = (a: DreLinha, b: DreLinha) => b.valor - a.valor;

      const receitas = linhas.filter((l) => l.tipo === "receita").sort(sortByValor);
      const despesas = linhas.filter((l) => l.tipo === "despesa").sort(sortByValor);
      const retiradas = linhas.filter((l) => l.tipo === "retirada_lucros").sort(sortByValor);

      const sum = (arr: DreLinha[]) => arr.reduce((s, l) => s + l.valor, 0);
      const totalReceita = sum(receitas);
      const totalDespesa = sum(despesas);
      const totalRetiradas = sum(retiradas);
      const resultado = totalReceita - totalDespesa - totalRetiradas;

      return {
        receitas,
        despesas,
        retiradas,
        totalReceita,
        totalDespesa,
        totalRetiradas,
        resultado,
        margem: totalReceita > 0 ? (resultado / totalReceita) * 100 : null,
        naoClassificados,
        porMes: [...meses.values()].sort((a, b) => a.mes.localeCompare(b.mes)),
      };
    },
  });
}
