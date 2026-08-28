import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { CASE_FIELDS, PROMPT_FIELDS, RESOURCE_FIELDS, parseCsv, toCsv } from './csv-utils.mjs';
import { sanitizePublicRecord } from './data-quality.mjs';

const datasets = [
  { path: 'data/cases.csv', fields: CASE_FIELDS },
  { path: 'data/candidate_cases.csv', fields: CASE_FIELDS },
  { path: 'data/resources.csv', fields: RESOURCE_FIELDS },
  { path: 'data/prompts.csv', fields: PROMPT_FIELDS },
];

let changedFiles = 0;

for (const dataset of datasets) {
  if (!existsSync(dataset.path)) continue;
  const original = await readFile(dataset.path, 'utf8');
  const sanitized = toCsv(parseCsv(original).map(sanitizePublicRecord), dataset.fields);
  if (sanitized === original) continue;
  await writeFile(dataset.path, sanitized, 'utf8');
  changedFiles += 1;
  console.log(`Sanitized ${dataset.path}.`);
}

console.log(`Public-data sanitization changed ${changedFiles} file(s).`);
