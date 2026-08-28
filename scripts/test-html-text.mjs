import assert from 'node:assert/strict';
import { extractReadableText } from './html-text.mjs';

const malformedClosingTag = `
  <html><body><article>
    Visible teaching case
    <script>dangerous payload</script\t\n ignored>
    <style>hidden style</style>
    <p>Useful classroom evidence</p>
  </article></body></html>
`;
const extracted = extractReadableText(malformedClosingTag);
assert.match(extracted, /Visible teaching case/);
assert.match(extracted, /Useful classroom evidence/);
assert.doesNotMatch(extracted, /dangerous payload|hidden style/);

assert.equal(
  extractReadableText('<article>&amp;#x2F; remains encoded &amp; one pass</article>'),
  '&#x2F; remains encoded & one pass',
);

console.log('HTML extraction security tests passed.');
