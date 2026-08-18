import { Loader2Icon } from "lucide-react";

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  const spinnerClassName = ["size-4 animate-spin", className].filter(Boolean).join(" ");

  return <Loader2Icon data-slot="spinner" role="status" aria-label="Loading" className={spinnerClassName} {...props} />;
}

export { Spinner };
