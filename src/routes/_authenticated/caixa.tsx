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
import { useCaixa } from "@/lib/queries/caixa";
import { brl } from "@/lib/format";
import { supabaseConfigured } from "@/lib/supabase";

export const Route = createFileRoute("/_authenticated/caixa")({
  head: () => ({ meta: [{ title: "Caixa — Santa Rita" }] }),
  component: CaixaPage,
});

function formatShortDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

function CaixaPage() {
  const { data: latest } = useLatestDate();
  const [period, setPeriod] = useState<PeriodValue | null>(null);
  const effective = useMemo<PeriodValue | null>(() => {
    if (period) return period;
    if (latest) return resolvePreset("30d", latest);
    return null;
  }, [period, latest]);

  const { data, isLoading, error } = useCaixa(effective?.from ?? "", effective?.to ?? "");

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Caixa</h1>
          <p className="text-sm text-muted-foreground">
            Saldo consolidado, movimentações por conta e transações do dia.
            {data?.latestDate ? (
              <>
                {" "}Último dia no período:{" "}
                <span className="font-medium text-foreground">
                  {new Date(data.latestDate + "T00:00:00").toLocaleDateString("pt-BR")}
                </span>
              </>
            ) : null}
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
          label="Saldo consolidado"
          value={data?.saldoConsolidadoLatest ?? 0}
          hint="dia mais recente do período"
        />
        <KpiCard
          label="Total recebimentos"
          value={data?.totalRecebimentosPeriodo ?? 0}
          hint="no período"
        />
        <KpiCard
          label="Total sangrias"
          value={data?.totalSangriasPeriodo ?? 0}
          hint="no período"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Saldo consolidado por dia</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          {data && data.serieSaldo.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.serieSaldo} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
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
                  dot={{ r: 3 }}
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
          <CardTitle className="text-base">Saldo por conta (dia mais recente)</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          {data && data.saldoPorContaLatest.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.saldoPorContaLatest}
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
                  dataKey="conta"
                  fontSize={12}
                  width={140}
                  stroke="currentColor"
                  className="text-muted-foreground"
                />
                <Tooltip formatter={(v: number) => brl(v)} contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="saldo" fill="var(--primary)" radius={[0, 4, 4, 0]} />
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
          <CardTitle className="text-base">
            Transações do dia{" "}
            {data?.latestDate
              ? new Date(data.latestDate + "T00:00:00").toLocaleDateString("pt-BR")
              : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Conta</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Forma pagamento</TableHead>
                <TableHead className="text-right">Recebido</TableHead>
                <TableHead className="text-right">Pago</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.transacoesLatest ?? []).map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{r.conta ?? "—"}</TableCell>
                  <TableCell className="truncate max-w-[320px]">{r.descricao ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {r.forma_pagamento ?? "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-emerald-600">
                    {r.valor_recebido ? brl(r.valor_recebido) : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-red-600">
                    {r.valor_pago ? brl(r.valor_pago) : "—"}
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && !data?.transacoesLatest.length && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Sem transações registradas.
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
