import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Check, ChevronsUpDown, X } from "lucide-react";

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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";


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
  useCarteiraPrazo,
  useClienteTimeline,
  useExtratoClientes,

  type StatusVenda,
} from "@/lib/queries/contas-receber";
import { Badge } from "@/components/ui/badge";
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

/**
 * Recharts colapsa o eixo Y quando todos os pontos têm o mesmo valor
 * (domínio degenerado), e a linha some. Gera um domínio com folga.
 */
function yDomain(values: number[]): [number, number] {
  if (!values.length) return [0, 1];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) {
    const pad = Math.abs(min) * 0.1 || 1;
    return [min - pad, max + pad];
  }
  const pad = (max - min) * 0.1;
  return [min - pad, max + pad];
}


const STATUS_LABEL: Record<StatusVenda, string> = {
  pago: "Pago",
  parcial: "Parcial",
  aberto: "Em aberto",
};

function StatusBadge({ status }: { status: StatusVenda }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium",
        status === "pago" && "border-emerald-600/30 bg-emerald-600/10 text-emerald-700",
        status === "parcial" && "border-amber-600/30 bg-amber-600/10 text-amber-700",
        status === "aberto" && "border-red-600/30 bg-red-600/10 text-red-700",
      )}
    >
      {STATUS_LABEL[status]}
    </Badge>
  );
}

function fmtDate(d?: string | null) {
  return d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "—";
}

type SortKey = "cod_cliente" | "nome_cliente" | "saldoAnterior" | "compras" | "pagamentos" | "saldoAtual";

const PAGE_SIZE = 25;

function money(v: number | null) {
  return v == null ? "—" : brl(v);
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
  const { data: carteira, isLoading: loadingCarteira } = useCarteiraPrazo();
  const { data: timeline, isLoading: loadingTimeline } = useClienteTimeline(selectedCod);

  const { data: extrato, isLoading: loadingExtrato } = useExtratoClientes(
    effective?.from ?? "",
    effective?.to ?? "",
  );
  const [busca, setBusca] = useState("");
  const [soComCompras, setSoComCompras] = useState(false);
  const [soComPagamentos, setSoComPagamentos] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("saldoAtual");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);

  const linhas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const base = (extrato ?? []).filter(
      (r) =>
        (!q ||
          r.nome_cliente.toLowerCase().includes(q) ||
          r.cod_cliente.toLowerCase().includes(q)) &&
        (!soComCompras || r.compras > 0) &&
        (!soComPagamentos || r.pagamentos > 0),
    );
    const dir = sortDir === "asc" ? 1 : -1;
    return [...base].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "string" || typeof bv === "string") {
        return String(av ?? "").localeCompare(String(bv ?? ""), "pt-BR") * dir;
      }
      return (((av as number | null) ?? 0) - ((bv as number | null) ?? 0)) * dir;
    });
  }, [extrato, busca, soComCompras, soComPagamentos, sortKey, sortDir]);


  const totalPages = Math.max(1, Math.ceil(linhas.length / PAGE_SIZE));
  const pageIdx = Math.min(page, totalPages - 1);
  const pageRows = linhas.slice(pageIdx * PAGE_SIZE, pageIdx * PAGE_SIZE + PAGE_SIZE);

  function toggleSort(k: SortKey) {
    if (k === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setSortDir(k === "cod_cliente" || k === "nome_cliente" ? "asc" : "desc");
    }
    setPage(0);
  }

  function SortHead({
    k,
    children,
    align = "left",
  }: {
    k: SortKey;
    children: React.ReactNode;
    align?: "left" | "right";
  }) {
    return (
      <TableHead className={align === "right" ? "text-right" : undefined}>
        <button
          type="button"
          onClick={() => toggleSort(k)}
          className={cn(
            "inline-flex items-center gap-1 hover:text-foreground",
            sortKey === k ? "text-foreground font-medium" : "text-muted-foreground",
          )}
        >
          {children}
          {sortKey === k ? (sortDir === "asc" ? "↑" : "↓") : null}
        </button>
      </TableHead>
    );
  }




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

      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Visão da carteira (vendas a prazo)
          </h2>
          <p className="text-xs text-muted-foreground">
            Baseado em vendas distintas (venda_doc) cruzadas com as baixas de contas recebidas.
            {loadingCarteira ? " Carregando…" : null}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Vendas a prazo em aberto"
            value={carteira?.vendasAbertasQtd ?? 0}
            format="raw"
            hint="sem baixa total"
          />
          <KpiCard
            label="Valor em aberto (vendas a prazo)"
            value={carteira?.valorAberto ?? 0}
            hint="líquido menos baixas"
          />
          <KpiCard
            label="Prazo médio de recebimento"
            value={
              carteira?.prazoMedioDias != null
                ? `${carteira.prazoMedioDias.toFixed(1)} dias`
                : "—"
            }
            format="raw"
            hint={`baseado em ${carteira?.amostraQuitadas ?? 0} vendas já quitadas`}
          />
          <KpiCard
            label="Ticket médio a prazo"
            value={carteira?.ticketMedio ?? 0}
            hint={`${carteira?.totalVendas ?? 0} vendas distintas`}
          />
        </div>
      </section>


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
                  domain={yDomain(data.serieSaldo.map((p) => p.total))}
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
                  connectNulls
                  isAnimationActive={false}
                  dot={{ r: 3, fill: "var(--primary)", stroke: "var(--primary)" }}
                  activeDot={{ r: 5 }}
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
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-base">Extrato por cliente no período</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              {linhas.length} cliente(s) com movimento. Clique nos cabeçalhos para ordenar.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center md:w-auto">
            <Input
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setPage(0);
              }}
              placeholder="Buscar por nome ou código…"
              className="w-full sm:w-[280px]"
            />
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
              <label className="flex cursor-pointer items-center gap-2 whitespace-nowrap">
                <Checkbox
                  checked={soComCompras}
                  onCheckedChange={(checked) => {
                    setSoComCompras(checked === true);
                    setPage(0);
                  }}
                />
                Só com compras no período
              </label>
              <label className="flex cursor-pointer items-center gap-2 whitespace-nowrap">
                <Checkbox
                  checked={soComPagamentos}
                  onCheckedChange={(checked) => {
                    setSoComPagamentos(checked === true);
                    setPage(0);
                  }}
                />
                Só com pagamentos no período
              </label>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <Table>
            <TableHeader>
              <TableRow>
                <SortHead k="cod_cliente">Código</SortHead>
                <SortHead k="nome_cliente">Cliente</SortHead>
                <SortHead k="saldoAnterior" align="right">Saldo anterior</SortHead>
                <SortHead k="compras" align="right">Compras no período</SortHead>
                <SortHead k="pagamentos" align="right">Pagamentos no período</SortHead>
                <SortHead k="saldoAtual" align="right">Saldo atual</SortHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.map((r) => (
                <TableRow
                  key={r.cod_cliente}
                  className="cursor-pointer"
                  onClick={() => setSelectedCod(r.cod_cliente)}
                >
                  <TableCell className="tabular-nums">{r.cod_cliente}</TableCell>
                  <TableCell className="truncate max-w-[320px]">{r.nome_cliente}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {money(r.saldoAnterior)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{brl(r.compras)}</TableCell>
                  <TableCell className="text-right tabular-nums">{brl(r.pagamentos)}</TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    {money(r.saldoAtual)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCod(r.cod_cliente);
                      }}
                    >
                      Ver
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!pageRows.length && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    {loadingExtrato ? "Carregando…" : "Sem dados no período."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {totalPages > 1 && (
            <div className="flex items-center justify-end gap-3 text-sm text-muted-foreground">
              <span>
                Página {pageIdx + 1} de {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                className="h-7"
                disabled={pageIdx === 0}
                onClick={() => setPage(pageIdx - 1)}
              >
                Anterior
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7"
                disabled={pageIdx >= totalPages - 1}
                onClick={() => setPage(pageIdx + 1)}
              >
                Próxima
              </Button>
            </div>
          )}
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
                          domain={yDomain(detalhe.serieSaldo.map((p) => p.saldo))}
                          allowDataOverflow={false}
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
                          stroke="var(--primary)"
                          strokeWidth={2}
                          connectNulls
                          isAnimationActive={false}
                          dot={{ r: 3, fill: "var(--primary)", stroke: "var(--primary)" }}
                          activeDot={{ r: 5 }}
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
                  Linha do tempo de vendas a prazo
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data da compra</TableHead>
                      <TableHead>Nº venda</TableHead>
                      <TableHead className="text-right">Valor da venda</TableHead>
                      <TableHead>Baixas</TableHead>
                      <TableHead className="text-right">Liquidado</TableHead>
                      <TableHead className="text-right">Dias até pgto.</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(timeline ?? []).map((v) => (
                      <TableRow key={v.venda_doc}>
                        <TableCell>{fmtDate(v.data_compra)}</TableCell>
                        <TableCell className="tabular-nums">{v.venda_doc}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {brl(v.valor_liquido)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {v.baixas.length ? (
                            <div className="space-y-0.5">
                              {v.baixas.map((b, i) => (
                                <div key={i} className="tabular-nums">
                                  {fmtDate(b.data_liquidacao)} · {brl(b.valor_liquidado)}
                                </div>
                              ))}
                            </div>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {v.totalLiquidado ? brl(v.totalLiquidado) : "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {v.diasAtePagamento != null ? v.diasAtePagamento : "—"}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={v.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                    {loadingTimeline && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          Carregando…
                        </TableCell>
                      </TableRow>
                    )}
                    {!loadingTimeline && !timeline?.length && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          Sem vendas a prazo registradas para este cliente.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
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
