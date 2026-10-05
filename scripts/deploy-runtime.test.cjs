const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { test } = require("node:test");

// Mock only GitHub downloads; exercise real archive extraction and deployment in a temporary workspace.
test("Deployment replaces installer and homepage, preserves site files, and supports forced repair", () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "tzedek-deploy-test-"));
  try {
    const web = path.join(temp, "web");
    const bin = path.join(temp, "bin");
    const bundle = path.join(temp, "bundle");
    fs.mkdirSync(web);
    fs.mkdirSync(bin);
    fs.mkdirSync(path.join(bundle, "page/assets"), { recursive: true });
    for (const file of ["smlCompliance.js", "smlComplianceRunner.js", "smlComplianceBootstrap.js", "compliance-bookmarklet.html", "compliance-bookmarklet.js", "wcag-demo.js"]) {
      fs.writeFileSync(path.join(bundle, "page", file), `released ${file}`);
    }
    const installer = "<html><head></head><body>released installer</body></html>";
    fs.writeFileSync(path.join(bundle, "page/compliance-bookmarklet.html"), installer);
    const homepage = '<html><head><base href="/tzedek/"></head><body>clean homepage<a href="wcag-demo.html">Test demo</a></body></html>';
    fs.writeFileSync(path.join(bundle, "page/index.html"), homepage.replace('/tzedek/', './'));
    const demo = '<html><head><base href="./"></head><body>deliberately broken demo</body></html>';
    fs.writeFileSync(path.join(bundle, "page/wcag-demo.html"), demo);
    fs.writeFileSync(path.join(bundle, "page/assets/test.css"), "released assets");
    fs.writeFileSync(path.join(bundle, "page/assets/issue-guide.js"), "released guide script");
    const archive = path.join(temp, "Tzedek.zip");
    execFileSync("zip", ["-qr", archive, "page"], { cwd: bundle });
    fs.writeFileSync(path.join(web, "index.html"), "custom homepage");
    fs.writeFileSync(path.join(web, "index.html.backup"), "saved homepage");
    fs.mkdirSync(path.join(web, "vendor"));
    fs.writeFileSync(path.join(web, "vendor/local.css"), "local vendor asset");
    fs.writeFileSync(path.join(web, "compliance-bookmarklet.html"), "old installer");
    fs.writeFileSync(path.join(bin, "curl"), `#!/bin/bash
if [ "$1" = "-fsSL" ] && [ "$2" = "-o" ]; then
  cp "$TEST_ARCHIVE" "$3"
else
  printf '{"tag_name":"vtest"}\\n'
fi
`, { mode: 0o755 });
    const script = path.join(__dirname, "deploy-runtime-to-nginx.sh");
    const env = { ...process.env, PATH: `${bin}:${process.env.PATH}`, TZEDEK_WEB_ROOT: web, TEST_ARCHIVE: archive, TZEDEK_FORCE_DEPLOY: "0" };
    execFileSync("bash", [script], { env });
    assert.equal(fs.readFileSync(path.join(web, "compliance-bookmarklet.html"), "utf8"), installer);
    assert.equal(fs.readFileSync(path.join(web, "index.html"), "utf8"), homepage);
    assert.equal(fs.readFileSync(path.join(web, "wcag-demo.html"), "utf8"), demo.replace('./', '/tzedek/'));
    for (const file of ["compliance-bookmarklet.js", "wcag-demo.js", "smlComplianceBootstrap.js"]) {
      assert.equal(fs.readFileSync(path.join(web, file), "utf8"), `released ${file}`);
    }
    assert.equal(fs.readFileSync(path.join(web, "assets/issue-guide.js"), "utf8"), "released guide script");
    assert.equal(fs.readFileSync(path.join(web, "index.html.backup"), "utf8"), "saved homepage");
    assert.equal(fs.readFileSync(path.join(web, "vendor/local.css"), "utf8"), "local vendor asset");
    assert.match(execFileSync("bash", [script], { env, encoding: "utf8" }), /Already serving/);
    fs.writeFileSync(path.join(web, "compliance-bookmarklet.html"), "stale installer");
    fs.writeFileSync(path.join(web, "index.html"), "stale homepage");
    execFileSync("bash", [script], { env: { ...env, TZEDEK_FORCE_DEPLOY: "1" } });
    assert.equal(fs.readFileSync(path.join(web, "compliance-bookmarklet.html"), "utf8"), installer);
    assert.equal(fs.readFileSync(path.join(web, "index.html"), "utf8"), homepage);
    fs.unlinkSync(path.join(bundle, "page/compliance-bookmarklet.js"));
    const incompleteArchive = path.join(temp, "incomplete.zip");
    execFileSync("zip", ["-qr", incompleteArchive, "page"], { cwd: bundle });
    assert.throws(() => execFileSync("bash", [script], {
      env: { ...env, TEST_ARCHIVE: incompleteArchive, TZEDEK_FORCE_DEPLOY: "1" },
      stdio: "pipe"
    }), /missing pages or their scripts/);
    assert.equal(fs.readFileSync(path.join(web, "index.html"), "utf8"), homepage);
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
});
