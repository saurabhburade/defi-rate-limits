import { getMetadata } from "@/configs/metadata";
import { LocalSimulationPlayground } from "@/views/playground/LocalSimulationPlayground";
import type { NextPage } from "next";

export const metadata = getMetadata({
  title: "Local Rate Limit Playground",
  description: "Local simulation playground for rolling-window and token-bucket rate limiters.",
});

const Playground: NextPage = () => {
  return <LocalSimulationPlayground />;
};

export default Playground;
