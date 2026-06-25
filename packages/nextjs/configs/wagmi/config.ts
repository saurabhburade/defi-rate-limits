import { isLocalChain, targetNetworks } from "@/configs/wagmi/chains";
import { wagmiConnectors } from "@/configs/wagmi/connectors";
import {
  DEFAULT_ALCHEMY_API_KEY,
  alchemyApiKey,
  getAlchemyHttpUrl,
  pollingInterval,
  rpcOverrides,
} from "@/configs/wagmi/rpc";
import { type Chain, createClient, fallback, http } from "viem";
import { createConfig } from "wagmi";

export const enabledChains = targetNetworks as readonly [Chain, ...Chain[]];

export const wagmiConfig = createConfig({
  chains: enabledChains,
  connectors: wagmiConnectors(),
  ssr: true,
  client({ chain }) {
    let rpcFallbacks = [http()];

    const rpcOverrideUrl = rpcOverrides[chain.id];

    if (rpcOverrideUrl) {
      rpcFallbacks = [http(rpcOverrideUrl), ...rpcFallbacks];
    } else {
      const alchemyHttpUrl = getAlchemyHttpUrl(chain.id);
      if (alchemyHttpUrl) {
        const isUsingDefaultKey = alchemyApiKey === DEFAULT_ALCHEMY_API_KEY;
        // If using the shared demo key, prioritize the chain's default public RPC.
        rpcFallbacks = isUsingDefaultKey
          ? [...rpcFallbacks, http(alchemyHttpUrl)]
          : [http(alchemyHttpUrl), ...rpcFallbacks];
      }
    }

    return createClient({
      chain,
      transport: fallback(rpcFallbacks),
      ...(!isLocalChain(chain.id) ? { pollingInterval } : {}),
    });
  },
});
