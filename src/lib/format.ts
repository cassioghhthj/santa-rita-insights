export const brl = (n: number | null | undefined) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(n ?? 0));

export const num = (n: number | null | undefined) =>
  new Intl.NumberFormat("pt-BR").format(Number(n ?? 0));

export const pct = (n: number | null | undefined) => {
  const v = Number(n ?? 0);
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(1)}%`;
};

export const isoDate = (d: Date) => d.toISOString().slice(0, 10);
