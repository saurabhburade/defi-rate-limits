"use client";

import { useEffect, useState } from "react";

export const nowSeconds = () => Math.floor(Date.now() / 1000);

export const useNowSeconds = () => {
  const [currentNowSeconds, setCurrentNowSeconds] = useState(nowSeconds);

  useEffect(() => {
    const interval = window.setInterval(() => setCurrentNowSeconds(nowSeconds()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  return currentNowSeconds;
};
