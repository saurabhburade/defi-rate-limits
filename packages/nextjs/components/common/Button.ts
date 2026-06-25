export const buttonBaseClassName =
  "inline-flex h-9 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 text-sm font-medium outline-none transition-all focus-visible:border-[color:var(--ring)] focus-visible:ring-[3px] focus-visible:ring-[color:var(--ring)] disabled:pointer-events-none disabled:opacity-50";

export const secondaryButtonClassName = `${buttonBaseClassName} border border-default bg-[color:var(--surface)] text-foreground hover:bg-[color:var(--surface-muted)]`;

export const primaryButtonClassName = `${buttonBaseClassName} border`;

export const primaryButtonToneClassName =
  "border-[color:var(--primary)] bg-[color:var(--primary)] text-[color:var(--primary-foreground)] hover:border-[color:var(--primary-hover)] hover:bg-[color:var(--primary-hover)]";

export const ghostButtonClassName = `${buttonBaseClassName} px-3 text-muted-foreground hover:bg-[color:var(--surface-muted)] hover:text-foreground`;
