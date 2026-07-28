import { isoDate } from "./format";

export type PeriodKey = "today" | "7d" | "30d" | "custom";

export interface PeriodRange {
  from: string; // yyyy-mm-dd
  to: string;
  label: string;
}

export function resolvePeriod(
  key: PeriodKey,
  custom?: { from?: string; to?: string },
): PeriodRange {
  const today = new Date();
  const to = isoDate(today);
  if (key === "today") return { from: to, to, label: "Hoje" };
  if (key === "7d") {
    const d = new Date(today);
    d.setDate(d.getDate() - 6);
    return { from: isoDate(d), to, label: "Últimos 7 dias" };
  }
  if (key === "30d") {
    const d = new Date(today);
    d.setDate(d.getDate() - 29);
    return { from: isoDate(d), to, label: "Últimos 30 dias" };
  }
  return {
    from: custom?.from ?? to,
    to: custom?.to ?? to,
    label: "Período customizado",
  };
}
