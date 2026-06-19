const path = require("path");

const buildNextEslintCommand = (filenames) =>
  `yarn workspace @defi-rate-limits/nextjs lint --fix --file ${filenames
    .map((f) => path.relative(path.join("packages", "nextjs"), f))
    .join(" --file ")}`;

const checkTypesNextCommand = () =>
  "yarn workspace @defi-rate-limits/nextjs check-types";

module.exports = {
  "packages/nextjs/**/*.{ts,tsx}": [
    buildNextEslintCommand,
    checkTypesNextCommand,
  ],
  "packages/foundry/**/*.{sol,mjs,toml}": [
    "yarn workspace @defi-rate-limits/foundry lint-staged",
  ],
};
