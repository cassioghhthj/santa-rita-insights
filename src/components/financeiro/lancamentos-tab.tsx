import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
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
import { CodigoCombobox } from "./codigo-combobox";
import { PeriodPicker, type PeriodValue } from "@/components/period-picker";
import {
  useClassificarLancamentos,
  useCodigos,
  useContas,
  useCriarLancamentoManual,
  useLancamentos,
  type LancFiltro,
} from "@/lib/queries/financeiro";
import { normalizeDb } from "@/lib/financeiro/normalize";
import { brl } from "@/lib/format";
import { cn } from "@/lib/utils";

const PAGE = 50;

export function LancamentosTab({
  period,
  onPeriodChange,
  latest,
}: {
  period: PeriodValue;
  onPeriodChange: (v: PeriodValue) => void;
  latest: string;
}) {
  const { data: contas } = useContas();
  const { data: codigos } = useCodigos();

  const [contaId, setContaId] = useState<string>("todas");
  const [origem, setOrigem] = useState<string>("todas");
  const [tipo, setTipo] = useState<"todos" | "credito" | "debito">("todos");
  const [somentePendentes, setSomentePendentes] = useState(false);
  const [busca, setBusca] = useState("");
  const [page, setPage] = useState(0);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [loteCodigo, setLoteCodigo] = useState<string | null>(null);
  const [novo, setNovo] = useState<null | {
    data: string;
    conta_id: string;
    tipo: "credito" | "debito";
    valor: string;
    descricao: string;
    codigo_id: string | null;
  }>(null);

  const filtro: LancFiltro = {
    from: period.from,
    to: period.to,
    contaId,
    origem,
    tipo,
    somentePendentes,
  };
  const { data: rows, isLoading, error } = useLancamentos(filtro);
  const classificar = useClassificarLancamentos();
  const criarManual = useCriarLancamentoManual();

  const nomeConta = (id: string) =>
    (contas ?? []).find((c) => c.id === id)?.apelido ??
    (contas ?? []).find((c) => c.id === id)?.nome ??
    "—";

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return (rows ?? []).filter((r) => !q || (r.descricao ?? "").toLowerCase().includes(q));
  }, [rows, busca]);

  const total = filtradas.length;
  const classificados = filtradas.filter((r) => r.status === "classificado").length;
  const pctClass = total ? Math.round((classificados / total) * 100) : 0;

  const pageCount = Math.max(1, Math.ceil(total / PAGE));
  const current = Math.min(page, pageCount - 1);
  const pageRows = filtradas.slice(current * PAGE, current * PAGE + PAGE);
  const allChecked = pageRows.length > 0 && pageRows.every((r) => sel.has(r.id));

  function toggle(id: string) {
    setSel((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function aplicarLote() {
    if (!loteCodigo) return toast.error("Selecione um código.");
    classificar.mutate(
      { ids: [...sel], codigoId: loteCodigo },
      {
        onSuccess: () => {
          toast.success(`${sel.size} lançamento(s) classificados.`);
          setSel(new Set());
        },
        onError: (e) => toast.error((e as Error).message),
      },
    );
  }

  function reclassificar(id: string, codigoId: string | null) {
    if (!codigoId) return;
    classificar.mutate(
      { ids: [id], codigoId },
      {
        onSuccess: () => toast.success("Lançamento reclassificado."),
        onError: (e) => toast.error((e as Error).message),
      },
    );
  }

  function salvarManual() {
    if (!novo) return;
    const valor = Number(novo.valor.replace(",", "."));
    if (!novo.conta_id) return toast.error("Selecione a conta.");
    if (!Number.isFinite(valor) || valor <= 0) return toast.error("Valor inválido.");
    if (!novo.descricao.trim()) return toast.error("Informe a descrição.");
    if (!novo.codigo_id) return toast.error("Código é obrigatório no lançamento manual.");
    criarManual.mutate(
      {
        data: novo.data,
        conta_id: novo.conta_id,
        tipo: novo.tipo,
        valor,
        descricao: novo.descricao.trim(),
        codigo_id: novo.codigo_id,
        descricao_normalizada: normalizeDb(novo.descricao),
      },
      {
        onSuccess: () => {
          toast.success("Lançamento criado.");
          setNovo(null);
        },
        onError: (e) => toast.error((e as Error).message),
      },
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <PeriodPicker value={period} onChange={onPeriodChange} latest={latest} />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={contaId} onValueChange={(v) => (setContaId(v), setPage(0))}>
              <SelectTrigger className="h-9 w-[180px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="todas">Todas as contas</SelectItem>
                {(contas ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={origem} onValueChange={(v) => (setOrigem(v), setPage(0))}>
              <SelectTrigger className="h-9 w-[150px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="todas">Todas as origens</SelectItem>
                <SelectItem value="extrato">Extrato</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="caixa_auto">Caixa auto</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={tipo}
              onValueChange={(v) => (setTipo(v as typeof tipo), setPage(0))}
            >
              <SelectTrigger className="h-9 w-[140px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="todos">Crédito e débito</SelectItem>
                <SelectItem value="credito">Só crédito</SelectItem>
                <SelectItem value="debito">Só débito</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Buscar descrição…"
              className="h-9 max-w-xs text-xs"
              value={busca}
              onChange={(e) => (setBusca(e.target.value), setPage(0))}
            />

            <label className="flex items-center gap-2 text-xs">
              <Checkbox
                checked={somentePendentes}
                onCheckedChange={(v) => (setSomentePendentes(Boolean(v)), setPage(0))}
              />
              Somente pendentes
            </label>

            <div className="ml-auto">
              <Button
                size="sm"
                onClick={() =>
                  setNovo({
                    data: period.to,
                    conta_id: (contas ?? []).find((c) => c.is_default)?.id ?? contas?.[0]?.id ?? "",
                    tipo: "debito",
                    valor: "",
                    descricao: "",
                    codigo_id: null,
                  })
                }
              >
                <Plus className="mr-2 h-4 w-4" /> Novo lançamento manual
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="min-w-[220px] flex-1">
              <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span>Classificados no período</span>
                <span>
                  {classificados} de {total} ({pctClass}%)
                </span>
              </div>
              <Progress value={pctClass} />
            </div>
            {sel.size > 0 && (
              <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2">
                <span className="text-xs">{sel.size} selecionado(s)</span>
                <CodigoCombobox
                  codigos={codigos ?? []}
                  value={loteCodigo}
                  onChange={setLoteCodigo}
                  placeholder="Escolher código"
                  className="w-[240px]"
                />
                <Button size="sm" onClick={aplicarLote} disabled={classificar.isPending}>
                  Classificar selecionados
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSel(new Set())}>
                  Limpar
                </Button>
              </div>
            )}
          </div>

          {error && (
            <div className="text-sm text-red-600">
              Erro ao carregar: {(error as Error).message}
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">
                  <Checkbox
                    checked={allChecked}
                    onCheckedChange={(v) =>
                      setSel((s) => {
                        const n = new Set(s);
                        pageRows.forEach((r) => (v ? n.add(r.id) : n.delete(r.id)));
                        return n;
                      })
                    }
                  />
                </TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Conta</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={9} className="text-muted-foreground">
                    Carregando…
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && !pageRows.length && (
                <TableRow>
                  <TableCell colSpan={9} className="text-muted-foreground">
                    Nenhum lançamento no período/filtro.
                  </TableCell>
                </TableRow>
              )}
              {pageRows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Checkbox checked={sel.has(r.id)} onCheckedChange={() => toggle(r.id)} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs">
                    {new Date(r.data + "T00:00:00").toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-xs">{nomeConta(r.conta_id)}</TableCell>
                  <TableCell className="text-xs capitalize text-muted-foreground">
                    {r.origem.replace("_", " ")}
                  </TableCell>
                  <TableCell className="max-w-[280px] truncate text-xs">
                    {r.descricao ?? "—"}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right tabular-nums text-xs",
                      r.tipo === "credito" ? "text-emerald-600" : "text-red-600",
                    )}
                  >
                    {r.tipo === "credito" ? "+" : "−"}
                    {brl(r.valor)}
                  </TableCell>
                  <TableCell className="text-xs capitalize">{r.tipo}</TableCell>
                  <TableCell>
                    <CodigoCombobox
                      codigos={codigos ?? []}
                      value={r.codigo_id}
                      onChange={(id) => reclassificar(r.id, id)}
                      className="w-[220px]"
                    />
                  </TableCell>
                  <TableCell>
                    {r.status === "classificado" ? (
                      <Badge variant="secondary">Classificado</Badge>
                    ) : (
                      <Badge variant="outline">Pendente</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {total} lançamento(s) · página {current + 1} de {pageCount}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={current === 0}
                onClick={() => setPage(current - 1)}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={current >= pageCount - 1}
                onClick={() => setPage(current + 1)}
              >
                Próxima
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={Boolean(novo)} onOpenChange={(o) => !o && setNovo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo lançamento manual</DialogTitle>
          </DialogHeader>
          {novo && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={novo.data}
                    onChange={(e) => setNovo({ ...novo, data: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Conta</Label>
                  <Select
                    value={novo.conta_id}
                    onValueChange={(v) => setNovo({ ...novo, conta_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      {(contas ?? [])
                        .filter((c) => c.ativo)
                        .map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.nome}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={novo.tipo}
                    onValueChange={(v) =>
                      setNovo({ ...novo, tipo: v as "credito" | "debito" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="credito">Crédito (entrada)</SelectItem>
                      <SelectItem value="debito">Débito (saída)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Valor</Label>
                  <Input
                    inputMode="decimal"
                    placeholder="0,00"
                    value={novo.valor}
                    onChange={(e) => setNovo({ ...novo, valor: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input
                  value={novo.descricao}
                  onChange={(e) => setNovo({ ...novo, descricao: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Código</Label>
                <div>
                  <CodigoCombobox
                    codigos={codigos ?? []}
                    value={novo.codigo_id}
                    onChange={(id) => setNovo({ ...novo, codigo_id: id })}
                    placeholder="Selecionar código"
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setNovo(null)}>
              Cancelar
            </Button>
            <Button onClick={salvarManual} disabled={criarManual.isPending}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
