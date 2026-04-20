import { RateLimitPlayground } from "./_components/RateLimitPlayground";
import type { NextPage } from "next";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

export const metadata = getMetadata({
  title: "Rate Limit Playground",
  description: "Directly inspect and exercise the BucketedRateLimiter and TokenBucketRateLimiter contracts.",
});

const Debug: NextPage = () => {
  return <RateLimitPlayground />;
};

export default Debug;
