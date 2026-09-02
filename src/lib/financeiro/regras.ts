import { normalizeMatch } from "./normalize";
import type { RegraRow } from "@/lib/queries/financeiro";

export interface MatchInput {
  descricao: string;
  tipo: "credito" | "debito";
}

/**
 * Resolve o código sugerido para uma transação.
 * Desempate: regra da conta atual > regra "qualquer conta";
 * depois maior prioridade; depois descrição mais longa (mais específica).
 */
export function resolverCodigo(
  tx: MatchInput,
  contaId: string,
  regras: RegraRow[],
): RegraRow | null {
  const alvo = normalizeMatch(tx.descricao);
  const candidatas = regras.filter((r) => {
    if (!r.ativo) return false;
    if (r.tipo_transacao && r.tipo_transacao !== tx.tipo) return false;
    if (r.conta_id && r.conta_id !== contaId) return false;
    const termo = normalizeMatch(r.descricao);
    return termo.length > 0 && alvo.includes(termo);
  });
  if (!candidatas.length) return null;

  candidatas.sort((a, b) => {
    const ac = a.conta_id === contaId ? 1 : 0;
    const bc = b.conta_id === contaId ? 1 : 0;
    if (ac !== bc) return bc - ac;
    if (a.prioridade !== b.prioridade) return b.prioridade - a.prioridade;
    return normalizeMatch(b.descricao).length - normalizeMatch(a.descricao).length;
  });
  return candidatas[0];
}
