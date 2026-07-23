"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

export const useIsMounted = () =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
