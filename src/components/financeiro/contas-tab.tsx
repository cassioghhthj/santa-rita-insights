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
import {
  useContas,
  useDeleteConta,
  useSaveConta,
  TIPOS_CONTA,
  type ContaRow,
} from "@/lib/queries/financeiro";

type Draft = Partial<ContaRow> & { id?: string };

export function ContasTab() {
  const { data: contas, isLoading } = useContas();
  const save = useSaveConta();
  const del = useDeleteConta();
  const [draft, setDraft] = useState<Draft | null>(null);

  function submit() {
    if (!draft?.nome?.trim()) return toast.error("Informe o nome da conta.");
    save.mutate(
      { ...draft, nome: draft.nome.trim() },
      {
        onSuccess: () => {
          toast.success("Conta salva.");
          setDraft(null);
        },
        onError: (e) => toast.error((e as Error).message),
      },
    );
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={() =>
              setDraft({ nome: "", apelido: "", tipo: "banco", ativo: true, is_default: false })
            }
          >
            <Plus className="mr-2 h-4 w-4" /> Nova conta
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Apelido</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Padrão</TableHead>
              <TableHead>Ativo</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground">
                  Carregando…
                </TableCell>
              </TableRow>
            )}
            {(contas ?? []).map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.nome}</TableCell>
                <TableCell className="text-muted-foreground">{c.apelido ?? "—"}</TableCell>
                <TableCell className="capitalize">{c.tipo}</TableCell>
                <TableCell>{c.is_default ? <Badge>Padrão</Badge> : "—"}</TableCell>
                <TableCell>
                  {c.ativo ? (
                    <Badge variant="secondary">Ativa</Badge>
                  ) : (
                    <Badge variant="outline">Inativa</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => setDraft(c)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      del.mutate(c.id, {
                        onSuccess: () => toast.success("Conta excluída."),
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
            <DialogTitle>{draft?.id ? "Editar conta" : "Nova conta"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={draft?.nome ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, nome: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Apelido</Label>
              <Input
                value={draft?.apelido ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, apelido: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={draft?.tipo ?? "banco"}
                onValueChange={(v) => setDraft((d) => ({ ...d, tipo: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {TIPOS_CONTA.map((t) => (
                    <SelectItem key={t} value={t} className="capitalize">
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Saldo inicial</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={draft?.saldo_inicial ?? 0}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, saldo_inicial: Number(e.target.value) }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Data do saldo inicial</Label>
                <Input
                  type="date"
                  value={draft?.data_saldo_inicial ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, data_saldo_inicial: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={draft?.is_default ?? false}
                  onCheckedChange={(v) => setDraft((d) => ({ ...d, is_default: v }))}
                />
                <Label>Conta padrão</Label>
              </div>
              <div className="flex items-center gap-2">
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
