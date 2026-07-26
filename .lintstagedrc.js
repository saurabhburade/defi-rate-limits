const path = require("path");

const buildNextBiomeCommand = (filenames) =>
  `pnpm --filter @defi-rate-limits/nextjs exec biome check --write --no-errors-on-unmatched ${filenames
    .map((f) =>
      JSON.stringify(path.relative(path.join("packages", "nextjs"), f)),
    )
    .join(" ")}`;

const checkTypesNextCommand = () =>
  "pnpm --filter @defi-rate-limits/nextjs run check-types";

module.exports = {
  "packages/nextjs/**/*.{css,js,json,mjs,ts,tsx}": [
    buildNextBiomeCommand,
    checkTypesNextCommand,
  ],
  "packages/foundry/**/*.{sol,mjs,toml}": [
    "pnpm --filter @defi-rate-limits/foundry run lint-staged",
  ],
};
