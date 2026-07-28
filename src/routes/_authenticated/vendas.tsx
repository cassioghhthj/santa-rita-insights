import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/vendas")({
  head: () => ({ meta: [{ title: "Vendas — Santa Rita" }] }),
  component: () => <Placeholder title="Vendas" />,
});

function Placeholder({ title }: { title: string }) {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">Em construção — próxima etapa.</p>
      </header>
      <Card>
        <CardHeader><CardTitle className="text-base">Em breve</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Série temporal, formas de pagamento, PDVs e produtos mais vendidos.
        </CardContent>
      </Card>
    </div>
  );
}
