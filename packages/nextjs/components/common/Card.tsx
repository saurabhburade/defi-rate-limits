export const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={["rounded-lg border border-default surface", className].filter(Boolean).join(" ")}>{children}</div>
);
