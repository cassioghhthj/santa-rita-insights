import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, EMPRESA_ID, supabaseConfigured } from "@/lib/supabase";
import { fetchAllPages } from "./paginate";

export interface ProvisionadaRow {
  id: string;
  codigo_id: string;
  data: string;
  valor: number;
  descricao: string | null;
  status: "pendente" | "paga";
}

export interface ProvisionadaLinha {
  codigo_id: string;
  codigo: string;
  nome: string;
  valor: number;
}

const SELECT = "id, codigo_id, data, valor, descricao, status";

export function useProvisionadas(period: { from: string; to: string } | null) {
  return useQuery({
    queryKey: ["fin-prov", period?.from, period?.to],
    enabled: supabaseConfigured && Boolean(period),
    staleTime: 30_000,
    queryFn: async (): Promise<ProvisionadaRow[]> => {
      const p = period!;
      return fetchAllPages<ProvisionadaRow>((a, b) =>
        supabase
          .from("despesas_provisionadas")
          .select(SELECT)
          .eq("empresa_id", EMPRESA_ID)
          .gte("data", p.from)
          .lte("data", p.to)
          .order("data", { ascending: false })
          .range(a, b),
      );
    },
  });
}

/** Despesas provisionadas pendentes do período, agrupadas por código (para o DRE). */
export function useProvisionadasDre(period: { from: string; to: string } | null) {
  return useQuery({
    queryKey: ["fin-prov-dre", period?.from, period?.to],
    enabled: supabaseConfigured && Boolean(period),
    staleTime: 30_000,
    queryFn: async (): Promise<{ linhas: ProvisionadaLinha[]; total: number }> => {
      const p = period!;
      const [rows, planoRes] = await Promise.all([
        fetchAllPages<ProvisionadaRow>((a, b) =>
          supabase
            .from("despesas_provisionadas")
            .select(SELECT)
            .eq("empresa_id", EMPRESA_ID)
            .eq("status", "pendente")
            .gte("data", p.from)
            .lte("data", p.to)
            .range(a, b),
        ),
        supabase
          .from("plano_contas_financeiro")
          .select("id, codigo, nome")
          .eq("empresa_id", EMPRESA_ID),
      ]);
      if (planoRes.error) throw planoRes.error;
      const plano = new Map(
        ((planoRes.data ?? []) as { id: string; codigo: string; nome: string }[]).map((r) => [
          r.id,
          r,
        ]),
      );
      const acc = new Map<string, ProvisionadaLinha>();
      for (const r of rows) {
        const pc = plano.get(r.codigo_id);
        const key = r.codigo_id ?? "—";
        let l = acc.get(key);
        if (!l) {
          l = {
            codigo_id: key,
            codigo: pc?.codigo ?? "—",
            nome: pc?.nome ?? "Sem código",
            valor: 0,
          };
          acc.set(key, l);
        }
        l.valor += Number(r.valor ?? 0);
      }
      const linhas = [...acc.values()].sort((a, b) => b.valor - a.valor);
      return { linhas, total: linhas.reduce((s, l) => s + l.valor, 0) };
    },
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["fin-prov"] });
    qc.invalidateQueries({ queryKey: ["fin-prov-dre"] });
  };
}

export interface ProvisionadaInput {
  codigo_id: string;
  data: string;
  valor: number;
  descricao: string | null;
}

export function useCriarProvisionada() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (input: ProvisionadaInput) => {
      const { error } = await supabase
        .from("despesas_provisionadas")
        .insert({ ...input, empresa_id: EMPRESA_ID, status: "pendente" });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useAtualizarProvisionada() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({
      id,
      ...patch
    }: Partial<ProvisionadaInput> & { id: string; status?: "pendente" | "paga" }) => {
      const { error } = await supabase
        .from("despesas_provisionadas")
        .update(patch)
        .eq("id", id)
        .eq("empresa_id", EMPRESA_ID);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useExcluirProvisionada() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("despesas_provisionadas")
        .delete()
        .eq("id", id)
        .eq("empresa_id", EMPRESA_ID);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}
