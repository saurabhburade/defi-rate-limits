import { LocalSimulationPlayground } from "./_components/LocalSimulationPlayground";
import type { NextPage } from "next";
import { getMetadata } from "~~/utils/metadata";

export const metadata = getMetadata({
  title: "Local Rate Limit Playground",
  description: "Local simulation playground for rolling-window and token-bucket rate limiters.",
});

const Playground: NextPage = () => {
  return <LocalSimulationPlayground />;
};

export default Playground;
