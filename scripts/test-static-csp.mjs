import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { parse } from 'parse5';

const files = ['index.html', 'resources.html'];
for (const directory of ['cases', 'paths', 'prompts', 'resources']) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith('.html')) {
      files.push(`${directory}/${entry.name}`);
    }
  }
}

for (const file of files) {
  const document = parse(await readFile(file, 'utf8'));
  const elements = collectElements(document);
  const cspMeta = elements.find((node) =>
    node.tagName === 'meta'
    && attribute(node, 'http-equiv').toLowerCase() === 'content-security-policy');
  const referrerMeta = elements.find((node) =>
    node.tagName === 'meta'
    && attribute(node, 'name').toLowerCase() === 'referrer');

  assert(cspMeta, `${file}: missing Content-Security-Policy meta tag`);
  assert(
    attribute(referrerMeta, 'content') === 'strict-origin-when-cross-origin',
    `${file}: missing strict referrer policy`,
  );

  const policy = attribute(cspMeta, 'content');
  for (const directive of [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "form-action 'self'",
    "script-src 'self'",
    "frame-src 'none'",
  ]) {
    assert(policy.includes(directive), `${file}: CSP missing ${directive}`);
  }

  for (const script of elements.filter((node) => node.tagName === 'script' && !attribute(node, 'src'))) {
    const content = (script.childNodes || [])
      .filter((node) => node.nodeName === '#text')
      .map((node) => node.value)
      .join('');
    const hash = `'sha256-${createHash('sha256').update(content).digest('base64')}'`;
    assert(policy.includes(hash), `${file}: CSP does not authorize inline script ${hash}`);
  }
}

console.log(`Static CSP tests passed for ${files.length} HTML files.`);

function collectElements(node, output = []) {
  if (node.tagName) output.push(node);
  for (const child of node.childNodes || []) collectElements(child, output);
  return output;
}

function attribute(node, name) {
  return node?.attrs?.find((item) => item.name.toLowerCase() === name)?.value || '';
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
