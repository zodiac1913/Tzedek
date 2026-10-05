const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const root = path.resolve(__dirname, "..");
const releaseVersion = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8")).releaseVersion;

// Expose the runner's helpers without starting an audit or requiring a browser DOM.
function loadRunner(relativePath, bookmarkletVersion) {
  const source = fs.readFileSync(path.join(root, relativePath), "utf8");
  const startup = source.indexOf("  (async function run() {");
  assert.ok(startup > 0, "Runner startup must be identifiable");
  const context = vm.createContext({
    URL,
    document: {
      currentScript: {
        dataset: {},
        src: `https://tzedek.example/tzedek/smlComplianceRunner.js?bookmarkletVersion=${bookmarkletVersion}`
      }
    },
    window: { location: { href: "https://audit.example/" } },
    TzedekConfig: { releaseVersion: bookmarkletVersion }
  });
  vm.runInContext(
    source.slice(0, startup) + "globalThis.runner = { getDisplayVersion, buildModuleUrl }; })();",
    context
  );
  return { source, runner: context.runner };
}

for (const relativePath of [
  "src/runtime/smlComplianceRunner.js",
  "demo/page/smlComplianceRunner.js",
  "extension/page/smlComplianceRunner.js"
]) {
  test(`${relativePath}: old launcher metadata does not override the loaded version`, () => {
    const { source, runner } = loadRunner(relativePath, "2026.10.01.02");
    assert.equal(runner.getDisplayVersion(), releaseVersion);
    const moduleUrl = new URL(runner.buildModuleUrl());
    assert.equal(moduleUrl.pathname, "/tzedek/smlCompliance.js");
    assert.match(moduleUrl.searchParams.get("t"), /^\d+$/);
    assert.doesNotMatch(source, /Bookmarklet update required|getBookmarkletUpdateNotice/);
    assert.match(source, /title='Click to see the GitHub repo'/);
    assert.match(source, /data-smlc-dismiss-alert='blocked'/);
  });

  test(`${relativePath}: current launcher reports the same loaded version`, () => {
    assert.equal(loadRunner(relativePath, releaseVersion).runner.getDisplayVersion(), releaseVersion);
  });
}
