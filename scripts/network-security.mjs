import { lookup as dnsLookup } from 'node:dns/promises';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { BlockList, isIP } from 'node:net';

const MAX_REDIRECTS = 5;
export const MAX_SOURCE_RESPONSE_BYTES = 8 * 1024 * 1024;
export const MAX_FIRECRAWL_RESPONSE_BYTES = 4 * 1024 * 1024;

const BLOCKED_IP_RANGES = new BlockList();
for (const [network, prefix] of [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.88.99.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
]) {
  BLOCKED_IP_RANGES.addSubnet(network, prefix, 'ipv4');
}
for (const [network, prefix] of [
  ['::', 128],
  ['::1', 128],
  ['100::', 64],
  ['2001:2::', 48],
  ['2001:10::', 28],
  ['2001:20::', 28],
  ['2001:db8::', 32],
  ['fc00::', 7],
  ['fe80::', 10],
  ['fec0::', 10],
  ['ff00::', 8],
]) {
  BLOCKED_IP_RANGES.addSubnet(network, prefix, 'ipv6');
}

const LOCAL_HOST_SUFFIXES = [
  '.arpa',
  '.example',
  '.home',
  '.internal',
  '.invalid',
  '.lan',
  '.local',
  '.localhost',
  '.onion',
  '.test',
];

const TRUSTED_SOURCE_ROOTS = [
  'ai4k12.org',
  'aiforeducation.io',
  'blog.google',
  'microsoft.com',
  'edsurge.com',
  'educause.edu',
  'eschoolnews.com',
  'facultyfocus.com',
  'insidehighered.com',
  'techlearning.com',
  'the74million.org',
  'youtube.com',
];

function hostnameMatchesRoot(hostname, root) {
  return hostname === root || hostname.endsWith(`.${root}`);
}

export function trustedSourceRoot(value) {
  const url = safeHttpsUrl(value);
  if (!url) return '';
  return TRUSTED_SOURCE_ROOTS.find((root) => hostnameMatchesRoot(url.hostname, root)) || '';
}

export function safeTrustedSourceUrl(value) {
  const url = safeHttpsUrl(value);
  return url && trustedSourceRoot(url.href) ? url.href : '';
}

export function trustedRedirectTarget(originalValue, targetValue) {
  const original = safeTrustedSourceUrl(originalValue);
  const target = safeTrustedSourceUrl(targetValue);
  if (!original || !target) return '';
  return trustedSourceRoot(original) === trustedSourceRoot(target) ? target : '';
}

export function validateFirecrawlApiBase(value) {
  const url = safeHttpsUrl(value);
  if (!url || url.origin !== 'https://api.firecrawl.dev') {
    throw new Error('FIRECRAWL_API_BASE must use the official HTTPS Firecrawl API origin.');
  }
  if (url.pathname.replace(/\/+$/, '') !== '/v2' || url.search || url.hash) {
    throw new Error('FIRECRAWL_API_BASE must be exactly https://api.firecrawl.dev/v2.');
  }
  return 'https://api.firecrawl.dev/v2';
}

export function safePublicRequestUrl(value) {
  const raw = String(value ?? '').trim();
  if (!raw || raw.length > 4096 || /[\u0000-\u001f\u007f\\]/u.test(raw)) return '';

  try {
    const url = new URL(raw);
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password || url.port) {
      return '';
    }

    const hostname = normalizeHostname(url.hostname);
    if (!hostname || hostname.length > 253) return '';
    const family = isIP(hostname);
    if (family) return isPublicIpAddress(hostname) ? url.href : '';
    if (!hostname.includes('.') || LOCAL_HOST_SUFFIXES.some((suffix) => hostname === suffix.slice(1) || hostname.endsWith(suffix))) {
      return '';
    }
    return url.href;
  } catch {
    return '';
  }
}

export function isPublicIpAddress(value) {
  const address = normalizeHostname(value);
  const family = isIP(address);
  if (!family) return false;
  if (family === 6 && address.toLowerCase().startsWith('::ffff:')) return false;
  return !BLOCKED_IP_RANGES.check(address, family === 4 ? 'ipv4' : 'ipv6');
}

export async function resolvePublicAddress(value, resolver = dnsLookup) {
  const safeUrl = safePublicRequestUrl(value);
  if (!safeUrl) throw new Error('URL is not a safe public HTTP(S) target.');

  const hostname = normalizeHostname(new URL(safeUrl).hostname);
  const family = isIP(hostname);
  if (family) return { address: hostname, family };

  const resolved = await resolver(hostname, { all: true, verbatim: true });
  const addresses = Array.isArray(resolved) ? resolved : [resolved];
  if (!addresses.length) throw new Error('Host did not resolve to a public address.');

  const normalized = addresses.map((entry) => ({
    address: String(entry?.address || ''),
    family: Number(entry?.family) || isIP(String(entry?.address || '')),
  }));
  if (normalized.some((entry) => !entry.family || !isPublicIpAddress(entry.address))) {
    throw new Error('Host resolved to a private, local, reserved, or invalid address.');
  }
  return normalized.find((entry) => entry.family === 4) || normalized[0];
}

export async function requestPublicUrlStatus(
  value,
  {
    timeoutMs = 12_000,
    maxRedirects = MAX_REDIRECTS,
    resolver = dnsLookup,
    httpRequestImpl = httpRequest,
    httpsRequestImpl = httpsRequest,
    headers = {},
  } = {},
) {
  let currentUrl = safePublicRequestUrl(value);
  if (!currentUrl) throw new Error('URL is not a safe public HTTP(S) target.');

  for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount += 1) {
    const address = await resolvePublicAddress(currentUrl, resolver);
    const url = new URL(currentUrl);
    const requestImpl = url.protocol === 'https:' ? httpsRequestImpl : httpRequestImpl;
    const result = await requestStatusOnce(url, address, {
      headers,
      requestImpl,
      timeoutMs,
    });

    if ([301, 302, 303, 307, 308].includes(result.statusCode)) {
      if (redirectCount === maxRedirects) throw new Error(`More than ${maxRedirects} redirects.`);
      if (!result.location) throw new Error('Redirect response did not include a location.');
      const target = safePublicRequestUrl(new URL(result.location, currentUrl).href);
      if (!target) throw new Error('Redirect target is not a safe public HTTP(S) URL.');
      currentUrl = target;
      continue;
    }

    return { statusCode: result.statusCode, finalUrl: currentUrl };
  }

  throw new Error(`More than ${maxRedirects} redirects.`);
}

export async function readBoundedResponseText(response, maxBytes) {
  if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) {
    throw new Error('Response byte limit must be a positive safe integer.');
  }

  const declaredLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new Error(`Response exceeds ${maxBytes} bytes.`);
  }
  if (!response.body) return '';

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const chunks = [];
  let received = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > maxBytes) {
        await reader.cancel('response too large');
        throw new Error(`Response exceeds ${maxBytes} bytes.`);
      }
      chunks.push(decoder.decode(value, { stream: true }));
    }
    chunks.push(decoder.decode());
    return chunks.join('');
  } finally {
    reader.releaseLock();
  }
}

export async function fetchTrustedText(
  value,
  {
    accept = 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
    timeoutMs = 20_000,
    maxBytes = MAX_SOURCE_RESPONSE_BYTES,
  } = {},
) {
  const originalUrl = safeTrustedSourceUrl(value);
  if (!originalUrl) throw new Error('Source URL is outside the trusted HTTPS allowlist.');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let currentUrl = originalUrl;

  try {
    for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
      const response = await fetch(currentUrl, {
        signal: controller.signal,
        redirect: 'manual',
        headers: {
          'user-agent': 'AIED Case Hub updater (https://github.com/Jojo-Edtech/aiedcase)',
          accept,
        },
      });

      if ([301, 302, 303, 307, 308].includes(response.status)) {
        if (redirectCount === MAX_REDIRECTS) throw new Error(`More than ${MAX_REDIRECTS} redirects.`);
        const location = response.headers.get('location');
        const target = location ? new URL(location, currentUrl).href : '';
        const safeTarget = trustedRedirectTarget(originalUrl, target);
        if (!safeTarget) throw new Error('Redirect left the trusted source domain.');
        currentUrl = safeTarget;
        continue;
      }

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await readBoundedResponseText(response, maxBytes);
    }
  } finally {
    clearTimeout(timeout);
  }

  throw new Error(`More than ${MAX_REDIRECTS} redirects.`);
}

function safeHttpsUrl(value) {
  const raw = String(value ?? '').trim();
  if (!raw || raw.length > 4096 || /[\u0000-\u001f\u007f\\]/u.test(raw)) return null;

  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' || !url.hostname || url.username || url.password) return null;
    return url;
  } catch {
    return null;
  }
}

function normalizeHostname(value) {
  return String(value || '')
    .trim()
    .replace(/^\[|\]$/g, '')
    .replace(/\.$/, '')
    .toLowerCase();
}

function requestStatusOnce(url, address, { headers, requestImpl, timeoutMs }) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      callback(value);
    };

    const request = requestImpl(
      url,
      {
        agent: false,
        family: address.family,
        headers,
        maxHeaderSize: 32 * 1024,
        method: 'GET',
        lookup: (_hostname, options, callback) => {
          if (options?.all) callback(null, [address]);
          else callback(null, address.address, address.family);
        },
      },
      (response) => {
        const result = {
          location: Array.isArray(response.headers.location)
            ? response.headers.location[0]
            : response.headers.location || '',
          statusCode: Number(response.statusCode) || 0,
        };
        response.destroy();
        finish(resolve, result);
      },
    );

    request.on('error', (error) => finish(reject, error));
    request.setTimeout(timeoutMs, () => {
      const error = new Error(`Request timed out after ${timeoutMs} ms.`);
      error.name = 'TimeoutError';
      request.destroy(error);
    });
    request.end();
  });
}
