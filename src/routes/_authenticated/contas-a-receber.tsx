import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Check, ChevronsUpDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { KpiCard } from "@/components/kpi-card";
import { PeriodPicker, resolvePreset, type PeriodValue } from "@/components/period-picker";
import { useLatestDate } from "@/lib/queries/latest-date";
import {
  useClienteDetalhe,
  useContasReceberOverview,
} from "@/lib/queries/contas-receber";
import { brl } from "@/lib/format";
import { cn } from "@/lib/utils";
import { supabaseConfigured } from "@/lib/supabase";

export const Route = createFileRoute("/_authenticated/contas-a-receber")({
  head: () => ({ meta: [{ title: "Contas a Receber — Santa Rita" }] }),
  component: ContasReceberPage,
});

function formatShortDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

function ContasReceberPage() {
  const { data: latest } = useLatestDate();
  const [period, setPeriod] = useState<PeriodValue | null>(null);
  const effective = useMemo<PeriodValue | null>(() => {
    if (period) return period;
    if (latest) return resolvePreset("30d", latest);
    return null;
  }, [period, latest]);

  const { data, isLoading, error } = useContasReceberOverview(
    effective?.from ?? "",
    effective?.to ?? "",
  );

  const [selectedCod, setSelectedCod] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const selectedNome =
    data?.clientesLista.find((c) => c.cod_cliente === selectedCod)?.nome_cliente ?? null;
  const { data: detalhe, isLoading: loadingDetalhe } = useClienteDetalhe(selectedCod);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contas a Receber</h1>
          <p className="text-sm text-muted-foreground">
            Saldo em aberto, evolução e histórico por cliente.
            {data?.latestDate ? (
              <>
                {" "}Snapshot mais recente:{" "}
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
          label="Saldo total em aberto"
          value={data?.saldoTotalAberto ?? 0}
          hint="snapshot mais recente"
        />
        <KpiCard
          label="Clientes com saldo"
          value={data?.clientesComSaldo ?? 0}
          format="raw"
          hint="saldo devedor > 0"
        />
        <KpiCard
          label="Recebido no período"
          value={data?.totalRecebidoPeriodo ?? 0}
          hint="baixas efetivas"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Evolução do saldo em aberto</CardTitle>
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
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              {isLoading ? "Carregando…" : "Sem snapshots no período."}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top 20 clientes com maior saldo devedor</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">#</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Saldo devedor</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.topDevedores ?? []).map((r, i) => (
                <TableRow key={r.cod_cliente + i}>
                  <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="tabular-nums">{r.cod_cliente}</TableCell>
                  <TableCell className="truncate max-w-[360px]">{r.nome_cliente}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {brl(r.saldo_devedor)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={() => setSelectedCod(r.cod_cliente)}
                    >
                      Ver
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && !data?.topDevedores.length && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Sem dados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-base">Detalhe por cliente</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Evolução do saldo e histórico de recebimentos.
            </p>
          </div>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full md:w-[360px] justify-between"
              >
                <span className="truncate">
                  {selectedNome
                    ? `${selectedCod} — ${selectedNome}`
                    : "Selecionar cliente…"}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[360px] p-0" align="end">
              <Command>
                <CommandInput placeholder="Buscar por nome ou código…" />
                <CommandList>
                  <CommandEmpty>Nenhum cliente.</CommandEmpty>
                  <CommandGroup>
                    {(data?.clientesLista ?? []).map((c) => (
                      <CommandItem
                        key={c.cod_cliente}
                        value={`${c.cod_cliente} ${c.nome_cliente}`}
                        onSelect={() => {
                          setSelectedCod(c.cod_cliente);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedCod === c.cod_cliente ? "opacity-100" : "opacity-0",
                          )}
                        />
                        <span className="truncate">
                          <span className="tabular-nums text-muted-foreground">
                            {c.cod_cliente}
                          </span>{" "}
                          — {c.nome_cliente}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </CardHeader>
        <CardContent className="space-y-6">
          {!selectedCod && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Selecione um cliente para ver o detalhe.
            </div>
          )}
          {selectedCod && (
            <>
              <div>
                <div className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                  Saldo devedor ao longo do tempo
                </div>
                <div className="h-64">
                  {detalhe && detalhe.serieSaldo.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={detalhe.serieSaldo}
                        margin={{ left: 8, right: 8, top: 8, bottom: 8 }}
                      >
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
                          dataKey="saldo"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      {loadingDetalhe ? "Carregando…" : "Sem snapshots para este cliente."}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                  Recebimentos
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data liquidação</TableHead>
                      <TableHead>Nº venda</TableHead>
                      <TableHead className="text-right">Valor liquidado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(detalhe?.recebimentos ?? []).map((r, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          {r.data_liquidacao
                            ? new Date(r.data_liquidacao + "T00:00:00").toLocaleDateString(
                                "pt-BR",
                              )
                            : "—"}
                        </TableCell>
                        <TableCell className="tabular-nums">{r.numero_venda ?? "—"}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {brl(r.valor_liquidado)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {!loadingDetalhe && !detalhe?.recebimentos.length && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          Sem recebimentos registrados.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
