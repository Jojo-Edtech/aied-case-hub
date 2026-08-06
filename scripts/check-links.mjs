import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { CASE_FIELDS, PROMPT_FIELDS, RESOURCE_FIELDS, parseCsv, toCsv } from './csv-utils.mjs';
import { canonicalizeUrl } from './data-quality.mjs';

const timeoutMs = Number(process.env.LINK_CHECK_TIMEOUT_MS || 12000);
const concurrency = Math.max(1, Number(process.env.LINK_CHECK_CONCURRENCY || 6));
const limit = process.env.LINK_CHECK_ALL === 'true'
  ? Number.POSITIVE_INFINITY
  : Math.max(1, Number(process.env.LINK_CHECK_LIMIT || 120));
const today = process.env.TARGET_DATE || hongKongDate(new Date());

const datasets = [
  { path: 'data/cases.csv', fields: CASE_FIELDS },
  { path: 'data/resources.csv', fields: RESOURCE_FIELDS },
  { path: 'data/prompts.csv', fields: PROMPT_FIELDS },
];

const loaded = await Promise.all(
  datasets.map(async (dataset) => ({
    ...dataset,
    rows: parseCsv(await readFile(dataset.path, 'utf8')),
  })),
);

const urlEntries = new Map();
for (const dataset of loaded) {
  dataset.rows.forEach((row, rowIndex) => {
    const url = canonicalizeUrl(row.canonical_url || row.source_url);
    if (!url) return;
    const entry = urlEntries.get(url) || { url, references: [], lastVerified: '' };
    entry.references.push({ dataset, row, rowIndex });
    if (row.last_verified_date && (!entry.lastVerified || row.last_verified_date < entry.lastVerified)) {
      entry.lastVerified = row.last_verified_date;
    }
    urlEntries.set(url, entry);
  });
}

const queue = [...urlEntries.values()]
  .sort((a, b) => (a.lastVerified || '').localeCompare(b.lastVerified || '') || a.url.localeCompare(b.url))
  .slice(0, limit);
const results = [];
let cursor = 0;

await Promise.all(
  Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    while (cursor < queue.length) {
      const entry = queue[cursor];
      cursor += 1;
      const result = await checkUrl(entry.url);
      results.push(result);
      applyResult(entry, result);
      console.log(`${result.link_status.padEnd(10)} ${String(result.http_status || '-').padEnd(4)} ${entry.url}`);
    }
  }),
);

for (const dataset of loaded) {
  await writeFile(dataset.path, toCsv(dataset.rows, dataset.fields));
}

const summary = {
  run_date: today,
  checked_urls: results.length,
  total_urls: urlEntries.size,
  counts: countBy(results, 'link_status'),
  results: results.sort((a, b) => a.url.localeCompare(b.url)),
};
await mkdir('data/reports', { recursive: true });
await writeFile('data/reports/link-check-report.json', `${JSON.stringify(summary, null, 2)}\n`);
console.log(`Checked ${results.length}/${urlEntries.size} unique URL(s): ${JSON.stringify(summary.counts)}.`);

function applyResult(entry, result) {
  for (const { row } of entry.references) {
    row.canonical_url = canonicalizeUrl(row.canonical_url || row.source_url);
    row.link_status = result.link_status;
    row.http_status = result.http_status ? String(result.http_status) : '';
    row.redirect_url = result.redirect_url;
    if (result.verified) row.last_verified_date = today;
  }
}

async function checkUrl(url) {
  const first = await requestUrl(url);
  if (first.link_status !== 'error') return first;
  await wait(350);
  return requestUrl(url);
}

async function requestUrl(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'user-agent': 'AIED Case Hub link verifier (+https://github.com/Jojo-Edtech/aiedcase)',
        accept: 'text/html,application/xhtml+xml,application/pdf,text/plain;q=0.8,*/*;q=0.5',
        range: 'bytes=0-2047',
      },
    });
    response.body?.cancel().catch(() => {});
    const status = response.status;
    const finalUrl = canonicalizeUrl(response.url || url);
    const redirected = finalUrl !== canonicalizeUrl(url);

    if (status >= 200 && status < 400) {
      return {
        url,
        link_status: redirected ? 'redirected' : 'ok',
        http_status: status,
        redirect_url: redirected ? finalUrl : '',
        verified: true,
      };
    }
    if ([401, 403, 406, 409, 429, 451].includes(status)) {
      return { url, link_status: 'blocked', http_status: status, redirect_url: finalUrl !== url ? finalUrl : '', verified: false };
    }
    if ([404, 410].includes(status)) {
      return { url, link_status: 'broken', http_status: status, redirect_url: '', verified: false };
    }
    return { url, link_status: 'error', http_status: status, redirect_url: '', verified: false };
  } catch (error) {
    return {
      url,
      link_status: 'error',
      http_status: '',
      redirect_url: '',
      verified: false,
      error: error.name === 'AbortError' ? 'timeout' : String(error.message || error),
    };
  } finally {
    clearTimeout(timer);
  }
}

function countBy(items, key) {
  return items.reduce((counts, item) => {
    const value = item[key] || 'unknown';
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function hongKongDate(date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en', {
      timeZone: 'Asia/Hong_Kong',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date).map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}
