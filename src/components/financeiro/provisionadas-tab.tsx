import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, Pencil, Plus, Trash2, TriangleAlert, Undo2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KpiCard } from "@/components/kpi-card";
import { PeriodPicker, type PeriodValue } from "@/components/period-picker";
import { CodigoCombobox } from "./codigo-combobox";
import { useCodigos } from "@/lib/queries/financeiro";
import {
  useAtualizarProvisionada,
  useCriarProvisionada,
  useExcluirProvisionada,
  useProvisionadas,
  type ProvisionadaRow,
} from "@/lib/queries/provisionadas";
import { brl } from "@/lib/format";

type Form = {
  id?: string;
  codigo_id: string | null;
  data: string;
  valor: string;
  descricao: string;
};

function fmtData(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR");
}

export function ProvisionadasTab({
  period,
  onPeriodChange,
  latest,
}: {
  period: PeriodValue;
  onPeriodChange: (v: PeriodValue) => void;
  latest: string;
}) {
  const { data: codigos } = useCodigos();
  const { data: rows, isLoading } = useProvisionadas(period);
  const criar = useCriarProvisionada();
  const atualizar = useAtualizarProvisionada();
  const excluir = useExcluirProvisionada();

  const [status, setStatus] = useState<"pendente" | "paga" | "todas">("pendente");
  const [busca, setBusca] = useState("");
  const [form, setForm] = useState<Form | null>(null);

  const codigosDespesa = useMemo(
    () => (codigos ?? []).filter((c) => c.tipo === "despesa" || c.tipo === "retirada_lucros"),
    [codigos],
  );
  const planoMap = useMemo(
    () => new Map((codigos ?? []).map((c) => [c.id, c])),
    [codigos],
  );

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return (rows ?? []).filter((r) => {
      if (status !== "todas" && r.status !== status) return false;
      if (!q) return true;
      const pc = planoMap.get(r.codigo_id);
      return (
        (r.descricao ?? "").toLowerCase().includes(q) ||
        `${pc?.codigo ?? ""} ${pc?.nome ?? ""}`.toLowerCase().includes(q)
      );
    });
  }, [rows, status, busca, planoMap]);

  const totalPendente = useMemo(
    () =>
      (rows ?? [])
        .filter((r) => r.status === "pendente")
        .reduce((s, r) => s + Number(r.valor ?? 0), 0),
    [rows],
  );
  const totalPago = useMemo(
    () =>
      (rows ?? [])
        .filter((r) => r.status === "paga")
        .reduce((s, r) => s + Number(r.valor ?? 0), 0),
    [rows],
  );

  function abrirNovo() {
    setForm({
      codigo_id: null,
      data: period.to,
      valor: "",
      descricao: "",
    });
  }

  function abrirEdicao(r: ProvisionadaRow) {
    setForm({
      id: r.id,
      codigo_id: r.codigo_id,
      data: r.data,
      valor: String(r.valor ?? ""),
      descricao: r.descricao ?? "",
    });
  }

  function salvar() {
    if (!form) return;
    const valor = Number(String(form.valor).replace(",", "."));
    if (!form.codigo_id) return toast.error("Selecione um código de despesa.");
    if (!form.data) return toast.error("Informe a data.");
    if (!isFinite(valor) || valor <= 0) return toast.error("Informe um valor válido.");

    const payload = {
      codigo_id: form.codigo_id,
      data: form.data,
      valor,
      descricao: form.descricao.trim() || null,
    };
    const done = {
      onSuccess: () => {
        toast.success(form.id ? "Despesa atualizada." : "Despesa provisionada criada.");
        setForm(null);
      },
      onError: (e: unknown) => toast.error((e as Error).message),
    };
    if (form.id) atualizar.mutate({ id: form.id, ...payload }, done);
    else criar.mutate(payload, done);
  }

  function alternarStatus(r: ProvisionadaRow) {
    atualizar.mutate(
      { id: r.id, status: r.status === "pendente" ? "paga" : "pendente" },
      {
        onSuccess: () =>
          toast.success(r.status === "pendente" ? "Marcada como paga." : "Voltou para pendente."),
        onError: (e) => toast.error((e as Error).message),
      },
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PeriodPicker value={period} onChange={onPeriodChange} latest={latest} />
        <Button size="sm" onClick={abrirNovo}>
          <Plus className="mr-2 h-4 w-4" />
          Nova despesa provisionada
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          label="Total pendente no período"
          value={totalPendente}
          icon={<TriangleAlert className="h-4 w-4 text-amber-600" />}
          hint={isLoading ? "Carregando…" : "não pago por falta de caixa"}
        />
        <KpiCard label="Já pagas no período" value={totalPago} />
        <KpiCard
          label="Lançamentos"
          value={`${(rows ?? []).length}`}
          format="raw"
          hint="no período selecionado"
        />
      </div>

      <Card>
        <CardContent className="space-y-4 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
              <SelectTrigger className="h-8 w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="pendente">Pendentes</SelectItem>
                <SelectItem value="paga">Pagas</SelectItem>
                <SelectItem value="todas">Todas</SelectItem>
              </SelectContent>
            </Select>
            <Input
              className="h-8 w-64"
              placeholder="Buscar descrição ou código…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            <span className="text-xs text-muted-foreground">
              {filtradas.length} registro(s)
            </span>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">Data</TableHead>
                <TableHead className="w-24">Código</TableHead>
                <TableHead>Conta</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="w-32 text-right">Valor</TableHead>
                <TableHead className="w-28">Status</TableHead>
                <TableHead className="w-36 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtradas.length ? (
                filtradas.map((r) => {
                  const pc = planoMap.get(r.codigo_id);
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="tabular-nums">{fmtData(r.data)}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {pc?.codigo ?? "—"}
                      </TableCell>
                      <TableCell>{pc?.nome ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{r.descricao ?? "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {brl(Number(r.valor ?? 0))}
                      </TableCell>
                      <TableCell>
                        <Badge variant={r.status === "paga" ? "secondary" : "outline"}>
                          {r.status === "paga" ? "Paga" : "Pendente"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            title={r.status === "pendente" ? "Marcar como paga" : "Voltar p/ pendente"}
                            onClick={() => alternarStatus(r)}
                          >
                            {r.status === "pendente" ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Undo2 className="h-4 w-4" />
                            )}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => abrirEdicao(r)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (!confirm("Excluir esta despesa provisionada?")) return;
                              excluir.mutate(r.id, {
                                onSuccess: () => toast.success("Excluída."),
                                onError: (e) => toast.error((e as Error).message),
                              });
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-sm text-muted-foreground">
                    {isLoading ? "Carregando…" : "Nenhuma despesa provisionada no período."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={Boolean(form)} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent className="bg-background">
          <DialogHeader>
            <DialogTitle>
              {form?.id ? "Editar despesa provisionada" : "Nova despesa provisionada"}
            </DialogTitle>
          </DialogHeader>
          {form && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Código (despesa ou retirada)</Label>
                <CodigoCombobox
                  codigos={codigosDespesa}
                  value={form.codigo_id}
                  onChange={(id) => setForm({ ...form, codigo_id: id })}
                  placeholder="Selecione o código"
                  className="w-full"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={form.data}
                    onChange={(e) => setForm({ ...form, data: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Valor</Label>
                  <Input
                    inputMode="decimal"
                    placeholder="0,00"
                    value={form.valor}
                    onChange={(e) => setForm({ ...form, valor: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Descrição (opcional)</Label>
                <Input
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setForm(null)}>
              Cancelar
            </Button>
            <Button onClick={salvar} disabled={criar.isPending || atualizar.isPending}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
