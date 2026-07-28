import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/caixa")({
  head: () => ({ meta: [{ title: "Caixa — Santa Rita" }] }),
  component: () => (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Caixa</h1>
        <p className="text-sm text-muted-foreground">Em construção — próxima etapa.</p>
      </header>
      <Card>
        <CardHeader><CardTitle className="text-base">Em breve</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Saldo do dia, sangrias, recebimentos e breakdown por forma de pagamento.
        </CardContent>
      </Card>
    </div>
  ),
});
