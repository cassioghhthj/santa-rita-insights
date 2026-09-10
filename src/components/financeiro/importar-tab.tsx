import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Upload } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CodigoCombobox } from "./codigo-combobox";
import { parseExtrato, type ParsedTx } from "@/lib/financeiro/parse";
import { hashTransacao } from "@/lib/financeiro/normalize";
import { resolverCodigo } from "@/lib/financeiro/regras";
import {
  fetchExistentes,
  useCodigos,
  useContas,
  useImportarLancamentos,
  useRegras,
} from "@/lib/queries/financeiro";
import { brl } from "@/lib/format";
import { cn } from "@/lib/utils";

interface PreviewRow extends ParsedTx {
  key: string;
  hash: string;
  duplicada: boolean;
  repetidaNoArquivo: boolean;
  codigo_id: string | null;
  selecionada: boolean;
}


export function ImportarTab() {
  const { data: contas } = useContas();
  const { data: codigos } = useCodigos();
  const { data: regras } = useRegras();
  const importar = useImportarLancamentos();
  const inputRef = useRef<HTMLInputElement>(null);

  const [contaId, setContaId] = useState<string>("");
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [saldoFinal, setSaldoFinal] = useState<number | null>(null);
  const [erros, setErros] = useState<string[]>([]);
  const [arquivo, setArquivo] = useState<string | null>(null);
  const [processando, setProcessando] = useState(false);

  async function handleFile(file: File) {
    if (!contaId) {
      toast.error("Selecione a conta antes de escolher o arquivo.");
      return;
    }
    setProcessando(true);
    try {
      const text = await file.text();
      const parsed = parseExtrato(file.name, text);
      setArquivo(file.name);
      setSaldoFinal(parsed.saldoFinal);
      setErros(parsed.erros);

      if (!parsed.transacoes.length) {
        setRows([]);
        return;
      }

      const datas = parsed.transacoes.map((t) => t.data).sort();
      const { hashes, fitids } = await fetchExistentes(
        contaId,
        datas[0],
        datas[datas.length - 1],
      );

      const vistos = new Set<string>();
      const preview: PreviewRow[] = parsed.transacoes.map((t, i) => {
        const hashTexto = hashTransacao(contaId, t.data, t.valor, t.descricao_normalizada);
        const hash = t.fitid ? t.fitid : hashTexto;
        const duplicada =
          (t.fitid ? fitids.has(t.fitid) || hashes.has(t.fitid) : false) || hashes.has(hashTexto);
        const repetidaNoArquivo = vistos.has(hash);
        vistos.add(hash);
        const regra = resolverCodigo(
          { descricao: t.descricao, tipo: t.tipo },
          contaId,
          regras ?? [],
        );
        return {
          ...t,
          key: `${i}-${hash}`,
          hash,
          duplicada,
          repetidaNoArquivo,
          codigo_id: regra?.codigo_id ?? null,
          selecionada: !duplicada && !repetidaNoArquivo,
        };
      });
      setRows(preview);

    } catch (e) {
      toast.error(`Falha ao ler arquivo: ${(e as Error).message}`);
    } finally {
      setProcessando(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const resumo = useMemo(() => {
    const dup = rows.filter((r) => r.duplicada).length;
    const rep = rows.filter((r) => r.repetidaNoArquivo).length;
    const auto = rows.filter((r) => r.codigo_id).length;
    const sel = rows.filter((r) => r.selecionada).length;
    return { total: rows.length, dup, rep, auto, sel };
  }, [rows]);

  const repetidas = useMemo(() => rows.filter((r) => r.repetidaNoArquivo), [rows]);

  function confirmar() {
    const sel = rows.filter((r) => r.selecionada);
    if (!sel.length) return toast.error("Nenhuma transação selecionada.");
    importar.mutate(
      sel.map((r) => ({
        conta_id: contaId,
        codigo_id: r.codigo_id,
        data: r.data,
        valor: r.valor,
        tipo: r.tipo,
        descricao: r.descricao,
        descricao_normalizada: r.descricao_normalizada,
        hash_dedupe: r.hash,
        fitid: r.fitid,
      })),
      {
        onSuccess: (res) => {
          toast.success(`${res.inseridas} lançamento(s) importados.`);
          if (res.ignoradas > 0) {
            const lista = res.colisoes
              .slice(0, 5)
              .map(
                (c) =>
                  `${new Date(c.data + "T00:00:00").toLocaleDateString("pt-BR")} · ${c.descricao} · ${brl(c.valor)}`,
              )
              .join("\n");
            toast.warning(
              `${res.ignoradas} transação(ões) não importada(s) por colisão de hash — confira manualmente se são duplicatas reais ou lançamentos distintos com mesmo valor/data/descrição.`,
              { description: lista || undefined, duration: 15000 },
            );
          }
          setRows([]);
          setArquivo(null);
          setSaldoFinal(null);
        },
        onError: (e) => toast.error((e as Error).message),
      },
    );
  }


  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Importar extrato (OFX ou CSV)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label>Conta bancária</Label>
              <Select value={contaId} onValueChange={setContaId}>
                <SelectTrigger className="w-[240px]">
                  <SelectValue placeholder="Selecionar conta" />
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
            <div>
              <input
                ref={inputRef}
                type="file"
                accept=".ofx,.csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleFile(f);
                }}
              />
              <Button
                variant="outline"
                onClick={() => inputRef.current?.click()}
                disabled={!contaId || processando}
              >
                <Upload className="mr-2 h-4 w-4" />
                {processando ? "Lendo…" : "Escolher arquivo"}
              </Button>
            </div>
            {arquivo && (
              <div className="text-xs text-muted-foreground">
                Arquivo: <span className="font-medium">{arquivo}</span>
                {saldoFinal !== null && (
                  <> · Saldo final informado no extrato: {brl(saldoFinal)} (conferência)</>
                )}
              </div>
            )}
          </div>

          {erros.length > 0 && (
            <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
              {erros.slice(0, 5).map((e, i) => (
                <div key={i}>{e}</div>
              ))}
              {erros.length > 5 && <div>… e mais {erros.length - 5} aviso(s).</div>}
            </div>
          )}


          {repetidas.length > 0 && (
            <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
              <div className="font-medium">
                {repetidas.length} transação(ões) repetida(s) dentro do próprio arquivo (mesma data,
                valor e descrição). Confira se são duplicatas reais do extrato ou lançamentos
                distintos que coincidiram — marque a caixa para importar mesmo assim.
              </div>
              {repetidas.map((r) => (
                <div key={r.key}>
                  · {new Date(r.data + "T00:00:00").toLocaleDateString("pt-BR")} · {r.descricao} ·{" "}
                  {brl(r.valor)} ({r.tipo})
                </div>
              ))}
            </div>
          )}

          {rows.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 rounded-md border bg-muted/40 px-3 py-2 text-xs">
              <span>{resumo.total} transações lidas</span>
              <span>· {resumo.dup} duplicata(s)</span>
              <span>· {resumo.rep} repetida(s) no arquivo</span>
              <span>· {resumo.auto} classificadas automaticamente</span>
              <span>· {resumo.sel} selecionadas</span>

              <Button
                size="sm"
                className="ml-auto"
                onClick={confirmar}
                disabled={importar.isPending}
              >
                Importar selecionadas
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {rows.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">
                    <Checkbox
                      checked={rows.every((r) => r.selecionada)}
                      onCheckedChange={(v) =>
                        setRows((rs) => rs.map((r) => ({ ...r, selecionada: Boolean(v) })))
                      }
                    />
                  </TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Código sugerido</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.key} className={cn(r.duplicada && "opacity-60")}>
                    <TableCell>
                      <Checkbox
                        checked={r.selecionada}
                        onCheckedChange={(v) =>
                          setRows((rs) =>
                            rs.map((x) =>
                              x.key === r.key ? { ...x, selecionada: Boolean(v) } : x,
                            ),
                          )
                        }
                      />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs">
                      {new Date(r.data + "T00:00:00").toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="max-w-[320px] text-xs">
                      <div className="truncate">{r.descricao}</div>
                      {r.duplicada && (
                        <Badge variant="outline" className="mt-1">
                          já existe
                        </Badge>
                      )}
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
                        allowClear
                        onChange={(id) =>
                          setRows((rs) =>
                            rs.map((x) => (x.key === r.key ? { ...x, codigo_id: id } : x)),
                          )
                        }
                        className="w-[220px]"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
