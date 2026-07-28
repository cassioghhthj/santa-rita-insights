import { useQuery } from "@tanstack/react-query";
import { supabase, EMPRESA_ID, supabaseConfigured } from "@/lib/supabase";

async function fetchLatestDate(): Promise<string | null> {
  const { data, error } = await supabase
    .from("vendas_por_pdv")
    .select("data")
    .eq("empresa_id", EMPRESA_ID)
    .order("data", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.data ?? null;
}

export function useLatestDate() {
  return useQuery({
    queryKey: ["latest-date"],
    queryFn: fetchLatestDate,
    enabled: supabaseConfigured,
    staleTime: 5 * 60_000,
  });
}
