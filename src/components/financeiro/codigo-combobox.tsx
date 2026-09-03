import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
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
import type { CodigoRow } from "@/lib/queries/financeiro";
import { cn } from "@/lib/utils";

export function CodigoCombobox({
  codigos,
  value,
  onChange,
  placeholder = "Sem código",
  className,
  allowClear = false,
  clearLabel = "Sem código",
}: {
  codigos: CodigoRow[];
  value: string | null;
  onChange: (id: string | null) => void;
  placeholder?: string;
  className?: string;
  allowClear?: boolean;
  clearLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const sel = codigos.find((c) => c.id === value) ?? null;


  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          role="combobox"
          className={cn("h-8 justify-between font-normal", className)}
        >
          <span className={cn("truncate", !sel && "text-muted-foreground")}>
            {sel ? `${sel.codigo} · ${sel.nome}` : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0 bg-popover" align="start">
        <Command>
          <CommandInput placeholder="Buscar código…" />
          <CommandList>
            <CommandEmpty>Nenhum código encontrado.</CommandEmpty>
            <CommandGroup>
              {allowClear && (
                <CommandItem
                  value="__limpar"
                  onSelect={() => {
                    onChange(null);
                    setOpen(false);
                  }}
                >
                  <span className="text-muted-foreground">Sem código</span>
                </CommandItem>
              )}
              {codigos
                .filter((c) => c.ativo || c.id === value)
                .map((c) => (
                  <CommandItem
                    key={c.id}
                    value={`${c.codigo} ${c.nome}`}
                    onSelect={() => {
                      onChange(c.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        c.id === value ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="truncate">
                      {c.codigo} · {c.nome}
                    </span>
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
