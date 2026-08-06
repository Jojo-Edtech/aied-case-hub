export const CASE_FIELDS = [
  'id',
  'title_original',
  'title_cn',
  'category',
  'subcategory',
  'subject',
  'education_level',
  'language',
  'region',
  'ai_tool_or_method',
  'summary_cn',
  'teaching_goal_cn',
  'implementation_cn',
  'outcomes_cn',
  'limitations_cn',
  'workflow_cn',
  'source_type',
  'credibility',
  'source_url',
  'canonical_url',
  'published_date',
  'accessed_date',
  'last_verified_date',
  'link_status',
  'http_status',
  'redirect_url',
  'quality_score',
  'quality_label',
];

export const RESOURCE_FIELDS = [
  'id',
  'title_original',
  'title_cn',
  'resource_type',
  'category',
  'subject',
  'education_level',
  'audience',
  'language',
  'region',
  'publisher',
  'summary_cn',
  'use_case_cn',
  'source_url',
  'canonical_url',
  'published_date',
  'accessed_date',
  'last_verified_date',
  'link_status',
  'http_status',
  'redirect_url',
  'access_type',
  'quality_score',
  'quality_label',
];

export const PROMPT_FIELDS = [
  'id',
  'title_cn',
  'prompt_type',
  'skill_domain',
  'category',
  'subject',
  'education_level',
  'audience',
  'output_format',
  'ai_tool_or_method',
  'prompt_cn',
  'use_case_cn',
  'required_inputs',
  'optional_inputs',
  'output_schema',
  'evidence_strength',
  'evidence_sources',
  'limitations_cn',
  'next_steps',
  'tested_models',
  'verification_checklist',
  'privacy_note',
  'version',
  'source_title',
  'source_url',
  'canonical_url',
  'accessed_date',
  'last_verified_date',
  'link_status',
  'http_status',
  'redirect_url',
  'quality_score',
  'quality_label',
];

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = '';
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        value += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && char === ',') {
      row.push(value);
      value = '';
      continue;
    }

    if (!inQuotes && (char === '\n' || char === '\r')) {
      if (char === '\r' && next === '\n') {
        index += 1;
      }
      row.push(value);
      if (row.some((cell) => cell !== '')) {
        rows.push(row);
      }
      row = [];
      value = '';
      continue;
    }

    value += char;
  }

  if (value !== '' || row.length > 0) {
    row.push(value);
    rows.push(row);
  }

  if (rows.length === 0) {
    return [];
  }

  const headers = rows[0];
  return rows.slice(1).map((cells) => {
    const record = {};
    headers.forEach((header, index) => {
      record[header] = cells[index] ?? '';
    });
    return record;
  });
}

export function toCsv(records, fields = CASE_FIELDS) {
  const lines = [fields.map(escapeCell).join(',')];
  for (const record of records) {
    lines.push(fields.map((field) => escapeCell(record[field] ?? '')).join(','));
  }
  return `${lines.join('\n')}\n`;
}

export function escapeCell(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}
