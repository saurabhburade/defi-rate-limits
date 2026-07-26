"use client";

import { buttonBaseClassName } from "@/components/common/Button";

export type RateLimitMechanism = "bucketed" | "token";

const mechanismOptions = [
  { label: "Bucketed window", value: "bucketed" },
  { label: "Token bucket", value: "token" },
] as const satisfies readonly { label: string; value: RateLimitMechanism }[];

export const MechanismTabs = ({
  onChange,
  value,
}: {
  onChange: (value: RateLimitMechanism) => void;
  value: RateLimitMechanism;
}) => (
  <section
    aria-label="Rate limit mechanism"
    className="mt-8 inline-grid w-full max-w-xs grid-cols-2 rounded-full bg-[color:var(--surface-muted)] p-1"
  >
    {mechanismOptions.map(option => {
      const active = option.value === value;

      return (
        <button
          aria-pressed={active}
          className={`${buttonBaseClassName} px-4 ${
            active
              ? "bg-[color:var(--surface)] text-foreground shadow-[0_2px_12px_rgb(0_0_0/0.08)]"
              : "text-muted-foreground hover:text-foreground"
          }`}
          key={option.value}
          onClick={() => onChange(option.value)}
          type="button"
        >
          {option.label}
        </button>
      );
    })}
  </section>
);
