import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
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
import {
  useCodigos,
  useContas,
  useDeleteRegra,
  useRegras,
  useSaveRegra,
  type RegraRow,
} from "@/lib/queries/financeiro";

type Draft = Partial<RegraRow> & { id?: string };
const QUALQUER = "__qualquer";

export function RegrasTab() {
  const { data: regras, isLoading } = useRegras();
  const { data: contas } = useContas();
  const { data: codigos } = useCodigos();
  const save = useSaveRegra();
  const del = useDeleteRegra();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busca, setBusca] = useState("");

  const nomeConta = (id: string | null) =>
    id ? (contas ?? []).find((c) => c.id === id)?.nome ?? "—" : "Qualquer conta";
  const nomeCodigo = (id: string) => {
    const c = (codigos ?? []).find((x) => x.id === id);
    return c ? `${c.codigo} · ${c.nome}` : "—";
  };

  const rows = (regras ?? []).filter((r) => {
    const q = busca.trim().toLowerCase();
    return !q || r.descricao.toLowerCase().includes(q);
  });

  function submit() {
    if (!draft?.descricao?.trim()) return toast.error("Informe o termo de busca.");
    if (!draft?.codigo_id) return toast.error("Selecione o código sugerido.");
    save.mutate(draft, {
      onSuccess: () => {
        toast.success("Regra salva.");
        setDraft(null);
      },
      onError: (e) => toast.error((e as Error).message),
    });
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <Input
            placeholder="Buscar termo…"
            className="max-w-xs"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <Button
            size="sm"
            onClick={() =>
              setDraft({
                descricao: "",
                tipo_transacao: null,
                conta_id: null,
                prioridade: 1,
                ativo: true,
              })
            }
          >
            <Plus className="mr-2 h-4 w-4" /> Nova regra
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          {rows.length} regra(s). A regra casa quando a descrição do lançamento contém o termo.
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição (termo)</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Conta</TableHead>
              <TableHead>Código sugerido</TableHead>
              <TableHead className="text-right">Prioridade</TableHead>
              <TableHead>Ativo</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground">
                  Carregando…
                </TableCell>
              </TableRow>
            )}
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="max-w-[320px] truncate">{r.descricao}</TableCell>
                <TableCell className="capitalize">{r.tipo_transacao ?? "qualquer"}</TableCell>
                <TableCell className="text-muted-foreground">{nomeConta(r.conta_id)}</TableCell>
                <TableCell className="text-xs">{nomeCodigo(r.codigo_id)}</TableCell>
                <TableCell className="text-right tabular-nums">{r.prioridade}</TableCell>
                <TableCell>
                  {r.ativo ? (
                    <Badge variant="secondary">Ativa</Badge>
                  ) : (
                    <Badge variant="outline">Inativa</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => setDraft(r)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      del.mutate(r.id, {
                        onSuccess: () => toast.success("Regra excluída."),
                        onError: (e) => toast.error((e as Error).message),
                      })
                    }
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={Boolean(draft)} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Editar regra" : "Nova regra"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Descrição (termo de busca)</Label>
              <Input
                value={draft?.descricao ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, descricao: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de transação</Label>
                <Select
                  value={draft?.tipo_transacao ?? QUALQUER}
                  onValueChange={(v) =>
                    setDraft((d) => ({
                      ...d,
                      tipo_transacao: v === QUALQUER ? null : (v as "credito" | "debito"),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value={QUALQUER}>Qualquer</SelectItem>
                    <SelectItem value="credito">Crédito</SelectItem>
                    <SelectItem value="debito">Débito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Conta</Label>
                <Select
                  value={draft?.conta_id ?? QUALQUER}
                  onValueChange={(v) =>
                    setDraft((d) => ({ ...d, conta_id: v === QUALQUER ? null : v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value={QUALQUER}>Qualquer conta</SelectItem>
                    {(contas ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Código sugerido</Label>
              <div>
                <CodigoCombobox
                  codigos={codigos ?? []}
                  value={draft?.codigo_id ?? null}
                  onChange={(id) => setDraft((d) => ({ ...d, codigo_id: id ?? undefined }))}
                  placeholder="Selecionar código"
                  className="w-full"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 items-end">
              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Input
                  type="number"
                  value={draft?.prioridade ?? 0}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, prioridade: Number(e.target.value) }))
                  }
                />
              </div>
              <div className="flex items-center gap-2 pb-2">
                <Switch
                  checked={draft?.ativo ?? true}
                  onCheckedChange={(v) => setDraft((d) => ({ ...d, ativo: v }))}
                />
                <Label>Ativa</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>
              Cancelar
            </Button>
            <Button onClick={submit} disabled={save.isPending}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
