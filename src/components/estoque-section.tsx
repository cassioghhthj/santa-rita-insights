import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Check, ChevronsUpDown, Info, TrendingDown, TrendingUp } from "lucide-react";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  useEstoqueAlertas,
  useEstoqueMovimentacao,
  useEstoqueProdutos,
  type EstoqueSaldoRow,
} from "@/lib/queries/estoque";
import { num } from "@/lib/format";
import { cn } from "@/lib/utils";

const qtd = (n: number) => num(Math.round(n * 100) / 100);
const signed = (n: number) => (n > 0 ? `+${qtd(n)}` : qtd(n));

const AVISO =
  "Saldo relativo desde 01/07/2026 (não é o estoque físico real, que não temos disponível). Positivo = comprou mais do que vendeu; negativo = vendeu mais do que comprou.";

function AlertList({
  title,
  icon,
  tone,
  rows,
  loading,
  onSelect,
}: {
  title: string;
  icon: React.ReactNode;
  tone: "neg" | "pos";
  rows: EstoqueSaldoRow[];
  loading: boolean;
  onSelect: (cod: string) => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {loading && <div className="py-6 text-sm text-muted-foreground">Carregando…</div>}
        {!loading && !rows.length && (
          <div className="py-6 text-sm text-muted-foreground">Sem dados.</div>
        )}
        {rows.map((r) => (
          <button
            key={r.codigo_produto}
            type="button"
            onClick={() => onSelect(r.codigo_produto)}
            className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-accent"
          >
            <div className="min-w-0">
              <div className="truncate text-sm">{r.produto}</div>
              <div className="truncate text-xs text-muted-foreground">
                {r.codigo_produto} · {r.classe_nome}
              </div>
            </div>
            <div
              className={cn(
                "shrink-0 text-sm font-medium tabular-nums",
                tone === "neg" ? "text-red-600" : "text-emerald-600",
              )}
            >
              {signed(r.saldo_acumulado)}
            </div>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}

export function EstoqueSection() {
  const { data: alertas, isLoading: loadingAlertas, error } = useEstoqueAlertas();
  const { data: produtos } = useEstoqueProdutos();
  const [codigo, setCodigo] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const { data: mov, isLoading: loadingMov } = useEstoqueMovimentacao(codigo);

  const selecionado = useMemo(
    () => (produtos ?? []).find((p) => p.codigo_produto === codigo) ?? null,
    [produtos, codigo],
  );

  const chartData = useMemo(
    () =>
      (mov ?? []).map((m) => ({
        data: m.data.slice(8, 10) + "/" + m.data.slice(5, 7),
        saldo: m.saldo_acumulado,
      })),
    [mov],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-2 rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>{AVISO}</span>
      </div>

      {error && (
        <Card>
          <CardContent className="py-6 text-sm text-red-600">
            Erro ao carregar estoque: {(error as Error).message}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <AlertList
          title="Possível falta de estoque"
          icon={<TrendingDown className="h-4 w-4 text-red-600" />}
          tone="neg"
          rows={alertas?.falta ?? []}
          loading={loadingAlertas}
          onSelect={setCodigo}
        />
        <AlertList
          title="Possível excesso / risco de perda"
          icon={<TrendingUp className="h-4 w-4 text-emerald-600" />}
          tone="pos"
          rows={alertas?.excesso ?? []}
          loading={loadingAlertas}
          onSelect={setCodigo}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              Ficha de estoque por produto
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help text-muted-foreground">
                    <Info className="h-3.5 w-3.5" />
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-xs">{AVISO}</TooltipContent>
              </Tooltip>
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Histórico completo desde 01/07/2026 (não afetado pelo filtro de período).
            </p>
          </div>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="w-full justify-between sm:w-[360px]">
                <span className="truncate">
                  {selecionado
                    ? `${selecionado.produto} (${selecionado.codigo_produto})`
                    : codigo
                      ? codigo
                      : "Selecionar produto…"}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[360px] p-0" align="end">
              <Command>
                <CommandInput placeholder="Buscar por nome ou código…" />
                <CommandList>
                  <CommandEmpty>Nenhum produto.</CommandEmpty>
                  <CommandGroup>
                    {(produtos ?? []).slice(0, 500).map((p) => (
                      <CommandItem
                        key={p.codigo_produto}
                        value={`${p.produto} ${p.codigo_produto}`}
                        onSelect={() => {
                          setCodigo(p.codigo_produto);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            codigo === p.codigo_produto ? "opacity-100" : "opacity-0",
                          )}
                        />
                        <span className="truncate">{p.produto}</span>
                        <span className="ml-auto pl-2 text-xs text-muted-foreground">
                          {p.codigo_produto}
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
          {!codigo ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Selecione um produto (ou clique em um item das listas acima).
            </div>
          ) : (
            <>
              <div className="h-72">
                {chartData.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis
                        dataKey="data"
                        fontSize={11}
                        stroke="currentColor"
                        className="text-muted-foreground"
                      />
                      <YAxis
                        fontSize={11}
                        width={70}
                        tickFormatter={(v) => qtd(Number(v))}
                        stroke="currentColor"
                        className="text-muted-foreground"
                      />
                      <RTooltip
                        formatter={(v: number) => [qtd(v), "Saldo acumulado"]}
                        contentStyle={{ fontSize: 12 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="saldo"
                        stroke="var(--primary)"
                        strokeWidth={2}
                        dot={false}
                        connectNulls
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    {loadingMov ? "Carregando…" : "Sem movimentação para este produto."}
                  </div>
                )}
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Comprado</TableHead>
                      <TableHead className="text-right">Vendido</TableHead>
                      <TableHead className="text-right">Saldo do dia</TableHead>
                      <TableHead className="text-right">Saldo acumulado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(mov ?? []).map((m) => (
                      <TableRow key={m.data}>
                        <TableCell className="tabular-nums">
                          {m.data.split("-").reverse().join("/")}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {qtd(m.qtde_comprada)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {qtd(m.qtde_vendida)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right tabular-nums",
                            m.saldo_dia > 0 && "text-emerald-600",
                            m.saldo_dia < 0 && "text-red-600",
                          )}
                        >
                          {signed(m.saldo_dia)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right font-medium tabular-nums",
                            m.saldo_acumulado > 0 && "text-emerald-600",
                            m.saldo_acumulado < 0 && "text-red-600",
                          )}
                        >
                          {signed(m.saldo_acumulado)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {!loadingMov && !(mov ?? []).length && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          Sem dados.
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
