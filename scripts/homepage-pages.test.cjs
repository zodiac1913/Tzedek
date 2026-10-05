const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");

test("Homepage and deliberate demo are packaged independently with correct bases", () => {
  const homepage = read("demo/index.html");
  const demo = read("demo/wcag-demo.html");
  assert.equal(read("extension/page/index.html"), homepage.replace('<base href="./page/">', '<base href="./">'));
  assert.equal(read("extension/page/wcag-demo.html"), demo.replace('<base href="./page/">', '<base href="./">'));
  assert.equal(read("demo/page/wcag-demo.html"), demo.replace('<base href="./page/">', '<base href="./">'));
  assert.match(homepage, /<main id="maincontent">/);
  assert.match(homepage, /<nav[^>]+aria-label="Tzedek resources">/);
  assert.match(homepage, /<label for="bookmarkletCode">/);
  assert.match(homepage, /:focus-visible/);
  assert.match(homepage, /href="\.\/wcag-demo\.html">Try the intentionally broken WCAG demo<\/a>/);
  assert.ok(homepage.indexOf('id="demoLink"') > homepage.indexOf("Usage Notes"));
  assert.doesNotMatch(homepage, /mountDemoFixtures|fixture-links-buttons/);
  assert.match(read("demo/wcag-demo.js"), /document\.baseURI/);
  assert.doesNotMatch(demo, /\.\/page\/smlCompliance/);
});

test("Recovered demo mounts the original deliberate accessibility failures", () => {
  const script = read("demo/wcag-demo.js");
  const mounted = new Map();
  const context = vm.createContext({
    document: { getElementById: id => {
      if (!mounted.has(id)) mounted.set(id, {});
      return mounted.get(id);
    } }
  });
  vm.runInContext(script.slice(0, script.indexOf("window.TzedekConfig")) + "mountDemoFixtures();", context);
  assert.match(mounted.get("fixture-links-buttons").innerHTML, /aria-label='Open employee profile'>View profile/);
  assert.match(mounted.get("fixture-links-buttons").innerHTML, /Low contrast button/);
  assert.match(mounted.get("fixture-forms-media").innerHTML, /<img[^>]+>/);
  assert.doesNotMatch(mounted.get("fixture-forms-media").innerHTML.match(/<img[^>]+>/)[0], /\balt=/);
  assert.match(mounted.get("fixture-forms-media").innerHTML, /demoMissingLabel/);
  assert.match(mounted.get("fixture-structure").innerHTML, /demoCritcalHeader/);
});

function luminance(hex) {
  const rgb = hex.match(/[a-f0-9]{2}/gi).map(value => parseInt(value, 16) / 255);
  const linear = rgb.map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}

test("External demo script preserves click behavior without inline handlers", () => {
  const elements = new Map();
  const scripts = [];
  const messages = [];
  const context = vm.createContext({
    URL,
    alert: message => messages.push(message),
    window: {},
    document: {
      baseURI: "chrome-extension://test/page/",
      getElementById: id => {
        if (id === "tzedek-demo-runner") return null;
        if (!elements.has(id)) elements.set(id, {
          listeners: new Map(),
          addEventListener(name, handler) { this.listeners.set(name, handler); }
        });
        return elements.get(id);
      },
      createElement: () => ({ dataset: {} }),
      head: { appendChild: script => scripts.push(script) }
    }
  });
  vm.runInContext(read("demo/wcag-demo.js"), context);
  assert.equal(scripts.length, 1);
  assert.equal(scripts[0].dataset.moduleUrl, "chrome-extension://test/page/smlCompliance.js");
  elements.get("runTzedekButton").listeners.get("click")();
  assert.equal(scripts.length, 2);
  elements.get("demoFakeButton").listeners.get("click")();
  assert.deepEqual(messages, ["Not semantic"]);
});

test("Homepage action colors meet normal-text AA contrast", () => {
  const homepage = read("demo/index.html");
  assert.match(homepage, /\.bookmarklet-link\s*\{[^}]*background:\s*#fff/);
  assert.match(homepage, /color:\s*Firebrick/);
  assert.match(homepage, /\.copy-button\s*\{\s*background:\s*#102a43;\s*color:\s*#fff !important/);
  assert.match(homepage, /\.secondary-link\s*\{\s*background:\s*#fff;\s*color:\s*#1d4ed8 !important/);
  for (const [foreground, background] of [["b22222", "ffffff"], ["ffffff", "102a43"], ["1d4ed8", "ffffff"]]) {
    const levels = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
    assert.ok((levels[0] + 0.05) / (levels[1] + 0.05) >= 4.5);
  }
});
