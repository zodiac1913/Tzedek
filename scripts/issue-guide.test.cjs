const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const { pathToFileURL } = require("node:url");

const root = path.resolve(__dirname, "..");

// Exercise the guide's actual rendering script without opening an IDE webview.
test("Every emitted finding renders a nonempty How to Fix page", async () => {
  globalThis.Element = class {};
  globalThis.HTMLElement = class extends Element {};
  globalThis.HTMLInputElement = class extends HTMLElement {};
  const source = fs.readFileSync(path.join(root, "src/runtime/smlCompliance.js"), "utf8");
  for (const name of new Set(source.match(/\bHTML[A-Za-z]+Element\b/g))) {
    globalThis[name] = class extends Element {};
  }
  const runtime = await import(pathToFileURL(path.join(root, "src/runtime/smlCompliance.js")));
  const data = await import(pathToFileURL(path.join(root, "src/runtime/assets/tzedekIssueGuideData.js")));
  const titles = new Set([
    ...Object.keys(data.ISSUE_GUIDE_DETAILS_BY_TITLE),
    ...Array.from(source.matchAll(/\.addAlert\([^,]+,\s*"([^"]+)"/g), match => match[1]),
    "Invalid aria-labelledby Reference", "Duplicate aria-labelledby Reference",
    "Invalid aria-describedby Reference", "Duplicate aria-describedby Reference",
    "Unknown future finding"
  ]);
  const html = fs.readFileSync(path.join(root, "src/runtime/assets/issue-guide.html"), "utf8");
  const script = html.match(/<script type="module">([\s\S]*?)<\/script>/)[1]
    .replace(/^\s*import .*;\s*$/gm, "");
  function node() {
    return {
      hidden: true, textContent: "", children: [],
      appendChild(child) { this.children.push(child); },
      insertBefore(child) { this.children.push(child); }
    };
  }
  for (const title of titles) {
    const nodes = new Map();
    const document = {
      title: "Tzedek Issue Guide",
      documentElement: { getAttribute: () => "en" },
      querySelectorAll: () => [],
      querySelector: () => null,
      getElementById(id) {
        if (!nodes.has(id)) nodes.set(id, node());
        return nodes.get(id);
      },
      createElement: node
    };
    globalThis.document = document;
    const url = new URL("https://tzedek.example/assets/issue-guide.html");
    url.searchParams.set("title", title);
    vm.runInNewContext(script, {
      ...runtime, ...data, document, URL, URLSearchParams,
      window: { location: { href: url.href, search: url.search } }
    }, { filename: `issue-guide (${title})` });
    assert.equal(nodes.get("fixSection").hidden, false, title);
    assert.ok(nodes.get("fixDescription").textContent.trim(), `${title}: description`);
    assert.ok(nodes.get("reviewList").children.length, `${title}: review steps`);
  }
  console.log(`Rendered guides for ${titles.size} finding titles.`);
});
