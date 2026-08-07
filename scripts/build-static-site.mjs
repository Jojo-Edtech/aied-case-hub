import { cp, mkdir, rm } from "node:fs/promises";

const outputDir = "dist";

const rootFiles = [
  ".nojekyll",
  "index.html",
  "resources.html",
  "sitemap.xml",
  "script.js",
  "styles.css",
  "dashboard-theme.css",
];

const rootDirectories = ["cases", "paths", "prompts", "resources", "vendor"];

const dataFiles = [
  "candidate_cases.csv",
  "cases.csv",
  "learning_paths.json",
  "prompts.csv",
  "rag-config.json",
  "resources.csv",
];

await rm(outputDir, { recursive: true, force: true });
await mkdir(`${outputDir}/data`, { recursive: true });

for (const file of rootFiles) {
  await cp(file, `${outputDir}/${file}`);
}

for (const directory of rootDirectories) {
  await cp(directory, `${outputDir}/${directory}`, { recursive: true });
}

for (const file of dataFiles) {
  await cp(`data/${file}`, `${outputDir}/data/${file}`);
}

await cp("data/reports", `${outputDir}/data/reports`, { recursive: true });

console.log(`Static site prepared in ${outputDir}/`);
