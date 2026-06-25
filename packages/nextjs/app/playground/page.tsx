import { getMetadata } from "@/libs/metadata";
import { PlaygroundView } from "@/views/playground/PlaygroundView";
import type { NextPage } from "next";

export const metadata = getMetadata({
  title: "Local Rate Limit Playground",
  description: "Local simulation playground for rolling-window and token-bucket rate limiters.",
});

const Playground: NextPage = () => {
  return <PlaygroundView />;
};

export default Playground;
