import assert from 'node:assert/strict';
import {
  canonicalizeUrl,
  containsEmailAddress,
  duplicateKey,
  enrichCaseRecord,
  enrichPromptRecord,
  enrichResourceRecord,
  extractPromptVariables,
  qualityLabel,
  redactEmailAddresses,
} from './data-quality.mjs';

assert.equal(
  canonicalizeUrl('https://www.Example.com/lesson/?utm_source=test&b=2&a=1#part'),
  'https://example.com/lesson?a=1&b=2',
);
assert.deepEqual(extractPromptVariables('为[学段]设计 {{主题}} 活动，并再次检查[学段]。'), ['学段', '主题']);
assert.equal(qualityLabel(86), '高质量');
assert.equal(qualityLabel(54), '资料不完整');
assert.equal(redactEmailAddresses('Contact researcher@example.edu for details.'), 'Contact [email removed] for details.');
assert.equal(containsEmailAddress('Contact researcher@example.edu for details.'), true);
assert.equal(containsEmailAddress('Contact [email removed] for details.'), false);

const caseRecord = enrichCaseRecord({
  id: 'case-test',
  title_original: 'A classroom AI lesson',
  title_cn: '课堂 AI 课程',
  category: 'AI Literacy',
  subject: 'AI Literacy',
  ai_tool_or_method: '生成式 AI',
  summary_cn: '学生在一节课堂活动中比较两段 AI 输出，核查事实依据并解释人工判断为何仍然必要。',
  workflow_cn: '【流程】比较输出，核查证据，修改答案。\n【产出】旧的错误产出。',
  source_url: 'https://example.com/lesson?utm_source=test',
  published_date: '2026-01-01',
  credibility: '教师实践',
});
assert.equal(caseRecord.canonical_url, 'https://example.com/lesson');
assert.equal(caseRecord.link_status, 'unverified');
assert.match(caseRecord.workflow_cn, /AI 输出核查记录/);
assert.match(caseRecord.outcomes_cn, /未提供可核实/);
assert.ok(Number(caseRecord.quality_score) > 0);

const autoCollectedCase = enrichCaseRecord({
  ...caseRecord,
  id: 'case-auto-test',
  summary_cn: `自动收录：${caseRecord.summary_cn}`,
});
assert.ok(
  Number(autoCollectedCase.quality_score) < Number(caseRecord.quality_score),
  'Automatically collected summaries should not receive the same completeness score as curated records.',
);
assert.doesNotMatch(
  enrichCaseRecord({ ...caseRecord, summary_cn: 'Contact researcher@example.edu.' }).summary_cn,
  /@/,
);

const resourceRecord = enrichResourceRecord({
  id: 'resource-test',
  title_cn: '教师指南',
  summary_cn: '面向教师的人工智能素养课程指南，包含课堂活动、伦理讨论和学习目标。',
  use_case_cn: '用于备课、工作坊设计和课程目标检查。',
  publisher: 'Example University',
  subject: 'AI Literacy',
  region: '全球',
  access_type: '免费',
  source_url: 'https://example.edu/guide',
  published_date: '2025',
});
assert.equal(resourceRecord.link_status, 'unverified');
assert.ok(Number(resourceRecord.quality_score) > 0);

const promptRecord = enrichPromptRecord({
  id: 'prompt-test',
  title_cn: '分层活动设计',
  prompt_type: '差异化支持',
  subject: 'Science',
  output_format: '分层学习单',
  ai_tool_or_method: '通用生成式 AI',
  prompt_cn: '请为[学段]学生围绕[主题]设计三层学习活动，并给出评价证据和教师检查步骤。',
  use_case_cn: '教师根据学生已有基础生成可调整的分层活动。',
  source_title: 'Teacher practice framework',
  source_url: 'https://example.org/prompt',
});
assert.equal(promptRecord.skill_domain, '包容性设计');
assert.match(promptRecord.required_inputs, /学段/);
assert.match(promptRecord.privacy_note, /个人资料/);
assert.ok(Number(promptRecord.quality_score) > 0);
assert.equal(
  duplicateKey({ title_original: 'A classroom AI lesson', source_url: 'https://example.com/lesson?ref=x' }),
  duplicateKey({ title_original: 'A Classroom AI Lesson', source_url: 'https://www.example.com/lesson' }),
);

console.log('Data quality unit tests passed.');
