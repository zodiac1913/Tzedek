const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");

const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");

// Guards the reviewed XSS: URL/page text must never reach a live innerHTML parse.
test("Text extraction helpers parse untrusted markup inertly", () => {
  const runtime = read("src/runtime/smlCompliance.js");
  const helper = runtime.slice(runtime.indexOf("function getAriaAttributeNameFromText"));
  const helperBody = helper.slice(0, helper.indexOf("\n}\n"));
  assert.match(helperBody, /new DOMParser\(\)\.parseFromString/);
  assert.doesNotMatch(helperBody, /innerHTML/);

  const runner = read("src/runtime/smlComplianceRunner.js");
  const strip = runner.slice(runner.indexOf("function stripHtml"));
  const stripBody = strip.slice(0, strip.indexOf("\n  }\n"));
  assert.match(stripBody, /new DOMParser\(\)\.parseFromString/);
  assert.doesNotMatch(stripBody, /innerHTML/);
});

test("Standalone pages ship a same-origin script CSP", () => {
  for (const file of [
    "src/runtime/assets/issue-guide.html",
    "demo/index.html",
    "bookmarklet/compliance-bookmarklet.html",
    "extension/page/assets/issue-guide.html",
    "extension/page/index.html",
    "extension/page/compliance-bookmarklet.html"
  ]) {
    const csp = read(file).match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)?.[1];
    assert.ok(csp, `${file}: CSP present`);
    assert.match(csp, /script-src 'self'(;|$)/, file);
    assert.match(csp, /object-src 'none'/, file);
    assert.doesNotMatch(csp, /script-src[^;]*unsafe-(inline|eval)/, file);
  }
});

test("Plain-text finding messages keep literal tag names like <nav>", () => {
  const runner = read("src/runtime/smlComplianceRunner.js");
  assert.match(runner, /alert\.messageHtml === true\s*\?\s*stripHtml\(alert\.message/);
  assert.match(read("src/runtime/smlCompliance.js"), /Page should have <nav> or role="navigation"/);
});
