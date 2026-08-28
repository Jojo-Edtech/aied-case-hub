import { parse } from 'parse5';

const IGNORED_ELEMENTS = new Set(['script', 'style', 'noscript', 'svg']);
const PREFERRED_ELEMENTS = new Set(['article', 'main']);

function findElements(node, names, matches = []) {
  if (names.has(node.nodeName)) matches.push(node);
  for (const child of node.childNodes || []) findElements(child, names, matches);
  return matches;
}

function textContent(node) {
  if (node.nodeName === '#text') return node.value || '';
  if (IGNORED_ELEMENTS.has(node.nodeName)) return '';
  return (node.childNodes || []).map(textContent).join(' ');
}

function cleanText(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function removeCommonBoilerplate(text) {
  return text
    .replace(/\b(subscribe|sign up|cookie policy|privacy policy|terms of use|advertisement)\b/gi, ' ')
    .replace(/\b(accept all cookies|manage cookies|skip to content|share this article)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractReadableText(html) {
  const document = parse(String(html || ''));
  const preferred = findElements(document, PREFERRED_ELEMENTS);
  const body = findElements(document, new Set(['body']))[0];
  const candidates = preferred.length > 0 ? preferred : [body || document];
  const text = candidates
    .map((candidate) => cleanText(textContent(candidate)))
    .reduce((longest, candidate) => candidate.length > longest.length ? candidate : longest, '');
  return removeCommonBoilerplate(text);
}
