import { createFileRoute } from "@tanstack/react-router";
import { ShoppingCart, Package, Coins, Wallet } from "lucide-react";
import { KpiCard } from "@/components/kpi-card";
import { useOverview } from "@/lib/queries/overview";
import { supabaseConfigured } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Visão geral — Santa Rita" }] }),
  component: DashboardPage,
});

function pctDelta(current: number, prev: number): number | null {
  if (!prev) return null;
  return ((current - prev) / Math.abs(prev)) * 100;
}

function DashboardPage() {
  const { data, isLoading, error } = useOverview();

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Visão geral</h1>
        <p className="text-sm text-muted-foreground">
          {data?.latestDate
            ? `Dados referentes a ${new Date(data.latestDate + "T00:00:00").toLocaleDateString("pt-BR")}, comparados ao dia anterior.`
            : "Resumo do dia mais recente disponível."}
        </p>
      </header>

      {!supabaseConfigured && (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            Conecte seu projeto Supabase pela aba <strong>Cloud &gt; Supabase</strong> do editor
            para carregar os dados.
          </CardContent>
        </Card>
      )}

      {error && (
        <Card>
          <CardContent className="py-6 text-sm text-red-600">
            Erro ao carregar dados: {(error as Error).message}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Vendas do dia"
          value={data?.totalVendasHoje ?? 0}
          delta={data ? pctDelta(data.totalVendasHoje, data.totalVendasOntem) : null}
          icon={<ShoppingCart className="h-4 w-4" />}
          hint={isLoading ? "carregando…" : "vs dia anterior"}
        />
        <KpiCard
          label="Compras do dia"
          value={data?.totalComprasHoje ?? 0}
          delta={data ? pctDelta(data.totalComprasHoje, data.totalComprasOntem) : null}
          icon={<Package className="h-4 w-4" />}
          hint={isLoading ? "carregando…" : "vs dia anterior"}
        />
        <KpiCard
          label="Saldo de caixa"
          value={data?.saldoCaixaHoje ?? 0}
          delta={data ? pctDelta(data.saldoCaixaHoje, data.saldoCaixaOntem) : null}
          icon={<Coins className="h-4 w-4" />}
          hint={isLoading ? "carregando…" : "vs dia anterior"}
        />
        <KpiCard
          label="Contas a receber"
          value={data?.contasReceber ?? 0}
          delta={data?.crPrevIsAdjacent ? pctDelta(data.contasReceber, data.contasReceberAnterior) : null}
          icon={<Wallet className="h-4 w-4" />}
          hint={data && !data.crPrevIsAdjacent ? "sem dado do dia anterior" : "saldo em aberto"}
        />

      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Evolução do saldo a receber (mensal)</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          {mensal && mensal.some((m) => m.saldo !== null) ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mensal} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="label"
                  fontSize={12}
                  stroke="currentColor"
                  className="text-muted-foreground"
                />
                <YAxis
                  tickFormatter={(v) => brl(Number(v)).replace("R$", "").trim()}
                  fontSize={12}
                  width={80}
                  stroke="currentColor"
                  className="text-muted-foreground"
                />
                <Tooltip
                  formatter={(v: number) => brl(v)}
                  labelFormatter={(l) => `Fechamento de ${l}`}
                  contentStyle={{ fontSize: 12 }}
                />
                <Bar dataKey="saldo" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              {mensalLoading ? "Carregando…" : "Sem dados de contas a receber nos últimos 12 meses."}
            </div>
          )}
        </CardContent>
        <CardContent className="pt-0 text-xs text-muted-foreground">
          Cada barra usa a última data_referencia disponível no mês. Meses sem relatório ficam
          vazios.
        </CardContent>
      </Card>

    </div>
  );
}
