const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");

test("All extension pages use packaged external scripts and no inline event handlers", () => {
  for (const page of ["index.html", "compliance-bookmarklet.html", "wcag-demo.html", "assets/issue-guide.html"]) {
    const relativePath = `extension/page/${page}`;
    const html = read(relativePath);
    assert.doesNotMatch(html, /\son[a-z]+\s*=/i, relativePath);
    assert.doesNotMatch(html, /<base href="\/tzedek\/">/, relativePath);
    const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
    assert.ok(scripts.length, `${relativePath}: external script exists`);
    for (const [, attributes, body] of scripts) {
      assert.equal(body.trim(), "", `${relativePath}: no inline script`);
      const src = attributes.match(/\bsrc="([^"]+)"/)?.[1];
      assert.ok(src, `${relativePath}: script has src`);
      assert.ok(fs.existsSync(path.resolve(root, path.dirname(relativePath), src)), `${relativePath}: ${src} is packaged`);
    }
  }
  for (const [source, copy] of [
    ["bookmarklet/compliance-bookmarklet.js", "extension/page/compliance-bookmarklet.js"],
    ["bookmarklet/compliance-bookmarklet.js", "demo/page/compliance-bookmarklet.js"],
    ["demo/wcag-demo.js", "extension/page/wcag-demo.js"],
    ["demo/wcag-demo.js", "demo/page/wcag-demo.js"],
    ["src/runtime/assets/issue-guide.js", "extension/page/assets/issue-guide.js"],
    ["src/runtime/assets/issue-guide.js", "demo/page/assets/issue-guide.js"],
    ["src/runtime/smlComplianceBootstrap.js", "extension/page/smlComplianceBootstrap.js"],
    ["src/runtime/smlComplianceBootstrap.js", "demo/page/smlComplianceBootstrap.js"]
  ]) {
    assert.equal(read(source), read(copy), `${copy}: authoritative source parity`);
  }
  assert.doesNotMatch(read("demo/wcag-demo.js"), /\son[a-z]+\s*=/i);
  const manifest = JSON.parse(read("extension/manifest.json"));
  const resources = manifest.web_accessible_resources.flatMap(entry => entry.resources);
  assert.ok(resources.includes("page/assets/issue-guide.js"));
  assert.ok(resources.includes("page/smlComplianceBootstrap.js"));
  assert.doesNotMatch(JSON.stringify(manifest.content_security_policy || {}), /unsafe-inline/);
});

function loadFallback() {
  const source = read("src/runtime/smlComplianceRunner.js");
  const startup = source.indexOf("  (async function run() {");
  assert.ok(startup > 0);
  const listeners = new Map();
  const elements = [];
  const context = vm.createContext({
    URL,
    Element: class {},
    document: {
      currentScript: { dataset: { moduleUrl: "chrome-extension://test/page/smlCompliance.js" } },
      getElementById: () => null,
      createElement: () => ({ dataset: {}, setAttribute() {} }),
      head: { appendChild: element => elements.push(element) }
    },
    window: {
      location: { href: "https://audit.example/" },
      setTimeout,
      clearTimeout,
      addEventListener: (name, handler) => listeners.set(name, handler),
      removeEventListener: name => listeners.delete(name)
    }
  });
  vm.runInContext(source.slice(0, startup) + "globalThis.loadFallback = loadByModuleScriptTag; })();", context);
  return { context, elements, listeners };
}

test("Runtime module fallback uses an external URL and resolves exports", async () => {
  const { context, elements, listeners } = loadFallback();
  const loaded = context.loadFallback();
  const script = elements[0];
  assert.equal(script.type, "module");
  assert.equal(script.textContent, undefined);
  const url = new URL(script.src);
  assert.equal(url.pathname, "/page/smlComplianceBootstrap.js");
  const moduleUrl = new URL(url.searchParams.get("moduleUrl"));
  assert.equal(moduleUrl.pathname, "/page/smlCompliance.js");
  assert.match(moduleUrl.searchParams.get("t"), /^\d+$/);
  function Compliance() {}
  context.window.smlCompliance = Compliance;
  listeners.get("smlComplianceModuleReady")({});
  assert.equal(await loaded, Compliance);
  assert.equal(listeners.size, 0);
});

test("Runtime module fallback surfaces import and script-load failures", async () => {
  for (const failure of ["import", "script"]) {
    const { context, elements, listeners } = loadFallback();
    const loaded = context.loadFallback();
    const rejected = assert.rejects(loaded, failure === "import" ? /blocked module/ : /Module script injection failed/);
    if (failure === "import") {
      listeners.get("smlComplianceModuleReady")({ detail: { error: new Error("blocked module") } });
    } else {
      elements[0].onerror();
    }
    await rejected;
    assert.equal(listeners.size, 0);
  }
});

// Substitute module loading only; execute the external bootstrap's success/error contract.
test("External bootstrap publishes runtime helpers and reports failures to the runner", async () => {
  const source = read("src/runtime/smlComplianceBootstrap.js")
    .replace("import.meta.url", "bootstrapUrl")
    .replace("await import(moduleUrl)", "await importRuntime(moduleUrl)");
  for (const failure of [false, true]) {
    const events = [];
    const runtime = {
      smlCompliance() {},
      runComplianceAudit() {},
      getMoreInfoUrl() {},
      getMoreInfoLinks() {},
      getSmlcNewWindowLinkLabel() {}
    };
    const context = vm.createContext({
      URL,
      Event,
      CustomEvent,
      bootstrapUrl: "chrome-extension://test/page/smlComplianceBootstrap.js?moduleUrl=chrome-extension%3A%2F%2Ftest%2Fpage%2FsmlCompliance.js%3Ft%3D123",
      window: { dispatchEvent: event => events.push(event) },
      importRuntime: async url => {
        assert.equal(url, "chrome-extension://test/page/smlCompliance.js?t=123");
        if (failure) throw new Error("module blocked");
        return runtime;
      }
    });
    await vm.runInContext(`(async () => {${source}})()`, context);
    assert.equal(events.length, 1);
    assert.equal(events[0].type, "smlComplianceModuleReady");
    if (failure) {
      assert.equal(events[0].detail.error.message, "module blocked");
    } else {
      assert.equal(context.window.smlCompliance, runtime.smlCompliance);
      assert.equal(context.window.runComplianceAudit, runtime.runComplianceAudit);
      assert.equal(context.window.smlComplianceGetMoreInfoLinks, runtime.getMoreInfoLinks);
    }
  }
});
