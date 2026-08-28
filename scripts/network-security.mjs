const MAX_REDIRECTS = 5;
export const MAX_SOURCE_RESPONSE_BYTES = 8 * 1024 * 1024;
export const MAX_FIRECRAWL_RESPONSE_BYTES = 4 * 1024 * 1024;

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
