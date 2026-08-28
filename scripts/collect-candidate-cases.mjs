import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { CASE_FIELDS, parseCsv, toCsv } from './csv-utils.mjs';
import { canonicalizeUrl, enrichCaseRecord, titleFingerprint } from './data-quality.mjs';
import { extractReadableText } from './html-text.mjs';
import {
  MAX_FIRECRAWL_RESPONSE_BYTES,
  fetchTrustedText,
  readBoundedResponseText,
  validateFirecrawlApiBase,
} from './network-security.mjs';

const CASES_PATH = process.env.CASES_PATH || 'data/cases.csv';
const CANDIDATES_PATH = process.env.CANDIDATES_PATH || 'data/candidate_cases.csv';
const FEEDS_PATH = process.env.FEEDS_PATH || 'data/source_feeds.json';
const SUMMARY_PATH = process.env.SUMMARY_FILE || '.tmp/candidate_update_summary.md';
const MAX_NEW_CANDIDATES = Number(process.env.MAX_NEW_CANDIDATES || 30);
const AUTO_PUBLISH_CASES = process.env.AUTO_PUBLISH_CASES !== 'false';
const AUTO_PUBLISH_MIN_SCORE = Number(process.env.AUTO_PUBLISH_MIN_SCORE || 0);
const ARTICLE_ENRICHMENT_ENABLED = process.env.ARTICLE_ENRICHMENT_ENABLED !== 'false';
const ARTICLE_ENRICHMENT_MAX_PER_RUN = Number(process.env.ARTICLE_ENRICHMENT_MAX_PER_RUN || 18);
const ARTICLE_MIN_TEXT_CHARS = Number(process.env.ARTICLE_MIN_TEXT_CHARS || 450);
const ARTICLE_TEXT_MAX_CHARS = Number(process.env.ARTICLE_TEXT_MAX_CHARS || 4500);
const FIRECRAWL_ENABLED = process.env.FIRECRAWL_ENABLED !== 'false';
const FIRECRAWL_PRIMARY = process.env.FIRECRAWL_PRIMARY === 'true';
const FIRECRAWL_API_BASE = validateFirecrawlApiBase(
  process.env.FIRECRAWL_API_BASE || 'https://api.firecrawl.dev/v2',
);
const FIRECRAWL_MAX_PER_RUN = Number(process.env.FIRECRAWL_MAX_PER_RUN || 6);
const FIRECRAWL_SEARCH_ENABLED = process.env.FIRECRAWL_SEARCH_ENABLED !== 'false';
const FIRECRAWL_SEARCH_MAX_QUERIES = Number(process.env.FIRECRAWL_SEARCH_MAX_QUERIES || 4);
const FIRECRAWL_SEARCH_RESULTS_PER_QUERY = Number(process.env.FIRECRAWL_SEARCH_RESULTS_PER_QUERY || 5);

const categories = [
  'AI Literacy',
  'AI+STEM',
  'AI+Humanities',
  'AI+Social Sciences',
  'AI for Teaching & Assessment',
];

const aiTerms = [
  'ai',
  'artificial intelligence',
  'generative ai',
  'chatgpt',
  'machine learning',
  'large language model',
  'llm',
  'copilot',
  '人工智能',
  '生成式ai',
  '生成式人工智能',
  '大模型',
  '機器學習',
  '机器学习',
];

const educationTerms = [
  'school',
  'student',
  'teacher',
  'classroom',
  'curriculum',
  'lesson',
  'education',
  'university',
  'college',
  'assessment',
  'course',
  'learners',
  '学校',
  '學生',
  '学生',
  '教師',
  '教师',
  '课堂',
  '課堂',
  '课程',
  '課程',
  '教育',
  '教学',
  '學習',
  '学习',
  '评估',
  '評估',
];

const practiceTerms = [
  'case',
  'pilot',
  'class',
  'lesson',
  'course',
  'project',
  'workshop',
  'classroom',
  'activity',
  'assignment',
  'challenge',
  'tutoring',
  'translation',
  'feedback',
  'rubric',
  '案例',
  '课堂',
  '課堂',
  '活动',
  '活動',
  '课程',
  '課程',
  '项目',
  '項目',
  '任务',
  '任務',
  '作业',
  '作業',
  '反馈',
  '回饋',
];

async function main() {
  const [casesText, feedsText] = await Promise.all([
    readFile(CASES_PATH, 'utf8'),
    readFile(FEEDS_PATH, 'utf8'),
  ]);
  const existingCases = parseCsv(casesText);
  const candidates = existsSync(CANDIDATES_PATH)
    ? parseCsv(await readFile(CANDIDATES_PATH, 'utf8'))
    : [];
  const feeds = JSON.parse(feedsText);

  const knownUrls = new Set(
    [...existingCases, ...candidates]
      .map((record) => canonicalizeUrl(record.canonical_url || record.source_url))
      .filter(Boolean),
  );
  const knownTitles = new Set(
    [...existingCases, ...candidates]
      .map((record) => titleFingerprint(record.title_original || record.title_cn))
      .filter((value) => value.length >= 16),
  );

  const nextRecordId = AUTO_PUBLISH_CASES
    ? createCaseIdFactory([...existingCases, ...candidates])
    : createCandidateIdFactory(candidates);
  const newCandidates = [];
  const feedReports = [];
  const enrichmentState = createEnrichmentState();

  for (const feed of feeds) {
    try {
      const feedText = await fetchText(feed.url);
      const items = parseFeedItems(feedText, feed.item_limit);
      let matched = 0;

      for (const item of items) {
        if (newCandidates.length >= MAX_NEW_CANDIDATES) {
          break;
        }

        const sourceUrl = canonicalizeUrl(item.url);
        if (!sourceUrl || knownUrls.has(sourceUrl)) {
          continue;
        }
        if (shouldSkipByFeedRules(item, feed)) {
          continue;
        }

        const enrichedItem = await maybeEnrichItem(item, sourceUrl, feed, enrichmentState);
        const titleKey = titleFingerprint(enrichedItem.title);
        if (titleKey.length >= 16 && knownTitles.has(titleKey)) {
          continue;
        }
        const searchableText = `${enrichedItem.title} ${enrichedItem.description}`;
        if (!hasAiInTitle(enrichedItem.title, feed) || !looksLikeTeachingPractice(searchableText, enrichedItem.title)) {
          continue;
        }

        const record = buildCandidateRecord({
          id: nextRecordId(),
          item: enrichedItem,
          feed,
          sourceUrl,
          autoPublish: AUTO_PUBLISH_CASES,
        });

        knownUrls.add(sourceUrl);
        if (titleKey.length >= 16) knownTitles.add(titleKey);
        newCandidates.push(record);
        matched += 1;
      }

      feedReports.push(`- ${feed.name}: 读取 ${items.length} 条，新增 ${matched} 条质量待判定匹配`);
    } catch (error) {
      feedReports.push(`- ${feed.name}: 读取失败，${error.message}`);
    }
  }

  if (newCandidates.length < MAX_NEW_CANDIDATES) {
    const searchReport = await collectFirecrawlSearchCandidates({
      knownUrls,
      knownTitles,
      nextRecordId,
      remaining: MAX_NEW_CANDIDATES - newCandidates.length,
      enrichmentState,
    });
    newCandidates.push(...searchReport.records);
    feedReports.push(...searchReport.reports);
  }

  const newPublished = AUTO_PUBLISH_CASES
    ? newCandidates.filter((record) => Number(record.quality_score) >= AUTO_PUBLISH_MIN_SCORE)
    : [];
  const newReview = AUTO_PUBLISH_CASES
    ? newCandidates.filter((record) => Number(record.quality_score) < AUTO_PUBLISH_MIN_SCORE)
    : newCandidates;

  if (newCandidates.length > 0) {
    await mkdir(dirname(CASES_PATH), { recursive: true });
    await mkdir(dirname(CANDIDATES_PATH), { recursive: true });
    await writeFile(CASES_PATH, toCsv([...existingCases, ...newPublished], CASE_FIELDS));
    await writeFile(CANDIDATES_PATH, toCsv([...candidates, ...newReview], CASE_FIELDS));
  }

  await writeSummary({ newCandidates, newPublished, newReview, feedReports, enrichmentState });
  console.log(`Discovered ${newCandidates.length}: published ${newPublished.length}, held ${newReview.length}.`);
}

async function fetchText(
  url,
  accept = 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
  timeoutMs = 20000,
) {
  return fetchTrustedText(url, { accept, timeoutMs });
}

function createEnrichmentState() {
  return {
    articleAttempts: 0,
    articleHtmlExtracted: 0,
    articleFailed: 0,
    firecrawlCalls: 0,
    firecrawlScrapes: 0,
    firecrawlSearchQueries: 0,
    firecrawlSearchResults: 0,
    firecrawlDisabledReason: FIRECRAWL_ENABLED
      ? ''
      : 'Firecrawl disabled by FIRECRAWL_ENABLED=false; using RSS/HTML only.',
    cache: new Map(),
  };
}

async function maybeEnrichItem(item, sourceUrl, feed, state) {
  if (!shouldEnrichArticle(item, sourceUrl, feed, state)) {
    return item;
  }

  if (state.cache.has(sourceUrl)) {
    const cached = state.cache.get(sourceUrl);
    return appendArticleText(item, cached.text, cached.method);
  }

  state.articleAttempts += 1;

  try {
    const article = await fetchReadableArticleText(sourceUrl, state);
    state.cache.set(sourceUrl, article);
    return appendArticleText(item, article.text, article.method);
  } catch (error) {
    state.articleFailed += 1;
    state.cache.set(sourceUrl, { text: '', method: 'failed' });
    return item;
  }
}

function shouldEnrichArticle(item, sourceUrl, feed, state) {
  if (!ARTICLE_ENRICHMENT_ENABLED || state.articleAttempts >= ARTICLE_ENRICHMENT_MAX_PER_RUN) {
    return false;
  }
  if (!sourceUrl || isLikelyVideoUrl(sourceUrl)) {
    return false;
  }
  if (!hasAiInTitle(item.title, feed)) {
    return false;
  }

  const baseText = `${item.title} ${item.description}`;
  return item.description.length < ARTICLE_MIN_TEXT_CHARS || !looksLikeTeachingPractice(baseText, item.title);
}

function appendArticleText(item, articleText, method) {
  if (!articleText) {
    return item;
  }

  const compactArticleText = truncate(articleText, ARTICLE_TEXT_MAX_CHARS);
  const description = [item.description, compactArticleText].filter(Boolean).join('\n\n');

  return {
    ...item,
    description,
    enrichmentMethod: method,
  };
}

async function fetchReadableArticleText(url, state) {
  if (FIRECRAWL_PRIMARY && canUseFirecrawl(state)) {
    try {
      const firecrawlText = await fetchFirecrawlScrape(url, state);
      if (firecrawlText.length >= ARTICLE_MIN_TEXT_CHARS) {
        state.firecrawlScrapes += 1;
        return { text: firecrawlText, method: 'firecrawl' };
      }
    } catch {
      // Fall back to ordinary HTML extraction if Firecrawl is unavailable or returns too little text.
    }
  }

  try {
    const htmlText = await fetchHtmlArticleText(url);
    if (htmlText.length >= ARTICLE_MIN_TEXT_CHARS) {
      state.articleHtmlExtracted += 1;
      return { text: htmlText, method: 'html' };
    }
  } catch {
    // Some news and school sites block ordinary HTML fetches. Firecrawl is the optional fallback.
  }

  if (!canUseFirecrawl(state)) {
    throw new Error('Article text was too short and Firecrawl fallback is unavailable.');
  }

  const firecrawlText = await fetchFirecrawlScrape(url, state);
  if (firecrawlText.length < ARTICLE_MIN_TEXT_CHARS) {
    throw new Error('Firecrawl scrape returned too little readable text.');
  }

  state.firecrawlScrapes += 1;
  return { text: firecrawlText, method: 'firecrawl' };
}

async function fetchHtmlArticleText(url) {
  const html = await fetchText(url, 'text/html, application/xhtml+xml, */*', 15000);
  return extractReadableText(html);
}

function isLikelyVideoUrl(url) {
  return /(?:youtube\.com|youtu\.be|bilibili\.com|vimeo\.com)/i.test(url);
}

function canUseFirecrawl(state) {
  return FIRECRAWL_ENABLED && !state.firecrawlDisabledReason && state.firecrawlCalls < FIRECRAWL_MAX_PER_RUN;
}

async function fetchFirecrawlScrape(url, state) {
  const payload = {
    url,
    formats: ['markdown'],
    onlyMainContent: true,
  };
  const data = await firecrawlRequest('/scrape', payload, state);
  return cleanText(
    data?.data?.markdown ||
      data?.data?.content ||
      data?.data?.html ||
      data?.markdown ||
      data?.content ||
      '',
  );
}

async function fetchFirecrawlSearch(query, state) {
  const data = await firecrawlRequest(
    '/search',
    {
      query,
      limit: FIRECRAWL_SEARCH_RESULTS_PER_QUERY,
      sources: [{ type: 'web' }],
    },
    state,
  );
  const results =
    data?.data?.web ||
    data?.data?.results ||
    data?.data ||
    data?.results ||
    [];

  return Array.isArray(results) ? results : [];
}

async function firecrawlRequest(path, body, state) {
  if (!canUseFirecrawl(state)) {
    throw new Error(state.firecrawlDisabledReason || 'Firecrawl call limit reached.');
  }
  if (!['/scrape', '/search'].includes(path)) {
    throw new Error('Unsupported Firecrawl API path.');
  }

  state.firecrawlCalls += 1;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  const headers = {
    'content-type': 'application/json',
    accept: 'application/json',
  };
  if (process.env.FIRECRAWL_API_KEY) {
    headers.authorization = `Bearer ${process.env.FIRECRAWL_API_KEY}`;
  }

  try {
    const response = await fetch(`${FIRECRAWL_API_BASE}${path}`, {
      method: 'POST',
      signal: controller.signal,
      redirect: 'error',
      headers,
      body: JSON.stringify(body),
    });
    const text = await readBoundedResponseText(response, MAX_FIRECRAWL_RESPONSE_BYTES);

    if (!response.ok) {
      const message = formatFirecrawlError(path, response.status, text);
      if ([401, 403, 429].includes(response.status)) {
        state.firecrawlDisabledReason = message;
      }
      throw new Error(message);
    }

    return JSON.parse(text);
  } finally {
    clearTimeout(timeout);
  }
}

function formatFirecrawlError(path, status, text) {
  if (status === 403 && /suspicious|api key/i.test(text)) {
    return `Firecrawl ${path} HTTP 403: keyless access was blocked from this runner; continuing with RSS/HTML only.`;
  }
  if (status === 401) {
    return `Firecrawl ${path} HTTP 401: API key missing or invalid; continuing with RSS/HTML only.`;
  }
  if (status === 429) {
    return `Firecrawl ${path} HTTP 429: rate limit reached; continuing with RSS/HTML only.`;
  }
  return `Firecrawl ${path} HTTP ${status}: ${truncate(text, 160)}`;
}

async function collectFirecrawlSearchCandidates({ knownUrls, knownTitles, nextRecordId, remaining, enrichmentState }) {
  const records = [];
  const reports = [];

  if (!FIRECRAWL_ENABLED || !FIRECRAWL_SEARCH_ENABLED || remaining <= 0) {
    return { records, reports };
  }

  const queries = getFirecrawlSearchQueries().slice(0, FIRECRAWL_SEARCH_MAX_QUERIES);
  if (queries.length === 0) {
    return { records, reports };
  }

  let totalResults = 0;
  let totalMatched = 0;

  for (const query of queries) {
    if (records.length >= remaining || !canUseFirecrawl(enrichmentState)) {
      break;
    }

    try {
      enrichmentState.firecrawlSearchQueries += 1;
      const results = await fetchFirecrawlSearch(query, enrichmentState);
      totalResults += results.length;
      enrichmentState.firecrawlSearchResults += results.length;

      for (const result of results) {
        if (records.length >= remaining) {
          break;
        }

        const sourceUrl = canonicalizeUrl(result.url || result.link);
        if (!sourceUrl || knownUrls.has(sourceUrl) || isLikelyVideoUrl(sourceUrl)) {
          continue;
        }

        const item = {
          title: cleanText(result.title || result.name || ''),
          description: cleanText(result.description || result.snippet || result.markdown || ''),
          url: sourceUrl,
          publishedDate: normalizeDate(result.publishedDate || result.published_date || ''),
        };

        const searchFeed = {
          name: `Firecrawl Search: ${query}`,
          language: inferLanguage(`${item.title} ${item.description}`),
          region: inferRegion(`${item.title} ${item.description}`, '全球'),
          source_type: '媒体报道',
          credibility: '媒体报道',
          ai_focused: true,
        };

        const enrichedItem = await maybeEnrichItem(item, sourceUrl, searchFeed, enrichmentState);
        const titleKey = titleFingerprint(enrichedItem.title);
        if (titleKey.length >= 16 && knownTitles.has(titleKey)) {
          continue;
        }
        const searchableText = `${enrichedItem.title} ${enrichedItem.description}`;
        if (!looksLikeTeachingPractice(searchableText, enrichedItem.title)) {
          continue;
        }

        const record = buildCandidateRecord({
          id: nextRecordId(),
          item: enrichedItem,
          feed: searchFeed,
          sourceUrl,
          autoPublish: AUTO_PUBLISH_CASES,
        });

        knownUrls.add(sourceUrl);
        if (titleKey.length >= 16) knownTitles.add(titleKey);
        records.push(record);
        totalMatched += 1;
      }
    } catch (error) {
      reports.push(`- Firecrawl Search「${query}」: 读取失败，${error.message}`);
    }
  }

  if (totalResults > 0 || totalMatched > 0) {
    reports.push(`- Firecrawl Search: 读取 ${totalResults} 条搜索结果，新增 ${totalMatched} 条质量待判定匹配`);
  } else if (enrichmentState.firecrawlDisabledReason) {
    reports.push(`- Firecrawl Search: 已自动跳过，${enrichmentState.firecrawlDisabledReason}`);
  }

  return { records, reports };
}

function getFirecrawlSearchQueries() {
  const customQueries = process.env.FIRECRAWL_SEARCH_QUERIES;
  if (customQueries) {
    return customQueries
      .split(/\n|\|\|/g)
      .map((query) => query.trim())
      .filter(Boolean);
  }

  return [
    'AI education classroom case teacher students',
    'generative AI lesson classroom project students',
    'ChatGPT classroom teaching practice school students',
    'AI literacy lesson plan classroom case study',
  ];
}

function parseFeedItems(xml, itemLimit = 0) {
  const itemBlocks = [...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)].map((match) => match[0]);
  const entryBlocks = [...xml.matchAll(/<entry\b[\s\S]*?<\/entry>/gi)].map((match) => match[0]);
  const blocks = itemBlocks.length > 0 ? itemBlocks : entryBlocks;

  if (blocks.length === 0) {
    throw new Error('No RSS/Atom items found');
  }

  return blocks.slice(0, itemLimit || blocks.length).map((block) => {
    const title = firstNonEmptyText([readTag(block, 'title'), readTag(block, 'media:title')]);
    const description = longestText([
      readTag(block, 'description'),
      readTag(block, 'summary'),
      readTag(block, 'content:encoded'),
      readTag(block, 'content'),
      readTag(block, 'media:description'),
    ]);
    const url = readTag(block, 'link') || readHref(block, 'link') || readTag(block, 'guid');
    const published =
      readTag(block, 'pubDate') || readTag(block, 'published') || readTag(block, 'updated');

    return {
      title,
      description,
      url: decodeEntities(url.trim()),
      publishedDate: normalizeDate(published),
    };
  });
}

function readTag(block, tagName) {
  const escaped = tagName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = block.match(new RegExp(`<${escaped}\\b[^>]*>([\\s\\S]*?)<\\/${escaped}>`, 'i'));
  return match?.[1] ?? '';
}

function readHref(block, tagName) {
  const escaped = tagName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = block.match(new RegExp(`<${escaped}\\b[^>]*href=["']([^"']+)["'][^>]*>`, 'i'));
  return match?.[1] ?? '';
}

function cleanText(value) {
  return decodeEntities(value)
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function firstNonEmptyText(values) {
  for (const value of values) {
    const text = cleanText(value || '');
    if (text) return text;
  }
  return '';
}

function longestText(values) {
  return values
    .map((value) => cleanText(value || ''))
    .sort((a, b) => b.length - a.length)[0] || '';
}

function decodeEntities(value) {
  const namedEntities = {
    amp: '&',
    apos: "'",
    gt: '>',
    lt: '<',
    nbsp: ' ',
    quot: '"',
  };

  return value.replace(/&(?:#x([0-9a-f]+)|#(\d+)|([a-z]+));/gi, (entity, hex, decimal, named) => {
    if (hex) return String.fromCodePoint(Number.parseInt(hex, 16));
    if (decimal) return String.fromCodePoint(Number.parseInt(decimal, 10));
    return namedEntities[named.toLowerCase()] ?? entity;
  });
}

function looksLikeTeachingPractice(text, title = '') {
  const normalized = text.toLowerCase();
  if (looksLikeAdministrativeOnly(title)) {
    return false;
  }

  return (
    includesAny(normalized, aiTerms) &&
    includesAny(normalized, educationTerms) &&
    (includesAny(normalized, practiceTerms) || hasStrongClassroomSignal(normalized)) &&
    !looksLikeAiResearchOnly(normalized)
  );
}

function hasAiInTitle(title, feed) {
  return Boolean(feed.ai_focused) || includesAny(title.toLowerCase(), aiTerms);
}

function shouldSkipByFeedRules(item, feed) {
  const title = item.title.toLowerCase();
  const excluded = feed.exclude_title_terms || [];
  if (excluded.some((term) => title.includes(String(term).toLowerCase()))) {
    return true;
  }

  const required = feed.require_title_terms || [];
  if (required.length > 0 && !required.some((term) => title.includes(String(term).toLowerCase()))) {
    return true;
  }

  return false;
}

function looksLikeAdministrativeOnly(title) {
  const normalized = title.toLowerCase();
  return [
    /cybersecurity|zero trust|security/i,
    /governance|policy|lawmakers|guardrails/i,
    /afford|budget|funding|procurement/i,
    /college degrees?|hiring managers?/i,
    /foundations? for reshaping|future of education/i,
    /school it officials?/i,
  ].some((pattern) => pattern.test(normalized));
}

function hasStrongClassroomSignal(text) {
  return [
    /teachers?\s+(use|uses|using|used|bring|brings|brought|ask|asks|asked|assign|assigns|assigned|embed|embeds|embedded)/i,
    /students?\s+(use|uses|using|used|build|builds|built|create|creates|created|write|writes|wrote|revise|revises|revised|complete|completes|completed)/i,
    /classroom-ready|lesson plan|student project|project showcase|hour of ai|ai literacy project/i,
    /教师.*(使用|应用|設計|设计|布置)|教師.*(使用|應用|設計|布置)|学生.*(使用|创作|完成|修改)|學生.*(使用|創作|完成|修改)/i,
  ].some((pattern) => pattern.test(text));
}

function looksLikeAiResearchOnly(text) {
  return [
    /teaching ai (agents?|models?)/i,
    /training (method|ai model|machine learning model)/i,
    /test bed for ai agents?/i,
    /ai model can outperform/i,
    /researchers? (developed|trained|propose|introduce)/i,
  ].some((pattern) => pattern.test(text));
}

function includesAny(text, terms) {
  return terms.some((term) => {
    const normalizedTerm = term.toLowerCase();
    if (/^[a-z0-9]+$/.test(normalizedTerm) && normalizedTerm.length <= 3) {
      return new RegExp(`(^|[^a-z0-9])${escapeRegExp(normalizedTerm)}([^a-z0-9]|$)`).test(text);
    }
    return text.includes(normalizedTerm);
  });
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildCandidateRecord({ id, item, feed, sourceUrl, autoPublish = false }) {
  const text = `${item.title} ${item.description}`;
  const category = inferCategory(text);
  const subcategory = inferSubcategory(text, category);
  const summarySource = item.description || item.title;
  const subject = inferSubject(text, category, subcategory);

  const record = {
    id,
    title_original: item.title,
    title_cn: autoPublish ? item.title : `待审核：${item.title}`,
    category,
    subcategory,
    subject,
    education_level: inferEducationLevel(text),
    language: feed.language || '英文',
    region: inferRegion(text, feed.region || '全球'),
    ai_tool_or_method: inferMethod(text),
    summary_cn: autoPublish
      ? `自动收录：${truncate(summarySource, 180)}。原文包含 AI 教育、课堂实践、教师工作流或学生学习任务相关信息，可打开来源进一步查看。`
      : `自动候选：${truncate(summarySource, 140)}。请审核是否为真实教学实践案例，并补充正式简体中文摘要。`,
    teaching_goal_cn: '',
    implementation_cn: '',
    outcomes_cn: '',
    limitations_cn: '',
    workflow_cn: '',
    source_type: feed.source_type || '媒体报道',
    credibility: feed.credibility || '媒体报道',
    source_url: sourceUrl,
    canonical_url: canonicalizeUrl(sourceUrl),
    published_date: item.publishedDate,
    accessed_date: todayInHongKong(),
    last_verified_date: '',
    link_status: 'unverified',
    http_status: '',
    redirect_url: '',
    quality_score: '0',
    quality_label: '资料不完整',
  };
  record.workflow_cn = workflowFor(record, autoPublish);
  return enrichCaseRecord(record);
}

function inferCategory(text) {
  const lower = text.toLowerCase();
  if (/(assessment|grading|feedback|teacher|lesson plan|rubric|评估|評估|评分|評分|反馈|回饋|教师|教師)/i.test(lower)) return 'AI for Teaching & Assessment';
  if (/(math|mathematics|algebra|geometry|calculus|science|biology|chemistry|physics|laboratory|stem|coding|computer science|programming|python|scratch|code|engineering|robot|robotics|maker|数学|數學|科学|科學|物理|化学|化學|生物|编程|程式|資訊科技|信息技术|工程|机器人|機器人)/i.test(lower)) return 'AI+STEM';
  if (/(business|economics|entrepreneur|finance|marketing|social studies|civics|geography|商業|商业|经济|經濟|金融|社会|社會|公民|地理)/i.test(lower)) return 'AI+Social Sciences';
  if (/(writing|reading|language|english|literacy|history|humanities|作文|阅读|閱讀|語文|语文|语言|語言|历史|歷史|人文)/i.test(lower)) return 'AI+Humanities';
  if (/(^|[^a-z])(art|arts|design|music|media|creative|visual)([^a-z]|$)|艺术|藝術|设计|設計|音乐|音樂/i.test(lower)) return 'AI+Humanities';
  return categories[0];
}

function inferSubcategory(text, category) {
  const lower = text.toLowerCase();
  if (category === 'AI+STEM') {
    if (/(math|mathematics|algebra|geometry|calculus|数学|數學)/i.test(lower)) return 'Math';
    if (/(coding|computer science|programming|python|scratch|code|编程|程式|資訊科技|信息技术)/i.test(lower)) return 'Coding / CS';
    if (/(robot|robotics|engineering|maker|机器人|機器人|工程)/i.test(lower)) return 'Engineering / Robotics';
    if (/(science|biology|chemistry|physics|laboratory|科学|科學|物理|化学|化學|生物)/i.test(lower)) return 'Science';
    return 'Integrated STEM';
  }
  if (category === 'AI+Humanities') {
    if (/(writing|reading|language|english|literacy|作文|写作|寫作|阅读|閱讀|語文|语文|语言|語言)/i.test(lower)) return 'Language';
    if (/(^|[^a-z])(art|arts|design|music|media|creative|visual)([^a-z]|$)|艺术|藝術|设计|設計|音乐|音樂/i.test(lower)) return 'Arts & Design';
    return 'Humanities';
  }
  if (category === 'AI+Social Sciences') {
    if (/(business|economics|entrepreneur|finance|marketing|商業|商业|经济|經濟|金融)/i.test(lower)) return 'Business / Economics';
    return 'Social Studies';
  }
  if (category === 'AI for Teaching & Assessment') {
    if (/(assessment|grading|rubric|feedback|评估|評估|评分|評分|反馈|回饋)/i.test(lower)) return 'Assessment / Feedback';
    if (/(teacher|professional development|lesson plan|教师|教師|备课|備課)/i.test(lower)) return 'Teacher Workflow';
    return 'Teaching Support';
  }
  if (/(ethic|bias|responsible|安全|伦理|倫理|偏见|偏誤)/i.test(lower)) return 'Responsible AI';
  if (/(prompt|chatgpt|generative|生成式|大模型)/i.test(lower)) return 'Generative AI Literacy';
  return 'AI Literacy Basics';
}

function inferSubject(text, category, subcategory) {
  const lower = text.toLowerCase();
  if (/(writing|作文|写作|寫作)/i.test(lower)) return '写作';
  if (/(reading|阅读|閱讀)/i.test(lower)) return '阅读';
  if (/(robot|robotics|机器人|機器人)/i.test(lower)) return '机器人';
  if (/(assessment|grading|rubric|评估|評估|评分|評分)/i.test(lower)) return '评估';
  if (/(teacher|professional development|教师|教師)/i.test(lower)) return '教师专业发展';
  if (category === 'AI Literacy') return 'AI素养';
  return subcategory;
}

function workflowFor(record, autoPublish = false) {
  return [
    `【案例】${record.title_cn || record.title_original}`,
    `【适用】${record.education_level || '学生'}；方向：${record.subcategory || record.category}`,
    `【目标】用${record.ai_tool_or_method || 'AI工具'}完成一个可检查的学习任务，并让学习者说明AI帮助和人工判断。`,
    '【流程】1. 用真实问题导入；2. 教师示范提示、生成或反馈；3. 学生完成任务并记录AI对话；4. 核查事实与偏差；5. 修改作品并反思。',
    '【产出】学习作品、AI使用记录和简短反思。',
    '【评价】看任务完成度、证据质量、修改过程、AI透明度和反思深度。',
    autoPublish
      ? '【注意】使用前请结合本校AI政策、学生年龄和资料私隐要求调整。'
      : '【注意】候选案例需人工审核来源与课堂场景后再上线。',
  ].join('\\n');
}

function inferEducationLevel(text) {
  const lower = text.toLowerCase();
  if (/(primary|elementary|小学|小學)/i.test(lower)) return '小学';
  if (/(middle school|junior|初中)/i.test(lower)) return '初中';
  if (/(high school|secondary|高中|中学|中學)/i.test(lower)) return '中学';
  if (/(university|college|higher education|大学|大學|高校)/i.test(lower)) return '大学';
  if (/(teacher|educator|教师|教師)/i.test(lower)) return '教师教育';
  return '混合';
}

function inferRegion(text, fallback) {
  if (/(hong kong|香港)/i.test(text)) return '香港';
  if (/(china|mainland|中国|中國|内地|內地)/i.test(text)) return '中国内地';
  if (/(taiwan|台湾|台灣)/i.test(text)) return '台湾';
  if (/(macau|macao|澳门|澳門)/i.test(text)) return '澳门';
  if (/(united kingdom|uk|britain|英国|英國)/i.test(text)) return '英国';
  if (/(australia|澳大利亚|澳洲)/i.test(text)) return '澳大利亚';
  if (/(canada|加拿大)/i.test(text)) return '加拿大';
  if (/(singapore|新加坡)/i.test(text)) return '新加坡';
  return fallback;
}

function inferLanguage(text) {
  if (/[\u4e00-\u9fff]/.test(text)) {
    if (/(學|習|課|教師|學生|評|臺|台灣|香港|澳門)/.test(text)) {
      return '繁体中文';
    }
    return '简体中文';
  }
  return '英文';
}

function inferMethod(text) {
  const lower = text.toLowerCase();
  if (/(chatgpt|chatbot|聊天机器人|聊天機器人)/i.test(lower)) return 'Chatbot';
  if (/(generative|生成式|大模型|llm|large language model)/i.test(lower)) return 'Generative AI';
  if (/(image|visual|图像|圖像|影像)/i.test(lower)) return 'Image Generation';
  if (/(robot|robotics|机器人|機器人)/i.test(lower)) return 'Robotics';
  if (/(feedback|rubric|grading|反馈|回饋|评分|評分)/i.test(lower)) return 'Writing Feedback';
  if (/(coding|programming|code|编程|程式)/i.test(lower)) return 'Coding Assistant';
  if (/(adaptive|personalized|個人化|个性化|自适应|自適應)/i.test(lower)) return 'Adaptive Learning';
  return 'Generative AI';
}

function createCaseIdFactory(cases) {
  let max = 0;
  for (const item of cases) {
    const match = String(item.id).match(/^case-(\d+)$/);
    if (match) {
      max = Math.max(max, Number(match[1]));
    }
  }

  return () => {
    max += 1;
    return `case-${String(max).padStart(3, '0')}`;
  };
}

function createCandidateIdFactory(candidates) {
  let max = 0;
  for (const candidate of candidates) {
    const match = String(candidate.id).match(/^candidate-(\d+)$/);
    if (match) {
      max = Math.max(max, Number(match[1]));
    }
  }

  return () => {
    max += 1;
    return `candidate-${String(max).padStart(3, '0')}`;
  };
}

function normalizeDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value.trim().slice(0, 10);
  }
  return date.toISOString().slice(0, 10);
}

function todayInHongKong() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Hong_Kong',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function truncate(value, maxLength) {
  const clean = String(value).replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength - 1)}…`;
}

async function writeSummary({ newCandidates, newPublished, newReview, feedReports, enrichmentState }) {
  const lines = [
    `# Daily AIED ${AUTO_PUBLISH_CASES ? 'Case' : 'Candidate'} Update`,
    '',
    `Run date: ${todayInHongKong()} HKT`,
    '',
    `New matches: ${newCandidates.length}`,
    `Published automatically (minimum score ${AUTO_PUBLISH_MIN_SCORE}): ${newPublished.length}`,
    `Held in candidate pool: ${newReview.length}`,
    '',
    '## Crawler enrichment',
    '',
    `- Article pages checked: ${enrichmentState.articleAttempts}`,
    `- Readable HTML pages extracted: ${enrichmentState.articleHtmlExtracted}`,
    `- Firecrawl calls used: ${enrichmentState.firecrawlCalls}`,
    `- Firecrawl scrape successes: ${enrichmentState.firecrawlScrapes}`,
    `- Firecrawl search queries: ${enrichmentState.firecrawlSearchQueries}`,
    `- Firecrawl search results read: ${enrichmentState.firecrawlSearchResults}`,
    `- Article enrichment failures: ${enrichmentState.articleFailed}`,
    enrichmentState.firecrawlDisabledReason
      ? `- Firecrawl status: ${enrichmentState.firecrawlDisabledReason}`
      : '- Firecrawl status: available or not needed',
    '',
    '## Feed report',
    '',
    ...feedReports,
    '',
  ];

  if (newCandidates.length > 0) {
    lines.push('## Review checklist', '');
    if (AUTO_PUBLISH_CASES) {
      lines.push(`- Records scoring ${AUTO_PUBLISH_MIN_SCORE} or above were appended to \`data/cases.csv\`.`);
      lines.push('- The default minimum is 0, so matched teaching-practice records publish directly and remain distinguishable by quality and verification labels.');
      lines.push('- Set `AUTO_PUBLISH_MIN_SCORE` above 0 only when a separate candidate pool is desired.');
      lines.push('- Quality scores reward explicit teaching goals, implementation details, outcomes evidence, limitations and credible sources.');
    } else {
      lines.push('- Confirm each source is a real classroom, course, activity, or learning task.');
      lines.push('- Replace `待审核` titles and automatic notes with polished Simplified Chinese copy.');
      lines.push('- Move approved rows from `data/candidate_cases.csv` into `data/cases.csv`.');
      lines.push('- Remove rejected candidate rows before merging.');
    }
    lines.push('');
    lines.push('## New match links', '');
    for (const candidate of newCandidates) {
      const destination = newPublished.includes(candidate) ? 'published' : 'candidate';
      lines.push(`- [${destination}; score ${candidate.quality_score}] ${candidate.title_original}: ${candidate.source_url}`);
    }
  } else {
    lines.push(`No new ${AUTO_PUBLISH_CASES ? 'published' : 'candidate'} cases matched the filters.`);
  }

  await mkdir(dirname(SUMMARY_PATH), { recursive: true });
  await writeFile(SUMMARY_PATH, `${lines.join('\n')}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
