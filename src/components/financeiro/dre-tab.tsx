import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, FileDown, TrendingDown, TrendingUp, Wallet } from "lucide-react";
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
import { KpiCard } from "@/components/kpi-card";
import { PeriodPicker, type PeriodValue } from "@/components/period-picker";
import { useDre, type DreLinha } from "@/lib/queries/dre";
import { useProvisionadasDre } from "@/lib/queries/provisionadas";
import { brl } from "@/lib/format";
import { gerarDrePdf } from "@/lib/financeiro/dre-pdf";

import { cn } from "@/lib/utils";

function Secao({
  titulo,
  linhas,
  total,
}: {
  titulo: string;
  linhas: DreLinha[];
  total: number;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{titulo}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Código</TableHead>
              <TableHead>Conta</TableHead>
              <TableHead className="text-right w-40">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {linhas.length ? (
              linhas.map((l) => (
                <TableRow key={l.codigo_id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {l.codigo}
                  </TableCell>
                  <TableCell>{l.nome}</TableCell>
                  <TableCell className="text-right tabular-nums">{brl(l.valor)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-sm text-muted-foreground">
                  Sem lançamentos no período.
                </TableCell>
              </TableRow>
            )}
            <TableRow className="border-t-2 font-medium">
              <TableCell colSpan={2}>Subtotal</TableCell>
              <TableCell className="text-right tabular-nums">{brl(total)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function DreTab({
  period,
  onPeriodChange,
  latest,
  onIrParaLancamentos,
}: {
  period: PeriodValue;
  onPeriodChange: (v: PeriodValue) => void;
  latest: string;
  onIrParaLancamentos: (aba: "lancamentos" | "caixa") => void;
}) {
  const { data, isLoading } = useDre(period);
  const { data: prov } = useProvisionadasDre(period);
  const positivo = (data?.resultado ?? 0) >= 0;
  const resultadoReal = (data?.resultado ?? 0) - (prov?.total ?? 0);
  const margemReal =
    (data?.totalReceita ?? 0) > 0 ? (resultadoReal / data!.totalReceita) * 100 : null;


  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PeriodPicker value={period} onChange={onPeriodChange} latest={latest} />
        <Button
          size="sm"
          variant="outline"
          disabled={!data || isLoading}
          onClick={() => data && gerarDrePdf(data, period, prov ?? null)}
        >
          <FileDown className="mr-2 h-4 w-4" />
          Exportar PDF
        </Button>
      </div>

      {data && data.naoClassificados > 0 && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="flex flex-wrap items-center gap-3 py-4 text-sm">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span>
              {data.naoClassificados} lançamento(s) ainda não classificados não entram neste DRE —
              classifique em Lançamentos Banco/Caixa.
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => onIrParaLancamentos("lancamentos")}>
                Lançamentos Banco
              </Button>
              <Button size="sm" variant="outline" onClick={() => onIrParaLancamentos("caixa")}>
                Lançamentos Caixa
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Receita do período"
          value={data?.totalReceita ?? 0}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <KpiCard
          label="Despesa do período"
          value={(data?.totalDespesa ?? 0) + (data?.totalRetiradas ?? 0)}
          icon={<TrendingDown className="h-4 w-4" />}
          hint={
            data && data.totalRetiradas > 0
              ? `inclui ${brl(data.totalRetiradas)} de retiradas`
              : undefined
          }
        />
        <KpiCard
          label="Resultado do período"
          value={data?.resultado ?? 0}
          icon={<Wallet className="h-4 w-4" />}
          hint={isLoading ? "Carregando…" : undefined}
        />
        <KpiCard
          label="Margem"
          value={data?.margem != null ? `${data.margem.toFixed(1)}%` : "—"}
          format="raw"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Receita x Despesa por mês</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          {data && data.porMes.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.porMes} margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="label"
                  fontSize={12}
                  stroke="currentColor"
                  className="text-muted-foreground"
                />
                <YAxis
                  fontSize={12}
                  tickFormatter={(v) => brl(Number(v)).replace("R$", "").trim()}
                  stroke="currentColor"
                  className="text-muted-foreground"
                />
                <Tooltip formatter={(v: number) => brl(v)} contentStyle={{ fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="receita" name="Receita" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                <Bar
                  dataKey="despesa"
                  name="Despesa"
                  fill="var(--muted-foreground)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              {isLoading ? "Carregando…" : "Sem dados no período."}
            </div>
          )}
        </CardContent>
      </Card>

      <Secao titulo="Receitas" linhas={data?.receitas ?? []} total={data?.totalReceita ?? 0} />
      <Secao titulo="Despesas" linhas={data?.despesas ?? []} total={data?.totalDespesa ?? 0} />
      <Secao
        titulo="Retiradas de Lucro"
        linhas={data?.retiradas ?? []}
        total={data?.totalRetiradas ?? 0}
      />

      <Card>
        <CardContent className="flex items-center justify-between py-5">
          <span className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Resultado do Período
          </span>
          <span
            className={cn(
              "text-2xl font-semibold tabular-nums",
              positivo ? "text-emerald-600" : "text-red-600",
            )}
          >
            {brl(data?.resultado ?? 0)}
          </span>
        </CardContent>
      </Card>

      {prov && prov.total > 0 && (
        <>
          <Card className="border-amber-500/40 bg-amber-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-amber-700 dark:text-amber-500">
                Despesas Provisionadas (Não Pagas)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Código</TableHead>
                    <TableHead>Conta</TableHead>
                    <TableHead className="text-right w-40">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prov.linhas.map((l) => (
                    <TableRow key={l.codigo_id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {l.codigo}
                      </TableCell>
                      <TableCell>{l.nome}</TableCell>
                      <TableCell className="text-right tabular-nums">{brl(l.valor)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="border-t-2 font-medium">
                    <TableCell colSpan={2}>Subtotal</TableCell>
                    <TableCell className="text-right tabular-nums">{brl(prov.total)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border-2 border-dashed border-amber-500/60 bg-transparent">
            <CardContent className="flex flex-wrap items-center justify-between gap-2 py-5">
              <div>
                <span className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                  Resultado do Período Real
                </span>
                <p className="text-xs text-muted-foreground">
                  Projeção: considera despesas provisionadas ainda não pagas. Não é o resultado de
                  caixa oficial.
                </p>
              </div>
              <span
                className={cn(
                  "text-2xl font-semibold tabular-nums",
                  resultadoReal >= 0 ? "text-emerald-600" : "text-red-600",
                )}
              >
                {brl(resultadoReal)}
              </span>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

