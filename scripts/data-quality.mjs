const TRACKING_PARAMS = new Set([
  'fbclid',
  'gclid',
  'mc_cid',
  'mc_eid',
  'ref',
  'source',
  'utm_campaign',
  'utm_content',
  'utm_medium',
  'utm_source',
  'utm_term',
]);

const QUALITY_LABELS = [
  [85, '高质量'],
  [70, '资料完整'],
  [55, '基本可用'],
  [0, '资料不完整'],
];

const PROMPT_DOMAIN_BY_TYPE = {
  '备课设计': '课程设计与评价',
  '教材生成': '教材与认知支架',
  '练习与作业': '练习与学习科学',
  '评价反馈': '评价与反馈',
  '差异化支持': '包容性设计',
  '项目学习': '项目式学习',
  '课堂活动': '提问、讨论与课堂互动',
  '家校沟通': '家校沟通',
  '学生支持': '元认知与学生支持',
};

const EMAIL_ADDRESS_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;

export const LINK_STATUSES = new Set([
  'unverified',
  'ok',
  'redirected',
  'blocked',
  'broken',
  'error',
]);

export const QUALITY_LABEL_SET = new Set(QUALITY_LABELS.map(([, label]) => label));

export function safeHttpUrl(value) {
  const source = String(value || '').trim();
  if (!source || source.length > 4096 || /[\u0000-\u001f\u007f\\]/u.test(source)) return '';

  try {
    const url = new URL(source);
    if (!['http:', 'https:'].includes(url.protocol)) return '';
    if (!url.hostname || url.username || url.password) return '';
    return url.href;
  } catch {
    return '';
  }
}

export function canonicalizeUrl(value) {
  const source = safeHttpUrl(value);
  if (!source) return '';

  const url = new URL(source);
  url.hash = '';
  url.hostname = url.hostname.toLowerCase().replace(/^www\./, '');
  for (const name of [...url.searchParams.keys()]) {
    if (TRACKING_PARAMS.has(name.toLowerCase()) || name.toLowerCase().startsWith('utm_')) {
      url.searchParams.delete(name);
    }
  }
  url.searchParams.sort();
  if (url.pathname !== '/') url.pathname = url.pathname.replace(/\/+$/, '');
  return url.toString().replace(/\?$/, '');
}

export function titleFingerprint(value) {
  return String(value || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/^(自动收录|自动候选|待审核)[:：]\s*/u, '')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/[^\p{L}\p{N}]+/gu, '');
}

export function duplicateKey(record) {
  const title = titleFingerprint(record.title_original || record.title_cn);
  const canonical = canonicalizeUrl(record.canonical_url || record.source_url);
  return title.length >= 8 && canonical ? `${title}|${canonical}` : '';
}

export function qualityLabel(score) {
  const numeric = Number(score) || 0;
  return QUALITY_LABELS.find(([threshold]) => numeric >= threshold)?.[1] || '资料不完整';
}

export function containsEmailAddress(value) {
  EMAIL_ADDRESS_PATTERN.lastIndex = 0;
  return EMAIL_ADDRESS_PATTERN.test(String(value || ''));
}

export function redactEmailAddresses(value) {
  EMAIL_ADDRESS_PATTERN.lastIndex = 0;
  return String(value || '').replace(EMAIL_ADDRESS_PATTERN, '[email removed]');
}

export function sanitizePublicRecord(record) {
  const sanitized = Object.fromEntries(
    Object.entries(record).map(([field, value]) => [
      field,
      typeof value === 'string' ? redactEmailAddresses(value) : value,
    ]),
  );
  for (const field of ['source_url', 'canonical_url', 'redirect_url']) {
    if (field in sanitized) sanitized[field] = safeHttpUrl(sanitized[field]);
  }
  return sanitized;
}

export function enrichCaseRecord(record) {
  const source = sanitizePublicRecord(record);
  const subject = source.subject || source.subcategory || source.category || '相关主题';
  const method = source.ai_tool_or_method || 'AI 工具或方法';
  const summary = cleanText(source.summary_cn);
  const workflow = cleanText(source.workflow_cn);

  source.canonical_url = canonicalizeUrl(source.canonical_url || source.source_url);
  source.teaching_goal_cn = cleanText(source.teaching_goal_cn) ||
    `围绕${subject}设计一个可观察、可检查的 AI 辅助学习任务。`;
  source.implementation_cn = cleanText(source.implementation_cn) || implementationFromWorkflow(workflow, method);
  source.outcomes_cn = cleanText(source.outcomes_cn) ||
    '来源页面未提供可核实的学习成效数据；使用时应自行收集学生作品、过程记录或评价结果。';
  source.limitations_cn = cleanText(source.limitations_cn) ||
    '需结合学生年龄、课程目标、本校 AI 政策、资料私隐和工具可用性调整，不应把 AI 输出直接视为正确答案。';
  source.last_verified_date = cleanText(source.last_verified_date);
  source.link_status = LINK_STATUSES.has(source.link_status) ? source.link_status : 'unverified';
  source.http_status = cleanText(source.http_status);
  source.redirect_url = canonicalizeUrl(source.redirect_url);
  source.summary_cn = summary;
  source.workflow_cn = repairWorkflowOutput(workflow, source);

  const score = scoreCase(source);
  source.quality_score = String(score);
  source.quality_label = qualityLabel(score);
  return source;
}

export function enrichResourceRecord(record) {
  const source = sanitizePublicRecord(record);
  source.canonical_url = canonicalizeUrl(source.canonical_url || source.source_url);
  source.last_verified_date = cleanText(source.last_verified_date);
  source.link_status = LINK_STATUSES.has(source.link_status) ? source.link_status : 'unverified';
  source.http_status = cleanText(source.http_status);
  source.redirect_url = canonicalizeUrl(source.redirect_url);
  const score = scoreResource(source);
  source.quality_score = String(score);
  source.quality_label = qualityLabel(score);
  return source;
}

export function enrichPromptRecord(record) {
  const source = sanitizePublicRecord(record);
  const variables = extractPromptVariables(source.prompt_cn);

  source.skill_domain = cleanText(source.skill_domain) || PROMPT_DOMAIN_BY_TYPE[source.prompt_type] || '教学设计';
  source.required_inputs = cleanText(source.required_inputs) || variables.join('；') || '教学主题；学段；学习目标';
  source.optional_inputs = cleanText(source.optional_inputs) || '学生已有基础；可用设备；课堂时间；本校要求';
  source.output_schema = cleanText(source.output_schema) || outputSchemaFor(source);
  source.evidence_strength = cleanText(source.evidence_strength) || '实践框架';
  source.evidence_sources = cleanText(source.evidence_sources) || source.source_title || '未单独标注研究证据';
  source.limitations_cn = cleanText(source.limitations_cn) || limitationForPrompt(source);
  source.next_steps = cleanText(source.next_steps) || nextStepsForPrompt(source);
  source.tested_models = cleanText(source.tested_models) || source.ai_tool_or_method || '通用生成式 AI（尚未逐模型验证）';
  source.verification_checklist = cleanText(source.verification_checklist) || checklistForPrompt(source);
  source.privacy_note = cleanText(source.privacy_note) ||
    '不要输入学生真实姓名、联系方式、健康资料、成绩明细或其他可识别个人资料；必要时先匿名化。';
  source.version = cleanText(source.version) || '1.0';
  source.canonical_url = canonicalizeUrl(source.canonical_url || source.source_url);
  source.last_verified_date = cleanText(source.last_verified_date);
  source.link_status = LINK_STATUSES.has(source.link_status) ? source.link_status : 'unverified';
  source.http_status = cleanText(source.http_status);
  source.redirect_url = canonicalizeUrl(source.redirect_url);

  const score = scorePrompt(source);
  source.quality_score = String(score);
  source.quality_label = qualityLabel(score);
  return source;
}

export function scoreCase(record) {
  let score = 0;
  const automaticallyCollected = /^自动收录[:：]/.test(record.summary_cn || '');
  score += boundedTextScore(record.title_original || record.title_cn, 8, 5);
  score += boundedTextScore(record.summary_cn, 180, 16);
  score += boundedTextScore(record.workflow_cn, 260, 18);
  score += boundedTextScore(record.teaching_goal_cn, 55, 8);
  score += boundedTextScore(record.implementation_cn, 120, 12);
  score += boundedTextScore(record.limitations_cn, 80, 7);
  if (record.outcomes_cn && !/(未提供|未报告|无法核实|尚无)/.test(record.outcomes_cn)) score += 10;
  else if (record.outcomes_cn) score += 2;
  score += {
    '官方/学校': 12,
    '论文/研究': 12,
    '教师实践': 9,
    '媒体报道': 6,
  }[record.credibility] || 2;
  if (/^https?:\/\//.test(record.source_url || '')) score += 4;
  if (/^\d{4}/.test(record.published_date || '')) score += 3;
  if (automaticallyCollected) score -= 15;
  return Math.min(100, Math.round(score));
}

export function scoreResource(record) {
  let score = 8;
  score += boundedTextScore(record.summary_cn, 180, 22);
  score += boundedTextScore(record.use_case_cn, 140, 20);
  score += boundedTextScore(record.publisher, 24, 8);
  score += boundedTextScore(record.subject, 24, 6);
  if (/^https?:\/\//.test(record.source_url || '')) score += 12;
  if (/^\d{4}/.test(record.published_date || '')) score += 6;
  if (record.access_type && record.access_type !== '未知') score += 8;
  if (record.region) score += 5;
  return Math.min(100, Math.round(score));
}

export function scorePrompt(record) {
  let score = 0;
  score += boundedTextScore(record.prompt_cn, 500, 24);
  score += boundedTextScore(record.use_case_cn, 90, 8);
  score += boundedTextScore(record.required_inputs, 45, 9);
  score += boundedTextScore(record.output_schema, 80, 9);
  score += boundedTextScore(record.limitations_cn, 70, 8);
  score += boundedTextScore(record.next_steps, 55, 6);
  score += boundedTextScore(record.verification_checklist, 85, 9);
  score += boundedTextScore(record.privacy_note, 55, 6);
  score += boundedTextScore(record.evidence_sources, 30, 7);
  if (record.skill_domain) score += 4;
  if (record.version) score += 3;
  if (/^https?:\/\//.test(record.source_url || '')) score += 7;
  return Math.min(100, Math.round(score));
}

export function extractPromptVariables(prompt) {
  const values = new Set();
  const text = String(prompt || '');
  for (const match of text.matchAll(/\[([^\]\n]{1,50})\]/g)) values.add(match[1].trim());
  for (const match of text.matchAll(/\{\{([^}\n]{1,50})\}\}/g)) values.add(match[1].trim());
  return [...values].filter(Boolean);
}

function cleanText(value) {
  return String(value || '').replace(/\r\n/g, '\n').trim();
}

function boundedTextScore(value, targetLength, maxScore) {
  const length = cleanText(value).length;
  if (!length) return 0;
  return Math.min(maxScore, (length / targetLength) * maxScore);
}

function implementationFromWorkflow(workflow, method) {
  const flowLine = workflow
    .split('\n')
    .find((line) => /【流程】|流程[:：]|步骤[:：]/.test(line));
  if (flowLine) return flowLine.replace(/^.*?(【流程】|流程[:：]|步骤[:：])\s*/, '');
  return `教师先示范${method}的有限用途，学生完成一个具体任务并保存过程记录，再核查 AI 输出、修改作品并反思人工判断。`;
}

function repairWorkflowOutput(workflow, record) {
  if (!workflow || !/【产出】/.test(workflow)) return workflow;
  const output = outputForCase(record);
  return workflow.replace(/【产出】[^\n]*/u, `【产出】${output}`);
}

function outputForCase(record) {
  const category = record.category || '';
  const subcategory = record.subcategory || '';
  const subject = record.subject || '';
  const text = `${subcategory} ${subject}`.toLowerCase();

  if (category === 'AI Literacy') return '一份 AI 输出核查记录、学习作品和人工判断反思。';
  if (category === 'AI for Teaching & Assessment') return '一份教师审阅后的教案、反馈表、评价量规或分层材料。';
  if (category === 'AI+STEM') {
    if (/(coding|computer|program|编程|代码|计算思维)/i.test(text)) return '一段可运行代码、调试记录和代码说明。';
    if (/(math|数学|數學)/i.test(text)) return '一份解题过程、证据核查、错因说明和最终订正稿。';
    if (/(science|科学|科學|物理|化学|化學|生物|医学|醫學)/i.test(text)) return '一份科学解释、数据或实验记录，以及对 AI 建议的核查说明。';
    return '一个 STEM 探究原型、过程记录和基于证据的反思。';
  }
  if (category === 'AI+Humanities') {
    if (/(art|design|music|艺术|藝術|设计|設計|音乐|音樂)/i.test(text)) return '一个创意作品、提示词与版本记录，以及作者的设计说明。';
    return '一份带有来源证据、修改记录和 AI 使用说明的阅读、写作或人文作品。';
  }
  if (category === 'AI+Social Sciences') return '一份资料来源表、证据分析、观点作品和 AI 使用反思。';
  return '一份学习作品、AI 对话或过程记录，以及简短反思。';
}

function outputSchemaFor(record) {
  const output = record.output_format || '教学资源';
  return `${output}；包含目标、步骤、教师提示、学生产出、评价证据和调整建议。`;
}

function limitationForPrompt(record) {
  if (record.prompt_type === '评价反馈') {
    return 'AI 反馈只能作为教师判断的辅助，不能代替教师核对课程目标、学生实际表现和评价公平性。';
  }
  if (record.prompt_type === '学生支持' || record.prompt_type === '差异化支持') {
    return '生成结果可能简化学生差异；使用前必须由教师核对难度、语言、可访问性和标签化风险。';
  }
  return '生成结果可能出现事实错误、课程错配或不适合本班情境的活动，教师必须核对后再使用。';
}

function nextStepsForPrompt(record) {
  if (record.prompt_type === '备课设计') return '再用评价反馈模板检查目标、活动与评价是否对齐。';
  if (record.prompt_type === '教材生成') return '再生成分层版本，并用事实核查清单检查内容。';
  if (record.prompt_type === '评价反馈') return '抽样核对 AI 建议，再根据学生后续表现调整反馈。';
  return '先用一小组学生或一段材料试用，再根据结果补充约束并迭代 Prompt。';
}

function checklistForPrompt(record) {
  return [
    '事实与引用是否可核实',
    '是否符合学习目标与学段',
    '任务是否要求学生主动思考',
    '评价标准是否清楚且公平',
    '是否已经删除个人资料',
    record.prompt_type === '评价反馈' ? '教师是否保留最终评价责任' : '教师是否完成最终审阅',
  ].join('；');
}
