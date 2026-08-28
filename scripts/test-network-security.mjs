import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MAX_FIRECRAWL_RESPONSE_BYTES,
  isPublicIpAddress,
  readBoundedResponseText,
  requestPublicUrlStatus,
  resolvePublicAddress,
  safePublicRequestUrl,
  safeTrustedSourceUrl,
  trustedRedirectTarget,
  validateFirecrawlApiBase,
} from './network-security.mjs';
import { EventEmitter } from 'node:events';

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

test('public link targets reject local names, private ranges, credentials, and custom ports', () => {
  assert.equal(safePublicRequestUrl('https://example.org/path'), 'https://example.org/path');
  assert.equal(safePublicRequestUrl('http://8.8.8.8/path'), 'http://8.8.8.8/path');
  for (const value of [
    'http://localhost/path',
    'http://localhost./path',
    'http://service.internal/path',
    'http://127.0.0.1/path',
    'http://2130706433/path',
    'http://169.254.169.254/latest/meta-data/',
    'http://10.0.0.1/path',
    'http://[::1]/path',
    'http://[fc00::1]/path',
    'https://user:pass@example.org/path',
    'https://example.org:8443/path',
  ]) {
    assert.equal(safePublicRequestUrl(value), '', value);
  }
});

test('public IP checks reject private, reserved, and IPv4-mapped IPv6 addresses', () => {
  assert.equal(isPublicIpAddress('8.8.8.8'), true);
  assert.equal(isPublicIpAddress('2606:4700:4700::1111'), true);
  for (const address of [
    '0.0.0.0',
    '100.64.0.1',
    '192.0.2.1',
    '198.51.100.1',
    '203.0.113.1',
    '224.0.0.1',
    '::1',
    '2001:db8::1',
    'fe80::1',
    '::ffff:127.0.0.1',
  ]) {
    assert.equal(isPublicIpAddress(address), false, address);
  }
});

test('DNS validation rejects any host answer containing a non-public address', async () => {
  assert.deepEqual(
    await resolvePublicAddress('https://example.org', async () => [{ address: '93.184.216.34', family: 4 }]),
    { address: '93.184.216.34', family: 4 },
  );
  await assert.rejects(
    resolvePublicAddress('https://example.org', async () => [
      { address: '93.184.216.34', family: 4 },
      { address: '127.0.0.1', family: 4 },
    ]),
    /private, local, reserved, or invalid/,
  );
});

test('link checker validates every redirect before issuing the next request', async () => {
  const calls = [];
  const requestImpl = fakeRequestFactory([
    { statusCode: 302, location: 'http://127.0.0.1/private' },
  ], calls);
  await assert.rejects(
    requestPublicUrlStatus('https://example.org/start', {
      resolver: async () => [{ address: '93.184.216.34', family: 4 }],
      httpsRequestImpl: requestImpl,
    }),
    /Redirect target is not a safe public/,
  );
  assert.equal(calls.length, 1);
});

test('link checker pins validated public addresses across bounded redirects', async () => {
  const calls = [];
  const requestImpl = fakeRequestFactory([
    { statusCode: 302, location: 'https://www.example.org/final' },
    { statusCode: 204 },
  ], calls);
  const result = await requestPublicUrlStatus('https://example.org/start', {
    resolver: async () => [{ address: '93.184.216.34', family: 4 }],
    httpsRequestImpl: requestImpl,
  });
  assert.deepEqual(result, { statusCode: 204, finalUrl: 'https://www.example.org/final' });
  assert.equal(calls.length, 2);
  for (const call of calls) {
    const pinned = await new Promise((resolve, reject) => {
      call.options.lookup('example.org', {}, (error, address, family) => {
        if (error) reject(error);
        else resolve({ address, family });
      });
    });
    assert.deepEqual(pinned, { address: '93.184.216.34', family: 4 });
  }
});

function fakeRequestFactory(responses, calls) {
  return (url, options, onResponse) => {
    const request = new EventEmitter();
    request.setTimeout = () => request;
    request.destroy = (error) => {
      if (error) queueMicrotask(() => request.emit('error', error));
    };
    request.end = () => {
      const next = responses.shift();
      if (!next) throw new Error('Unexpected request.');
      calls.push({ url: url.href, options });
      queueMicrotask(() => {
        onResponse({
          destroy() {},
          headers: { location: next.location || '' },
          statusCode: next.statusCode,
        });
      });
    };
    return request;
  };
}
