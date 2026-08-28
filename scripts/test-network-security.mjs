import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MAX_FIRECRAWL_RESPONSE_BYTES,
  readBoundedResponseText,
  safeTrustedSourceUrl,
  trustedRedirectTarget,
  validateFirecrawlApiBase,
} from './network-security.mjs';

test('trusted source URLs require HTTPS and an allowlisted source root', () => {
  assert.equal(safeTrustedSourceUrl('https://www.edsurge.com/articles_rss'), 'https://www.edsurge.com/articles_rss');
  assert.equal(
    safeTrustedSourceUrl('https://www.microsoft.com/en-us/education/blog/feed/'),
    'https://www.microsoft.com/en-us/education/blog/feed/',
  );
  for (const value of [
    'http://www.edsurge.com/articles_rss',
    'https://edsurge.com.evil.example/feed',
    'https://user:pass@www.edsurge.com/feed',
    'https://127.0.0.1/feed',
    'https://169.254.169.254/latest/meta-data/',
    'https://microsoft.com.evil.example/feed',
  ]) {
    assert.equal(safeTrustedSourceUrl(value), '');
  }
});

test('redirects remain within the original trusted source root', () => {
  assert.equal(
    trustedRedirectTarget('https://www.edsurge.com/feed', 'https://feeds.edsurge.com/latest'),
    'https://feeds.edsurge.com/latest',
  );
  assert.equal(
    trustedRedirectTarget('https://www.edsurge.com/feed', 'https://www.microsoft.com/en-us/education/blog/feed/'),
    '',
  );
});

test('Firecrawl authorization is bound to the exact official API base', () => {
  assert.equal(validateFirecrawlApiBase('https://api.firecrawl.dev/v2/'), 'https://api.firecrawl.dev/v2');
  for (const value of [
    'http://api.firecrawl.dev/v2',
    'https://api.firecrawl.dev.evil.example/v2',
    'https://user:pass@api.firecrawl.dev/v2',
    'https://api.firecrawl.dev/v1',
    'https://api.firecrawl.dev/v2?next=evil',
  ]) {
    assert.throws(() => validateFirecrawlApiBase(value));
  }
});

test('response text is bounded by declared and streamed byte length', async () => {
  assert.equal(await readBoundedResponseText(new Response('ok'), 2), 'ok');
  await assert.rejects(
    readBoundedResponseText(
      new Response('', { headers: { 'content-length': String(MAX_FIRECRAWL_RESPONSE_BYTES + 1) } }),
      MAX_FIRECRAWL_RESPONSE_BYTES,
    ),
  );
  await assert.rejects(readBoundedResponseText(new Response('abc'), 2));
});
