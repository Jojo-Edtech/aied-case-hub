import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { parseCsv } from './csv-utils.mjs';

const siteBase = (process.env.SITE_BASE_URL || 'https://jojo-edtech.github.io/aiedcase').replace(/\/+$/, '');
const [cases, resources, prompts, paths] = await Promise.all([
  readCsv('data/cases.csv'),
  readCsv('data/resources.csv'),
  readCsv('data/prompts.csv'),
  readFile('data/learning_paths.json', 'utf8').then(JSON.parse),
]);

const lookups = {
  case: new Map(cases.map((item) => [item.id, item])),
  resource: new Map(resources.map((item) => [item.id, item])),
  prompt: new Map(prompts.map((item) => [item.id, item])),
};

for (const directory of ['cases', 'resources', 'prompts', 'paths']) {
  await rm(directory, { recursive: true, force: true });
  await mkdir(directory, { recursive: true });
}

await Promise.all([
  ...cases.map((item) => writeFile(`cases/${safeId(item.id)}.html`, casePage(item))),
  ...resources.map((item) => writeFile(`resources/${safeId(item.id)}.html`, resourcePage(item))),
  ...prompts.map((item) => writeFile(`prompts/${safeId(item.id)}.html`, promptPage(item))),
  ...paths.map((item) => writeFile(`paths/${safeId(item.id)}.html`, pathPage(item))),
]);

await writeFile('paths/index.html', pathIndexPage(paths));
await writeFile('sitemap.xml', sitemap(cases, resources, prompts, paths));
console.log(`Generated ${cases.length} case, ${resources.length} resource, ${prompts.length} prompt and ${paths.length} pathway page(s).`);

async function readCsv(path) {
  return parseCsv(await readFile(path, 'utf8'));
}

function casePage(item) {
  const title = item.title_cn || item.title_original;
  const url = `${siteBase}/cases/${encodeURIComponent(item.id)}.html`;
  const tags = [
    item.category,
    item.subcategory,
    item.education_level,
    item.region,
    /^自动收录[:：]/.test(item.summary_cn || '') ? '自动收集' : '',
    item.quality_label,
  ];
  const body = `
    ${hero(title, item.title_original, tags)}
    ${section('案例简介', paragraph(item.summary_cn))}
    <div class="standalone-section-grid">
      ${section('教学目标', paragraph(item.teaching_goal_cn))}
      ${section('实施方式', paragraph(item.implementation_cn))}
      ${section('学习成效证据', paragraph(item.outcomes_cn))}
      ${section('适用条件与限制', paragraph(item.limitations_cn))}
    </div>
    ${copySection('可复制工作流', item.workflow_cn, '复制工作流')}
    ${metadata([
      ['学科/主题', item.subject],
      ['AI 工具/方法', item.ai_tool_or_method],
      ['来源类型', item.source_type],
      ['可信度', item.credibility],
      ['质量评分', `${item.quality_score}/100`],
      ['原始访问日期', item.accessed_date],
      ['最近核验日期', item.last_verified_date || '尚未核验'],
      ['链接状态', linkStatus(item)],
      ['最终重定向地址', item.redirect_url],
    ])}
    ${sourceActions(item.source_url, url, '查看原始来源')}`;
  return pageTemplate({ title, description: item.summary_cn, url, typeLabel: '教学案例', body });
}

function resourcePage(item) {
  const title = item.title_cn || item.title_original;
  const url = `${siteBase}/resources/${encodeURIComponent(item.id)}.html`;
  const tags = [item.resource_type, item.category, item.education_level, item.region, item.quality_label];
  const body = `
    ${hero(title, item.title_original, tags)}
    ${section('资源简介', paragraph(item.summary_cn))}
    ${section('适用方式', paragraph(item.use_case_cn))}
    ${metadata([
      ['发布机构', item.publisher],
      ['学科/主题', item.subject],
      ['受众', item.audience],
      ['访问方式', item.access_type],
      ['质量评分', `${item.quality_score}/100`],
      ['原始访问日期', item.accessed_date],
      ['最近核验日期', item.last_verified_date || '尚未核验'],
      ['链接状态', linkStatus(item)],
      ['最终重定向地址', item.redirect_url],
    ])}
    ${sourceActions(item.source_url, url, '打开教材/资源')}`;
  return pageTemplate({ title, description: item.summary_cn, url, typeLabel: '教材资源', body });
}

function promptPage(item) {
  const title = item.title_cn;
  const url = `${siteBase}/prompts/${encodeURIComponent(item.id)}.html`;
  const tags = [item.skill_domain, item.prompt_type, item.subject, item.education_level, item.quality_label];
  const body = `
    ${hero(title, item.use_case_cn, tags)}
    <div class="standalone-section-grid">
      ${section('必填输入', paragraph(item.required_inputs))}
      ${section('可选输入', paragraph(item.optional_inputs))}
      ${section('输出结构', paragraph(item.output_schema))}
      ${section('证据等级', paragraph(`${item.evidence_strength}；${item.evidence_sources}`))}
    </div>
    ${copySection('可复制 Prompt', item.prompt_cn, '复制 Prompt')}
    <div class="standalone-section-grid">
      ${section('使用限制', paragraph(item.limitations_cn))}
      ${section('下一步', paragraph(item.next_steps))}
      ${section('生成后检查清单', list(item.verification_checklist))}
      ${section('隐私提醒', paragraph(item.privacy_note))}
    </div>
    ${metadata([
      ['适用模型', item.tested_models],
      ['预期输出', item.output_format],
      ['目标受众', item.audience],
      ['版本', item.version],
      ['质量评分', `${item.quality_score}/100`],
      ['最近核验日期', item.last_verified_date || '尚未核验'],
      ['链接状态', linkStatus(item)],
      ['最终重定向地址', item.redirect_url],
    ])}
    ${sourceActions(item.source_url, url, '查看参考来源')}`;
  return pageTemplate({ title, description: item.use_case_cn, url, typeLabel: 'Prompt 教学技能', body });
}

function pathPage(path) {
  const url = `${siteBase}/paths/${encodeURIComponent(path.id)}.html`;
  const steps = path.steps.map((step, index) => {
    const item = lookups[step.type]?.get(step.id);
    if (!item) return '';
    const detailUrl = `../${typeDirectory(step.type)}/${encodeURIComponent(item.id)}.html`;
    const title = item.title_cn || item.title_original;
    return `<li class="path-step">
      <span class="path-step-number">${index + 1}</span>
      <div><span class="tag">${escapeHtml(typeLabel(step.type))}</span><h2>${escapeHtml(title)}</h2>
      <p>${escapeHtml(step.action_cn)}</p><a class="source-link" href="${detailUrl}">打开这一步</a></div>
    </li>`;
  }).join('');
  const body = `
    ${hero(path.title_cn, path.title_en, [path.duration, path.audience, '专题路径'])}
    ${section('路径简介', paragraph(path.description_cn))}
    ${section('完成后能够', paragraph(path.outcome_cn))}
    <ol class="path-step-list">${steps}</ol>
    <div class="detail-actions detail-footer-actions"><button class="button button-secondary" data-copy-value="${escapeAttribute(url)}">复制路径链接</button></div>`;
  return pageTemplate({ title: path.title_cn, description: path.description_cn, url, typeLabel: '专题学习路径', body });
}

function pathIndexPage(paths) {
  const cards = paths.map((path) => `<article class="case-card path-index-card">
    <div class="case-topline"><span class="tag category">${escapeHtml(path.duration)}</span><span class="tag">${escapeHtml(path.audience)}</span></div>
    <h2>${escapeHtml(path.title_cn)}</h2><p class="summary">${escapeHtml(path.description_cn)}</p>
    <a class="source-link" href="${encodeURIComponent(path.id)}.html">打开学习路径</a>
  </article>`).join('');
  const body = `${hero('AI 教育专题学习路径', 'AI Education Learning Pathways', ['案例 + 教材 + Prompt'])}<div class="case-grid">${cards}</div>`;
  return pageTemplate({ title: 'AI 教育专题学习路径', description: '将案例、教材资源和 Prompt 组合成教师可直接采用的专题备课路径。', url: `${siteBase}/paths/`, typeLabel: '专题路径', body });
}

function pageTemplate({ title, description, url, typeLabel, body }) {
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeAttribute(stripText(description).slice(0, 180));
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: stripText(title),
    description: stripText(description),
    url,
    inLanguage: 'zh-CN',
    educationalUse: typeLabel,
  }).replace(/</g, '\\u003c');
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${safeTitle} | AIED Case Hub</title>
  <meta name="description" content="${safeDescription}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="AIED Case Hub">
  <meta property="og:title" content="${escapeAttribute(title)}">
  <meta property="og:description" content="${safeDescription}">
  <meta property="og:url" content="${escapeAttribute(url)}">
  <link rel="canonical" href="${escapeAttribute(url)}">
  <link rel="stylesheet" href="../styles.css">
  <script type="application/ld+json">${jsonLd}</script>
</head>
<body class="standalone-detail-page">
  <header class="detail-site-header"><a href="../index.html">AIED Case Hub</a><span>${escapeHtml(typeLabel)}</span></header>
  <main class="standalone-detail-main"><article class="standalone-detail-card">${body}</article></main>
  <footer class="detail-site-footer"><a href="../index.html">返回资料库</a><span>内容以原始来源为准</span></footer>
  <script>
    document.addEventListener('click', async (event) => {
      const button = event.target.closest('[data-copy-value], [data-copy-target]');
      if (!button) return;
      const value = button.dataset.copyValue || document.querySelector(button.dataset.copyTarget)?.textContent || '';
      await navigator.clipboard.writeText(value);
      const previous = button.textContent;
      button.textContent = '已复制';
      setTimeout(() => { button.textContent = previous; }, 1400);
    });
  </script>
</body>
</html>`;
}

function hero(title, secondary, tags) {
  return `<header class="standalone-hero"><p class="eyebrow">AI Education Library</p><h1>${escapeHtml(title)}</h1>
    ${secondary && secondary !== title ? `<p class="standalone-secondary-title">${escapeHtml(secondary)}</p>` : ''}
    <div class="case-topline">${tags.filter(Boolean).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}</div></header>`;
}

function section(title, content) {
  return `<section class="standalone-section"><h2>${escapeHtml(title)}</h2>${content}</section>`;
}

function paragraph(value) {
  return `<p>${escapeHtml(value || '未标注')}</p>`;
}

function list(value) {
  const items = String(value || '').split(/[；;\n]+/).map((item) => item.trim()).filter(Boolean);
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
}

function copySection(title, value, buttonLabel) {
  const target = 'copy-content';
  return `<section class="standalone-section copy-detail-section"><div class="workflow-header"><h2>${escapeHtml(title)}</h2>
    <button class="copy-button" data-copy-target="#${target}">${escapeHtml(buttonLabel)}</button></div><pre id="${target}">${escapeHtml(value || '')}</pre></section>`;
}

function metadata(items) {
  return `<dl class="meta-list standalone-meta">${items.filter(([, value]) => value).map(([label, value]) =>
    `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join('')}</dl>`;
}

function sourceActions(sourceUrl, pageUrl, label) {
  return `<div class="detail-actions detail-footer-actions"><a class="button button-primary" href="${escapeAttribute(sourceUrl)}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>
    <button class="button button-secondary" data-copy-value="${escapeAttribute(pageUrl)}">复制本页链接</button></div>`;
}

function linkStatus(item) {
  const labels = {
    ok: '已核验可访问',
    redirected: '已核验，来源已跳转',
    blocked: '自动检查被来源拦截',
    broken: '可能失效',
    error: '检查暂时失败',
    unverified: '尚未核验',
  };
  return `${labels[item.link_status] || labels.unverified}${item.http_status ? `（HTTP ${item.http_status}）` : ''}`;
}

function sitemap(cases, resources, prompts, paths) {
  const urls = [
    `${siteBase}/`,
    `${siteBase}/paths/`,
    ...cases.map((item) => `${siteBase}/cases/${encodeURIComponent(item.id)}.html`),
    ...resources.map((item) => `${siteBase}/resources/${encodeURIComponent(item.id)}.html`),
    ...prompts.map((item) => `${siteBase}/prompts/${encodeURIComponent(item.id)}.html`),
    ...paths.map((item) => `${siteBase}/paths/${encodeURIComponent(item.id)}.html`),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`).join('\n')}\n</urlset>\n`;
}

function typeDirectory(type) {
  return type === 'case' ? 'cases' : type === 'resource' ? 'resources' : 'prompts';
}

function typeLabel(type) {
  return type === 'case' ? '教学案例' : type === 'resource' ? '教材资源' : 'Prompt 技能';
}

function safeId(value) {
  return String(value).replace(/[^a-zA-Z0-9_-]/g, '-');
}

function stripText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/\n/g, '&#10;');
}

function escapeXml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
  })[char]);
}
