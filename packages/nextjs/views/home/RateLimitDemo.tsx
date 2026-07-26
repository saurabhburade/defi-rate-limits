"use client";

import { useState } from "react";
import { BucketedPanel } from "@/views/home/BucketedPanel";
import { TokenPanel } from "@/views/home/TokenPanel";
import { MechanismTabs } from "@/views/shared/rate-limit/MechanismTabs";
import type { RateLimitMechanism } from "@/views/shared/rate-limit/MechanismTabs";

export const RateLimitDemo = () => {
  const [activeMechanism, setActiveMechanism] = useState<RateLimitMechanism>("bucketed");

  return (
    <div className="mx-auto w-full max-w-7xl px-6 pb-14 pt-8 sm:px-8 lg:px-10">
      <section>
        <p className="max-w-lg text-sm leading-6 text-muted-foreground">
          Compare rolling-window and token-bucket limits.
        </p>
      </section>

      <MechanismTabs onChange={setActiveMechanism} value={activeMechanism} />

      <div className="mt-10">{activeMechanism === "bucketed" ? <BucketedPanel /> : <TokenPanel />}</div>
    </div>
  );
};
