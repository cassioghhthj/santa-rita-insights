import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PeriodPreset = "7d" | "30d" | "90d" | "mtd";

export interface PeriodValue {
  preset: PeriodPreset;
  from: string;
  to: string;
}

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function resolvePreset(preset: PeriodPreset, latest: string): PeriodValue {
  const to = new Date(latest + "T00:00:00");
  const from = new Date(to);
  if (preset === "7d") from.setDate(to.getDate() - 6);
  else if (preset === "30d") from.setDate(to.getDate() - 29);
  else if (preset === "90d") from.setDate(to.getDate() - 89);
  else if (preset === "mtd") from.setDate(1);
  return { preset, from: iso(from), to: iso(to) };
}

const PRESETS: { key: PeriodPreset; label: string }[] = [
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
      <div className="text-xs text-muted-foreground">
        {new Date(value.from + "T00:00:00").toLocaleDateString("pt-BR")} —{" "}
        {new Date(value.to + "T00:00:00").toLocaleDateString("pt-BR")}
      </div>
    </div>
  );
}
