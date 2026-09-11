import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { KpiCard } from "@/components/kpi-card";
import { PeriodPicker, resolvePreset, type PeriodValue } from "@/components/period-picker";
import { useLatestDate } from "@/lib/queries/latest-date";
import { useVendas } from "@/lib/queries/vendas";
import { brl } from "@/lib/format";
import { gerarVendasPdf } from "@/lib/vendas-pdf";
import { supabaseConfigured } from "@/lib/supabase";

export const Route = createFileRoute("/_authenticated/vendas")({
  head: () => ({ meta: [{ title: "Vendas — Santa Rita" }] }),
  component: VendasPage,
});

function formatShortDate(d: string) {
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function VendasPage() {
  const { data: latest } = useLatestDate();
  const [period, setPeriod] = useState<PeriodValue | null>(null);
  const effective = useMemo<PeriodValue | null>(() => {
    if (period) return period;
    if (latest) return resolvePreset("30d", latest);
    return null;
  }, [period, latest]);

  const { data, isLoading, error } = useVendas(effective?.from ?? "", effective?.to ?? "");

  const ticket = data && data.series.length ? data.totalPeriodo / data.series.length : 0;
  const bestDay = data?.series.reduce<{ data: string; total: number } | null>(
    (best, r) => (!best || r.total > best.total ? r : best),
    null,
  );

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Vendas</h1>
          <p className="text-sm text-muted-foreground">
            Série temporal, formas de pagamento, PDVs e produtos mais vendidos.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {effective && latest ? (
            <PeriodPicker value={effective} onChange={setPeriod} latest={latest} />
          ) : null}
          <Button
            size="sm"
            variant="outline"
            className="h-9"
            disabled={!data || !effective}
            onClick={() => data && effective && gerarVendasPdf(data, effective)}
          >
            <FileDown className="mr-2 size-4" />
            Exportar PDF
          </Button>
        </div>
      </header>

      {!supabaseConfigured && (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            Conecte seu projeto Supabase para carregar os dados.
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          label="Total no período"
          value={data?.totalPeriodo ?? 0}
          hint={isLoading ? "carregando…" : `${data?.series.length ?? 0} dias`}
        />
        <KpiCard
          label="Ticket médio diário"
          value={ticket}
          hint={isLoading ? "carregando…" : "média por dia"}
        />
        <KpiCard
          label="Melhor dia"
          value={bestDay?.total ?? 0}
          hint={bestDay ? new Date(bestDay.data + "T00:00:00").toLocaleDateString("pt-BR") : "—"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Vendas por dia</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          {data && data.series.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.series} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="data"
                  tickFormatter={formatShortDate}
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
                  labelFormatter={(d) =>
                    new Date(String(d) + "T00:00:00").toLocaleDateString("pt-BR")
                  }
                  contentStyle={{ fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              {isLoading ? "Carregando…" : "Sem dados no período."}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Por forma de pagamento</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {data && data.byPagamento.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.byPagamento}
                  layout="vertical"
                  margin={{ left: 24, right: 16, top: 8, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    type="number"
                    tickFormatter={(v) => brl(Number(v)).replace("R$", "").trim()}
                    fontSize={12}
                    stroke="currentColor"
                    className="text-muted-foreground"
                  />
                  <YAxis
                    type="category"
                    dataKey="forma"
                    fontSize={12}
                    width={110}
                    stroke="currentColor"
                    className="text-muted-foreground"
                  />
                  <Tooltip formatter={(v: number) => brl(v)} contentStyle={{ fontSize: 12 }} />
                  <Bar dataKey="total" fill="var(--primary)" radius={[0, 4, 4, 0]}>
                    <LabelList
                      dataKey="total"
                      position="right"
                      formatter={(v: number) => brl(v)}
                      fontSize={11}
                      fill="currentColor"
                      className="fill-foreground"
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                {isLoading ? "Carregando…" : "Sem dados."}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Por PDV</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PDV</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Descontos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.byPdv ?? []).map((r) => (
                  <TableRow key={r.pdv}>
                    <TableCell className="font-medium">PDV {r.pdv}</TableCell>
                    <TableCell className="text-right tabular-nums">{brl(r.total)}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {brl(r.descontos)}
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && !data?.byPdv.length && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      Sem dados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top 20 produtos no período</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">#</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Total vendido</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.topProdutos ?? []).map((r, i) => (
                <TableRow key={r.codigo}>
                  <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="tabular-nums">{r.codigo}</TableCell>
                  <TableCell className="truncate max-w-[420px]">{r.produto}</TableCell>
                  <TableCell className="text-right tabular-nums">{brl(r.total)}</TableCell>
                </TableRow>
              ))}
              {!isLoading && !data?.topProdutos.length && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Sem dados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
