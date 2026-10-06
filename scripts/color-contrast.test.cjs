const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const vm = require("node:vm");
const { spawn } = require("node:child_process");
const { test } = require("node:test");

const source = fs.readFileSync(path.join(__dirname, "../src/runtime/smlCompliance.js"), "utf8");
const helpers = source.slice(source.indexOf("function calculateAPCAContrast("), source.indexOf("function splitSelectorList("));
const checkStart = source.indexOf("  checkColorContrast() {");
const checkEnd = source.indexOf("\n  /**", checkStart);

test("Legacy colors retain their values; unresolved backgrounds never become white", () => {
  assert.ok(helpers.length > 0 && checkStart > 0 && checkEnd > checkStart);
  class Element {
    constructor(backgroundColor, parentElement = null) {
      this.backgroundColor = backgroundColor;
      this.parentElement = parentElement;
    }
  }
  const warnings = [];
  const body = new Element("rgb(255, 255, 255)");
  const context = vm.createContext({
    Element,
    document: { body },
    window: { getComputedStyle: element => ({ backgroundColor: element.backgroundColor, backgroundImage: "none" }) },
    console: { warn: (...args) => warnings.push(args) }
  });
  vm.runInContext(helpers, context);
  const plain = value => JSON.parse(JSON.stringify(value));
  assert.deepEqual(plain(context.parseRGB("rgb(37, 99, 235)")), { r: 37, g: 99, b: 235, a: 1 });
  assert.deepEqual(plain(context.parseRGB("#FFFFFF")), { r: 255, g: 255, b: 255, a: 1 });
  for (const value of ["", "var(--color-blue-600)", "currentcolor", "inherit", "invalid", "rgb(1, 2, 3) junk"]) {
    assert.equal(context.parseRGB(value), null, value);
  }
  assert.equal(context.getEffectiveBackgroundColor(new Element("unsupported", body)), null);
  assert.equal(warnings.length, 1);
  assert.deepEqual(plain(context.getEffectiveBackgroundColor(new Element("rgba(0, 0, 255, 0.5)", body))),
    { r: 127.5, g: 127.5, b: 255 });
});

const browser = process.env.TZEDEK_TEST_BROWSER
  || (process.platform === "darwin" ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" : "");

// Real browser fixtures exercise CSS variables, canvas conversion, and finding output together.
test("Tailwind OKLCH buttons use their actual background in contrast findings", {
  skip: !browser || !fs.existsSync(browser) ? "Set TZEDEK_TEST_BROWSER to a Chromium executable" : false
}, async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "tzedek-contrast-"));
  try {
    const fixture = path.join(tempDir, "contrast.html");
    fs.writeFileSync(fixture, `<!doctype html><style>
      :root { --color-blue-600: oklch(54.6% .245 262.881); }
      body { background: white; }
      button { color: white; font-size: 14px; font-weight: 400; }
      .bg-blue-600 { background-color: var(--color-blue-600); }
    </style>
    <button class="bg-blue-600">Upgrade All</button><pre id="result"></pre>
    <script>
      ${helpers}
      let ACCESSIBLE_CSS_STYLE_RULES_CACHE;
      const CONTRAST_AUDIT_TEXT_SELECTOR = "button";
      const getAuditCandidateElements = selector => Array.from(document.querySelectorAll(selector));
      const getContrastAuditTarget = element => element;
      const isSmlcOwnedElement = () => false;
      const hasContrastReadableText = () => true;
      const isElementVisibleForContrastAudit = () => true;
      let getContrastStateSnapshots = () => [];
      const getContrastSuggestions = () => ({ balanced: {}, foreground: {}, background: {} });
      const ensureAuditTargetId = () => "sample";
      const rgbToHex = rgb => "#" + [rgb.r, rgb.g, rgb.b].map(c => Math.round(c).toString(16).padStart(2, "0")).join("").toUpperCase();
      const formatHexWithSwatch = hex => hex;
      const describeElementForContrast = () => "button.bg-blue-600";
      const BOOTSTRAP_COLOR_PALETTE = [], LEGACY_THEME_COLOR_PALETTE = [];
      const BOOTSTRAP_BUTTON_PALETTE = [], SML_BUTTON_PALETTE = [];
      const findBestPaletteReplacement = () => null;
      const findClosestButtonStyles = () => [];
      const formatButtonChoiceList = () => "";
      const escapeHtml = text => text;
      const alerts = [];
      const checker = { ${source.slice(checkStart, checkEnd)}, cfg: { level: "aa" }, addAlert: (...args) => alerts.push(args) };
      const expect = (condition, message) => { if (!condition) throw new Error(message); };
      try {
        const button = document.querySelector("button");
        const bg = getEffectiveBackgroundColor(button);
        expect(Math.abs(bg.r - 21) <= 2 && Math.abs(bg.g - 93) <= 2 && Math.abs(bg.b - 252) <= 2,
          "OKLCH blue must resolve near #155DFC: " + JSON.stringify(bg));
        const ratio = calculateAPCAContrast(parseRGB(getComputedStyle(button).color), bg);
        expect(ratio > 5 && ratio < 5.5, "Blue button ratio: " + ratio);
        checker.checkColorContrast();
        expect(alerts.length === 0, "Passing blue button must not produce a finding");
        const modernRgb = parseRGB("rgb(21 93 252 / 50%)");
        expect(Math.abs(modernRgb.r - 21) <= 1 && Math.abs(modernRgb.a - 0.5) < 0.01, "Modern RGB with alpha");
        expect(parseRGB("transparent").a === 0, "Transparent background");
        expect(parseRGB("color(srgb 1 0 0)").r === 255, "CSS color() conversion");
        button.style.backgroundColor = "oklch(70% .1 260)";
        const failingBg = getEffectiveBackgroundColor(button);
        checker.checkColorContrast();
        expect(alerts.length === 1, "Actually failing button must produce a finding");
        expect(alerts[0][2].includes("Background " + rgbToHex(failingBg)), "Finding must use measured background");
        expect(!alerts[0][2].includes("1.0:1"), "Finding must not invent white-on-white");
        expect(alerts[0][3] === button, "Finding must retain original target");
        const reviewImage = () => {
          alerts.length = 0;
          checker.checkColorContrast();
          expect(alerts.length === 1 && alerts[0][0] === "info", "Image must produce one informational notice");
          expect(alerts[0][1] === "Color Contrast Needs Manual Review", "Manual review title");
          expect(!alerts[0][2].includes(":1") && !alerts[0][2].includes("#FFFFFF"), "No invented ratio or color");
          expect(alerts[0][3] === button, "Manual notice retains actual target");
        };
        button.style.backgroundImage = 'url("rack.png")';
        reviewImage();
        button.style.backgroundImage = "linear-gradient(white, black)";
        reviewImage();
        button.style.backgroundImage = "none";
        button.style.backgroundColor = "transparent";
        document.body.style.backgroundImage = 'url("rack.png")';
        reviewImage();
        button.style.backgroundColor = "rgb(0, 0, 0)";
        alerts.length = 0;
        checker.checkColorContrast();
        expect(alerts.length === 0, "Opaque passing button hides ancestor image");
        button.style.backgroundColor = "white";
        checker.checkColorContrast();
        expect(alerts.length === 1 && alerts[0][1] === "Low Color Contrast", "Opaque failing button still measured");
        button.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
        reviewImage();
        document.body.style.backgroundImage = "none";
        document.body.style.backgroundColor = "transparent";
        document.documentElement.style.backgroundImage = 'url("rack.png")';
        reviewImage();
        document.documentElement.style.backgroundImage = "none";
        document.body.style.backgroundColor = "white";
        alerts.length = 0;
        const getImageStates = () => [{ name: "hover", textRgb: parseRGB("white"), backgroundRgb: null, requiresManualReview: true }];
        getContrastStateSnapshots = getImageStates;
        button.style.backgroundColor = "black";
        checker.checkColorContrast();
        expect(alerts.length === 1 && alerts[0][2].includes("hover"), "Image hover state needs manual review");
        alerts.length = 0;
        button.style.backgroundImage = 'url("rack.png")';
        getContrastStateSnapshots = () => [{ name: "focus", textRgb: parseRGB("white"), backgroundRgb: parseRGB("white") }];
        checker.checkColorContrast();
        expect(alerts.length === 2 && alerts[0][0] === "info" && alerts[1][1] === "Low Color Contrast",
          "Image default does not suppress measurable failing focus");
        document.querySelector("#result").textContent = "PASS " + ratio.toFixed(3);
      } catch (error) {
        document.querySelector("#result").textContent = "FAIL " + error.message;
      }
    </script>`);
    // Chrome helpers can retain pipe handles after exit; use a file for bounded capture.
    const outputPath = path.join(tempDir, "output.html");
    const outputFd = fs.openSync(outputPath, "w");
    try {
      const child = spawn(browser, [
        "--headless", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
        "--disable-background-networking", "--disable-component-update",
        "--use-mock-keychain", "--password-store=basic",
        `--user-data-dir=${path.join(tempDir, "profile")}`, "--dump-dom", `file://${fixture}`
      ], { stdio: ["ignore", outputFd, "ignore"] });
      await new Promise((resolve, reject) => {
        // Some Chrome builds stay running after dump-dom; stop only our isolated
        // process once the fixture has produced its complete test result.
        let completed = false;
        const monitor = setInterval(() => {
          if (/<pre id="result">(?:PASS|FAIL) [^<]+<\/pre>/.test(fs.readFileSync(outputPath, "utf8"))) {
            completed = true;
            clearInterval(monitor);
            child.kill();
          }
        }, 50);
        const timer = setTimeout(() => {
          clearInterval(monitor);
          child.kill();
          reject(new Error("Chromium timed out: " + fs.readFileSync(outputPath, "utf8").match(/<pre id="result">[^<]*/)?.[0]));
        }, 30000);
        child.once("error", error => { clearTimeout(timer); clearInterval(monitor); reject(error); });
        child.once("exit", (code, signal) => {
          clearTimeout(timer);
          clearInterval(monitor);
          if (completed || code === 0) resolve();
          else reject(new Error(`Chromium exited with code ${code}, signal ${signal}`));
        });
      });
    } finally {
      fs.closeSync(outputFd);
    }
    const output = fs.readFileSync(outputPath, "utf8");
    assert.match(output, /<pre id="result">PASS [\d.]+<\/pre>/);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
