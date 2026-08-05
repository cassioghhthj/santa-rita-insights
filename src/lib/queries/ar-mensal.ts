import { useQuery } from "@tanstack/react-query";
import { supabase, EMPRESA_ID, supabaseConfigured } from "@/lib/supabase";

export interface SaldoMensalPonto {
  /** "YYYY-MM" */
  mes: string;
  /** rótulo curto pt-BR, ex: "ago/25" */
  label: string;
  /** data_referencia usada (mais recente do mês) ou null se não há dado */
  dataReferencia: string | null;
  /** soma de saldo_devedor naquela data, ou null se o mês não tem dado */
  saldo: number | null;
}

const PAGE = 1000;

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d
    .toLocaleDateString("pt-BR", { month: "short", year: "2-digit" })
    .replace(".", "")
    .replace(" de ", "/");
}

function lastMonths(n: number): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    out.push(monthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)));
  }
  return out;
}

async function fetchSaldoMensal(): Promise<SaldoMensalPonto[]> {
  const meses = lastMonths(12);
  const first = meses[0];
  const from = `${first}-01`;

  // 1) descobrir a data_referencia mais recente de cada mês
  const datas = new Set<string>();
  for (let start = 0; start < 200000; start += PAGE) {
    const { data, error } = await supabase
      .from("contas_a_receber")
      .select("data_referencia")
      .eq("empresa_id", EMPRESA_ID)
      .gte("data_referencia", from)
      .order("data_referencia", { ascending: true })
      .range(start, start + PAGE - 1);
    if (error) throw error;
    const rows = data ?? [];
    for (const r of rows) if (r.data_referencia) datas.add(r.data_referencia);
    if (rows.length < PAGE) break;
  }

  const ultimaDoMes = new Map<string, string>();
  for (const d of datas) {
    const key = d.slice(0, 7);
    const cur = ultimaDoMes.get(key);
    if (!cur || d > cur) ultimaDoMes.set(key, d);
  }

  // 2) somar saldo_devedor em cada uma dessas datas
  const alvos = meses
    .map((m) => ({ mes: m, data: ultimaDoMes.get(m) ?? null }))
    .filter((x): x is { mes: string; data: string } => Boolean(x.data));

  const somas = new Map<string, number>();
  await Promise.all(
    alvos.map(async ({ mes, data }) => {
      let total = 0;
      for (let start = 0; start < 100000; start += PAGE) {
        const res = await supabase
          .from("contas_a_receber")
          .select("saldo_devedor")
          .eq("empresa_id", EMPRESA_ID)
          .eq("data_referencia", data)
          .range(start, start + PAGE - 1);
        if (res.error) throw res.error;
        const rows = res.data ?? [];
        for (const r of rows) total += Number(r.saldo_devedor ?? 0);
        if (rows.length < PAGE) break;
      }
      somas.set(mes, total);
    }),
  );

  return meses.map((mes) => ({
    mes,
    label: monthLabel(mes),
    dataReferencia: ultimaDoMes.get(mes) ?? null,
    saldo: somas.has(mes) ? (somas.get(mes) as number) : null,
  }));
}

export function useSaldoMensalAR() {
  return useQuery({
    queryKey: ["ar-saldo-mensal"],
    queryFn: fetchSaldoMensal,
    enabled: supabaseConfigured,
    staleTime: 300_000,
  });
}
