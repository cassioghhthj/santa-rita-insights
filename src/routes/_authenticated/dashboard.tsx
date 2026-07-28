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
          delta={data ? pctDelta(data.contasReceber, data.contasReceberAnterior) : null}
          icon={<Wallet className="h-4 w-4" />}
          hint="saldo em aberto"
        />
      </div>

      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Mais gráficos e detalhamentos serão adicionados nas próximas etapas: séries diárias,
          top produtos, top fornecedores e evolução de contas a receber por cliente.
        </CardContent>
      </Card>
    </div>
  );
}
