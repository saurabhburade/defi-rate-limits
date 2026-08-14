const buttonInteractionClassName =
  "inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full font-medium outline-none transition-all focus-visible:border-[color:var(--ring)] focus-visible:ring-[3px] focus-visible:ring-[color:var(--ring)] disabled:pointer-events-none disabled:opacity-50";

export const buttonBaseClassName = `${buttonInteractionClassName} h-9 gap-2 px-4 text-sm`;

export const secondaryButtonClassName = `${buttonBaseClassName} border border-default bg-[color:var(--surface)] text-foreground hover:bg-[color:var(--surface-muted)]`;

export const secondaryIconButtonClassName = `${buttonInteractionClassName} size-8 border border-default bg-[color:var(--surface)] p-2 text-muted-foreground hover:bg-[color:var(--surface-muted)] hover:text-foreground`;

export const primaryButtonClassName = `${buttonBaseClassName} border`;

export const primaryButtonToneClassName =
  "border-[color:var(--primary)] bg-[color:var(--primary)] text-[color:var(--primary-foreground)] hover:border-[color:var(--primary-hover)] hover:bg-[color:var(--primary-hover)]";

export const ghostButtonClassName = `${buttonBaseClassName} px-3 text-muted-foreground hover:bg-[color:var(--surface-muted)] hover:text-foreground`;
