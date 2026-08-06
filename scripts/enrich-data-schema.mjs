import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { CASE_FIELDS, PROMPT_FIELDS, RESOURCE_FIELDS, parseCsv, toCsv } from './csv-utils.mjs';
import {
  canonicalizeUrl,
  enrichCaseRecord,
  enrichPromptRecord,
  enrichResourceRecord,
  titleFingerprint,
} from './data-quality.mjs';

const datasets = [
  {
    path: 'data/cases.csv',
    fields: CASE_FIELDS,
    enrich: enrichCaseRecord,
    dedupe: true,
  },
  {
    path: 'data/candidate_cases.csv',
    fields: CASE_FIELDS,
    enrich: enrichCaseRecord,
    dedupe: true,
  },
  {
    path: 'data/resources.csv',
    fields: RESOURCE_FIELDS,
    enrich: enrichResourceRecord,
    dedupe: true,
  },
  {
    path: 'data/prompts.csv',
    fields: PROMPT_FIELDS,
    enrich: enrichPromptRecord,
    dedupe: true,
  },
];

const reports = [];

for (const dataset of datasets) {
  const rows = parseCsv(await readFile(dataset.path, 'utf8')).map(dataset.enrich);
  const seen = new Map();
  const kept = [];
  const removed = [];

  for (const row of rows) {
    const keys = duplicateKeys(row);
    const duplicateOf = keys.map((key) => seen.get(key)).find(Boolean);

    if (dataset.dedupe && duplicateOf) {
      removed.push({ id: row.id, duplicate_of: duplicateOf, title: row.title_original || row.title_cn });
      continue;
    }

    kept.push(row);
    keys.forEach((key) => seen.set(key, row.id));
  }

  await writeFile(dataset.path, toCsv(kept, dataset.fields));
  reports.push({
    dataset: dataset.path,
    before: rows.length,
    after: kept.length,
    removed_count: removed.length,
    removed,
  });
  console.log(`${dataset.path}: enriched ${kept.length} row(s), removed ${removed.length} duplicate(s).`);
}

await mkdir('data/reports', { recursive: true });
await writeFile('data/reports/dedup-report.json', `${JSON.stringify({ datasets: reports }, null, 2)}\n`);

function duplicateKeys(record) {
  const keys = [];
  const canonical = canonicalizeUrl(record.canonical_url || record.source_url);
  const originalTitle = titleFingerprint(record.title_original || record.title_cn);
  const localizedTitle = titleFingerprint(record.title_cn);

  if (canonical && originalTitle.length >= 8) keys.push(`url-title:${canonical}|${originalTitle}`);
  if (originalTitle.length >= 16) keys.push(`title:${originalTitle}`);
  if (localizedTitle.length >= 16) keys.push(`title-cn:${localizedTitle}`);
  return [...new Set(keys)];
}
