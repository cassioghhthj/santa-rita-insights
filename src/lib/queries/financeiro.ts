import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, EMPRESA_ID, supabaseConfigured } from "@/lib/supabase";
import { fetchAllPages } from "./paginate";
import { resolverCodigo } from "@/lib/financeiro/regras";
import { normalizeDb } from "@/lib/financeiro/normalize";

export interface ContaRow {
  id: string;
  nome: string;
  apelido: string | null;
  tipo: string;
  saldo_inicial: number;
  data_saldo_inicial: string | null;
  is_default: boolean;
  ativo: boolean;
}

export interface CodigoRow {
  id: string;
  codigo: string;
  nome: string;
  tipo: string;
  entra_no_dre: boolean;
  ativo: boolean;
}

export interface RegraRow {
  id: string;
  descricao: string;
  tipo_transacao: "credito" | "debito" | null;
  conta_id: string | null;
  codigo_id: string;
  prioridade: number;
  ativo: boolean;
}

export interface LancamentoRow {
  id: string;
  conta_id: string;
  codigo_id: string | null;
  origem: string;
  data: string;
  valor: number;
  tipo: "credito" | "debito";
  descricao: string | null;
  status: string;
}

export const TIPOS_CONTA = ["banco", "caixa", "cartao", "investimento", "outro"] as const;
export const TIPOS_CODIGO = [
  "receita",
  "despesa",
  "transferencia",
  "ajuste",
  "retirada_lucros",
] as const;

/* ---------------------------------- contas --------------------------------- */

export function useContas() {
  return useQuery({
    queryKey: ["fin-contas"],
    queryFn: async (): Promise<ContaRow[]> => {
      const { data, error } = await supabase
        .from("contas_financeiras")
        .select("id, nome, apelido, tipo, saldo_inicial, data_saldo_inicial, is_default, ativo")
        .eq("empresa_id", EMPRESA_ID)
        .order("nome");
      if (error) throw error;
      return (data ?? []) as ContaRow[];
    },
    enabled: supabaseConfigured,
    staleTime: 60_000,
  });
}

export function useCodigos() {
  return useQuery({
    queryKey: ["fin-codigos"],
    queryFn: async (): Promise<CodigoRow[]> => {
      const { data, error } = await supabase
        .from("plano_contas_financeiro")
        .select("id, codigo, nome, tipo, entra_no_dre, ativo")
        .eq("empresa_id", EMPRESA_ID)
        .order("codigo");
      if (error) throw error;
      return (data ?? []) as CodigoRow[];
    },
    enabled: supabaseConfigured,
    staleTime: 60_000,
  });
}

export function useRegras() {
  return useQuery({
    queryKey: ["fin-regras"],
    queryFn: async (): Promise<RegraRow[]> => {
      const rows = await fetchAllPages<RegraRow>((a, b) =>
        supabase
          .from("regras_classificacao_financeira")
          .select("id, descricao, tipo_transacao, conta_id, codigo_id, prioridade, ativo")
          .eq("empresa_id", EMPRESA_ID)
          .order("prioridade", { ascending: false })
          .order("descricao")
          .range(a, b),
      );
      return rows;
    },
    enabled: supabaseConfigured,
    staleTime: 60_000,
  });
}

export interface LancFiltro {
  from: string;
  to: string;
  contaId: string | "todas";
  /** Quando `contaId === "todas"`, restringe às contas desta lista. */
  contaIds?: string[];
  origem: string | "todas";
  tipo: "todos" | "credito" | "debito";
  somentePendentes: boolean;
}

export function useLancamentos(f: LancFiltro | null) {
  return useQuery({
    queryKey: ["fin-lancamentos", f],
    queryFn: async (): Promise<LancamentoRow[]> => {
      const filtro = f as LancFiltro;
      return fetchAllPages<LancamentoRow>((a, b) => {
        let q = supabase
          .from("lancamentos_financeiros")
          .select("id, conta_id, codigo_id, origem, data, valor, tipo, descricao, status")
          .eq("empresa_id", EMPRESA_ID)
          .gte("data", filtro.from)
          .lte("data", filtro.to);
        if (filtro.contaId !== "todas") q = q.eq("conta_id", filtro.contaId);
        else if (filtro.contaIds) q = q.in("conta_id", filtro.contaIds);
        if (filtro.origem !== "todas") q = q.eq("origem", filtro.origem);
        if (filtro.tipo !== "todos") q = q.eq("tipo", filtro.tipo);
        if (filtro.somentePendentes) q = q.eq("status", "pendente");
        return q
          .order("data", { ascending: false })
          .order("id", { ascending: true })
          .range(a, b);
      });
    },
    enabled:
      supabaseConfigured &&
      Boolean(f) &&
      !(f?.contaId === "todas" && f?.contaIds && f.contaIds.length === 0),
    staleTime: 30_000,
  });
}


/* -------------------------------- mutations -------------------------------- */

function useInvalidate(keys: string[]) {
  const qc = useQueryClient();
  return () => keys.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
}

export function useSaveConta() {
  const invalidate = useInvalidate(["fin-contas"]);
  return useMutation({
    mutationFn: async (v: Partial<ContaRow> & { id?: string }) => {
      const payload = {
        empresa_id: EMPRESA_ID,
        nome: v.nome,
        apelido: v.apelido || null,
        tipo: v.tipo,
        saldo_inicial: v.saldo_inicial ?? 0,
        data_saldo_inicial: v.data_saldo_inicial || null,
        is_default: v.is_default ?? false,
        ativo: v.ativo ?? true,
      };
      const res = v.id
        ? await supabase.from("contas_financeiras").update(payload).eq("id", v.id)
        : await supabase.from("contas_financeiras").insert(payload);
      if (res.error) throw res.error;
    },
    onSuccess: invalidate,
  });
}

export function useDeleteConta() {
  const invalidate = useInvalidate(["fin-contas"]);
  return useMutation({
    mutationFn: async (id: string) => {
      const { count, error } = await supabase
        .from("lancamentos_financeiros")
        .select("id", { count: "exact", head: true })
        .eq("conta_id", id);
      if (error) throw error;
      if ((count ?? 0) > 0)
        throw new Error(
          `Conta possui ${count} lançamento(s). Inative-a em vez de excluir.`,
        );
      const del = await supabase.from("contas_financeiras").delete().eq("id", id);
      if (del.error) throw del.error;
    },
    onSuccess: invalidate,
  });
}

export function useSaveCodigo() {
  const invalidate = useInvalidate(["fin-codigos"]);
  return useMutation({
    mutationFn: async (v: Partial<CodigoRow> & { id?: string }) => {
      const payload = {
        empresa_id: EMPRESA_ID,
        codigo: v.codigo?.trim(),
        nome: v.nome?.trim(),
        tipo: v.tipo,
        entra_no_dre: v.entra_no_dre ?? true,
        ativo: v.ativo ?? true,
      };
      const res = v.id
        ? await supabase.from("plano_contas_financeiro").update(payload).eq("id", v.id)
        : await supabase.from("plano_contas_financeiro").insert(payload);
      if (res.error) throw res.error;
    },
    onSuccess: invalidate,
  });
}

export function useDeleteCodigo() {
  const invalidate = useInvalidate(["fin-codigos"]);
  return useMutation({
    mutationFn: async (id: string) => {
      const [lanc, regras] = await Promise.all([
        supabase
          .from("lancamentos_financeiros")
          .select("id", { count: "exact", head: true })
          .eq("codigo_id", id),
        supabase
          .from("regras_classificacao_financeira")
          .select("id", { count: "exact", head: true })
          .eq("codigo_id", id),
      ]);
      if (lanc.error) throw lanc.error;
      if (regras.error) throw regras.error;
      const usos = (lanc.count ?? 0) + (regras.count ?? 0);
      if (usos > 0)
        throw new Error(
          `Código em uso (${lanc.count ?? 0} lançamento(s), ${regras.count ?? 0} regra(s)). Inative-o em vez de excluir.`,
        );
      const del = await supabase.from("plano_contas_financeiro").delete().eq("id", id);
      if (del.error) throw del.error;
    },
    onSuccess: invalidate,
  });
}

export function useSaveRegra() {
  const invalidate = useInvalidate(["fin-regras"]);
  return useMutation({
    mutationFn: async (v: Partial<RegraRow> & { id?: string }) => {
      const payload = {
        empresa_id: EMPRESA_ID,
        descricao: v.descricao?.trim(),
        tipo_transacao: v.tipo_transacao ?? null,
        conta_id: v.conta_id ?? null,
        codigo_id: v.codigo_id,
        prioridade: v.prioridade ?? 0,
        ativo: v.ativo ?? true,
      };
      const res = v.id
        ? await supabase.from("regras_classificacao_financeira").update(payload).eq("id", v.id)
        : await supabase.from("regras_classificacao_financeira").insert(payload);
      if (res.error) throw res.error;
    },
    onSuccess: invalidate,
  });
}

export function useDeleteRegra() {
  const invalidate = useInvalidate(["fin-regras"]);
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("regras_classificacao_financeira")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useClassificarLancamentos() {
  const invalidate = useInvalidate(["fin-lancamentos"]);
  return useMutation({
    mutationFn: async ({ ids, codigoId }: { ids: string[]; codigoId: string }) => {
      const { error } = await supabase
        .from("lancamentos_financeiros")
        .update({ codigo_id: codigoId, status: "classificado" })
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export interface NovoLancamento {
  data: string;
  conta_id: string;
  tipo: "credito" | "debito";
  valor: number;
  descricao: string;
  codigo_id: string;
}

export function useCriarLancamentoManual() {
  const invalidate = useInvalidate(["fin-lancamentos"]);
  return useMutation({
    mutationFn: async (v: NovoLancamento & { descricao_normalizada: string }) => {
      const { error } = await supabase.from("lancamentos_financeiros").insert({
        empresa_id: EMPRESA_ID,
        conta_id: v.conta_id,
        codigo_id: v.codigo_id,
        origem: "manual",
        data: v.data,
        valor: v.valor,
        tipo: v.tipo,
        descricao: v.descricao,
        descricao_normalizada: v.descricao_normalizada,
        status: "classificado",
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export interface ImportRow {
  conta_id: string;
  codigo_id: string | null;
  data: string;
  valor: number;
  tipo: "credito" | "debito";
  descricao: string;
  descricao_normalizada: string;
  hash_dedupe: string;
  fitid: string | null;
}

export function useImportarLancamentos() {
  const invalidate = useInvalidate(["fin-lancamentos"]);
  return useMutation({
    mutationFn: async (rows: ImportRow[]) => {
      const payload = rows.map((r) => ({
        empresa_id: EMPRESA_ID,
        ...r,
        origem: "extrato",
        status: r.codigo_id ? "classificado" : "pendente",
      }));
      for (let i = 0; i < payload.length; i += 500) {
        const { error } = await supabase
          .from("lancamentos_financeiros")
          .insert(payload.slice(i, i + 500));
        if (error) throw error;
      }
      return payload.length;
    },
    onSuccess: invalidate,
  });
}

/** hash_dedupe + fitid já existentes na conta, no intervalo do arquivo. */
export async function fetchExistentes(contaId: string, from: string, to: string) {
  const rows = await fetchAllPages<{
    hash_dedupe: string | null;
    fitid: string | null;
    data: string;
    valor: number;
    descricao_normalizada: string | null;
  }>((a, b) =>
    supabase
      .from("lancamentos_financeiros")
      .select("hash_dedupe, fitid, data, valor, descricao_normalizada")
      .eq("empresa_id", EMPRESA_ID)
      .eq("conta_id", contaId)
      .gte("data", from)
      .lte("data", to)
      .range(a, b),
  );
  const hashes = new Set<string>();
  const fitids = new Set<string>();
  for (const r of rows) {
    if (r.hash_dedupe) hashes.add(r.hash_dedupe);
    if (r.fitid) fitids.add(r.fitid);
    // lançamentos migrados não têm hash: reconstrói o textual
    hashes.add(
      `${contaId}|${r.data}|${Number(r.valor).toFixed(2)}|${r.descricao_normalizada ?? ""}`,
    );
  }
  return { hashes, fitids };
}

/* ------------------------------ caixa (staging) ----------------------------- */

export const CAIXA_CONTA_ID = "f1c6403d-a88d-4f76-8226-cb1ad962cd48";

export interface StagingResult {
  lidas: number;
  novas: number;
  classificadas: number;
  pendentes: number;
}

/**
 * Lê `conferencia_caixa` (só transações reais de caixa da loja) e cria os
 * lançamentos ainda não importados na conta Caixa Loja, aplicando as regras.
 */
export function useSincronizarCaixa() {
  const invalidate = useInvalidate(["fin-lancamentos"]);
  return useMutation({
    mutationFn: async ({
      from,
      to,
      regras,
    }: {
      from: string;
      to: string;
      regras: RegraRow[];
    }): Promise<StagingResult> => {
      const origem = await fetchAllPages<{
        id: number | string;
        data: string | null;
        data_transacao: string | null;
        descricao: string | null;
        valor_recebido: number | null;
        valor_pago: number | null;
      }>((a, b) =>
        supabase
          .from("conferencia_caixa")
          .select("id, data, data_transacao, descricao, valor_recebido, valor_pago")
          .eq("empresa_id", EMPRESA_ID)
          .eq("tipo_linha", "transacao")
          .eq("conta", "RECEBIMENTOS")
          .not("descricao", "ilike", "TRANSFERENCIA%")
          .neq("descricao", "RECEBIMENTO DE RECEITAS DE VENDAS")
          .gte("data", from)
          .lte("data", to)
          .order("id", { ascending: true })
          .range(a, b),
      );

      const existentes = await fetchAllPages<{ origem_ref: string | null }>((a, b) =>
        supabase
          .from("lancamentos_financeiros")
          .select("origem_ref")
          .eq("empresa_id", EMPRESA_ID)
          .eq("conta_id", CAIXA_CONTA_ID)
          .eq("origem", "caixa_auto")
          .not("origem_ref", "is", null)
          .range(a, b),
      );
      const jaImportados = new Set(existentes.map((r) => r.origem_ref as string));

      let classificadas = 0;
      let pendentes = 0;
      const payload = origem
        .filter((r) => !jaImportados.has(String(r.id)))
        .map((r) => {
          const pago = Number(r.valor_pago ?? 0);
          const receb = Number(r.valor_recebido ?? 0);
          const tipo: "credito" | "debito" = pago > 0 ? "debito" : "credito";
          const valor = pago > 0 ? pago : receb;
          const descricao = r.descricao ?? "";
          const regra = resolverCodigo({ descricao, tipo }, CAIXA_CONTA_ID, regras);
          if (regra) classificadas++;
          else pendentes++;
          return {
            empresa_id: EMPRESA_ID,
            conta_id: CAIXA_CONTA_ID,
            codigo_id: regra?.codigo_id ?? null,
            origem: "caixa_auto",
            origem_ref: String(r.id),
            data: r.data_transacao ?? r.data,
            valor,
            tipo,
            descricao,
            descricao_normalizada: normalizeDb(descricao),
            status: regra ? "classificado" : "pendente",
          };
        })
        .filter((p) => p.data && p.valor > 0);

      for (let i = 0; i < payload.length; i += 500) {
        const { error } = await supabase
          .from("lancamentos_financeiros")
          .insert(payload.slice(i, i + 500));
        if (error) throw error;
      }

      return { lidas: origem.length, novas: payload.length, classificadas, pendentes };
    },
    onSuccess: invalidate,
  });
}

/** Confirma (valida) lançamentos: marca como classificado mantendo o código atual. */
export function useConfirmarLancamentos() {
  const invalidate = useInvalidate(["fin-lancamentos"]);
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from("lancamentos_financeiros")
        .update({ status: "classificado" })
        .in("id", ids)
        .not("codigo_id", "is", null);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}
