export const RateLimitPanelHeader = ({
  children,
  fileName,
  title,
}: {
  children: React.ReactNode;
  fileName: string;
  title: string;
}) => (
  <div className="flex flex-wrap items-center gap-4">
    <h2 className="text-xl font-semibold tracking-[-0.03em] text-foreground">{title}</h2>
    <div className="inline-flex items-center gap-2">
      <span className="font-mono text-sm text-muted-foreground/50">{fileName}</span>
      {children}
    </div>
  </div>
);
