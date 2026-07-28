import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/contas-a-receber")({
  head: () => ({ meta: [{ title: "Contas a receber — Santa Rita" }] }),
  component: () => (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Contas a receber</h1>
        <p className="text-sm text-muted-foreground">Em construção — próxima etapa.</p>
      </header>
      <Card>
        <CardHeader><CardTitle className="text-base">Em breve</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Saldo em aberto, maiores devedores, evolução do saldo por dia e por cliente, e recebimentos
          efetivos (contas_recebidas).
        </CardContent>
      </Card>
    </div>
  ),
});
