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
  useCodigos,
  useDeleteCodigo,
  useSaveCodigo,
  TIPOS_CODIGO,
  type CodigoRow,
} from "@/lib/queries/financeiro";

type Draft = Partial<CodigoRow> & { id?: string };

export function PlanoTab() {
  const { data: codigos, isLoading } = useCodigos();
  const save = useSaveCodigo();
  const del = useDeleteCodigo();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busca, setBusca] = useState("");

  const rows = (codigos ?? []).filter((c) => {
    const q = busca.trim().toLowerCase();
    return !q || c.codigo.toLowerCase().includes(q) || c.nome.toLowerCase().includes(q);
  });

  function submit() {
    if (!draft?.codigo?.trim() || !draft?.nome?.trim())
      return toast.error("Informe código e nome.");
    save.mutate(draft, {
      onSuccess: () => {
        toast.success("Código salvo.");
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
            placeholder="Buscar código ou nome…"
            className="max-w-xs"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <Button
            size="sm"
            onClick={() =>
              setDraft({ codigo: "", nome: "", tipo: "despesa", entra_no_dre: true, ativo: true })
            }
          >
            <Plus className="mr-2 h-4 w-4" /> Novo código
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Entra no DRE</TableHead>
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
            {rows.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-mono text-xs">{c.codigo}</TableCell>
                <TableCell className="font-medium">{c.nome}</TableCell>
                <TableCell className="capitalize">{c.tipo.replace("_", " ")}</TableCell>
                <TableCell>{c.entra_no_dre ? "Sim" : "Não"}</TableCell>
                <TableCell>
                  {c.ativo ? (
                    <Badge variant="secondary">Ativo</Badge>
                  ) : (
                    <Badge variant="outline">Inativo</Badge>
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
                        onSuccess: () => toast.success("Código excluído."),
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
            <DialogTitle>{draft?.id ? "Editar código" : "Novo código"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Código</Label>
                <Input
                  value={draft?.codigo ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, codigo: e.target.value }))}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Nome</Label>
                <Input
                  value={draft?.nome ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, nome: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={draft?.tipo ?? "despesa"}
                onValueChange={(v) => setDraft((d) => ({ ...d, tipo: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {TIPOS_CODIGO.map((t) => (
                    <SelectItem key={t} value={t} className="capitalize">
                      {t.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={draft?.entra_no_dre ?? true}
                  onCheckedChange={(v) => setDraft((d) => ({ ...d, entra_no_dre: v }))}
                />
                <Label>Entra no DRE</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={draft?.ativo ?? true}
                  onCheckedChange={(v) => setDraft((d) => ({ ...d, ativo: v }))}
                />
                <Label>Ativo</Label>
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
