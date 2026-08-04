import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type PeriodPreset = "7d" | "30d" | "90d" | "mtd" | "month";

export interface PeriodValue {
  preset: PeriodPreset;
  from: string;
  to: string;
  /** yyyy-mm, present only when preset === "month" */
  month?: string;
}

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function resolvePreset(preset: Exclude<PeriodPreset, "month">, latest: string): PeriodValue {
  const to = new Date(latest + "T00:00:00");
  const from = new Date(to);
  if (preset === "7d") from.setDate(to.getDate() - 6);
  else if (preset === "30d") from.setDate(to.getDate() - 29);
  else if (preset === "90d") from.setDate(to.getDate() - 89);
  else if (preset === "mtd") from.setDate(1);
  return { preset, from: iso(from), to: iso(to) };
}

/** month: "yyyy-mm" */
export function resolveMonth(month: string, latest: string): PeriodValue {
  const [y, m] = month.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const last = new Date(Date.UTC(y, m, 0));
  const latestDate = new Date(latest + "T00:00:00Z");
  const to = last > latestDate ? latestDate : last;
  return { preset: "month", month, from: iso(first), to: iso(to) };
}

function monthOptions(latest: string, count = 12) {
  const d = new Date(latest + "T00:00:00Z");
  const out: { value: string; label: string }[] = [];
  for (let i = 0; i < count; i++) {
    const ref = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - i, 1));
    const value = `${ref.getUTCFullYear()}-${String(ref.getUTCMonth() + 1).padStart(2, "0")}`;
    const label = ref.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
    out.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
  }
  return out;
}

const PRESETS: { key: Exclude<PeriodPreset, "month">; label: string }[] = [
  { key: "7d", label: "7 dias" },
  { key: "30d", label: "30 dias" },
  { key: "90d", label: "90 dias" },
  { key: "mtd", label: "Mês atual" },
];

export function PeriodPicker({
  value,
  onChange,
  latest,
}: {
  value: PeriodValue;
  onChange: (v: PeriodValue) => void;
  latest: string;
}) {
  const months = monthOptions(latest);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex rounded-md border bg-card p-0.5">
        {PRESETS.map((p) => (
          <Button
            key={p.key}
            size="sm"
            variant="ghost"
            className={cn(
              "h-8 rounded-sm px-3 text-xs",
              value.preset === p.key && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
            )}
            onClick={() => onChange(resolvePreset(p.key, latest))}
          >
            {p.label}
          </Button>
        ))}
      </div>

      <Select
        value={value.preset === "month" ? value.month : undefined}
        onValueChange={(m) => onChange(resolveMonth(m, latest))}
      >
        <SelectTrigger
          className={cn(
            "h-9 w-[170px] text-xs",
            value.preset === "month" && "border-primary text-foreground",
          )}
        >
          <SelectValue placeholder="Mês específico" />
        </SelectTrigger>
        <SelectContent className="bg-popover">
          {months.map((m) => (
            <SelectItem key={m.value} value={m.value} className="text-xs">
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="text-xs text-muted-foreground">
        {new Date(value.from + "T00:00:00").toLocaleDateString("pt-BR")} —{" "}
        {new Date(value.to + "T00:00:00").toLocaleDateString("pt-BR")}
      </div>
    </div>
  );
}
