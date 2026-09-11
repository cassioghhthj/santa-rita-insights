import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { brl, pct } from "@/lib/format";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { ReactNode } from "react";

interface KpiCardProps {
  label: string;
  value: number | string;
  format?: "brl" | "raw";
  delta?: number | null;
  icon?: ReactNode;
  hint?: string;
  valueClassName?: string;
}

export function KpiCard({ label, value, format = "brl", delta, icon, hint, valueClassName }: KpiCardProps) {
  const display = format === "brl" && typeof value === "number" ? brl(value) : String(value);
  const showDelta = typeof delta === "number" && isFinite(delta);
  const positive = (delta ?? 0) > 0;
  const negative = (delta ?? 0) < 0;

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </CardTitle>
        {icon ? <div className="text-muted-foreground">{icon}</div> : null}
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-semibold tabular-nums", valueClassName)}>{display}</div>
        <div className="mt-1 flex items-center gap-2 text-xs">
          {showDelta ? (
            <span
              className={cn(
                "inline-flex items-center gap-1 font-medium",
                positive && "text-emerald-600",
                negative && "text-red-600",
                !positive && !negative && "text-muted-foreground",
              )}
            >
              {positive ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : negative ? (
                <ArrowDownRight className="h-3 w-3" />
              ) : (
                <Minus className="h-3 w-3" />
              )}
              {pct(delta)}
            </span>
          ) : null}
          {hint ? <span className="text-muted-foreground">{hint}</span> : null}
        </div>
      </CardContent>
    </Card>
  );
}
