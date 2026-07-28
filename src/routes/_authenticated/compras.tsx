import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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
import { useCompras } from "@/lib/queries/compras";
import { brl } from "@/lib/format";
import { supabaseConfigured } from "@/lib/supabase";

export const Route = createFileRoute("/_authenticated/compras")({
  head: () => ({ meta: [{ title: "Compras — Santa Rita" }] }),
  component: ComprasPage,
});

function formatShortDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

function ComprasPage() {
  const { data: latest } = useLatestDate();
  const [period, setPeriod] = useState<PeriodValue | null>(null);
  const effective = useMemo<PeriodValue | null>(() => {
    if (period) return period;
    if (latest) return resolvePreset("30d", latest);
    return null;
  }, [period, latest]);

  const { data, isLoading, error } = useCompras(effective?.from ?? "", effective?.to ?? "");

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Compras</h1>
          <p className="text-sm text-muted-foreground">
            Série temporal, classes de produto e principais fornecedores.
          </p>
        </div>
        {effective && latest ? (
          <PeriodPicker value={effective} onChange={setPeriod} latest={latest} />
        ) : null}
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
          label="Total comprado"
          value={data?.totalPeriodo ?? 0}
          hint={isLoading ? "carregando…" : `${data?.series.length ?? 0} dias`}
        />
        <KpiCard
          label="Notas / compras"
          value={data?.numCompras ?? 0}
          format="raw"
          hint="compra_id distintos"
        />
        <KpiCard
          label="Ticket médio por compra"
          value={data?.ticketMedio ?? 0}
          hint="valor médio por nota"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Compras por dia</CardTitle>
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
                  stroke="hsl(var(--primary))"
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Por classe</CardTitle>
        </CardHeader>
        <CardContent className="h-96">
          {data && data.byClasse.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.byClasse.slice(0, 15)}
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
                  dataKey="classe"
                  fontSize={12}
                  width={180}
                  stroke="currentColor"
                  className="text-muted-foreground"
                />
                <Tooltip formatter={(v: number) => brl(v)} contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
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
          <CardTitle className="text-base">Principais fornecedores no período</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">#</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead className="text-right">Notas</TableHead>
                <TableHead className="text-right">Total comprado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.topFornecedores ?? []).map((r, i) => (
                <TableRow key={r.fornecedor}>
                  <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="truncate max-w-[420px]">{r.fornecedor}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {r.notas}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{brl(r.total)}</TableCell>
                </TableRow>
              ))}
              {!isLoading && !data?.topFornecedores.length && (
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
