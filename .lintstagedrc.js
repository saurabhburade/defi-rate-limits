const path = require("path");

const buildNextEslintCommand = (filenames) =>
  `pnpm --filter @defi-rate-limits/nextjs exec eslint --fix ${filenames
    .map((f) =>
      JSON.stringify(path.relative(path.join("packages", "nextjs"), f)),
    )
    .join(" ")}`;

const checkTypesNextCommand = () =>
  "pnpm --filter @defi-rate-limits/nextjs run check-types";

module.exports = {
  "packages/nextjs/**/*.{ts,tsx}": [
    buildNextEslintCommand,
    checkTypesNextCommand,
  ],
  "packages/foundry/**/*.{sol,mjs,toml}": [
    "pnpm --filter @defi-rate-limits/foundry run lint-staged",
  ],
};
