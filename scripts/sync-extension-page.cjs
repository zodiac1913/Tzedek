const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const repoRoot = path.resolve(__dirname, "..");
const sipsExecutable = "/usr/bin/sips";
const runtimeDir = path.join(repoRoot, "src", "runtime");
const runtimeAssetsDir = path.join(runtimeDir, "assets");
const extensionPageDir = path.join(repoRoot, "extension", "page");
const extensionAssetsDir = path.join(extensionPageDir, "assets");
const extensionIconsDir = path.join(repoRoot, "extension", "icons");
const extensionIconSizes = [16, 32, 48, 128];

const filesToCopy = [
  "smlCompliance.js",
  "smlComplianceRunner.js"
];

fs.mkdirSync(extensionPageDir, { recursive: true });
fs.mkdirSync(extensionAssetsDir, { recursive: true });
fs.mkdirSync(extensionIconsDir, { recursive: true });

for (const fileName of filesToCopy) {
  const sourcePath = path.join(runtimeDir, fileName);
  const targetPath = path.join(extensionPageDir, fileName);

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Missing runtime file: ${sourcePath}. Run npm run import:cats first.`);
  }

  fs.copyFileSync(sourcePath, targetPath);
  console.log(`Synced ${fileName}`);
}

const runtimeAssetFiles = fs.readdirSync(runtimeAssetsDir, { withFileTypes: true })
  .filter(entry => entry.isFile())
  .map(entry => entry.name);

for (const assetFile of runtimeAssetFiles) {
  const sourceAssetPath = path.join(runtimeAssetsDir, assetFile);
  const targetAssetPath = path.join(extensionAssetsDir, assetFile);
  fs.copyFileSync(sourceAssetPath, targetAssetPath);
  console.log(`Synced ${assetFile}`);
}

const extensionIconSourcePath = path.join(runtimeAssetsDir, "Righteousness.png");
if (fs.existsSync(extensionIconSourcePath)) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "tzedek-icons-"));

  try {
    for (const size of extensionIconSizes) {
      const tempPath = path.join(tempDir, `icon-${size}.png`);
      const targetPath = path.join(extensionIconsDir, `icon-${size}.png`);

      execFileSync(sipsExecutable, ["-Z", String(size), extensionIconSourcePath, "--out", tempPath], { stdio: "ignore" });
      execFileSync(sipsExecutable, ["-p", String(size), String(size), "--padColor", "FFFFFF", tempPath, "--out", targetPath], { stdio: "ignore" });

      console.log(`Generated icon-${size}.png`);
    }
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}
