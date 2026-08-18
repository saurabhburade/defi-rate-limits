const path = require("path");

const buildWebBiomeCommand = (filenames) =>
  `pnpm --filter @defi-rate-limits/web exec biome check --write --no-errors-on-unmatched ${filenames
    .map((f) => JSON.stringify(path.relative("web", f)))
    .join(" ")}`;

const checkTypesWebCommand = () =>
  "pnpm --filter @defi-rate-limits/web run check-types";

module.exports = {
  "web/**/*.{css,js,json,mjs,ts,tsx}": [
    buildWebBiomeCommand,
    checkTypesWebCommand,
  ],
  "contracts/**/*.{sol,toml}": [
    "pnpm --filter @defi-rate-limits/contracts run lint-staged",
  ],
};
