import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseMechDocument } from "../src/components/database";

const repoRoot = path.resolve(__dirname, "../../..");
const mechPath = path.resolve(repoRoot, "components/slack/MECH.md");
const outputDir = path.resolve(repoRoot, "components/database/.generated");
const outputPath = path.resolve(outputDir, "seed-mech.json");
const profile = process.argv[2] || "default";

async function main() {
  const content = await readFile(mechPath, "utf8");
  const parsedRules = parseMechDocument(content);

  await mkdir(outputDir, { recursive: true });
  await writeFile(
    outputPath,
    `${JSON.stringify({ profile, source: mechPath, rules: parsedRules }, null, 2)}\n`,
    "utf8"
  );

  console.log(
    JSON.stringify(
      {
        mechPath,
        outputPath,
        profile,
        rules: parsedRules.length,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
