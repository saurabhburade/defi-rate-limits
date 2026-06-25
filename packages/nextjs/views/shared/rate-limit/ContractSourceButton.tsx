"use client";

import { useEffect, useId, useState } from "react";
import { secondaryButtonClassName } from "@/components/common/Button";
import { ContractSourceSheet } from "@/views/shared/rate-limit/ContractSourceSheet";
import { CodeIcon } from "lucide-react";

type SourceLoader = () => Promise<string>;

export const ContractSourceButton = ({ fileName, loadSource }: { fileName: string; loadSource: SourceLoader }) => {
  const [mounted, setMounted] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [source, setSource] = useState("");
  const [sourceError, setSourceError] = useState<string | null>(null);
  const titleId = useId();

  const openSheet = () => {
    setMounted(true);
    setSourceError(null);

    if (!source) {
      loadSource()
        .then(setSource)
        .catch(() => setSourceError("Unable to load source."));
    }
  };

  useEffect(() => {
    if (!mounted) return;

    const frame = requestAnimationFrame(() => setSheetOpen(true));

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSheetOpen(false);
      }
    };
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mounted]);

  return (
    <>
      <button
        aria-expanded={sheetOpen}
        aria-haspopup="dialog"
        aria-label={`View ${fileName}`}
        className={secondaryButtonClassName}
        onClick={openSheet}
        style={{
          color: "color-mix(in oklch, var(--muted-foreground) 50%, transparent)",
          height: 28,
          padding: 0,
          width: 28,
        }}
        title={`View ${fileName}`}
        type="button"
      >
        <CodeIcon aria-hidden="true" size={14} />
      </button>

      {mounted ? (
        <ContractSourceSheet
          fileName={fileName}
          onClose={() => setSheetOpen(false)}
          onExited={() => setMounted(false)}
          open={sheetOpen}
          source={source}
          sourceError={sourceError}
          titleId={titleId}
        />
      ) : null}
    </>
  );
};

export const BucketedRateLimiterSourceButton = () => (
  <ContractSourceButton
    fileName="BucketedRateLimiter.sol"
    loadSource={() =>
      import("@/configs/contracts/sources/bucketedRateLimiterSource").then(mod => mod.bucketedRateLimiterSource)
    }
  />
);

export const TokenBucketRateLimiterSourceButton = () => (
  <ContractSourceButton
    fileName="TokenBucketRateLimiter.sol"
    loadSource={() =>
      import("@/configs/contracts/sources/tokenBucketRateLimiterSource").then(mod => mod.tokenBucketRateLimiterSource)
    }
  />
);
