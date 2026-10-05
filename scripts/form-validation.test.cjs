const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

// Isolate the field check with visibility fixtures; findings must retain the actual field target.
test("Missing error messages are reported only on visible, page-owned fields", () => {
  const source = fs.readFileSync(path.join(__dirname, "../src/runtime/smlCompliance.js"), "utf8");
  const start = source.indexOf("  checkFormValidation() {");
  const end = source.indexOf("\n  /**", start);
  assert.ok(start > 0 && end > start);
  const field = (id, overrides = {}) => ({
    id, type: "text", visible: true, hidden: false, owned: false,
    getAttribute: () => null,
    ...overrides
  });
  const visible = field("visible");
  const inputs = [
    visible,
    field("hidden-input", { type: "hidden" }),
    field("hidden-ancestor", { hidden: true }),
    field("not-rendered", { visible: false }),
    field("audit-ui", { owned: true })
  ];
  const alerts = [];
  const checker = vm.runInNewContext(`({${source.slice(start, end)}})`, {
    getAuditCandidateElements: () => [{ querySelectorAll: () => inputs }],
    isHiddenFromAllUsers: input => input.hidden,
    isElementVisibleForContrastAudit: input => input.visible,
    isSmlcOwnedElement: input => input.owned,
    document: { getElementById: () => null }
  });
  checker.addAlert = (...args) => alerts.push(args);
  checker.checkFormValidation();
  assert.equal(alerts.length, 1);
  assert.equal(alerts[0][1], "Missing Error Message Element");
  assert.equal(alerts[0][3], visible);
});
