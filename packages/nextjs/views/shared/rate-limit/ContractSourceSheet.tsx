"use client";

import { ghostButtonClassName } from "@/components/common/Button";
import { sheetPanelClassName } from "@/components/common/Sheet";
import { XIcon } from "lucide-react";

export const ContractSourceSheet = ({
  fileName,
  open,
  source,
  sourceError,
  titleId,
  onClose,
  onExited,
}: {
  fileName: string;
  open: boolean;
  source: string;
  sourceError: string | null;
  titleId: string;
  onClose: () => void;
  onExited: () => void;
}) => (
  <div className="fixed inset-0 z-50">
    <button
      aria-label="Close source viewer"
      className="absolute inset-0 cursor-default"
      onClick={onClose}
      style={{
        backgroundColor: "rgb(0 0 0 / 0.35)",
        opacity: open ? 1 : 0,
        transition: "opacity 240ms ease-out",
      }}
      type="button"
    />
    <aside
      aria-labelledby={titleId}
      aria-modal="true"
      className={sheetPanelClassName}
      onTransitionEnd={event => {
        if (event.target === event.currentTarget && !open) {
          onExited();
        }
      }}
      role="dialog"
      style={{
        transform: open ? "translateX(0)" : "translateX(100%)",
        transition: "transform 280ms cubic-bezier(0.22, 1, 0.36, 1)",
        willChange: "transform",
        width: "min(44rem, 100vw)",
      }}
    >
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-default px-5 py-4">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">Solidity source</p>
          <h2 className="mt-1 truncate text-lg font-semibold text-foreground" id={titleId}>
            {fileName}
          </h2>
        </div>
        <button
          aria-label="Close source viewer"
          className={ghostButtonClassName}
          onClick={onClose}
          style={{ height: 32, padding: 0, width: 32 }}
          title="Close"
          type="button"
        >
          <XIcon aria-hidden="true" size={16} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto bg-[color:var(--surface)] p-4">
        <pre className="min-w-max text-xs leading-5 text-foreground">
          <code>{(sourceError ?? source) || "Loading..."}</code>
        </pre>
      </div>
    </aside>
  </div>
);
