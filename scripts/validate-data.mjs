import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { CASE_FIELDS, PROMPT_FIELDS, RESOURCE_FIELDS, parseCsv } from './csv-utils.mjs';
import {
  LINK_STATUSES,
  QUALITY_LABEL_SET,
  canonicalizeUrl,
  containsEmailAddress,
  duplicateKey,
  titleFingerprint,
} from './data-quality.mjs';

const categories = new Set([
  'AI Literacy',
  'AI+STEM',
  'AI+Humanities',
  'AI+Social Sciences',
  'AI for Teaching & Assessment',
]);
const credibilityLabels = new Set(['官方/学校', '论文/研究', '教师实践', '媒体报道']);
const resourceTypes = new Set([
  '课程/教材',
  '教师指南',
  '政策框架',
  '课堂工具包',
  '学生课程',
  '资源目录',
  '研究报告',
]);
const accessTypes = new Set(['免费', '需注册', '付费/订阅', '未知']);
const promptTypes = new Set([
  '备课设计',
  '教材生成',
  '练习与作业',
  '评价反馈',
  '差异化支持',
  '项目学习',
  '课堂活动',
  '家校沟通',
  '学生支持',
]);
const evidenceStrengths = new Set(['强', '中等', '初步', '实践框架', '未评级']);
const datePattern = /^\d{4}(?:-\d{2}(?:-\d{2})?)?$/;
let failures = 0;
const recordsByFile = new Map();

const datasetConfigs = [
  {
    file: 'data/cases.csv',
    fields: CASE_FIELDS,
    required: CASE_FIELDS.filter((field) => !['last_verified_date', 'http_status', 'redirect_url'].includes(field)),
    type: 'case',
  },
  {
    file: 'data/candidate_cases.csv',
    fields: CASE_FIELDS,
    required: CASE_FIELDS.filter((field) => !['last_verified_date', 'http_status', 'redirect_url'].includes(field)),
    type: 'case',
  },
  {
    file: 'data/resources.csv',
    fields: RESOURCE_FIELDS,
    required: RESOURCE_FIELDS.filter((field) => !['last_verified_date', 'http_status', 'redirect_url'].includes(field)),
    type: 'resource',
  },
  {
    file: 'data/prompts.csv',
    fields: PROMPT_FIELDS,
    required: PROMPT_FIELDS.filter((field) => !['last_verified_date', 'http_status', 'redirect_url'].includes(field)),
    type: 'prompt',
  },
];

for (const config of datasetConfigs) {
  const records = await readCsvFile(config);
  recordsByFile.set(config.file, records);
  validateRecords(config, records);
}

await validateLearningPaths();

if (failures > 0) {
  console.error(`${failures} validation failure(s).`);
  process.exitCode = 1;
}

async function readCsvFile(config) {
  if (!existsSync(config.file)) {
    fail(`${config.file} does not exist.`);
    return [];
  }
  const text = await readFile(config.file, 'utf8');
  const header = text.split(/\r?\n/, 1)[0].split(',').map((cell) => cell.replace(/^"|"$/g, ''));
  if (header.join('|') !== config.fields.join('|')) fail(`${config.file} has an unexpected header.`);
  return parseCsv(text);
}

function validateRecords(config, records) {
  const ids = new Set();
  const duplicateKeys = new Map();
  const titleKeys = new Map();
  let repeatedUrls = 0;
  const urls = new Set();

  records.forEach((record, index) => {
    const label = `${config.file} row ${index + 2}`;
    const missing = config.required.filter((field) => !String(record[field] || '').trim());
    if (missing.length > 0) fail(`${label} is missing: ${missing.join(', ')}`);
    if (Object.values(record).some((value) => containsEmailAddress(value))) {
      fail(`${label} contains an email address.`);
    }

    if (ids.has(record.id)) fail(`${label} duplicates id ${record.id}.`);
    ids.add(record.id);

    if (!/^https?:\/\//.test(record.source_url || '')) fail(`${label} has invalid source_url ${record.source_url}.`);
    if (record.canonical_url !== canonicalizeUrl(record.canonical_url)) {
      fail(`${label} has non-canonical canonical_url ${record.canonical_url}.`);
    }
    if (urls.has(record.source_url)) repeatedUrls += 1;
    urls.add(record.source_url);

    const key = duplicateKey(record);
    if (key && duplicateKeys.has(key)) fail(`${label} duplicates ${duplicateKeys.get(key)} by canonical URL and title.`);
    if (key) duplicateKeys.set(key, record.id);

    const titleKey = titleFingerprint(record.title_original || record.title_cn);
    if (titleKey.length >= 16 && titleKeys.has(titleKey)) {
      fail(`${label} duplicates title from ${titleKeys.get(titleKey)}.`);
    }
    if (titleKey.length >= 16) titleKeys.set(titleKey, record.id);

    if (record.category && !categories.has(record.category)) fail(`${label} has unsupported category ${record.category}.`);
    if (!LINK_STATUSES.has(record.link_status)) fail(`${label} has unsupported link_status ${record.link_status}.`);
    if (!QUALITY_LABEL_SET.has(record.quality_label)) fail(`${label} has unsupported quality_label ${record.quality_label}.`);
    const qualityScore = Number(record.quality_score);
    if (!Number.isInteger(qualityScore) || qualityScore < 0 || qualityScore > 100) {
      fail(`${label} has invalid quality_score ${record.quality_score}.`);
    }
    validateDate(label, 'published_date', record.published_date, config.type === 'prompt');
    validateDate(label, 'accessed_date', record.accessed_date, false);
    validateDate(label, 'last_verified_date', record.last_verified_date, true);

    if (config.type === 'case' && !credibilityLabels.has(record.credibility)) {
      fail(`${label} has unsupported credibility ${record.credibility}.`);
    }
    if (config.type === 'resource') {
      if (!resourceTypes.has(record.resource_type)) fail(`${label} has unsupported resource_type ${record.resource_type}.`);
      if (!accessTypes.has(record.access_type)) fail(`${label} has unsupported access_type ${record.access_type}.`);
    }
    if (config.type === 'prompt') {
      if (!promptTypes.has(record.prompt_type)) fail(`${label} has unsupported prompt_type ${record.prompt_type}.`);
      if (!evidenceStrengths.has(record.evidence_strength)) {
        fail(`${label} has unsupported evidence_strength ${record.evidence_strength}.`);
      }
    }
  });

  console.log(`${config.file}: ${records.length} row(s) validated, ${repeatedUrls} reused source URL(s).`);
}

function validateDate(label, field, value, optional) {
  if (!value && optional) return;
  if (value && !datePattern.test(value)) fail(`${label} has invalid ${field} ${value}.`);
}

async function validateLearningPaths() {
  const file = 'data/learning_paths.json';
  if (!existsSync(file)) {
    fail(`${file} does not exist.`);
    return;
  }

  let paths;
  try {
    paths = JSON.parse(await readFile(file, 'utf8'));
  } catch (error) {
    fail(`${file} is not valid JSON: ${error.message}`);
    return;
  }

  if (!Array.isArray(paths) || paths.length === 0) {
    fail(`${file} must contain at least one learning path.`);
    return;
  }

  const references = {
    case: new Set((recordsByFile.get('data/cases.csv') || []).map((record) => record.id)),
    resource: new Set((recordsByFile.get('data/resources.csv') || []).map((record) => record.id)),
    prompt: new Set((recordsByFile.get('data/prompts.csv') || []).map((record) => record.id)),
  };
  const pathIds = new Set();

  paths.forEach((path, index) => {
    const label = `${file} item ${index + 1}`;
    for (const field of ['id', 'title_cn', 'title_en', 'duration', 'audience', 'description_cn', 'outcome_cn']) {
      if (!String(path[field] || '').trim()) fail(`${label} is missing ${field}.`);
    }
    if (pathIds.has(path.id)) fail(`${label} duplicates path id ${path.id}.`);
    pathIds.add(path.id);
    if (!Array.isArray(path.steps) || path.steps.length < 2) {
      fail(`${label} must contain at least two linked steps.`);
      return;
    }

    path.steps.forEach((step, stepIndex) => {
      const stepLabel = `${label} step ${stepIndex + 1}`;
      if (!references[step.type]) {
        fail(`${stepLabel} has unsupported type ${step.type}.`);
        return;
      }
      if (!references[step.type].has(step.id)) fail(`${stepLabel} references missing ${step.type} ${step.id}.`);
      if (!String(step.action_cn || '').trim()) fail(`${stepLabel} is missing action_cn.`);
    });
  });

  console.log(`${file}: ${paths.length} learning path(s) validated.`);
}

function fail(message) {
  console.error(message);
  failures += 1;
}
