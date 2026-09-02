import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LancamentosTab } from "@/components/financeiro/lancamentos-tab";
import { ImportarTab } from "@/components/financeiro/importar-tab";
import { ContasTab } from "@/components/financeiro/contas-tab";
import { PlanoTab } from "@/components/financeiro/plano-tab";
import { RegrasTab } from "@/components/financeiro/regras-tab";
import { resolvePreset, type PeriodValue } from "@/components/period-picker";
import { useLatestDate } from "@/lib/queries/latest-date";
import { supabaseConfigured } from "@/lib/supabase";

export const Route = createFileRoute("/_authenticated/financeiro")({
  head: () => ({
    meta: [
      { title: "Financeiro — Santa Rita" },
      {
        name: "description",
        content:
          "Lançamentos financeiros, importação de extratos OFX/CSV, contas, plano de contas e regras de classificação.",
      },
      { property: "og:title", content: "Financeiro — Santa Rita" },
      {
        property: "og:description",
        content:
          "Lançamentos financeiros, importação de extratos OFX/CSV, contas, plano de contas e regras de classificação.",
      },
    ],
  }),
  component: FinanceiroPage,
});

function FinanceiroPage() {
  const { data: latest } = useLatestDate();
  const [period, setPeriod] = useState<PeriodValue | null>(null);
  const effective = useMemo<PeriodValue | null>(() => {
    if (period) return period;
    if (latest) return resolvePreset("30d", latest);
    return null;
  }, [period, latest]);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Financeiro</h1>
        <p className="text-sm text-muted-foreground">
          Lançamentos, importação de extratos e cadastros de classificação.
        </p>
      </header>

      {!supabaseConfigured && (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            Conecte seu projeto Supabase para carregar os dados.
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="lancamentos" className="space-y-6">
        <TabsList>
          <TabsTrigger value="lancamentos">Lançamentos</TabsTrigger>
          <TabsTrigger value="importar">Importar Extrato</TabsTrigger>
          <TabsTrigger value="contas">Contas</TabsTrigger>
          <TabsTrigger value="plano">Plano de Contas</TabsTrigger>
          <TabsTrigger value="regras">Regras</TabsTrigger>
        </TabsList>

        <TabsContent value="lancamentos" className="mt-0">
          {effective && latest ? (
            <LancamentosTab period={effective} onPeriodChange={setPeriod} latest={latest} />
          ) : (
            <Card>
              <CardContent className="py-6 text-sm text-muted-foreground">Carregando…</CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="importar" className="mt-0">
          <ImportarTab />
        </TabsContent>

        <TabsContent value="contas" className="mt-0">
          <ContasTab />
        </TabsContent>

        <TabsContent value="plano" className="mt-0">
          <PlanoTab />
        </TabsContent>

        <TabsContent value="regras" className="mt-0">
          <RegrasTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
