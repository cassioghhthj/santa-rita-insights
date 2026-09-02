/**
 * Equivalente em JS ao que o banco usa em `descricao_normalizada`:
 * upper(regexp_replace(descricao, '[^A-Za-z0-9À-ÿ ]', '', 'g'))
 */
export function normalizeDb(s: string): string {
  return (s ?? "").replace(/[^A-Za-z0-9\u00C0-\u00FF ]/g, "").toUpperCase();
}

/** Normalização agressiva usada só para casar regras (sem acentos, espaços colapsados). */
export function normalizeMatch(s: string): string {
  return (s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Hash textual de deduplicação. */
export function hashTransacao(
  contaId: string,
  data: string,
  valor: number,
  descricaoNormalizada: string,
): string {
  return `${contaId}|${data}|${valor.toFixed(2)}|${descricaoNormalizada}`;
}
