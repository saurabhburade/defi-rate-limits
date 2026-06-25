"use client";

const AmountValue = ({ value }: { value: string }) => {
  const [amount, ...unitParts] = value.split(" ");
  const unit = unitParts.join(" ");

  return (
    <p className="mt-2 flex items-end gap-1.5 text-2xl font-semibold tracking-[-0.03em] text-foreground">
      <span>{amount}</span>
      {unit ? <span className="pb-0.5 text-sm font-medium tracking-normal text-muted-foreground">{unit}</span> : null}
    </p>
  );
};

export const MetricStrip = ({ items }: { items: Array<{ label: string; value: string }> }) => {
  const columnClassName = items.length === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3";

  return (
    <div className={`grid gap-y-6 ${columnClassName}`}>
      {items.map((item, index) => (
        <div key={item.label} className={index === 0 ? "" : "sm:border-l sm:border-default sm:pl-6"}>
          <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
          <AmountValue value={item.value} />
        </div>
      ))}
    </div>
  );
};
