"use client";

import { formatPercent } from "@/libs/rate-limit/formatting";

export const ReservoirMeter = ({ value, total }: { value?: bigint; total?: bigint }) => {
  const percent = Math.min(formatPercent(value, total), 100);

  return (
    <div className="pt-10">
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-base font-semibold text-muted-foreground">Reservoir fill</p>
        <span className="font-mono text-sm text-muted-foreground/60">{percent.toFixed(1)}%</span>
      </div>
      <div className="mt-5 rounded-xl bg-[color:var(--surface-muted)] p-3">
        <div className="h-3 overflow-hidden rounded-full bg-[color:var(--surface)]">
          <div
            className="h-full rounded-full bg-[color:var(--primary)] transition-[width] duration-700 ease-out motion-reduce:transition-none"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  );
};
