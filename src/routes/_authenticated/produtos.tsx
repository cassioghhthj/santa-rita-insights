import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KpiCard } from "@/components/kpi-card";
import { EstoqueSection } from "@/components/estoque-section";
import { PeriodPicker, resolvePreset, type PeriodValue } from "@/components/period-picker";
import { useLatestDate } from "@/lib/queries/latest-date";
import { useProdutos, type ProdutoRow } from "@/lib/queries/produtos";
import { brl, num } from "@/lib/format";
import { supabaseConfigured } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/produtos")({
  head: () => ({
    meta: [
      { title: "Produtos — Santa Rita" },
      {
        name: "description",
        content: "Vendas e compras por produto no período, com preços médios e ranking.",
      },
      { property: "og:title", content: "Produtos — Santa Rita" },
      {
        property: "og:description",
        content: "Vendas e compras por produto no período, com preços médios e ranking.",
      },
    ],
  }),
  component: ProdutosPage,
});

type SortKey =
  | "codigo_produto"
  | "produto"
  | "classe_nome"
  | "qtde_vendida"
  | "vlr_total_vendas"
  | "preco_medio_venda"
  | "qtde_comprada"
  | "vlr_total_compras"
  | "margemValor"
  | "margemPercentual";

const PAGE = 25;

function ProdutosPage() {
  const { data: latest } = useLatestDate();
  const [period, setPeriod] = useState<PeriodValue | null>(null);
  const effective = useMemo<PeriodValue | null>(() => {
    if (period) return period;
    if (latest) return resolvePreset("30d", latest);
    return null;
  }, [period, latest]);

  const { data, isLoading, error } = useProdutos(effective?.from ?? "", effective?.to ?? "");

  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("vlr_total_vendas");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);
  const [topBy, setTopBy] = useState<"qtde" | "valor">("qtde");

  function toggleSort(k: SortKey) {
    if (k === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setSortDir(typeof (data?.rows[0]?.[k] ?? "") === "number" ? "desc" : "asc");
    }
    setPage(0);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = (data?.rows ?? []).filter(
      (r) =>
        !q ||
        r.produto.toLowerCase().includes(q) ||
        r.codigo_produto.toLowerCase().includes(q) ||
        r.classe_nome.toLowerCase().includes(q),
    );
    const dir = sortDir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv), "pt-BR") * dir;
    });
  }, [data, search, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE));
  const current = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(current * PAGE, current * PAGE + PAGE);

  const topRows = useMemo(() => {
    const rows = [...(data?.rows ?? [])];
    rows.sort((a, b) =>
      topBy === "qtde" ? b.qtde_vendida - a.qtde_vendida : b.vlr_total_vendas - a.vlr_total_vendas,
    );
    return rows.slice(0, 15).map((r) => ({
      label: r.produto.length > 28 ? r.produto.slice(0, 28) + "…" : r.produto,
      value: topBy === "qtde" ? r.qtde_vendida : r.vlr_total_vendas,
    }));
  }, [data, topBy]);

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
          <h1 className="text-2xl font-semibold tracking-tight">Produtos</h1>
          <p className="text-sm text-muted-foreground">
            Vendas e compras por produto no período, com preços médios recalculados.
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Quantidade vendida"
          value={num(Math.round((data?.totalQtdeVendida ?? 0) * 100) / 100)}
          format="raw"
          hint={isLoading ? "carregando…" : `${data?.rows.length ?? 0} produtos`}
        />
        <KpiCard label="Valor vendido" value={data?.totalValorVendido ?? 0} />
        <KpiCard
          label="Produto mais vendido"
          value={data?.maisVendido?.produto ?? "—"}
          format="raw"
          hint={
            data?.maisVendido
              ? `${num(Math.round(data.maisVendido.qtde_vendida * 100) / 100)} un. · ${brl(data.maisVendido.vlr_total_vendas)}`
              : undefined
          }
        />
        <KpiCard
          label="Margem do período"
          value={data ? data.totalValorVendido - data.totalValorComprado : 0}
          format="brl"
          valueClassName={
            data && data.totalValorVendido - data.totalValorComprado >= 0
              ? "text-emerald-600"
              : "text-red-600"
          }
          hint={
            data && data.totalValorVendido > 0
              ? `${((data.totalValorVendido - data.totalValorComprado) / data.totalValorVendido * 100).toFixed(1).replace(".", ",")}% sobre vendas`
              : undefined
          }
        />
      </div>

      <Tabs defaultValue="ranking" className="space-y-6">
        <TabsList>
          <TabsTrigger value="ranking">Ranking</TabsTrigger>
          <TabsTrigger value="estoque">Estoque</TabsTrigger>
        </TabsList>

        <TabsContent value="ranking" className="space-y-6 mt-0">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Top 15 produtos mais vendidos</CardTitle>
            <div className="inline-flex rounded-md border bg-card p-0.5">
              {(
                [
                  { k: "qtde", label: "Quantidade" },
                  { k: "valor", label: "Valor" },
                ] as const
              ).map((o) => (
                <Button
                  key={o.k}
                  size="sm"
                  variant="ghost"
                  className={cn(
                    "h-8 rounded-sm px-3 text-xs",
                    topBy === o.k &&
                      "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
                  )}
                  onClick={() => setTopBy(o.k)}
                >
                  {o.label}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="h-[28rem]">
            {topRows.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topRows}
                  layout="vertical"
                  margin={{ left: 24, right: 16, top: 8, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    type="number"
                    tickFormatter={(v) =>
                      topBy === "valor" ? brl(Number(v)).replace("R$", "").trim() : num(Number(v))
                    }
                    fontSize={12}
                    stroke="currentColor"
                    className="text-muted-foreground"
                  />
                  <YAxis
                    type="category"
                    dataKey="label"
                    fontSize={11}
                    width={200}
                    stroke="currentColor"
                    className="text-muted-foreground"
                  />
                  <Tooltip
                    formatter={(v: number) => (topBy === "valor" ? brl(v) : num(v))}
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Bar dataKey="value" fill="var(--primary)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                {isLoading ? "Carregando…" : "Sem dados no período."}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base">Produtos no período</CardTitle>
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                placeholder="Buscar por produto, código ou categoria…"
                className="h-9 sm:w-80"
              />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Margem aproximada: compara o preço médio de compra e venda do produto no período, não é custo de
              reposição exato por unidade vendida (sem controle de estoque FIFO).
            </p>
            <div className="text-xs text-muted-foreground">
              {filtered.length} produto(s) · página {current + 1} de {pageCount}
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortHead k="codigo_produto">Código</SortHead>
                    <SortHead k="produto">Produto</SortHead>
                    <SortHead k="classe_nome">Categoria</SortHead>
                    <SortHead k="qtde_vendida" align="right">
                      Qtde vendida
                    </SortHead>
                    <SortHead k="vlr_total_vendas" align="right">
                      Valor vendido
                    </SortHead>
                    <SortHead k="preco_medio_venda" align="right">
                      Preço médio venda
                    </SortHead>
                    <SortHead k="qtde_comprada" align="right">
                      Qtde comprada
                    </SortHead>
                    <SortHead k="vlr_total_compras" align="right">
                      Valor comprado
                    </SortHead>
                    <SortHead k="margemValor" align="right">
                      Margem R$
                    </SortHead>
                    <SortHead k="margemPercentual" align="right">
                      Margem %
                    </SortHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageRows.map((r: ProdutoRow) => (
                    <TableRow key={r.codigo_produto}>
                      <TableCell className="text-muted-foreground tabular-nums">
                        {r.codigo_produto}
                      </TableCell>
                      <TableCell className="max-w-[280px] truncate">{r.produto}</TableCell>
                      <TableCell className="max-w-[180px] truncate text-muted-foreground">
                        {r.classe_nome}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {num(Math.round(r.qtde_vendida * 100) / 100)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {brl(r.vlr_total_vendas)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {r.qtde_vendida > 0 ? brl(r.preco_medio_venda) : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {num(Math.round(r.qtde_comprada * 100) / 100)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {brl(r.vlr_total_compras)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!isLoading && !pageRows.length && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        Sem dados.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={current === 0}
                onClick={() => setPage(current - 1)}
              >
                Anterior
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={current >= pageCount - 1}
                onClick={() => setPage(current + 1)}
              >
                Próxima
              </Button>
            </div>
          </CardContent>
        </Card>
        </TabsContent>

        <TabsContent value="estoque" className="mt-0">
          <EstoqueSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
