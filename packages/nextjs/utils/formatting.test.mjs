import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("./formatting.ts", import.meta.url), "utf8");
const compiledSource = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText;
const { formatAmount } = await import(`data:text/javascript;base64,${Buffer.from(compiledSource).toString("base64")}`);

test("compact amounts remain accurate across a thousands boundary", () => {
  assert.deepEqual(
    [800_277n, 800_554n, 800_831n, 801_108n, 16_620n].map(value => formatAmount(value, true)),
    ["800.28K units", "800.55K units", "800.83K units", "801.11K units", "16.62K units"],
  );
});
